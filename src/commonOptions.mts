/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

const commonOptions = {
  '--debug': {
    defaultValue: false,
    kind: 'switch',
    description: 'short',
  },
  '--quiet': {
    defaultValue: false,
    kind: 'switch',
    description: 'short',
  },
  '--verbose': {
    defaultValue: false,
    kind: 'switch',
    description: 'increase verbosity',
  },
} as const;

export default commonOptions;
