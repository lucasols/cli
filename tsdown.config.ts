import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/main.ts'],
  clean: true,
  dts: true,
  sourcemap: true,
  format: ['esm', 'cjs'],
});
