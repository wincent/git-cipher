/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import assert from 'node:assert';

import {assertIsObject, hasKey} from './assert.mjs';

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
  value: unknown
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
          typeof option.defaultValue === 'boolean'
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

export default function parseOptions(
  input: Options,
  schema: OptionsSchema
): Options {
  const errors = [];
  const output: Options = {};

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
        `option ${name} expects one of: ${option.allowedValues.join(', ')}`
      );
    }
  }

  for (const name of Object.keys(input)) {
    if (!schema[name]) {
      errors.push(`unrecognized option ${name}`);
    }
  }

  if (errors.length) {
    throw new Error('something bad ' + JSON.stringify(errors));
  }

  return output;
}
