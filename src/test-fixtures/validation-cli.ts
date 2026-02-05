import { createCLI, createCmd } from '../createCli.ts';

await createCLI(
  { name: 'Validation CLI', baseCmd: 'validation-cli' },
  {
    'server': createCmd({
      description: 'Start a server',
      args: {
        port: {
          type: 'positional-number',
          name: 'port',
          description: 'Port number to listen on',
        },
        timeout: {
          type: 'value-number-flag',
          name: 'timeout',
          description: 'Request timeout in seconds',
        },
        config: {
          type: 'value-string-flag',
          name: 'config',
          description: 'Configuration file path',
        },
      },
      run: (args) => {
        console.info(`Starting server on port: ${args.port || 'default'}`);
        if (args.timeout) console.info(`Timeout: ${args.timeout}s`);
        if (args.config) console.info(`Config: ${args.config}`);
      },
    }),
  },
);