import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { createProgressBar } from './progressBar.ts';

describe('createProgressBar', () => {
  let stdoutWriteSpy: MockInstance<typeof process.stdout.write>;

  beforeEach(() => {
    stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutWriteSpy.mockRestore();
  });

  it('creates a progress bar with required total option', () => {
    const bar = createProgressBar({ total: 100 });

    expect(bar).toBeDefined();
    expect(typeof bar.start).toBe('function');
    expect(typeof bar.update).toBe('function');
    expect(typeof bar.increment).toBe('function');
    expect(typeof bar.setTotal).toBe('function');
    expect(typeof bar.stop).toBe('function');
    expect(typeof bar.finish).toBe('function');
  });

  it('methods return the progress bar for chaining', () => {
    const bar = createProgressBar({ total: 100 });

    expect(bar.start()).toBe(bar);
    expect(bar.update(50)).toBe(bar);
    expect(bar.increment()).toBe(bar);
    expect(bar.setTotal(200)).toBe(bar);
    expect(bar.stop()).toBe(bar);
  });

  it('tracks value correctly', () => {
    const bar = createProgressBar({ total: 100 });

    expect(bar.value).toBe(0);

    bar.start();
    bar.update(50);
    expect(bar.value).toBe(50);

    bar.increment(10);
    expect(bar.value).toBe(60);
  });

  it('tracks total correctly', () => {
    const bar = createProgressBar({ total: 100 });

    expect(bar.total).toBe(100);

    bar.setTotal(200);
    expect(bar.total).toBe(200);
  });

  it('calculates percentage correctly', () => {
    const bar = createProgressBar({ total: 100 });

    expect(bar.percentage).toBe(0);

    bar.start().update(25);
    expect(bar.percentage).toBe(25);

    bar.update(50);
    expect(bar.percentage).toBe(50);

    bar.update(100);
    expect(bar.percentage).toBe(100);
  });

  it('clamps value to total', () => {
    const bar = createProgressBar({ total: 100 });

    bar.start().update(150);
    expect(bar.value).toBe(100);

    bar.update(50);
    bar.increment(100);
    expect(bar.value).toBe(100);
  });

  it('increment defaults to 1', () => {
    const bar = createProgressBar({ total: 100 });

    bar.start();
    bar.increment();
    expect(bar.value).toBe(1);

    bar.increment();
    expect(bar.value).toBe(2);
  });

  it('increment accepts custom delta', () => {
    const bar = createProgressBar({ total: 100 });

    bar.start();
    bar.increment(5);
    expect(bar.value).toBe(5);

    bar.increment(10);
    expect(bar.value).toBe(15);
  });

  it('handles zero total gracefully', () => {
    const bar = createProgressBar({ total: 0 });

    expect(bar.percentage).toBe(0);
    bar.start().update(10);
    expect(bar.percentage).toBe(0);
  });

  it('accepts all optional configuration', () => {
    const bar = createProgressBar({
      total: 100,
      width: 40,
      showPercentage: false,
      showValue: false,
      showEta: false,
      color: 'green',
    });

    expect(bar).toBeDefined();
  });
});
