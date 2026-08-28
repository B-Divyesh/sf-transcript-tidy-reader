import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', '.output/**', '.wxt/**', 'node_modules/**']
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'no-empty-pattern': 'off'
    }
  },
  {
    files: ['entrypoints/**/*.ts', 'src/**/*.ts', 'site/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        browser: 'readonly'
      }
    }
  },
  {
    files: ['site/public/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.serviceworker
      }
    }
  },
  {
    files: ['tests/**/*.ts', 'scripts/**/*.{ts,mjs}', '*.config.{ts,js}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.nodeBuiltin
      }
    }
  }
);
