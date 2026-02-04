import { createCLI, createCmd } from '../createCli.ts';

const reservedShort = process.argv[2];

await createCLI(
  { name: 'Reserved Short CLI', baseCmd: 'reserved-cli' },
  {
    hello: createCmd({
      description: 'Say hello',
      short: reservedShort,
      run: () => {
        console.info('Hello!');
      },
    }),
  },
);
