/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import Config from '../Config.mjs';
import commonOptions from '../commonOptions.mjs';
import * as log from '../log.mjs';
import removeCachedPlaintext from '../removeCachedPlaintext.mjs';
import resetManagedFiles from '../resetManagedFiles.mjs';

export const description =
  'unlocks the current repository, decrypting its secrets';

export const longDescription = `
  More docs here, to be shown somewhere...
`;

export async function execute(invocation: Invocation): Promise<number> {
  const config = new Config();

  const publicDirectory = await config.publicDirectory();
  if (!publicDirectory) {
    log.error(
      'unable to locate public directory; have you run `git cipher init`?'
    );
    return 1;
  }

  const secrets = await config.readPublicSecrets();
  if (!secrets) {
    log.error('unable to decrypt secrets');
    return 1;
  }

  // TODO: check that other config is valid/present (eg. clean/smudge filter)
  await config.unlockConfig();

  await config.writePrivateSecrets(secrets);

  await removeCachedPlaintext();

  return resetManagedFiles(config, invocation);
}

// help will use this to figure out what to print for usage info
export const optionsSchema = {
  ...commonOptions,
  '--force': {
    defaultValue: false,
    kind: 'switch',
    longDescription: `
      If ciphertext versions of managed files exist in the worktree,
      \`git-cipher unlock\` will reset them to their decrypted state.
      However, if the worktree is "dirty" it will abort.

      Use the \`--force\` switch to proceed with the reset even when
      the worktree is dirty.
    `,
    shortDescription: 'replace ciphertext even if worktree is dirty',
  },
} as const;
