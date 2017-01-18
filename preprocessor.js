// Preprocessor to testing.

const tsc = require('typescript');
const tsConfig = require('./tsconfig.json');

const tsCompilerOptions = {module: 'commonjs'};

module.exports = {
  process(src, path) {
    if (path.endsWith('.ts')) {
      return tsc.transpile(
        src,
        tsCompilerOptions,
        path,
        []
      );
    }
    return src;
  },
};
