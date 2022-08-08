/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import wrap, {revealSchema} from '../wrap.mjs';

export const description = 'cipher-aware wrapper around `git log`';

export const longDescription = `
  explanation
`;

export async function execute(invocation: Invocation): Promise<number> {
  return wrap('log', invocation);
}

export const optionsSchema = {
  ...revealSchema('log'),
} as const;