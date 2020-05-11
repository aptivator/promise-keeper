import babel                            from '@rollup/plugin-babel';
import resolve                          from '@rollup/plugin-node-resolve';
let {'jsnext:main': jsnext, main, name} = require('./package.json');

export default {
  input: 'src/promise-keeper.js',
  output: [{
    format: 'umd',
    file: main,
    name
  }, {
    format: 'es',
    file: jsnext,
    name
  }],
  plugins: [
    resolve(),
    babel()
  ]
};
