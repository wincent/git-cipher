/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import type {Buffer} from 'node:buffer';

const WRAP_WIDTH = 72;

/**
 * "Pretty prints" one or more buffers as a wrapped hexadecimal string.
 */
export default function hex(...buffers: Array<Buffer>): string {
  // Not the most efficient thing, but it is readable.
  return buffers
    .map((buffer) => buffer.toString('hex'))
    .join('')
    .replace(new RegExp(`.{1,${WRAP_WIDTH}}`, 'g'), '$&\n');
}
