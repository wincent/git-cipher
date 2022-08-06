/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

const commonOptions = {
  '--debug': {
    defaultValue: false,
    kind: 'switch',
    longDescription: `
      long
    `,
    shortDescription: 'short',
  },
  '--quiet': {
    defaultValue: false,
    kind: 'switch',
    longDescription: `
      long
    `,
    shortDescription: 'short',
  },
  '--verbose': {
    defaultValue: false,
    kind: 'switch',
    longDescription: `
      increases the verbosity
    `,
    shortDescription: 'increase verbosity',
  },
} as const;

export default commonOptions;
