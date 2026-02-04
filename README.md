# @ls-stack/cli

A TypeScript library for building interactive command-line interfaces with type-safe prompts and ESC-to-cancel support.

## Installation

```bash
pnpm add @ls-stack/cli
# or
yarn add @ls-stack/cli
```

**Requirements:** Node.js >= 21.5.0

## Quick Start

```typescript
import { cliInput } from '@ls-stack/cli';

const name = await cliInput.text('What is your name?');
const proceed = await cliInput.confirm('Continue?', { initial: true });

console.log(`Hello, ${name}!`);
```

## API Reference

### Types

```typescript
type ValidateFn = (
  value: string,
) => boolean | string | Promise<boolean | string>;

type SelectOption<T extends string> = {
  value: T;
  label?: string;
  hint?: string;
};
```

### `cliInput.select()`

Single selection from a list of options.

```typescript
const choice = await cliInput.select<'dev' | 'staging' | 'prod'>(
  'Select environment',
  {
    options: [
      { value: 'dev', label: 'Development', hint: 'Local development server' },
      { value: 'staging', label: 'Staging', hint: 'Pre-production testing' },
      { value: 'prod', label: 'Production', hint: 'Live environment' },
    ],
  },
);
// choice: 'dev' | 'staging' | 'prod'
```

**Parameters:**

| Name              | Type                | Description                 |
| ----------------- | ------------------- | --------------------------- |
| `title`           | `string`            | The prompt message          |
| `options.options` | `SelectOption<T>[]` | Array of selectable options |

**Returns:** `Promise<T>` - The selected option's value

### `cliInput.multipleSelect()`

Multi-select with checkboxes. Requires at least one selection.

```typescript
const features = await cliInput.multipleSelect<'ts' | 'eslint' | 'prettier'>(
  'Select features to enable',
  {
    options: [
      { value: 'ts', label: 'TypeScript' },
      { value: 'eslint', label: 'ESLint', hint: 'Code linting' },
      { value: 'prettier', label: 'Prettier', hint: 'Code formatting' },
    ],
  },
);
// features: ('ts' | 'eslint' | 'prettier')[]
```

**Parameters:**

| Name              | Type                | Description                 |
| ----------------- | ------------------- | --------------------------- |
| `title`           | `string`            | The prompt message          |
| `options.options` | `SelectOption<T>[]` | Array of selectable options |

**Returns:** `Promise<T[]>` - Array of selected values

### `cliInput.text()`

Text input with optional validation.

```typescript
const projectName = await cliInput.text('Enter project name', {
  initial: 'my-project',
  validate: (value) => {
    if (!/^[a-z0-9-]+$/.test(value)) {
      return 'Only lowercase letters, numbers, and hyphens allowed';
    }
    return true;
  },
});
```

**Parameters:**

| Name               | Type          | Description         |
| ------------------ | ------------- | ------------------- |
| `title`            | `string`      | The prompt message  |
| `options.initial`  | `string?`     | Default value       |
| `options.validate` | `ValidateFn?` | Validation function |

**Returns:** `Promise<string>` - The entered text

### `cliInput.textWithAutocomplete()`

Text input with autocomplete suggestions. Searches across value, label, and hint.

```typescript
const framework = await cliInput.textWithAutocomplete<
  'react' | 'vue' | 'svelte'
>('Select a framework', {
  options: [
    {
      value: 'react',
      label: 'React',
      hint: 'A JavaScript library for building UIs',
    },
    {
      value: 'vue',
      label: 'Vue',
      hint: 'The progressive JavaScript framework',
    },
    {
      value: 'svelte',
      label: 'Svelte',
      hint: 'Cybernetically enhanced web apps',
    },
  ],
  validate: (value) => value.length > 0 || 'Please select a framework',
});
```

**Parameters:**

| Name               | Type                | Description                       |
| ------------------ | ------------------- | --------------------------------- |
| `title`            | `string`            | The prompt message                |
| `options.options`  | `SelectOption<T>[]` | Array of autocomplete suggestions |
| `options.validate` | `ValidateFn?`       | Validation function               |

**Returns:** `Promise<T>` - The selected or entered value

### `cliInput.confirm()`

Yes/No boolean prompt.

```typescript
const shouldDeploy = await cliInput.confirm('Deploy to production?', {
  initial: false,
});
// shouldDeploy: boolean
```

**Parameters:**

| Name              | Type       | Description                                    |
| ----------------- | ---------- | ---------------------------------------------- |
| `title`           | `string`   | The prompt message                             |
| `options.initial` | `boolean?` | Default value (`true` for yes, `false` for no) |

**Returns:** `Promise<boolean>` - The user's choice

### `cliInput.number()`

Numeric input.

```typescript
const port = await cliInput.number('Enter port number', {
  initial: 3000,
});
// port: number | null
```

**Parameters:**

| Name              | Type      | Description        |
| ----------------- | --------- | ------------------ |
| `title`           | `string`  | The prompt message |
| `options.initial` | `number?` | Default value      |

**Returns:** `Promise<number | null>` - The entered number, or `null` on error

## Features

### ESC-to-Cancel

All prompts support pressing ESC to cancel. When cancelled, the process exits cleanly with code 0.

### Type Safety

All prompts are fully typed. When using generic type parameters with `select`, `multipleSelect`, or `textWithAutocomplete`, the return type is narrowed to the union of option values.

```typescript
// Return type is automatically 'small' | 'medium' | 'large'
const size = await cliInput.select<'small' | 'medium' | 'large'>(
  'Select size',
  {
    options: [{ value: 'small' }, { value: 'medium' }, { value: 'large' }],
  },
);
```

### Validation

Text inputs support synchronous or asynchronous validation:

```typescript
const email = await cliInput.text('Enter email', {
  validate: async (value) => {
    if (!value.includes('@')) {
      return 'Invalid email format';
    }
    const exists = await checkEmailExists(value);
    if (exists) {
      return 'Email already registered';
    }
    return true;
  },
});
```

## Examples

### Interactive Setup Wizard

```typescript
import { cliInput } from '@ls-stack/cli';

async function setupWizard() {
  const projectName = await cliInput.text('Project name', {
    validate: (v) => v.length >= 3 || 'Name must be at least 3 characters',
  });

  const template = await cliInput.select('Select template', {
    options: [
      { value: 'blank', label: 'Blank', hint: 'Empty project' },
      { value: 'react', label: 'React', hint: 'React with Vite' },
      { value: 'next', label: 'Next.js', hint: 'Full-stack React' },
    ],
  });

  const features = await cliInput.multipleSelect('Enable features', {
    options: [
      { value: 'typescript', label: 'TypeScript' },
      { value: 'eslint', label: 'ESLint' },
      { value: 'prettier', label: 'Prettier' },
      { value: 'testing', label: 'Testing (Vitest)' },
    ],
  });

  const installDeps = await cliInput.confirm('Install dependencies?', {
    initial: true,
  });

  return { projectName, template, features, installDeps };
}
```

### Configuration Menu

```typescript
import { cliInput } from '@ls-stack/cli';

async function configMenu() {
  const action = await cliInput.select('What would you like to configure?', {
    options: [
      { value: 'port', label: 'Server Port' },
      { value: 'host', label: 'Host Address' },
      { value: 'timeout', label: 'Request Timeout' },
    ],
  });

  switch (action) {
    case 'port': {
      const port = await cliInput.number('Enter port', { initial: 3000 });
      console.log(`Port set to ${port}`);
      break;
    }
    case 'host': {
      const host = await cliInput.text('Enter host', { initial: 'localhost' });
      console.log(`Host set to ${host}`);
      break;
    }
    case 'timeout': {
      const timeout = await cliInput.number('Timeout (seconds)', {
        initial: 30,
      });
      console.log(`Timeout set to ${timeout}s`);
      break;
    }
  }
}
```

## Error Handling

All prompts handle errors gracefully:

- **User cancellation (ESC/Ctrl+C):** Process exits with code 0
- **Other errors:** Error is logged and process exits with code 1

For the `number()` prompt specifically, non-cancellation errors return `null` instead of exiting.

## License

MIT
