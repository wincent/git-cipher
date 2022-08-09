/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import markdown from '../markdown.mjs';
import wrap, {revealSchema} from '../wrap.mjs';

export const description = 'cipher-aware wrapper around `git log`';

export const documentation = await markdown('git-cipher-log');

export async function execute(invocation: Invocation): Promise<number> {
  return wrap('log', invocation);
}

export const optionsSchema = {
  ...revealSchema(),
} as const;
