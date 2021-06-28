const gulp = require('gulp');
const path = require('path');
const ts = require('gulp-typescript');
const rollup = require('gulp-better-rollup');
const sourcemaps = require('gulp-sourcemaps');
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
function generateOutputConfig (format, minify) {
  const packageName = process.env.npm_package_name;
  const createOutputConfig = function(format, minify) {
    return {
      exports: 'named',
      file: packageName + (minify ? '.min' : '') + '.js',
      format,
      plugins: minify ? [terser()] : [],
      name: 'rocket'
    };
  };
  const output = [createOutputConfig(format, false)];
  if (minify) {
    output.push(createOutputConfig(format, true));
  }
  return output;
}

/**
 * @param {string} format cjs | esm | umd
 */
function generateInputConfig (format) {
  const extensions = ['.ts', '.js'];
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

function createBuildTask(format, minify) {
  return function buildTask() {
    return gulp.src('src/index.ts')
      .pipe(sourcemaps.init())
      .pipe(rollup(
        generateInputConfig(format),
        generateOutputConfig(format, minify)
      ))
      .pipe(sourcemaps.write(''))
      .pipe(gulp.dest(path.join(DEST_DIR_NAME, format)))
  }
}

const tsProject = ts.createProject('tsconfig.json', {
  declaration: true
});
const DEST_DIR_NAME = 'dist';

function buildDeclaration() {
  const tsResult = tsProject.src()
    .pipe(tsProject());
  return tsResult.dts.pipe(gulp.dest(`${DEST_DIR_NAME}/types`));
}

exports.buildDeclaration = buildDeclaration;
exports.buildESM = createBuildTask('esm', true);
exports.buildCJS = createBuildTask('cjs', true);
exports.buildUMD = createBuildTask('umd', true);