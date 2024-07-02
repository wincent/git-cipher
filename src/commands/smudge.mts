/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import {Buffer} from 'node:buffer';
import {stdin, stdout} from 'node:process';

import Config from '../Config.mjs';
import commonOptions from '../commonOptions.mjs';
import * as log from '../log.mjs';
import markdown from '../markdown.mjs';
import smudge from '../smudge.mjs';

export const description = 'decrypts file contents (Git filter)';

export const documentation = await markdown('git-cipher-smudge');

export async function execute(invocation: Invocation): Promise<number> {
  if (invocation.args.length !== 1) {
    log.error(
      `expected exactly one filename argument, got: ${invocation.args.join(
        ' ',
      )}`,
    );
    return 1;
  }
  const filename = invocation.args[0]!;

  const config = new Config();

  // Note: this will hang waiting for input (or until Ctrl-D), which is probably
  // what we want.
  const chunks = [];
  for await (const chunk of stdin) {
    chunks.push(chunk);
  }
  const input = Buffer.concat(chunks);

  if (!input.length) {
    log.debug(`file ${filename} is empty; passing through`);
    return 0;
  }

  const secrets = await config.readPrivateSecrets();
  if (!secrets) {
    log.debug(
      'cannot smudge without secrets; do you need to run `git-cipher unlock`?',
    );
    stdout.write(input);
    return 0;
  }

  // TODO: if decryption fails for some reason, may want `try`/`catch` here.
  const plaintext = await smudge(input, filename, secrets);

  stdout.write(plaintext);

  return 0;
}

export const optionsSchema = {
  ...commonOptions,
} as const;
