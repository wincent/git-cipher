/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import assert from 'node:assert';
import {readdir} from 'node:fs/promises';
import {extname, join} from 'node:path';

import commonOptions from '../commonOptions.mjs';
import * as log from '../log.mjs';
import markdown, {assertMarkdown} from '../markdown.mjs';
import {assertOptionsSchema} from '../parseOptions.mjs';

const COMMANDISH = /^\w+(?:-\w+)*$/;

export const description = 'prints usage information';

export const documentation = await markdown('git-cipher-help');

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
        const {description, documentation, optionsSchema} = await import(
          join(directory, file)
        );
        assert(typeof description === 'string');
        assertMarkdown(documentation);
        assertOptionsSchema(optionsSchema);
        log.print(documentation.text);

        const options = Object.values(documentation.options);
        if (options.length) {
          log.printLine('\nOptions');
          log.printLine('-------\n');
          for (const option of options) {
            log.printLine(`${option.name}\n`);
            if (option.description) {
              log.printLine(`${option.description}`);
            }
          }
        }

        return 0;
      } catch (error) {
        log.debug(error);
        log.error(`couldn't get help for command: ${command}`);
      }
    } else {
      log.error(`can't show help for non-command: ${command}`);
    }
  }

  const commands: {[name: string]: string} = {};
  log.printLine('Available subcommands:\n');
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
