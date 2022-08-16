/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import markdown from '../markdown.mjs';
import wrapGit, {revealSchema} from '../wrapGit.mjs';

export const description = 'cipher-aware wrapper around `git show`';

export const documentation = await markdown('git-cipher-show');

export async function execute(invocation: Invocation): Promise<number> {
  return wrapGit('show', invocation);
}

export const optionsSchema = {
  ...revealSchema(),
} as const;
