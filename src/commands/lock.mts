/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import Config from '../Config.mjs';
import commonOptions from '../commonOptions.mjs';
import removeCachedPlaintext from '../removeCachedPlaintext.mjs';
import resetManagedFiles from '../resetManagedFiles.mjs';

export const description = 'what this thing does';

export const longDescription = `
  Docs here... to be written later
`;

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
    longDescription: `
      If plaintext versions of managed files exist in the worktree,
      \`git-cipher lock\` will reset them to their encrypted state.
      However, if the worktree is "dirty" it will abort.

      Use the \`--force\` switch to proceed with the reset even when
      the worktree is dirty.
    `,
    shortDescription: 'replace plaintext even if worktree is dirty',
  },
} as const;
