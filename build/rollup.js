const packageName = process.env.npm_package_name;
const { babel } = require('@rollup/plugin-babel');
const { terser } = require('rollup-plugin-terser');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const typescript = require('@rollup/plugin-typescript');
const rollupReplace = require('@rollup/plugin-replace');
const nodePolyfill = require('rollup-plugin-node-polyfills');

/**
 * @param {string} format cjs | esm | umd
 * @param {bollean} minify 
 */
function createOutputConfig(format, minify) {
  return {
    exports: 'named',
    file: packageName + (minify ? '.min' : '') + '.js',
    format,
    plugins: minify ? [terser()] : [],
    name: 'rocket'
  };
}

exports.generateOutputConfig = function outputConfig(format, minify) {
  const output = [createOutputConfig(format, false)];
  if (minify) {
    output.push(createOutputConfig(format, true));
  }
  return output;
}

const extensions = ['.ts', '.js'];

/**
 * @param {string} format cjs | esm | umd
 * @param {bollean} minify 
 */
exports.generateInputConfig = function(format) {
  return {
    plugins: [
      rollupReplace({
        preventAssignment: true,
        values: {
          'process.env.npm_package_version': JSON.stringify(process.env.npm_package_version)
        }
      }),
      nodePolyfill(),
      nodeResolve({
        extensions
      }),
      typescript(),
      babel({
        babelHelpers: 'runtime',
        extensions
      })
    ],
    external: format !== 'umd'
      ? [
        /@babel\/runtime/,
        'events'
      ]
      : undefined
  }
};
