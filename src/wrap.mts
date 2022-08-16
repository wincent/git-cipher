/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import assert from 'node:assert';

/**
 * Wraps `text` within specified `width` using a basic version of the approach
 * (apparently?) implemented in TeX that seeks to minimize raggedness of the
 * right margin, but doesn't support advanced features like hyphenation.
 *
 * For each line except the last, we calculate a penalty based on the amount of
 * trailing whitespace squared. We use a bottom-up dynamic programming approach
 * to find an optimum set of break-points (ie. using memoization to avoid
 * recomputing the same penalties as we explore the problem space). Run time is
 * quadratic.
 */
export default function wrap(text: string, width: number = 72): string {
  const words = text.trim().split(/\s+/g);
  assert(words.length);
  const memo: Array<{
    end: number;
    penalty: number;
  }> = [];

  for (let start = words.length - 1; start >= 0; start--) {
    let length = 0;
    for (let end = start + 1; end <= words.length; end++) {
      const word = words[end - 1];
      assert(word);
      const candidateLength = word.length;
      let fits = false;
      if (end - start === 1) {
        // First word after a break is always considered to fit.
        fits = true;
      } else {
        fits = length + 1 + candidateLength <= width;
      }
      if (fits) {
        length = length ? length + 1 + candidateLength : candidateLength;
        const next = memo[end] || {end: words.length, penalty: 0};
        const penalty =
          (end === words.length ? 0 : Math.pow(width - length, 2)) +
          next.penalty;
        memo[start] = {end, penalty};
      } else {
        break;
      }
    }
  }

  let output = '';
  for (let i = 0; i < words.length; ) {
    const line = memo[i];
    assert(line);
    while (i < line.end) {
      output += words[i++];
      if (i === line.end) {
        output += '\n';
        break;
      } else {
        output += ' ';
      }
    }
  }
  return output;
}
