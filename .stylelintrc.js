module.exports = {
  extends: [
    'stylelint-config-recommended-scss',
    'stylelint-config-recess-order',
    'stylelint-config-recommended-vue',
    'stylelint-prettier/recommended',
  ],
  overrides: [
    {
      files: ['**/*.scss'],
      customSyntax: 'postcss-scss',
    },
  ],
  rules: {},
};
