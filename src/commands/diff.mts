/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import markdown from '../markdown.mjs';
import wrap, {revealSchema} from '../wrap.mjs';

export const description = 'cipher-aware wrapper around `git diff`';

export const documentation = await markdown('git-cipher-diff');

export async function execute(invocation: Invocation): Promise<number> {
  return wrap('diff', invocation);
}

export const optionsSchema = {
  ...revealSchema,
} as const;
