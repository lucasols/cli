import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { createSpinner } from './spinner.ts';

describe('createSpinner', () => {
  let stdoutWriteSpy: MockInstance<typeof process.stdout.write>;

  beforeEach(() => {
    stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutWriteSpy.mockRestore();
  });

  it('returns a chainable spinner object', () => {
    const spinner = createSpinner('Loading');

    expect(spinner).toBeDefined();
    expect(typeof spinner.start).toBe('function');
    expect(typeof spinner.update).toBe('function');
    expect(typeof spinner.success).toBe('function');
    expect(typeof spinner.error).toBe('function');
    expect(typeof spinner.warn).toBe('function');
    expect(typeof spinner.stop).toBe('function');
    expect(typeof spinner.clear).toBe('function');
  });

  it('methods return the spinner for chaining', () => {
    const spinner = createSpinner('Loading');

    expect(spinner.start()).toBe(spinner);
    expect(spinner.update('text')).toBe(spinner);
    expect(spinner.stop()).toBe(spinner);
  });

  it('accepts string as options shorthand', () => {
    const spinner = createSpinner('My text');
    expect(spinner).toBeDefined();
  });

  it('accepts options object', () => {
    const spinner = createSpinner({ text: 'Loading', color: 'green' });
    expect(spinner).toBeDefined();
  });

  it('works with no options', () => {
    const spinner = createSpinner();
    expect(spinner).toBeDefined();
  });
});
