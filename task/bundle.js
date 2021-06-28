const gulp = require('gulp');
const path = require('path');
const fsPromise = require('fs').promises;
const cwd = process.cwd();

const DIST_DIR = path.join(cwd, 'dist');

function copyFileTask(src, dest) {
  return function copyFile() {
    return fsPromise.copyFile(src, dest);
  }
}
const distFileName = process.env.npm_package_name + '.min.js';
function generatePackageJson() {
  const raw = require('../package.json');
  const fileContent = JSON.stringify({
    name: raw.name,
    description: raw.description,
    keywords: raw.keywords,
    version: raw.version,
    author: raw.author,
    // cjs entry
    main: 'cjs/' + distFileName,
    // esm entry
    module: 'esm/' + distFileName,
    // typing
    types: 'types/index.d.ts',
    // umd
    unpkg: 'umd' + distFileName,
    license: raw.license,
    dependencies: raw.dependencies
  }, undefined, '  ');
  return fsPromise.writeFile(
    path.join(DIST_DIR, 'package.json'),
    fileContent
  );
}

exports.bundle = gulp.parallel(
  copyFileTask(
    path.join(cwd, 'LICENSE'),
    path.join(DIST_DIR, 'LICENSE')
  ),
  generatePackageJson
);
