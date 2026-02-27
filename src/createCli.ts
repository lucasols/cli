import { cliInput } from './cliInput';
import { getAscIndexOrder, sortBy } from '@ls-stack/utils/arrayUtils';
import { exhaustiveCheck } from '@ls-stack/utils/assertions';
import { dedent } from '@ls-stack/utils/dedent';
import { removeANSIColors } from '@ls-stack/utils/stringUtils';
import { isObjKey, typedObjectEntries } from '@ls-stack/utils/typingFnUtils';
import { styleText } from 'node:util';

const [, , cmdFromTerminal, ...cmdArgs] = process.argv;

/**
 * Positional argument definition for CLI commands.
 *
 * Positional arguments are parsed in the order they are defined in the `args` object.
 *
 * @example
 * ```ts
 * // String positional arg (required)
 * { type: 'positional-string', name: 'filename', description: 'File to process' }
 *
 * // Number positional arg with default (optional)
 * { type: 'positional-number', name: 'port', description: 'Port number', default: 3000 }
 * ```
 */
export type PositionalArg =
  | {
      type: 'positional-string';
      name: string;
      default?: string;
      description: string;
    }
  | {
      type: 'positional-number';
      name: string;
      default?: number;
      description: string;
    };

/**
 * Argument definition for CLI commands.
 *
 * Supports positional arguments, boolean flags, and value flags.
 *
 * **Argument Types:**
 * - `positional-string` - Required string argument (optional if `default` is provided)
 * - `positional-number` - Required number argument (optional if `default` is provided)
 * - `flag` - Boolean flag (`--verbose`), defaults to `false`
 * - `value-string-flag` - Flag with string value (`--config file.json`)
 * - `value-number-flag` - Flag with number value (`--port 8080`)
 *
 * @example
 * ```ts
 * const args = {
 *   name: { type: 'positional-string', name: 'name', description: 'Project name' },
 *   port: { type: 'value-number-flag', name: 'port', description: 'Port', default: 3000 },
 *   verbose: { type: 'flag', name: 'verbose', description: 'Verbose output' },
 * };
 * ```
 */
export type Arg =
  | PositionalArg
  | {
      type: 'flag';
      name: string;
      description: string;
    }
  | {
      type: 'value-string-flag';
      default?: string;
      name: string;
      description: string;
    }
  | {
      type: 'value-number-flag';
      default?: number;
      name: string;
      description: string;
    };

type Cmd = {
  short?: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- internal type
  run: (...args: any[]) => Promise<void> | void;
  args?: Record<string, Arg>;
  examples?: {
    args: string[];
    description: string;
  }[];
};

type GetArgType<T extends Arg> =
  T extends PositionalArg ?
    T['type'] extends 'positional-string' ?
      T['default'] extends string ?
        string
      : string | undefined
    : T['type'] extends 'positional-number' ?
      T['default'] extends number ?
        number
      : number | undefined
    : never
  : T extends { type: 'flag' } ? boolean
  : T extends { type: 'value-string-flag' } ?
    T['default'] extends string ?
      string
    : string | undefined
  : T extends { type: 'value-number-flag' } ?
    T['default'] extends number ?
      number
    : number | undefined
  : never;

/**
 * Creates a type-safe command definition for use with `createCLI`.
 *
 * The `run` function receives fully typed arguments based on the `args` definition.
 * Positional arguments are parsed in declaration order.
 *
 * @template Args - Record of argument definitions
 * @param options - Command configuration
 * @param options.description - Command description shown in help
 * @param options.short - Optional single-character alias (cannot be 'i' or 'h')
 * @param options.args - Typed argument definitions
 * @param options.run - Handler function receiving parsed arguments
 * @param options.examples - Optional usage examples for help text
 * @returns Command definition object
 *
 * @example
 * ```ts
 * const deploy = createCmd({
 *   short: 'd',
 *   description: 'Deploy the application',
 *   args: {
 *     env: {
 *       type: 'positional-string',
 *       name: 'env',
 *       description: 'Target environment',
 *     },
 *     port: {
 *       type: 'value-number-flag',
 *       name: 'port',
 *       description: 'Port number',
 *       default: 3000,
 *     },
 *     verbose: {
 *       type: 'flag',
 *       name: 'verbose',
 *       description: 'Enable verbose logging',
 *     },
 *   },
 *   examples: [
 *     { args: ['production'], description: 'Deploy to production' },
 *     { args: ['staging', '--port', '8080'], description: 'Deploy to staging on port 8080' },
 *   ],
 *   run: async ({ env, port, verbose }) => {
 *     // env: string, port: number, verbose: boolean
 *     console.log(`Deploying to ${env} on port ${port}`);
 *   },
 * });
 * ```
 */
export function createCmd<Args extends undefined | Record<string, Arg>>({
  short,
  description,
  run,
  args,
  examples,
}: {
  short?: string;
  description: string;
  args?: Args;
  run: (cmdArgs: {
    [K in keyof Args]: Args[K] extends Arg ? GetArgType<Args[K]> : never;
  }) => Promise<void> | void;
  examples?: {
    args: string[];
    description: string;
  }[];
}) {
  return {
    short,
    description,
    run,
    args,
    examples,
  };
}

/**
 * Creates and runs a CLI application with the given commands.
 *
 * Automatically handles argument parsing, help generation, and interactive mode.
 *
 * **Built-in commands:**
 * - `h` or `--help` - Shows help with all commands
 * - `i` - Interactive mode (select command from list)
 * - `<command> -h` - Shows help for a specific command
 *
 * @template C - String literal union of command names
 * @param options - CLI configuration
 * @param options.name - CLI display name shown in header
 * @param options.baseCmd - Command prefix for help text (e.g., 'my-cli')
 * @param options.sort - Optional array to customize command display order
 * @param cmds - Record of command definitions created with `createCmd`
 *
 * @example
 * ```ts
 * await createCLI(
 *   { name: 'My CLI', baseCmd: 'my-cli' },
 *   {
 *     hello: createCmd({
 *       short: 'hi',
 *       description: 'Say hello',
 *       run: async () => console.log('Hello!'),
 *     }),
 *     deploy: createCmd({
 *       short: 'd',
 *       description: 'Deploy the app',
 *       args: {
 *         env: { type: 'positional-string', name: 'env', description: 'Environment' },
 *       },
 *       run: async ({ env }) => console.log(`Deploying to ${env}`),
 *     }),
 *   },
 * );
 * ```
 *
 * @example
 * ```bash
 * # Usage examples:
 * my-cli              # Show interactive menu
 * my-cli h            # Show help
 * my-cli i            # Interactive mode
 * my-cli hello        # Run hello command
 * my-cli hi           # Run hello via short alias
 * my-cli deploy prod  # Run deploy with argument
 * my-cli deploy -h    # Show deploy command help
 * ```
 */
export async function createCLI<C extends string>(
  {
    name,
    sort,
    baseCmd,
  }: { name: string; sort?: NoInfer<C>[]; baseCmd: string },
  cmds: Record<C, Cmd>,
) {
  function getCmdId(cmd: string): C {
    if (isObjKey(cmd, cmds)) return cmd;

    console.error(styleText(['red', 'bold'], `Command '${cmd}' not found`));
    process.exit(1);
  }

  process.stdout.write('\x1Bc'); // Clear console

  console.info(styleText(['blue', 'bold'], name));

  const addedShortCmds = new Set<string>();
  const reservedShortCmds = ['i', 'h'];

  let runCmdId: string | undefined = cmdFromTerminal;

  for (const [, cmd] of typedObjectEntries(cmds)) {
    if (cmd.short) {
      if (reservedShortCmds.includes(cmd.short)) {
        console.error(
          styleText(['red', 'bold'], `Short cmd "${cmd.short}" is reserved for built-in commands`),
        );
        process.exit(1);
      }

      if (addedShortCmds.has(cmd.short)) {
        console.error(
          styleText(['red', 'bold'], `Short cmd "${cmd.short}" is duplicated`),
        );
        process.exit(1);
      }

      addedShortCmds.add(cmd.short);
    }
  }

  function printHelp() {
    const pipeChar = styleText(['dim'], ' or ');
    const fmtCmd = (c: string) => styleText(['blue', 'bold'], c);
    const beforeDescription = styleText(['dim'], '->');

    const largestCmdTextLength = Math.max(
      ...typedObjectEntries(cmds).map(
        ([cmd, { short }]) => `${cmd}${short ? ` or ${short}` : ''}`.length,
      ),
    );

    console.info(dedent`
      ${styleText(['blue', 'bold'], 'Docs:')}

      ${styleText(['bold', 'underline'], 'Usage:')} ${baseCmd} <command> [command-args...]

      ${styleText(['bold', 'underline'], 'Commands:')}

      ${typedObjectEntries(cmds)
        .map(([cmd, { description, short, args }]) => {
          const cmdText = `${fmtCmd(cmd)}${short ? `${pipeChar}${fmtCmd(short)}` : ''}`;
          const unformattedCmdText = removeANSIColors(cmdText);

          let result = `${cmdText}${' '.repeat(
            largestCmdTextLength - unformattedCmdText.length + 1,
          )}${beforeDescription} ${description}`;

          if (args && Object.keys(args).length > 0) {
            const briefArgs = typedObjectEntries(args)
              .sort(([, a], [, b]) => {
                // Positional args first (in declaration order), then flags
                if (a.type.startsWith('positional') && !b.type.startsWith('positional')) return -1;
                if (!a.type.startsWith('positional') && b.type.startsWith('positional')) return 1;
                return 0; // Keep original order within each group
              })
              .map(([, arg]) => {
                switch (arg.type) {
                  case 'positional-string':
                  case 'positional-number':
                    return `[${arg.name}]`;
                  case 'flag':
                    return `[--${arg.name}]`;
                  case 'value-string-flag':
                  case 'value-number-flag':
                    return `[--${arg.name}]`;
                  default:
                    throw exhaustiveCheck(arg);
                }
              })
              .join(' ');
            result += `\n${styleText(['dim'], ` └─ args: ${briefArgs}`)}`;
          }

          return result;
        })
        .join('\n')}

      ${styleText(['dim'], `Use ${baseCmd} <cmd> -h for more details about a command`)}

      ${fmtCmd('i')} ${beforeDescription} Starts in interactive mode
      ${fmtCmd('h')} ${beforeDescription} Prints this help message
    `);

    console.info(styleText(['dim'], 'Use a command to get started!'));
  }

  function printCmdHelp(cmdId: string) {
    const cmd = cmds[getCmdId(cmdId)];

    function formatArg(arg: Arg): string {
      switch (arg.type) {
        case 'positional-string':
        case 'positional-number':
          return `[${arg.name}]`;
        case 'flag':
          return `[--${arg.name}]`;
        case 'value-string-flag':
          return `[--${arg.name} <value>]`;
        case 'value-number-flag':
          return `[--${arg.name} <number>]`;
        default:
          throw exhaustiveCheck(arg);
      }
    }

    function getArgsUsage(args?: Record<string, Arg>): string {
      if (!args) return '';

      const sortedArgs = typedObjectEntries(args).sort(([, a], [, b]) => {
        // Positional args first (in declaration order), then flags
        if (a.type.startsWith('positional') && !b.type.startsWith('positional')) return -1;
        if (!a.type.startsWith('positional') && b.type.startsWith('positional')) return 1;
        return 0; // Keep original order within each group
      });

      const colors = [
        'cyan',
        'yellow',
        'magenta',
        'blue',
        'green',
        'red',
      ] as const;
      return sortedArgs
        .map(([, arg], index) => {
          const color = colors[index % colors.length];

          if (!color) return formatArg(arg);

          return styleText([color], formatArg(arg)) || formatArg(arg);
        })
        .join(' ');
    }

    const cmdTitle = cmd.short ? `${cmdId} (${cmd.short})` : cmdId;
    let helpText = `${styleText(['blue', 'bold'], `${cmdTitle}:`) || `${cmdTitle}:`} ${cmd.description}\n\n${styleText(['bold', 'underline'], 'Usage:') || 'Usage:'} ${styleText(['dim'], baseCmd) || baseCmd} ${styleText(['bold'], cmdId) || cmdId}`;

    if (cmd.args) {
      const argsUsage = getArgsUsage(cmd.args);
      if (argsUsage) {
        helpText += ` ${argsUsage}`;
      }
    }
    
    if (cmd.short) {
      helpText += `\n       ${styleText(['dim'], baseCmd) || baseCmd} ${styleText(['bold'], cmd.short) || cmd.short} ...`;
    }

    if (cmd.args) {
      const argEntries = typedObjectEntries(cmd.args);
      if (argEntries.length > 0) {
        helpText += `\n\n${styleText(['bold', 'underline'], 'Arguments:') || 'Arguments:'}`;
        const colors = [
          'cyan',
          'yellow',
          'magenta',
          'blue',
          'green',
          'red',
        ] as const;
        for (const [index, [, arg]] of argEntries.entries()) {
          const color = colors[index % colors.length];

          if (!color) continue;

          const argDisplayName =
            arg.type === 'flag' ? `--${arg.name}`
            : arg.type === 'value-string-flag' ? `--${arg.name}`
            : arg.type === 'value-number-flag' ? `--${arg.name}`
            : arg.name;
          const argName = styleText([color], argDisplayName) || argDisplayName;
          const required = '';
          helpText += `\n  ${argName}${required} - ${arg.description}`;
        }
      }
    }

    if (cmd.examples) {
      helpText += `\n\n${styleText(['bold', 'underline'], 'Examples:') || 'Examples:'}`;
      for (const { args: exampleArgs, description: exampleDesc } of cmd.examples) {
        helpText += `\n  ${baseCmd} ${cmdId} ${exampleArgs.join(' ')} ${styleText(['dim'], `# ${exampleDesc}`) || `# ${exampleDesc}`}`;
      }
    }

    console.info(helpText);
    console.info(styleText(['dim'], 'Use a command to get started!'));
  }

  if (!cmdFromTerminal) {
    const response = await cliInput.select('Choose an action', {
      options: [
        {
          value: 'run-cmd',
          label: 'Start interactive mode',
          hint: `Select a command to run from a list | ${baseCmd} i`,
        },
        {
          value: 'print-help',
          label: 'Print help',
          hint: `${baseCmd} h`,
        },
      ],
    });

    if (response === 'print-help') {
      printHelp();
      process.exit(0);
    } else {
      runCmdId = 'i';
    }
  }

  if (
    runCmdId === '-h' ||
    runCmdId === '--help' ||
    runCmdId === 'help' ||
    runCmdId === 'h'
  ) {
    printHelp();
    process.exit(0);
  }

  type ParsedArgs = Record<string, string | number | boolean | undefined>;

  function parseArgs(rawArgs: string[], commandArgs?: Record<string, Arg>): ParsedArgs {
    if (!commandArgs) return {};

    const parsed: ParsedArgs = {};
    const argEntries = typedObjectEntries(commandArgs);

    // Initialize with defaults
    for (const [key, argDef] of argEntries) {
      if (argDef.type === 'flag') {
        parsed[key] = false;
      } else if ('default' in argDef && argDef.default !== undefined) {
        parsed[key] = argDef.default;
      }
    }

    // Parse positional arguments (use object declaration order)
    const positionalArgs = argEntries
      .filter(([, argDef]) => argDef.type.startsWith('positional'));

    let positionalIndex = 0;
    let i = 0;
    
    while (i < rawArgs.length) {
      const currentArg = rawArgs[i];
      
      if (currentArg?.startsWith('--')) {
        // Handle flags
        const flagName = currentArg.slice(2);
        const flagEntry = argEntries.find(([, argDef]) => argDef.name === flagName);
        
        if (flagEntry) {
          const [key, argDef] = flagEntry;
          
          if (argDef.type === 'flag') {
            parsed[key] = true;
            i++;
          } else if (argDef.type === 'value-string-flag' || argDef.type === 'value-number-flag') {
            const value = rawArgs[i + 1];
            if (value && !value.startsWith('--')) {
              if (argDef.type === 'value-number-flag') {
                const numValue = Number(value);
                if (isNaN(numValue)) {
                  console.error(styleText(['red', 'bold'], `Error: Invalid number "${value}" for --${argDef.name}`));
                  process.exit(1);
                }
                parsed[key] = numValue;
              } else {
                parsed[key] = value;
              }
              i += 2;
            } else {
              console.error(styleText(['red', 'bold'], `Error: Missing value for --${argDef.name}`));
              process.exit(1);
            }
          } else {
            i++;
          }
        } else {
          console.error(styleText(['red', 'bold'], `Error: Unknown flag --${flagName}`));
          process.exit(1);
        }
      } else {
        // Handle positional arguments
        if (positionalIndex < positionalArgs.length) {
          const positionalEntry = positionalArgs[positionalIndex];
          if (positionalEntry) {
            const [key, argDef] = positionalEntry;
            if (argDef.type === 'positional-number') {
              const numValue = Number(currentArg);
              if (isNaN(numValue)) {
                console.error(styleText(['red', 'bold'], `Error: Invalid number "${currentArg}" for ${argDef.name}`));
                process.exit(1);
              }
              parsed[key] = numValue;
            } else {
              parsed[key] = currentArg;
            }
            positionalIndex++;
          }
        }
        i++;
      }
    }

    // Validate required positional arguments
    for (const [key, argDef] of positionalArgs) {
      if (!('default' in argDef) && parsed[key] === undefined) {
        console.error(styleText(['red', 'bold'], `Error: Missing required argument <${argDef.name}>`));
        process.exit(1);
      }
    }

    return parsed;
  }

  async function runCmd(cmd: string, args: string[]) {
    process.stdout.write('\x1Bc'); // Clear console

    for (const [cmdId, { short, run: fn, args: commandArgs }] of typedObjectEntries(cmds)) {
      if (cmd === short || cmd === cmdId) {
        // Check if help is requested for this specific command
        if (args.includes('-h') || args.includes('--help')) {
          printCmdHelp(cmdId);
          process.exit(0);
        }

        console.info(
          `Running ${styleText(['blue', 'bold'], cmdId)}${short ? styleText(['dim'], `|${short}`) : ''}:\n`,
        );

        const parsedArgs = parseArgs(args, commandArgs);
        await fn(parsedArgs);
        process.exit(0);
      }
    }

    console.error(styleText(['red', 'bold'], `Command '${cmd}' not found`));
    printHelp();
    process.exit(1);
  }

  if (runCmdId === 'i') {
    function hasRequiredArgs(args?: Record<string, Arg>): boolean {
      if (!args) return false;
      return typedObjectEntries(args).some(
        ([, arg]) =>
          (arg.type === 'positional-string' || arg.type === 'positional-number') &&
          !('default' in arg),
      );
    }

    let cmdEntries = typedObjectEntries(cmds);

    if (sort) {
      cmdEntries = sortBy(cmdEntries, ([cmd]) =>
        getAscIndexOrder(sort.indexOf(cmd)),
      );
    }

    const availableCmds = cmdEntries.filter(([, cmd]) => !hasRequiredArgs(cmd.args));
    const cmdsWithRequiredArgs = cmdEntries.filter(([, cmd]) => hasRequiredArgs(cmd.args));

    const selectOptions = [
      ...availableCmds.map(([cmd, { short, description }]) => ({
        value: cmd,
        label: short ? `${cmd} ${styleText(['dim'], '|')} ${short}` : cmd,
        hint: description,
      })),
      ...(cmdsWithRequiredArgs.length > 0
        ? [{ value: '__run_with_args__', label: styleText(['dim'], 'Run command with required args...') }]
        : []),
    ];

    const response = await cliInput.select('Select a command', {
      options: selectOptions,
    });

    if (response === '__run_with_args__') {
      const selectedCmd = await cliInput.select('Select a command', {
        options: cmdsWithRequiredArgs.map(([cmd, { short, description }]) => ({
          value: cmd,
          label: short ? `${cmd} ${styleText(['dim'], '|')} ${short}` : cmd,
          hint: description,
        })),
      });

      const cmdDef = cmds[selectedCmd];
      const collectedArgs: string[] = [];

      if (cmdDef.args) {
        for (const [, arg] of typedObjectEntries(cmdDef.args)) {
          if (
            (arg.type === 'positional-string' || arg.type === 'positional-number') &&
            !('default' in arg)
          ) {
            if (arg.type === 'positional-string') {
              const value = await cliInput.text(arg.name);
              collectedArgs.push(value);
            } else {
              const value = await cliInput.number(arg.name);
              if (value !== null) {
                collectedArgs.push(String(value));
              }
            }
          }
        }
      }

      await runCmd(selectedCmd, collectedArgs);
    } else {
      await runCmd(response, []);
    }
  } else {
    if (!runCmdId) {
      console.error(
        styleText(
          ['red', 'bold'],
          `Command not found, use \`${baseCmd} h\` to list all supported commands`,
        ),
      );
      console.info(styleText(['dim'], 'Use a command to get started!'));
      process.exit(1);
    }

    await runCmd(runCmdId, cmdArgs);
  }
}
