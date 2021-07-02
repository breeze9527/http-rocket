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

const DEST_DIR_NAME = 'dist';

const packageName = process.env.npm_package_name;

/**
 * @param {string} format cjs | esm | umd
 * @param {boolean} minify
 */
function createOutputConfig(format, minify) {
  return {
    exports: 'named',
    file: packageName + (minify ? '.min' : '') + '.js',
    format,
    name: 'rocket',
    plugins: minify ? [terser()] : []
  };
}

/**
 * @param {string} format cjs | esm | umd
 */
function generateInputConfig(format) {
  const extensions = ['.ts', '.js'];
  return {
    external: format !== 'umd'
      ? [
        /@babel\/runtime/,
        'events'
      ]
      : undefined,
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
    ]
  };
}

function createBuildTask(format) {
  return function buildTask() {
    return gulp.src('src/index.ts')
      .pipe(sourcemaps.init())
      .pipe(rollup(
        generateInputConfig(format),
        [
          createOutputConfig(format, true),
          createOutputConfig(format, false)
        ]
      ))
      .pipe(sourcemaps.write(''))
      .pipe(gulp.dest(path.join(DEST_DIR_NAME, format)));
  };
}

const tsProject = ts.createProject('tsconfig.json', {
  declaration: true
});

function buildDeclaration() {
  const tsResult = tsProject.src()
    .pipe(tsProject());
  return tsResult.dts.pipe(gulp.dest(`${DEST_DIR_NAME}/types`));
}

exports.buildDeclaration = buildDeclaration;
exports.buildESM = createBuildTask('esm');
exports.buildCJS = createBuildTask('cjs');
exports.buildUMD = createBuildTask('umd');
