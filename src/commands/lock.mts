/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import Config from '../Config.mjs';
import commonOptions from '../commonOptions.mjs';
import markdown from '../markdown.mjs';
import removeCachedPlaintext from '../removeCachedPlaintext.mjs';
import resetManagedFiles from '../resetManagedFiles.mjs';

export const description =
  'locks the current repositry, replacing decrypted files with ciphertext';

export const documentation = await markdown('git-cipher-lock');

export async function execute(invocation: Invocation): Promise<number> {
  const config = new Config();

  await config.removePrivateSecrets();

  await removeCachedPlaintext();

  // TODO: check that other config is valid/present (eg. clean/smudge filter)

  await config.lockConfig();

  return resetManagedFiles(config, invocation);
}

export const optionsSchema = {
  ...commonOptions,
  '--force': {
    defaultValue: false,
    kind: 'switch',
    description: 'replace plaintext even if worktree is dirty',
  },
} as const;
