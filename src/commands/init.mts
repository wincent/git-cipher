/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import commonOptions from '../commonOptions.mjs';

// 1. set up .git-cipher directory to contain config
//   might want user to be able to override this with a switch, in case they don't
//   like the name
// 2. decrypt committed key & salt (etc?)
// 3. stash it in .git/com.wincent.git-cipher/...
// 4. register up clean and smudge filters

export const description = 'what this thing does';

export const options = {
  ...commonOptions,
};
