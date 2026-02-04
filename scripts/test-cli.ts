import { cliInput } from '../src/main.js';

async function main() {
  console.log('Testing @ls-stack/cli\n');

  const action = await cliInput.select('What do you want to test?', {
    options: [
      { value: 'select', label: 'Select (single choice)' },
      { value: 'selectWithSearch', label: 'Select with search' },
      { value: 'text', label: 'Text input' },
      { value: 'confirm', label: 'Confirm (yes/no)' },
      { value: 'multipleSelect', label: 'Multiple select (checkbox)' },
      { value: 'number', label: 'Number input' },
      { value: 'all', label: 'Run all tests' },
    ],
  });

  if (action === 'select' || action === 'all') {
    console.log('\n--- Testing select ---');
    const color = await cliInput.select('Pick a color:', {
      options: [
        { value: 'red', label: 'Red', hint: 'A warm color' },
        { value: 'green', label: 'Green', hint: 'A nature color' },
        { value: 'blue', label: 'Blue', hint: 'A cool color' },
      ],
    });
    console.log(`You selected: ${color}`);
  }

  if (action === 'selectWithSearch' || action === 'all') {
    console.log('\n--- Testing selectWithSearch ---');
    const country = await cliInput.selectWithSearch('Pick a country:', {
      options: [
        { value: 'us', label: 'United States' },
        { value: 'uk', label: 'United Kingdom' },
        { value: 'ca', label: 'Canada' },
        { value: 'au', label: 'Australia' },
        { value: 'br', label: 'Brazil' },
        { value: 'de', label: 'Germany' },
        { value: 'fr', label: 'France' },
        { value: 'jp', label: 'Japan' },
      ],
    });
    console.log(`You selected: ${country}`);
  }

  if (action === 'text' || action === 'all') {
    console.log('\n--- Testing text ---');
    const name = await cliInput.text('Enter your name:');
    console.log(`Hello, ${name}!`);

    const email = await cliInput.text('Enter your email:', {
      validate: (value) => {
        if (!value.includes('@')) return 'Please enter a valid email address';

        return true;
      },
    });
    console.log(`Email: ${email}`);
  }

  if (action === 'confirm' || action === 'all') {
    console.log('\n--- Testing confirm ---');
    const proceed = await cliInput.confirm('Do you want to proceed?', {
      initial: true,
    });
    console.log(`Proceed: ${proceed}`);
  }

  if (action === 'multipleSelect' || action === 'all') {
    console.log('\n--- Testing multipleSelect ---');
    const features = await cliInput.multipleSelect(
      'Select features to enable:',
      {
        options: [
          { value: 'typescript', label: 'TypeScript', hint: 'Type safety' },
          { value: 'eslint', label: 'ESLint', hint: 'Code linting' },
          { value: 'prettier', label: 'Prettier', hint: 'Code formatting' },
          { value: 'testing', label: 'Testing', hint: 'Unit tests' },
        ],
      },
    );
    console.log(`Selected features: ${features.join(', ')}`);
  }

  if (action === 'number' || action === 'all') {
    console.log('\n--- Testing number ---');
    const age = await cliInput.number('Enter your age:', { initial: 25 });
    console.log(`Age: ${age}`);
  }

  console.log('\n✓ All tests completed!');
}

void main();
