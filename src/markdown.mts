/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import assert from 'node:assert';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

import Scanner from './Scanner.mjs';
import {assertIsObject, assertHasKey} from './assert.mjs';
import {docs} from './paths.mjs';

type Option = {
  name: string;
  description: string;
};

type Markdown = {
  text: string;
  options: Array<Option>;
};

/**
 * Returns formatted (wrapped) Markdown suitable for display on the command-line
 * and structured information from the documentation for the specified
 * `command`.
 *
 * Makes some assumptions about the syntax in the documents:
 *
 * - No hard wrapping.
 * - All code blocks are fenced.
 * - Options appear under an "## Options" section, and each option uses an
 *   "### `--option-name`" subheading; options continue until the next
 *   "## Section", or the end of the document.
 * - No links.
 * - No footnotes.
 *
 * In other words, it is not intended to handle anything like "PROTOCOL.md", but
 * rather the simple command-oriented docs under "docs/".
 */
export default async function markdown(command: string): Promise<Markdown> {
  console.log(command);

  const contents = await readFile(join(docs, `${command}.md`), 'utf8');
  const scanner = new Scanner(contents);
  const result: Markdown = {
    text: '',
    options: [],
  };

  let lastIndex = scanner.index;
  while (!scanner.atEnd()) {
    if (scanner.scan(/##\s*Options\s*\n/)) {
      result.options = scanOptions(scanner);
    }

    // TODO: make this scan more things; like fenced code blocks, lists, headings etc.
    const fenced = scanFenced(scanner);
    if (fenced) {
      result.text = result.text.length ? `${result.text}\n${fenced}` : fenced;
    }

    const line = scanner.scan(/[^\n]+/);
    if (line) {
      result.text = result.text.length
        ? `${result.text}\n\n${line.trim()}`
        : line.trim();
    }

    scanner.scan(/\s+/);

    assert(scanner.index !== lastIndex);
  }

  return result;
}

export function assertMarkdown(value: unknown): asserts value is Markdown {
  assertIsObject(value);
  assertHasKey(value, 'text');
  assert(typeof value.text === 'string');
  assertHasKey(value, 'options');
  assert(Array.isArray(value.options));

  for (const option of value.options) {
    assertIsObject(option);
    assertHasKey(option, 'name');
    assert(typeof option.name === 'string');
    assertHasKey(option, 'description');
    assert(typeof option.description === 'string');
  }
}

function scanFenced(scanner: Scanner): string {
  let fenced = '';
  if (scanner.scan(/```(?:\w+)?\n/)) {
    fenced = '```\n';
    while (!scanner.atEnd()) {
      if (scanner.scan(/```\n/)) {
        fenced += '```\n';
        return fenced;
      }
      const line = scanner.scan(/[^\n]*\n/);
      if (line) {
        fenced += line;
      }
    }
  }
  assert(fenced === ''); // Error if we got fence start but not fence end.
  return fenced;
}

function scanOption(scanner: Scanner, name: string): Option {
  const option = {
    name,
    description: '',
  };
  let lastIndex = scanner.index;
  while (!scanner.atEnd()) {
    if (scanner.peek(/###?\s*\S/)) {
      // Next option or section is starting.
      break;
    }

    // TODO: make this scan more things; like fenced code blocks, lists etc
    const line = scanner.scan(/[^#][^\n]*/);
    if (line) {
      option.description = option.description.length
        ? `${option.description}\n\n${line.trim()}`
        : line.trim();
    }

    scanner.scan(/\s+/);

    assert(scanner.index !== lastIndex);
  }
  return option;
}

function scanOptions(scanner: Scanner): Array<Option> {
  const options: Array<Option> = [];
  let lastIndex = scanner.index;
  while (!scanner.atEnd()) {
    if (scanner.peek(/##\s*\S/)) {
      // Next section is starting.
      break;
    }

    if (scanner.scan(/###\s*([^\n]+)/)) {
      const name = scanner.captures?.[0];
      assert(name);
      options.push(scanOption(scanner, name));
    }

    assert(scanner.index !== lastIndex);
  }
  return options;
}

// TODO: wrapping
