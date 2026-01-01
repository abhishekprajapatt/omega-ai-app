import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import type { Linter } from 'eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig: Linter.Config[] = [
  ...compat.extends('next/core-web-vitals'),
];

export default eslintConfig;