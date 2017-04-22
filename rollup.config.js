import buble from 'rollup-plugin-buble';
let packageJson = require('./package.json');
let {'jsnext:main': jsnext, main} = packageJson;

export default {
  moduleName: 'promise-keeper',
  entry: 'src/promise-keeper.js',
  targets: [{
    format: 'umd',
    dest: main
  }, {
    format: 'es',
    dest: jsnext
  }],
  plugins: [
    buble()
  ]
};
