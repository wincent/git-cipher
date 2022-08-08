/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import git from './git.mjs';
import * as log from './log.mjs';
import {describeResult} from './run.mjs';

export default async function removeCachedPlaintext(): Promise<void> {
  let result = await git('update-ref', '-d', 'refs/notes/textconv/git-cipher');
  if (!result.success) {
    log.error(describeResult(result));
  }
  result = await git('gc', '--prune=now');
  if (!result.success) {
    log.error(describeResult(result));
  }
}
