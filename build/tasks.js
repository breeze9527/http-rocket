const gulp = require('gulp');
const path = require('path');
const ts = require('gulp-typescript');
const rollup = require('gulp-better-rollup');
const sourcemaps = require('gulp-sourcemaps');
const {
  generateInputConfig,
  generateOutputConfig
} = require('./rollup');

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

function createBundleTask(format, minify) {
  return function bundleTask() {
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

exports.bundleESM = createBundleTask('esm', true);
exports.bundleCJS = createBundleTask('cjs', true);
exports.bundleUMD = createBundleTask('umd', true);
