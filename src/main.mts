#!/usr/bin/env node

/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import assert from 'node:assert';
import {argv, env, exit} from 'node:process';

import * as log from './log.mjs';
import parseOptions from './parseOptions.mjs';

const __DEV__ = !!env['__DEV__'];

const invocation: Invocation = {
  options: {},
  args: [],
  argv: argv.slice(2),
};

const SHORT_SWITCH = /^-[a-z]$/i;
const SEPARATOR = '--';
const LONG_SWITCH = /^--(?:no-)?(?:[a-z]+-)*(?:[a-z]+)$/;
const LONG_OPTION = /^--(?:[a-z]+-)*(?:[a-z]+)=.+$/;

// Skip `node` executable + the `main.mjs` script.
for (let i = 2; i < argv.length; i++) {
  const arg = argv[i];
  assert(arg);
  if (arg === SEPARATOR) {
    invocation.args.push(...argv.slice(i + 1));
    break;
  }

  let match = arg.match(SHORT_SWITCH);
  if (match) {
    invocation.options[arg] = true;
    continue;
  }

  match = arg.match(LONG_SWITCH);
  if (match) {
    if (arg.startsWith('--no-')) {
      invocation.options[`--${arg.slice(5)}`] = false;
    } else {
      invocation.options[arg] = true;
    }
    continue;
  }

  match = arg.match(LONG_OPTION);
  if (match) {
    const [option, value] = arg.split('=', 2);
    assert(option);
    assert(value);
    invocation.options[option] = value;
    continue;
  }

  if (!invocation.command) {
    invocation.command = arg;
  } else {
    invocation.args.push(arg);
  }
}

if (!invocation.command) {
  invocation.command = 'help';
}

// Note that some subcommands might want to override this (for example
// `clean`/`smudge` should probably be quieter by default than `init` or
// `unlock` which should be reasonably loud by default).
if (invocation.options['--quiet']) {
  log.setLogLevel(log.NOTICE);
}

if (invocation.options['--debug']) {
  log.setLogLevel(log.DEBUG);
}

// TODO: based on subcommand, parse/validate options/args
// eg. --build should be ignored but only in dev
if (invocation.options['--build'] === true && __DEV__) {
  // Ignoring build flag, which should only be passed in __DEV__
  // (ie. from a local clone).
  delete invocation.options['--build'];
}

let status = 1;

// TODO: if these end up being all the same (and they probably will, look at
// DRY-ing them up) - will lose type information unless i take steps
// See: https://github.com/microsoft/TypeScript/issues/32401
if (invocation.command === 'add') {
  const {execute, optionsSchema} = await import('./commands/add.mjs');
  invocation.options = parseOptions(invocation.options, optionsSchema);
  status = await execute(invocation);
} else if (invocation.command === 'clean') {
  const {execute, optionsSchema} = await import('./commands/clean.mjs');
  invocation.options = parseOptions(invocation.options, optionsSchema);
  status = await execute(invocation);
} else if (invocation.command === 'demo') {
  const {execute, optionsSchema} = await import('./commands/demo.mjs');
  invocation.options = parseOptions(invocation.options, optionsSchema);
  status = await execute(invocation);
} else if (invocation.command === 'diff') {
  // This is a wrapper around `git diff`, so we don't call `parseOptions()`.
  const {execute} = await import('./commands/diff.mjs');
  status = await execute(invocation);
} else if (invocation.command === 'help') {
  const {execute, optionsSchema} = await import('./commands/help.mjs');
  invocation.options = parseOptions(invocation.options, optionsSchema);
  status = await execute(invocation);
} else if (invocation.command === 'hook') {
  const {execute, optionsSchema} = await import('./commands/hook.mjs');
  invocation.options = parseOptions(invocation.options, optionsSchema);
  status = await execute(invocation);
} else if (invocation.command === 'init') {
  const {execute, optionsSchema} = await import('./commands/init.mjs');
  invocation.options = parseOptions(invocation.options, optionsSchema);
  status = await execute(invocation);
} else if (invocation.command === 'is-encrypted') {
  const {execute, optionsSchema} = await import('./commands/is-encrypted.mjs');
  invocation.options = parseOptions(invocation.options, optionsSchema);
  status = await execute(invocation);
} else if (invocation.command === 'lock') {
  const {execute, optionsSchema} = await import('./commands/lock.mjs');
  invocation.options = parseOptions(invocation.options, optionsSchema);
  status = await execute(invocation);
} else if (invocation.command === 'log') {
  // This is a wrapper around `git log`, so we don't call `parseOptions()`.
  const {execute} = await import('./commands/log.mjs');
  status = await execute(invocation);
} else if (invocation.command === 'ls') {
  const {execute, optionsSchema} = await import('./commands/ls.mjs');
  invocation.options = parseOptions(invocation.options, optionsSchema);
  status = await execute(invocation);
} else if (invocation.command === 'merge') {
  const {execute, optionsSchema} = await import('./commands/merge.mjs');
  invocation.options = parseOptions(invocation.options, optionsSchema);
  status = await execute(invocation);
} else if (invocation.command === 'show') {
  // This is a wrapper around `git show`, so we don't call `parseOptions()`.
  const {execute} = await import('./commands/show.mjs');
  status = await execute(invocation);
} else if (invocation.command === 'smudge') {
  const {execute, optionsSchema} = await import('./commands/smudge.mjs');
  invocation.options = parseOptions(invocation.options, optionsSchema);
  status = await execute(invocation);
} else if (invocation.command === 'textconv') {
  const {execute, optionsSchema} = await import('./commands/textconv.mjs');
  invocation.options = parseOptions(invocation.options, optionsSchema);
  status = await execute(invocation);
} else if (invocation.command === 'unlock') {
  const {execute, optionsSchema} = await import('./commands/unlock.mjs');
  invocation.options = parseOptions(invocation.options, optionsSchema);
  status = await execute(invocation);
} else {
  log.error(`command not implemented: ${invocation.command}`);
}

exit(status);
