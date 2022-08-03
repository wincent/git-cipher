#!/usr/bin/env node

/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import assert from 'node:assert';
import {argv, env} from 'node:process';

const invocation: Invocation = {
  options: {},
  args: [],
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

  console.log('testing', arg);
  let match = arg.match(SHORT_SWITCH);
  if (match) {
    invocation.options[arg.slice(1)] = true;
    continue;
  }

  match = arg.match(LONG_SWITCH);
  if (match) {
    if (arg.startsWith('--no-')) {
      invocation.options[arg.slice(5)] = false;
    } else {
      invocation.options[arg.slice(2)] = true;
    }
    continue;
  }

  match = arg.match(LONG_OPTION);
  if (match) {
    const [option, value] = arg.split('=', 2);
    assert(option);
    invocation.options[option.slice(2)] = value || true;
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

// TODO: based on subcommand, parse/validate options/args
// eg. --build should be ignored but only in dev
if (invocation.options['build'] === true && env['__DEV__']) {
  // Ignoring build flag, which should only be passed in __DEV__
  // (ie. from a local clone).
  delete invocation.options['build'];
}

console.log('invocation', invocation);

if (invocation.command === 'demo') {
  const {execute} = await import('./commands/demo.mjs');
  await execute(invocation);
} else if (invocation.command === 'help') {
  const {execute} = await import('./commands/help.mjs');
  await execute(invocation);
}
