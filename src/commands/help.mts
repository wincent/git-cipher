/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import commonOptions from '../commonOptions.mjs';

export async function execute(invocation: Invocation) {
  if (invocation.args.length) {
    console.log('would show help for this command here');
  }
}

export const description = 'what this thing does';

export const options = {
  ...commonOptions,
};
