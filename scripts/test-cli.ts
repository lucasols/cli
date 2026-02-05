import { cliInput, createSpinner, createProgressBar } from '../src/main.js';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('Testing @ls-stack/cli\n');

  const action = await cliInput.select('What do you want to test?', {
    options: [
      { value: 'select', label: 'Select (single choice)' },
      { value: 'textWithAutocomplete', label: 'Select with search' },
      { value: 'text', label: 'Text input' },
      { value: 'confirm', label: 'Confirm (yes/no)' },
      { value: 'multipleSelect', label: 'Multiple select (checkbox)' },
      { value: 'number', label: 'Number input' },
      { value: 'spinner', label: 'Spinner' },
      { value: 'progressBar', label: 'Progress bar' },
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

  if (action === 'textWithAutocomplete' || action === 'all') {
    console.log('\n--- Testing textWithAutocomplete ---');
    const country = await cliInput.textWithAutocomplete('Pick a country:', {
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

  if (action === 'spinner' || action === 'all') {
    console.log('\n--- Testing spinner ---');

    const spinner = createSpinner('Loading data...').start();
    await sleep(1000);
    spinner.update('Processing...');
    await sleep(1000);
    spinner.update('Almost done...');
    await sleep(1000);
    spinner.success('Data loaded successfully!');

    await sleep(500);

    const errorSpinner = createSpinner('Trying something risky...').start();
    await sleep(1000);
    errorSpinner.error('Operation failed!');

    await sleep(500);

    const warnSpinner = createSpinner('Checking status...').start();
    await sleep(1000);
    warnSpinner.warn('Warning: low disk space');
  }

  if (action === 'progressBar' || action === 'all') {
    console.log('\n--- Testing progress bar ---');

    const bar = createProgressBar({ total: 50 }).start();
    for (let i = 0; i <= 50; i++) {
      await sleep(50);
      bar.update(i);
    }
    bar.finish('Download complete!');

    await sleep(500);

    console.log('\n--- Testing progress bar with increment ---');

    const bar2 = createProgressBar({
      total: 20,
      color: 'green',
      showEta: true,
    }).start();

    for (let i = 0; i < 20; i++) {
      await sleep(100);
      bar2.increment();
    }
    bar2.finish('Processing complete!');
  }

  console.log('\n✓ All tests completed!');
}

void main();
