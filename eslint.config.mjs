import tseslint from '@electron-toolkit/eslint-config-ts'

export default [
  {
    ignores: ['out/**', 'dist/**', 'release/**', 'node_modules/**', 'coverage/**']
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
]
