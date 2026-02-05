import { createSpinner as createNanoSpinner } from 'nanospinner';

const isTTY = process.stdout.isTTY === true;

export type Spinner = {
  start: (text?: string) => Spinner;
  update: (text: string) => Spinner;
  success: (text?: string) => Spinner;
  error: (text?: string) => Spinner;
  warn: (text?: string) => Spinner;
  stop: () => Spinner;
  clear: () => Spinner;
};

function createNoopSpinner(): Spinner {
  const spinner: Spinner = {
    start: () => spinner,
    update: () => spinner,
    success: (text) => {
      if (text) process.stdout.write(`${text}\n`);
      return spinner;
    },
    error: (text) => {
      if (text) console.error(text);
      return spinner;
    },
    warn: (text) => {
      if (text) console.warn(text);
      return spinner;
    },
    stop: () => spinner,
    clear: () => spinner,
  };
  return spinner;
}

export type SpinnerOptions = {
  text?: string;
  color?: 'green' | 'red' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white';
};

export function createSpinner(options?: SpinnerOptions | string): Spinner {
  const opts: SpinnerOptions =
    typeof options === 'string' ? { text: options } : (options ?? {});

  if (!isTTY) {
    if (opts.text) process.stdout.write(`${opts.text}\n`);
    return createNoopSpinner();
  }

  const nanoSpinner = createNanoSpinner(opts.text ?? '', {
    color: opts.color ?? 'cyan',
  });

  const spinner: Spinner = {
    start: (text) => {
      if (text) {
        nanoSpinner.update({ text });
      }
      nanoSpinner.start();
      return spinner;
    },
    update: (text) => {
      nanoSpinner.update({ text });
      return spinner;
    },
    success: (text) => {
      nanoSpinner.success({ text });
      return spinner;
    },
    error: (text) => {
      nanoSpinner.error({ text });
      return spinner;
    },
    warn: (text) => {
      nanoSpinner.warn({ text });
      return spinner;
    },
    stop: () => {
      nanoSpinner.stop();
      return spinner;
    },
    clear: () => {
      nanoSpinner.clear();
      return spinner;
    },
  };

  return spinner;
}
