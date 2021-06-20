const gulp = require('gulp');
const del = require('del');
const path = require('path');
const cwd = process.cwd();
const {
  buildDeclaration,
  bundleCJS,
  bundleUMD,
  bundleESM
} = require('./build/tasks');

function cleanDist() {
  return del(path.join(cwd, './dist'));
}

exports.clean = cleanDist;
exports.buildDeclaration = buildDeclaration;
exports.bundleCJS = bundleCJS;
exports.bundleESM = bundleESM;
exports.bundleUMD = bundleUMD;
exports.bundle = gulp.parallel(
  bundleCJS,
  bundleESM,
  bundleUMD,
);
exports.build = gulp.series(
  cleanDist,
  gulp.parallel(
    buildDeclaration,
    exports.bundle
  )
);
