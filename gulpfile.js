const gulp = require('gulp');
const del = require('del');
const path = require('path');

const cwd = process.cwd();
const {
  buildDeclaration,
  buildCJS,
  buildUMD,
  buildESM
} = require('./task/build');
const { bundle } = require('./task/bundle');

function cleanDist() {
  return del(path.join(cwd, './dist'));
}

exports.clean = cleanDist;

exports.build = gulp.series(
  cleanDist,
  gulp.parallel(
    buildDeclaration,
    buildCJS,
    buildESM,
    buildUMD
  )
);
exports.bundle = bundle;
