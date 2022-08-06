/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import wrap, {revealSchema} from '../wrap.mjs';

export const description = 'cipher-aware wrapper around `git show`';

export const longDescription = `
  explanation
`;

export async function execute(invocation: Invocation): Promise<number> {
  return wrap('show', invocation);
}

export const optionsSchema = {
  ...revealSchema('show'),
} as const;
