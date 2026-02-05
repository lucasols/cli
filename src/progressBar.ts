import { styleText } from 'node:util';

const isTTY = process.stdout.isTTY === true;

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;

  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${minutes}m${secs}s`;
}

export type ProgressBar = {
  start: () => ProgressBar;
  update: (value: number) => ProgressBar;
  increment: (delta?: number) => ProgressBar;
  setTotal: (total: number) => ProgressBar;
  stop: () => ProgressBar;
  finish: (message?: string) => ProgressBar;
  readonly value: number;
  readonly total: number;
  readonly percentage: number;
};

export type ProgressBarOptions = {
  total: number;
  width?: number;
  showPercentage?: boolean;
  showValue?: boolean;
  showEta?: boolean;
  color?: 'green' | 'red' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white';
};

export function createProgressBar(options: ProgressBarOptions): ProgressBar {
  const width = options.width ?? 30;
  const showPercentage = options.showPercentage ?? true;
  const showValue = options.showValue ?? true;
  const showEta = options.showEta ?? true;
  const color = options.color ?? 'cyan';

  let currentValue = 0;
  let totalValue = options.total;
  let startTime: number | null = null;
  let isRunning = false;

  function render(): void {
    if (!isRunning) return;

    const percent = totalValue > 0 ? currentValue / totalValue : 0;
    const filled = Math.round(width * percent);
    const empty = width - filled;

    const filledBar = styleText(color, '█'.repeat(filled));
    const emptyBar = styleText('gray', '░'.repeat(empty));

    const parts: string[] = [`[${filledBar}${emptyBar}]`];

    if (showPercentage) {
      parts.push(`${Math.round(percent * 100)}%`);
    }

    if (showValue) {
      parts.push(`${currentValue}/${totalValue}`);
    }

    if (showEta && startTime !== null && currentValue > 0 && percent < 1) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = currentValue / elapsed;
      const remaining = (totalValue - currentValue) / rate;
      if (Number.isFinite(remaining) && remaining > 0) {
        parts.push(`ETA: ${formatTime(remaining)}`);
      }
    }

    const line = parts.join(' ');

    if (isTTY) {
      process.stdout.write(`\r${line}`);
    }
  }

  function clearLine(): void {
    if (isTTY) {
      process.stdout.write(`\r${' '.repeat(80)}\r`);
    }
  }

  const progressBar: ProgressBar = {
    start: () => {
      isRunning = true;
      startTime = Date.now();
      render();
      return progressBar;
    },

    update: (value) => {
      currentValue = Math.min(value, totalValue);
      render();
      return progressBar;
    },

    increment: (delta = 1) => {
      currentValue = Math.min(currentValue + delta, totalValue);
      render();
      return progressBar;
    },

    setTotal: (total) => {
      totalValue = total;
      render();
      return progressBar;
    },

    stop: () => {
      isRunning = false;
      clearLine();
      return progressBar;
    },

    finish: (message) => {
      isRunning = false;
      clearLine();
      if (message) {
        process.stdout.write(`${message}\n`);
      } else if (!isTTY) {
        process.stdout.write(`Progress: ${currentValue}/${totalValue} (100%)\n`);
      }
      return progressBar;
    },

    get value() {
      return currentValue;
    },

    get total() {
      return totalValue;
    },

    get percentage() {
      return totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
    },
  };

  return progressBar;
}
