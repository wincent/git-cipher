/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import assert from 'node:assert';
import {stdout} from 'node:process';
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
    scanWhitespace(scanner);
    if (scanner.scan(/##\s*Options\s*\n/)) {
      result.options = scanOptions(scanner);
      continue;
    }
    const heading = scanHeading(scanner);
    if (heading) {
      result.text = result.text.length ? `${result.text}\n${heading}` : heading;
    }
    scanWhitespace(scanner);
    const text = scanText(scanner);
    if (text) {
      result.text = result.text.length ? `${result.text}\n${text}` : text;
    }
    scanWhitespace(scanner);

    assert(scanner.index !== lastIndex);
    lastIndex = scanner.index;
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

function scanHeading(scanner: Scanner): string {
  const heading = scanner.scan(/#+s*[^\n]+\n/);
  if (heading) {
    return heading;
  }
  return '';
}

function scanList(scanner: Scanner): string {
  let list = '';
  if (scanner.scan(/-\s*([^\n]+)\n/)) {
    const item = scanner.captures?.[0];
    assert(item);
    list = list.length ? `${list}\n${item}\n` : `- ${item}\n`;
  }
  return list;
}

function scanOption(scanner: Scanner, name: string): Option {
  const description = scanText(scanner);
  assert(description);
  return {
    name,
    description,
  };
}

function scanOptions(scanner: Scanner): Array<Option> {
  const options: Array<Option> = [];
  let lastIndex = scanner.index;
  while (!scanner.atEnd()) {
    if (scanner.peek(/##\s*\S/)) {
      // Next section is starting.
      break;
    }

    if (scanner.scan(/###\s*`([^\n`]+)`\s*\n/)) {
      const name = scanner.captures?.[0];
      assert(name);
      options.push(scanOption(scanner, name));
    }

    assert(scanner.index !== lastIndex);
    lastIndex = scanner.index;
  }
  return options;
}

/**
 * Returns a single paragraph. Note that this depends on more specific types of
 * scan having been called first to handle headings, lists, and fenced code
 * blocks).
 */
function scanParagraph(scanner: Scanner): string {
  const peeked = scanner.peek(/.{1,3}/);
  assert(!peeked?.startsWith('#'));
  assert(!peeked?.startsWith('-'));
  assert(peeked !== '```');
  const line = scanner.scan(/[^\n]+/);
  if (line) {
    return line.trim();
  }
  return '';
}

/**
 * Scans text (paragraphs, fenced code blocks, lists) up until the next section
 * header, or until the end of the input if no such header exists.
 */
function scanText(scanner: Scanner): string {
  let text = '';
  let lastIndex = scanner.index;
  while (!scanner.atEnd()) {
    scanWhitespace(scanner);
    if (scanner.peek(/#/)) {
      break;
    }
    const fenced = scanFenced(scanner);
    if (fenced) {
      text = text.length ? `${text}\n${fenced}` : fenced;
      continue;
    }
    const list = scanList(scanner);
    if (list) {
      text = text.length ? `${text}\n${list}` : list;
      continue;
    }
    const paragraph = scanParagraph(scanner);
    if (paragraph) {
      text = text.length ? `${text}\n${paragraph}` : paragraph;
      continue;
    }
    assert(scanner.index !== lastIndex);
    lastIndex = scanner.index;
  }
  return text;
}

function scanWhitespace(scanner: Scanner): string | undefined {
  return scanner.scan(/\s+/);
}

function wrapWidth(): number {
  return stdout.columns || 80;
}

// TODO: don't export this, i am only exporting it now to stop TS from complaining
export function wrap(text: string): string {
  const width = wrapWidth();
  return `${width}:${text}`; // TODO actually implement
}
