var path = require('path');
var fs = require('fs');

var nodeModules = {};
fs.readdirSync('node_modules')
  .filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

module.exports = {
  entry: ['isomorphic-fetch', './build/intermediate/index.js'],
  include: ['./build/intermediate/', /isomorphic-fetch/],
  target: 'node',
  module: {
    loaders: [
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
      {
        test: /\.js(x?)$/,
        loader: 'babel-loader'
      }
    ]
  },
  externals: nodeModules,
  output: {
    path: path.join(__dirname, 'build/final'),
    filename: 'service.js'
  },
  node: {
    console: true,
    fs: true,
  }
}
