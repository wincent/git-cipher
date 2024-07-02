/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import assert from 'node:assert';
import {join} from 'node:path';
import {argv} from 'node:process';

import ExitStatus from './ExitStatus.mjs';
import {assertIsObject, hasKey} from './assert.mjs';
import * as log from './log.mjs';
import {commands} from './paths.mjs';
import {wrapWithInset} from './wrap.mjs';

type Options = {
  [option: string]: string | boolean;
};

type OptionSchema = {
  allowedValues?: Array<string>;
  defaultValue?: string;
  description?: string;
  kind: 'option';
  process?: (value: string) => unknown;
  required?: boolean;
};

type SwitchSchema = {
  defaultValue?: boolean;
  description?: string;
  kind: 'switch';
  process?: (value: boolean) => unknown;
  required?: boolean;
};

export type OptionsSchema = {
  [option: string]: OptionSchema | SwitchSchema;
};

export function assertOptionsSchema(
  value: unknown,
): asserts value is OptionsSchema {
  assertIsObject(value);

  for (const [name, option] of Object.entries(value)) {
    // TODO: validate format of name properly
    assert(/^-.+/, name);

    assertIsObject(option);

    if (hasKey(option, 'allowedValues')) {
      assert(Array.isArray(option.allowedValues));
      for (const item of option.allowedValues) {
        assert(typeof item === 'string');
      }
    }

    if (hasKey(option, 'defaultValue')) {
      assert(
        typeof option.defaultValue === 'string' ||
          typeof option.defaultValue === 'boolean',
      );
    }

    if (hasKey(option, 'description')) {
      assert(typeof option.description === 'string');
    }

    assert(hasKey(option, 'kind'));
    assert(option.kind === 'option' || option.kind === 'switch');

    if (hasKey(option, 'required')) {
      assert(typeof option.required === 'boolean');
    }
  }
}

function executableName(): string {
  // Sadly, at this point we can't know if called as `git cipher <subcommand>`
  // or `git-cipher <subcommand>` (ie. via $PATH) or `bin/git-cipher
  // <subcommand>` (ie. in `__DEV__` env); so we take a weak guess.
  if (argv[0]?.includes('/vendor/node/n/versions/node/')) {
    // Probably running from __DEV__ via `bin/git-cipher`; first two elements of
    // `argv` will resemble:
    //
    // - '/some/absolute/path/to/repo/vendor/node/n/versions/node/18.7.0/bin/node'
    // - '/some/absolute/path/to/repo/lib/main.mjs'
    return 'git-cipher';
  } else {
    // Probably installed globally in `$PATH`.
    return 'git cipher';
  }
}

/**
 * When `wrapGit` is `true`, only limited parsing is done (checking to see
 * whether `--help` has been provided); everything else passed through to `git`.
 */
export default async function parseOptions(
  invocation: Invocation,
  schema: OptionsSchema,
  options?: {
    wrapGit: boolean;
  },
): Promise<Options> {
  const errors = [];
  const input = invocation.options;
  const output: Options = {};
  const wrapGit = options?.wrapGit;

  // Special case; for any command `--help` should print usage information and
  // exit immediately.
  if (input['--help']) {
    const executable = executableName();

    // Note: in practice, `command` is always set even though its type
    // technically is `string | undefined`, because we set it to "help" as a
    // fallback.
    log.printLine(`${executable} ${invocation.command}\n`);

    try {
      // Safe because `invocation.command` is always an existing command name.
      const {description} = await import(
        join(commands, `${invocation.command}.mjs`)
      );
      assert(typeof description === 'string');
      log.printLine(wrapWithInset(description, 2));
    } catch {
      // No description; command is undocumented.
    }

    log.printLine('Options:\n');
    Object.entries(schema)
      .sort(([a], [b]) => {
        return a < b ? -1 : a > b ? 1 : 0;
      })
      .forEach(([name, schema]) => {
        if (schema.kind === 'switch') {
          if (schema.defaultValue) {
            // Note: In practice, we don't have any switches like this yet.
            log.printLine(`  ${name.replace(/^--/, '--no-')}`);
          } else {
            log.printLine(`  ${name}`);
          }
        } else {
          const placeholder = `<${name.replace(/-/g, '')}>`;
          if (schema.defaultValue) {
            log.printLine(
              `  ${name}=${placeholder} (default: ${schema.defaultValue})`,
            );
          } else {
            log.printLine(`  ${name}=${placeholder}`);
          }
        }
        if (schema.description) {
          // Shouldn't need to wrap this very often, but we do, just in case.
          log.printLine(wrapWithInset(schema.description, 4));
        }
      });

    log.printLine(
      `\nRun \`${executable} help ${invocation.command}\` for subcommand documentation.`,
    );
    log.printLine(`Run \`${executable} help\` for a list of subcommands.`);

    throw new ExitStatus(0);
  }

  if (wrapGit) {
    return output;
  }

  for (const [name, option] of Object.entries(schema)) {
    if (input[name] === undefined && option.defaultValue !== undefined) {
      output[name] = option.defaultValue;
    } else if (input[name] !== undefined) {
      // For some reason, TS isn't refining the type here.
      output[name] = input[name]!;
    }

    const value = output[name];

    if (option.required && !value) {
      errors.push(`required option ${name} not provided`);
    } else if (option.kind === 'option' && typeof value !== 'string') {
      errors.push(`option ${name} requires a value`);
    } else if (option.kind === 'switch' && typeof value !== 'boolean') {
      errors.push(`${name} switch does not accept a value`);
    } else if (
      option.kind === 'option' &&
      option.allowedValues &&
      typeof value === 'string' &&
      !option.allowedValues.includes(value)
    ) {
      errors.push(
        `option ${name} expects one of: ${option.allowedValues.join(', ')}`,
      );
    }
  }

  for (const name of Object.keys(input)) {
    if (!schema[name]) {
      errors.push(`unrecognized option ${name}`);
    }
  }

  if (errors.length) {
    for (const error of errors) {
      log.error(error);
    }
    throw new ExitStatus(1);
  }

  return output;
}
