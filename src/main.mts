#!/usr/bin/env node

import {Buffer} from 'node:buffer';
import {readFile} from 'node:fs/promises';
import {argv} from 'node:process';
import {promisify} from 'node:util';

const {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomFill: randomFillAsync,
  scrypt,
} = await import('node:crypto');

const randomFill = promisify(randomFillAsync);

const BLOCK_CIPHER_ALGORITHM = 'aes-256-cbc';
const BLOCK_CIPHER_IV_SIZE = 16; // 16 bytes = 128 bits = block size.
const BLOCK_CIPHER_KEY_SIZE = 32; // 32 bytes = 256 bits.

/**
 * Size of the `salt` parameter to `scrypt()`.
 *
 * Should be "at least 128 bits" (ie. 16 bytes):
 *
 * https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf
 */
const KEY_SALT_SIZE = 64; // 64 bytes = 512 bits.

/*
type Salt = {
  filename: string,
  extra: Buffer,
};
*/

/**
 * This is the "mac" in "encrypt-then-mac".
 *
 * For why we use a different key for this, than we do for salt/IV generation,
 * see:
 *
 * https://crypto.stackexchange.com/a/8086
 */
async function mac(
  filename: string,
  iv: Buffer,
  ciphertext: Buffer,
  key: Buffer
): Promise<Buffer> {
  return new Promise(async (resolve, _reject) => {
    const secret = Buffer.concat([key, Buffer.from(filename)]);
    const hmac = createHmac('sha256', secret);
    const contents = Buffer.concat([iv, ciphertext]);
    hmac.update(contents);
    const digest = hmac.digest();
    resolve(digest);
  });
}

async function decrypt(
  contents: Buffer,
  key: Buffer,
  iv: Buffer
): Promise<Buffer> {
  return new Promise((resolve, _reject) => {
    const decipher = createDecipheriv(BLOCK_CIPHER_ALGORITHM, key, iv);
    const initial = decipher.update(contents);
    const final = decipher.final();
    resolve(Buffer.concat([initial, final]));
  });
}

async function deriveKey(passphrase: Buffer, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(passphrase, salt, BLOCK_CIPHER_KEY_SIZE, (error, buffer) => {
      if (error) {
        reject(error);
      } else {
        console.log(buffer.length);
        resolve(buffer);
      }
    });
  });
}

async function encrypt(
  contents: Buffer,
  key: Buffer,
  iv: Buffer
): Promise<Buffer> {
  return new Promise((resolve, _reject) => {
    const cipher = createCipheriv(BLOCK_CIPHER_ALGORITHM, key, iv);
    const initial = cipher.update(contents);
    const final = cipher.final();
    resolve(Buffer.concat([initial, final]));
  });
}

async function generateRandom(size: number = 32): Promise<Buffer> {
  const buffer = Buffer.alloc(size);
  await randomFill(buffer);
  return buffer;
}

async function generateRandomPassphrase(size: number = 128): Promise<Buffer> {
  return generateRandom(size);
}

/**
 * We use these deterministic per-file "file salts" as IVs in the block cipher
 * (in order to get deterministic encryption). `base` is a one-time secret
 * generated separately from the passphrase.
 *
 * The IV itself is not secret, but in order to attack it, you'd need to know
 * the filename (easy), guess the file contents (sometimes), _and_ guess the
 * `base` (hard). Basically you would brute force, creating HMACs for the
 * suspected file contents until you guessed `base` (which are 32 bytes from a
 * cryptographic random source).
 *
 * Once you know the `base`, however, that tells you nothing about the
 * `passphrase`. In other words, you did a lot of work to guess something that
 * won't prove very valuable compared to what you already know (you already
 * guessed the file contents, after all).
 */
async function generateFileSalt(
  filename: string,
  contents: Buffer,
  base: Buffer
): Promise<Buffer> {
  return new Promise(async (resolve, _reject) => {
    const secret = Buffer.concat([base, Buffer.from(filename)]);
    const hmac = createHmac('sha256', secret);
    hmac.update(contents);
    const digest = hmac.digest();
    const salt = Buffer.concat([digest], BLOCK_CIPHER_IV_SIZE);
    resolve(salt);
  });
}

/**
 * This is totally random; we generate it once and record it for subsequent use.
 */
async function generateKeySalt(): Promise<Buffer> {
  return generateRandom(KEY_SALT_SIZE);
}

const WRAP_WIDTH = 72;

/**
 * "Pretty prints" one or more buffers as a wrapped hexadecimal string.
 */
function hex(...buffers: Array<Buffer>): string {
  // Not the most efficient thing, but it is readable.
  return buffers
    .map((buffer) => buffer.toString('hex'))
    .join('')
    .replace(new RegExp(`.{1,${WRAP_WIDTH}}`, 'g'), '$&\n');
}

/**
 * The counterpart to `mac()`, you call this before decrypting to rule out
 * tampering.
 */
async function verify(
  digest: Buffer,
  filename: string,
  iv: Buffer,
  ciphertext: Buffer,
  key: Buffer
): Promise<boolean> {
  const actual = await mac(filename, iv, ciphertext, key);
  return Buffer.compare(digest, actual) == 0;
}

const passphrase = await generateRandomPassphrase();
console.log('pass', hex(passphrase));

const authenticationKey = await generateRandom();

const base = await generateRandom();
console.log('base', hex(base));

const keySalt = await generateKeySalt();
console.log('keySalt', hex(keySalt));

const derived = await deriveKey(passphrase, keySalt);
console.log('derived (1 of 2)', hex(derived));

// const derived2 = await deriveKey(passphrase, keySalt);
// console.log('derived (2 of 2)', hex(derived2));

const last = argv[argv.length - 1];
const filename = last && !last.startsWith('-') ? last : 'package.json';
console.log('filename', filename);

const contents = await readFile(filename);
console.log('contents', hex(contents));

const salt = await generateFileSalt(filename, contents, base);
console.log('salt (1 of 2)', hex(salt));

// const salt2 = await generateFileSalt(filename, contents, base);
// console.log('salt (2 of 2)', hex(salt2));

const ciphertext = await encrypt(contents, derived, salt);
console.log('ciphertext (1 of 2)', hex(ciphertext));

// const ciphertext2 = await encrypt(contents, derived, salt);
// console.log('ciphertext (2 of 2)', hex(ciphertext2));

const theMac = await mac(filename, salt, ciphertext, authenticationKey);
console.log('the mac', hex(theMac));

const verifies = await verify(
  theMac,
  filename,
  salt,
  ciphertext,
  authenticationKey
);
console.log('verifies?', verifies);

const plaintext = await decrypt(ciphertext, derived, salt);
console.log('plaintext (1 of 2)', hex(plaintext));

// const plaintext2 = await decrypt(ciphertext, derived, salt);
// console.log('plaintext (1 of 2)', hex(plaintext2));

console.log(plaintext.toString('utf8'));

const cleaned =
  'magic = com.wincent.git-cipher\n' +
  'url = https://github.com/wincent/git-cipher\n' +
  'version = 1\n' +
  'algorithm = ' +
  BLOCK_CIPHER_ALGORITHM +
  '\n' +
  'iv = ' +
  hex(salt) +
  'ciphertext =\n' +
  hex(ciphertext) +
  'hmac = ' +
  hex(theMac);

console.log(cleaned);
