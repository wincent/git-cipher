/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import run from './run.mjs';

import type {Result} from './run.mjs';

export default function git(...args: Array<string>): Promise<Result> {
  return run('git', args);
}
