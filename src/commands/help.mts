/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import assert from 'node:assert';
import {readdir} from 'node:fs/promises';
import {extname, join} from 'node:path';

import commonOptions from '../commonOptions.mjs';
import dedent from '../dedent.mjs';
import * as log from '../log.mjs';
import {assertOptionsSchema} from '../parseOptions.mjs';

const COMMANDISH = /^\w+$/;

export const description = 'prints usage information';

export const longDescription = `
  long description here
`;

export async function execute(invocation: Invocation): Promise<number> {
  const {commands: directory} = await import('../paths.mjs');

  if (invocation.args.length) {
    if (invocation.args.length > 1) {
      log.warn(`ignoring excess arguments: ${invocation.args.join(' ')}`);
    }
    const command = invocation.args[0];
    assert(command);
    if (COMMANDISH.test(command)) {
      try {
        const file = command + '.mjs';
        const {description, longDescription, optionsSchema} = await import(
          join(directory, file)
        );
        assert(typeof description === 'string');
        assertOptionsSchema(optionsSchema);
        const heading = `Command: git-cipher ${command}`;
        log.printLine(heading);
        log.printLine('='.repeat(heading.length));
        log.printLine('\n', description);
        log.printLine('\n', dedent(longDescription));

        const entries = Object.entries(optionsSchema);
        if (entries.length) {
          log.printLine('Options');
          log.printLine('-------\n');
        }
        for (const [name, option] of entries) {
          // TODO: indent these a bit
          log.printLine(name);
          if (option.longDescription) {
            log.printLine(`\n${dedent(option.longDescription)}`);
          }
        }

        return 0;
      } catch {
        log.error(`couldn't get help for command: ${command}`);
      }
    } else {
      log.error(`can't show help for non-command: ${command}`);
    }
  }

  const commands: {[name: string]: string} = {};
  for (const file of await readdir(directory)) {
    if (extname(file) === '.mjs') {
      try {
        const {description} = await import(join(directory, file));
        assert(typeof description === 'string');
        const name = file.slice(0, -4);
        commands[name] = description;
      } catch {
        // No description; command is undocumented.
      }
    }
  }

  const keys = Object.keys(commands).sort();
  const maximum = keys.reduce((acc, key) => Math.max(acc, key.length), 0);

  for (const name of keys) {
    log.printLine(`    ${name.padEnd(maximum)}    ${commands[name]}`);
  }
  return 0;
}

export const optionsSchema = {
  ...commonOptions,
} as const;
