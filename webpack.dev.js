const path = require('path');
const { merge } = require('webpack-merge');

const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    port: 8080,
    open: true,
    static: [
      {
        directory: path.resolve(__dirname, 'dist/data'),
        publicPath: '/data',
      },
    ],
  },
});
