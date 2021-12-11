module.exports = {
  extends: [
    'stylelint-config-recess-order',
    'stylelint-config-recommended-vue/scss',
    'stylelint-config-prettier',
  ],
  // additional configuration to validate scss with vscode-stylelint extention
  // https://github.com/stylelint/vscode-stylelint#%EF%B8%8F-only-css-and-postcss-are-validated-by-default
  overrides: [
    {
      files: ['**/*.scss'],
      customSyntax: 'postcss-scss',
    },
  ],
  rules: {
    'at-rule-no-unknown': null,
  },
};
