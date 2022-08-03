#!/usr/bin/env node

/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import {readFile} from 'node:fs/promises';
import {argv} from 'node:process';

import {
  BLOCK_CIPHER_ALGORITHM,
  decrypt,
  deriveKey,
  encrypt,
  generateFileSalt,
  generateKeySalt,
  generateRandom,
  generateRandomPassphrase,
  mac,
  verify,
} from './crypto.mjs';
import hex from './hex.mjs';

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
