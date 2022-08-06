/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import wrap, {revealSchema} from '../wrap.mjs';

export const description = 'cipher-aware wrapper around `git diff`';

export const longDescription = `
  explanation
`;

export async function execute(invocation: Invocation): Promise<number> {
  return wrap('diff', invocation);
}

export const optionsSchema = {
  ...revealSchema('diff'),
} as const;
