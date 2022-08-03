/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import commonOptions from '../commonOptions.mjs';

// 1. remove secret stuff from .git/com.wincent.git-cipher/...

export const description = 'what this thing does';

// help will use this to figure out what to print for usage info
export const options = {
  ...commonOptions,
};
