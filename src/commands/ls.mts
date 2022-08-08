/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import {readFile} from 'node:fs/promises';
import {join, relative, resolve} from 'node:path';
import {cwd, stdout} from 'node:process';

import Config from '../Config.mjs';
import commonOptions from '../commonOptions.mjs';
import git from '../git.mjs';
import * as log from '../log.mjs';
import parse from '../parse.mjs';

export const description = 'Lists encrypted files';

export const longDescription = `
  Shows the set of files managed by \`git-cipher\` in the current repository.

  This is effectively provided as a convenience because the same information is
  available in the ".gitattributes" file, albeit in a less readable format.

  By default, shows all managed files. Can be scoped to list specific files by
  passing additional arguments representing files or directories; for example,
  to list managed files in the current directory only:

      git-cipher ls .
`;

export async function execute(invocation: Invocation): Promise<number> {
  const filters = invocation.args.map((arg) => {
    return resolve(arg);
  });
  const config = new Config();

  const managedFiles = await config.managedFiles();
  const topLevel = await config.topLevel();
  if (!managedFiles || !topLevel) {
    log.error('unable to list files');
    return 1;
  }

  for (const file of managedFiles) {
    const relativePath = relative(cwd(), join(topLevel, file));

    if (filters.length) {
      const absolutePath = resolve(relativePath);
      if (
        !filters.some((filter) => {
          return (
            absolutePath === filter || absolutePath.startsWith(`${filter}/`)
          );
        })
      ) {
        continue;
      }
    }

    if (invocation.options['--verbose']) {
      const index = await indexStatus(relativePath);
      const worktree = await worktreeStatus(relativePath);
      const problematic = index === 'decrypted';
      const prefix = problematic ? `${log.BOLD}${log.RED}` : '';
      const suffix = problematic ? log.RESET : '';
      stdout.write(
        `${prefix}${relativePath} (index=${index}, worktree=${worktree})${suffix}\n`
      );
    } else {
      stdout.write(`${relativePath}\n`);
    }
  }

  return 0;
}

type EncryptionStatus = 'decrypted' | 'empty' | 'encrypted' | 'error';

const PARSE_RESULT_TO_ENCRYPTION_STATUS = {
  'already-decrypted': 'decrypted',
  success: 'encrypted',
  error: 'error',
} as const;

function status(contents: Buffer): EncryptionStatus {
  if (contents.length) {
    const parseResult = parse(contents);
    return PARSE_RESULT_TO_ENCRYPTION_STATUS[parseResult.kind];
  } else {
    return 'empty';
  }
}

async function indexStatus(relativePath: string): Promise<EncryptionStatus> {
  const result = await git('show', `:0:${relativePath}`);
  if (result.success) {
    return status(result.stdout);
  }
  return 'error';
}

async function worktreeStatus(relativePath: string): Promise<EncryptionStatus> {
  try {
    const contents = await readFile(relativePath);
    return status(contents);
  } catch {
    return 'error';
  }
}

export const optionsSchema = {
  ...commonOptions,
  '--verbose': {
    ...commonOptions['--verbose'],
    longDescription: `
      In addition to listing the paths, show current status information for
      each file. For each of "index" and "worktree", the following statuses
      may apply:

          - encrypted
          - empty
          - error
          - decrypted

      Sample output:

          examples/empty-file (index=empty, worktree=empty)
          examples/file (index=encrypted, worktree=decrypted)

      Note that a status of "index=decrypted" is always a problem, because it
      indicates that plaintext was staged in the index and may be committed.
      The \`git-cipher ls\` subcommand will print such lines using bold, red
      highlighting.
    `,
    shortDescription: 'display status information for each file',
  },
} as const;
