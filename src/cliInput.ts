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

/**
 * Validation function for text inputs.
 *
 * @param value - The current input value to validate
 * @returns `true` if valid, `false` if invalid, or a string error message
 *
 * @example
 * ```ts
 * const validate: ValidateFn = (value) => {
 *   if (value.length < 3) return 'Must be at least 3 characters';
 *   return true;
 * };
 * ```
 */
export type ValidateFn = (
  value: string,
) => boolean | string | Promise<boolean | string>;

/**
 * Option configuration for select and autocomplete prompts.
 *
 * @template T - The string literal type for the option value
 *
 * @example
 * ```ts
 * const options: SelectOption<'dev' | 'prod'>[] = [
 *   { value: 'dev', label: 'Development', hint: 'Local environment' },
 *   { value: 'prod', label: 'Production' },
 * ];
 * ```
 */
export type SelectOption<T extends string> = {
  /** The value returned when this option is selected */
  value: T;
  /** Display text shown to the user (defaults to value if not provided) */
  label?: string;
  /** Additional description or help text for the option */
  hint?: string;
};

/**
 * Interactive CLI input utilities with ESC-to-cancel support.
 *
 * All prompts exit the process with code 0 when the user presses ESC or Ctrl+C.
 *
 * @example
 * ```ts
 * import { cliInput } from '@ls-stack/cli';
 *
 * const name = await cliInput.text('Enter your name');
 * const confirm = await cliInput.confirm('Proceed?', { initial: true });
 * ```
 */
export const cliInput = {
  /**
   * Single selection prompt from a list of options.
   *
   * @template T - String literal union type of option values
   * @param title - The prompt message displayed to the user
   * @param options - Configuration object containing the selectable options
   * @returns The value of the selected option
   *
   * @example
   * ```ts
   * const env = await cliInput.select('Select environment', {
   *   options: [
   *     { value: 'dev', label: 'Development', hint: 'Local server' },
   *     { value: 'prod', label: 'Production' },
   *   ],
   * });
   * // env: 'dev' | 'prod'
   * ```
   */
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

  /**
   * Text input with autocomplete suggestions.
   *
   * Searches across option values, labels, and hints (case-insensitive).
   * Allows free-form text input with optional validation.
   *
   * @template T - String literal union type of option values
   * @param title - The prompt message displayed to the user
   * @param options - Configuration with autocomplete options and optional validation
   * @returns The selected or entered value
   *
   * @example
   * ```ts
   * const framework = await cliInput.textWithAutocomplete('Select framework', {
   *   options: [
   *     { value: 'react', label: 'React', hint: 'UI library' },
   *     { value: 'vue', label: 'Vue', hint: 'Progressive framework' },
   *   ],
   *   validate: (v) => v.length > 0 || 'Required',
   * });
   * ```
   */
  textWithAutocomplete: async <T extends string>(
    title: string,
    {
      options,
      validate,
    }: { options: SelectOption<T>[]; validate?: ValidateFn },
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
                  c.value.toLowerCase().includes(lowerTerm) ||
                  c.description?.toLowerCase().includes(lowerTerm),
              );
            },
            validate,
          },
          { signal },
        ),
      );
    } catch (e) {
      handlePromptError(e);
    }
  },

  /**
   * Text input prompt with optional default value and validation.
   *
   * @param title - The prompt message displayed to the user
   * @param options - Configuration with optional initial value and validation
   * @returns The entered text
   *
   * @example
   * ```ts
   * const name = await cliInput.text('Project name', {
   *   initial: 'my-project',
   *   validate: (v) => /^[a-z0-9-]+$/.test(v) || 'Invalid name',
   * });
   * ```
   */
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

  /**
   * Yes/No confirmation prompt.
   *
   * @param title - The prompt message displayed to the user
   * @param options - Configuration with optional default value
   * @returns `true` for yes, `false` for no
   *
   * @example
   * ```ts
   * const proceed = await cliInput.confirm('Deploy to production?', {
   *   initial: false,
   * });
   * ```
   */
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

  /**
   * Multi-select prompt with checkboxes.
   *
   * Requires at least one option to be selected.
   *
   * @template T - String literal union type of option values
   * @param title - The prompt message displayed to the user
   * @param options - Configuration object containing the selectable options
   * @returns Array of selected option values
   *
   * @example
   * ```ts
   * const features = await cliInput.multipleSelect('Enable features', {
   *   options: [
   *     { value: 'typescript', label: 'TypeScript' },
   *     { value: 'eslint', label: 'ESLint' },
   *     { value: 'prettier', label: 'Prettier' },
   *   ],
   * });
   * // features: ('typescript' | 'eslint' | 'prettier')[]
   * ```
   */
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

  /**
   * Numeric input prompt.
   *
   * Returns `null` on non-cancellation errors (cancellation exits the process).
   *
   * @param title - The prompt message displayed to the user
   * @param options - Configuration with optional default value
   * @returns The entered number, or `null` on error
   *
   * @example
   * ```ts
   * const port = await cliInput.number('Enter port', { initial: 3000 });
   * if (port !== null) {
   *   console.log(`Using port ${port}`);
   * }
   * ```
   */
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
