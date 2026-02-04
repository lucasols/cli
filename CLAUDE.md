# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A TypeScript library (`@ls-stack/cli`) for building interactive command-line interfaces with support for typed arguments, command aliases, and interactive prompts.

## Commands

```bash
pnpm lint          # Type-check + ESLint (runs tsc then eslint)
pnpm test          # Run interactive CLI test script
pnpm build         # Lint + build with tsdown
pnpm build:no-test # Build only (skip lint)
```

Run tests with vitest:
```bash
pnpm vitest                              # Watch mode
pnpm vitest run                          # Single run
pnpm vitest run src/createCli.test.ts    # Single file
```

## Architecture

**Entry point**: `src/main.ts` exports the public API (`cliInput`, `SelectOption`, `ValidateFn`)

**Core modules**:
- `src/cliInput.ts` - Interactive prompt wrappers around `@inquirer/prompts` with ESC-to-cancel support
- `src/createCli.ts` - CLI framework for defining commands with typed arguments (not exported, internal tool)

**createCli system** (in `src/createCli.ts`):
- `createCmd()` - Type-safe command definition with positional args, flags, and value flags
- `createCLI()` - Registers commands and handles argument parsing, help generation, interactive mode
- Argument types: `positional-string`, `positional-number`, `flag`, `value-string-flag`, `value-number-flag`
- Built-in commands: `h` (help), `i` (interactive mode), `-h`/`--help` per command

**Test fixtures**: `src/test-fixtures/*.ts` - Example CLIs used by `createCli.test.ts` via subprocess execution

## Code Style

- Use `tsx` to run TypeScript files directly
- Use `pnpm` (never npm/npx)
- Strict TypeScript: no `any`, no `as` casts (except `as const`), no `!` assertions
