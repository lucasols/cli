import {
  checkbox,
  confirm,
  input,
  number,
  search,
  select,
} from '@inquirer/prompts';
import * as readline from 'readline';

function isUserCancellation(e: unknown): boolean {
  return (
    e instanceof Error &&
    (e.name === 'ExitPromptError' ||
      e.name === 'AbortError' ||
      e.name === 'AbortPromptError')
  );
}

function handlePromptError(e: unknown): never {
  if (isUserCancellation(e)) {
    process.exit(0);
  }

  console.error(e);
  process.exit(1);
}

function createEscapeAbortController(): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  const controller = new AbortController();

  readline.emitKeypressEvents(process.stdin);

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  function onKeypress(_: string, key: readline.Key) {
    if (key.name === 'escape') {
      controller.abort();
    }
  }

  process.stdin.on('keypress', onKeypress);

  function cleanup() {
    process.stdin.removeListener('keypress', onKeypress);
  }

  return { signal: controller.signal, cleanup };
}

async function withEscapeSupport<T>(
  promptFn: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const { signal, cleanup } = createEscapeAbortController();

  try {
    return await promptFn(signal);
  } finally {
    cleanup();
  }
}

export type ValidateFn = (
  value: string,
) => boolean | string | Promise<boolean | string>;

export type SelectOption<T extends string> = {
  value: T;
  label?: string;
  hint?: string;
};

export const cliInput = {
  select: async <T extends string>(
    title: string,
    { options }: { options: SelectOption<T>[] },
  ): Promise<T> => {
    try {
      return await withEscapeSupport((signal) =>
        select(
          {
            message: title,
            choices: options.map((option) => ({
              value: option.value,
              name: option.label ?? option.value,
              description: option.hint,
            })),
          },
          { signal },
        ),
      );
    } catch (e) {
      handlePromptError(e);
    }
  },

  selectWithSearch: async <T extends string>(
    title: string,
    { options }: { options: SelectOption<T>[] },
  ): Promise<T> => {
    try {
      const choices = options.map((option) => ({
        value: option.value,
        name: option.label ?? option.value,
        description: option.hint,
      }));

      return await withEscapeSupport((signal) =>
        search(
          {
            message: title,
            source: (term: string | undefined) => {
              if (!term) return choices;

              const lowerTerm = term.toLowerCase();

              return choices.filter(
                (c) =>
                  c.name.toLowerCase().includes(lowerTerm) ||
                  c.value.toLowerCase().includes(lowerTerm),
              );
            },
          },
          { signal },
        ),
      );
    } catch (e) {
      handlePromptError(e);
    }
  },

  text: async (
    title: string,
    {
      initial,
      validate,
    }: {
      initial?: string;
      validate?: ValidateFn;
    } = {},
  ): Promise<string> => {
    try {
      return await withEscapeSupport((signal) =>
        input(
          { message: title, default: initial, required: true, validate },
          { signal },
        ),
      );
    } catch (e) {
      handlePromptError(e);
    }
  },

  confirm: async (
    title: string,
    { initial }: { initial?: boolean } = {},
  ): Promise<boolean> => {
    try {
      return await withEscapeSupport((signal) =>
        confirm({ message: title, default: initial }, { signal }),
      );
    } catch (e) {
      handlePromptError(e);
    }
  },

  multipleSelect: async <T extends string>(
    title: string,
    { options }: { options: SelectOption<T>[] },
  ): Promise<T[]> => {
    try {
      return await withEscapeSupport((signal) =>
        checkbox(
          {
            message: title,
            required: true,
            choices: options.map((option) => ({
              value: option.value,
              name: option.label ?? option.value,
              description: option.hint,
            })),
          },
          { signal },
        ),
      );
    } catch (e) {
      handlePromptError(e);
    }
  },

  number: async (
    title: string,
    { initial }: { initial?: number } = {},
  ): Promise<number | null> => {
    try {
      return await withEscapeSupport((signal) =>
        number(
          { message: title, default: initial, required: true },
          { signal },
        ),
      );
    } catch (e) {
      if (isUserCancellation(e)) {
        process.exit(0);
      }

      console.error(e);
      return null;
    }
  },
};
