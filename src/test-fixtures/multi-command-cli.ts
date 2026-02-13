import { createCLI, createCmd } from '../createCli.ts';

const create = createCmd({
  description: 'Create a new project',
  short: 'c',
  args: {
    name: {
      type: 'positional-string',
      name: 'name',
      description: 'Project name',
    },
    template: {
      type: 'value-string-flag',
      name: 'template',
      description: 'Project template',
      default: 'basic',
    },
    verbose: {
      type: 'flag',
      name: 'verbose',
      description: 'Enable verbose output',
    },
  },
  examples: [
    {
      args: ['my-project'],
      description: 'Create project with default template',
    },
    {
      args: ['my-project', '--template', 'react'],
      description: 'Create React project',
    },
  ],
  run: (args) => {
    console.info(`Creating project: ${args.name || 'unnamed'}`);
    console.info(`Template: ${args.template || 'basic'}`);
    if (args.verbose) console.info('Verbose mode enabled');
  },
});

void create.run({ name: undefined, template: 'd', verbose: true });

await createCLI(
  { name: 'Multi Command CLI', baseCmd: 'multi-cli' },
  {
    create,
    deploy: createCmd({
      description: 'Deploy the application',
      short: 'd',
      args: {
        port: {
          type: 'positional-number',
          name: 'port',
          description: 'Port number',
          default: 3000,
        },
        env: {
          type: 'value-string-flag',
          name: 'env',
          description: 'Environment to deploy to',
        },
      },
      run: (args) => {
        console.info(`Deploying on port: ${args.port || 3000}`);
        if (args.env) console.info(`Environment: ${args.env}`);
      },
    }),
    status: createCmd({
      description: 'Check application status',
      run: () => {
        console.info('Application is running');
      },
    }),
  },
);
