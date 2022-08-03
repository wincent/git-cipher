/**
 * SPDX-FileCopyrightText: Copyright 2013-present Greg Hurrell and contributors.
 * SPDX-License-Identifier: MIT
 */

import {spawn} from 'node:child_process';

export type Result = {
  command: string;
  error: Error | null;
  signal: string | null;
  status: number | null;
  stderr: string;
  stdout: string;
};

/**
 * Run a command and return the result.
 */
export default async function run(
  command: string,
  args: Array<string>
): Promise<Result> {
  return new Promise((resolve) => {
    const result: Result = {
      command: [command, ...args].join(' '),
      error: null,
      signal: null,
      status: null,
      stderr: '',
      stdout: '',
    };

    const child = spawn(command, args);

    child.stderr.on('data', (data) => {
      result.stderr += data.toString();
    });

    // "The 'close' event is emitted after a process has ended and the stdio
    // streams of a child process have been closed. This is distinct from
    // the 'exit' event, since multiple processes might share the same stdio
    // streams. The 'close' event will always emit after 'exit' was already
    // emitted, or 'error' if the child failed to spawn."
    //
    // See: https://nodejs.org/api/child_process.html#event-close
    child.on('close', () => {
      resolve(result);
    });

    child.stdout.on('data', (data) => {
      result.stdout += data.toString();
    });

    // "The 'exit' event may or may not fire after an error has occurred. When
    // listening to both the 'exit' and 'error' events, guard against
    // accidentally invoking handler functions multiple times."
    //
    // See: https://nodejs.org/api/child_process.html#event-close
    child.on('error', (error) => {
      result.error = error;
    });

    // "The 'exit' event is emitted after the child process ends. If the process
    // exited, code is the final exit code of the process, otherwise null. If
    // the process terminated due to receipt of a signal, signal is the string
    // name of the signal, otherwise null. One of the two will always be
    // non-null.
    //
    // When the 'exit' event is triggered, child process stdio streams might
    // still be open."
    //
    // See: https://nodejs.org/api/child_process.html#event-exit
    child.on('exit', (status, signal) => {
      if (typeof status === 'number') {
        result.status = status;
      } else if (signal) {
        result.signal = signal;
      }
    });
  });
}
