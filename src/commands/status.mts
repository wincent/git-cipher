/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import commonOptions from '../commonOptions.mjs';

export const description = 'what this thing does';

export const longDescription = `
  long description here
`;

export async function execute(_invocation: Invocation): Promise<number> {
  return 0;
}

export const optionsSchema = {
  ...commonOptions,
} as const;
