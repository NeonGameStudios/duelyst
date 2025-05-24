import gulp from 'gulp';
import gutil from 'gulp-util';
import size from 'gulp-size';
import changed from 'gulp-changed';
import replace from 'gulp-replace';
import _ from 'underscore';
import { exec } from 'child_process';

// images
import imagemin from 'gulp-imagemin';
import pngquant from 'imagemin-pngquant';
import optipng from 'imagemin-optipng';
import mozjpeg from 'imagemin-mozjpeg';
import zopfli from 'imagemin-zopfli';
import jpegtran from 'imagemin-jpegtran';
import { config, development } from './shared';

const handleError = (taskName) => function (error) {
  gutil.log(gutil.colors.red(`[RSX:${taskName}] Error:`), error.message);
  if (error.stack) {
    gutil.log(gutil.colors.red(`[RSX:${taskName}] Stack Trace:`), error.stack);
  }
  if (error.plugin) {
    gutil.log(gutil.colors.red(`[RSX:${taskName}] Plugin:`), error.plugin);
  }
  // Emit 'end' to stop the stream and prevent Gulp from hanging
  this.emit('end');
};

export function imageMin() {
  const taskName = 'imageMin';
  gutil.log(`[RSX:${taskName}] Starting image minification (mozjpeg, zopfli)...`);
  return gulp.src('app/original_resources/**/*.{jpg,png}')
    .pipe(changed('app/resources', { hasChanged: changed.compareSha1Digest }))
    .on('error', handleError(taskName))
    .pipe(imagemin([mozjpeg(), zopfli()], { verbose: true }))
    .on('error', handleError(taskName))
    .pipe(size())
    .pipe(gulp.dest('app/resources'))
    .on('end', () => gutil.log(gutil.colors.green(`[RSX:${taskName}] Finished image minification.`)));
}

export function imageMinLossy() {
  const taskName = 'imageMinLossy';
  gutil.log(`[RSX:${taskName}] Starting lossy image minification (pngquant)...`);
  return gulp.src(['app/resources/**/*.{jpg,png}', '!app/resources/{maps,maps/**}'])
    .pipe(changed('app/resources', { hasChanged: changed.compareSha1Digest }))
    .on('error', handleError(taskName))
    .pipe(imagemin([pngquant({ nofs: true })], { verbose: true }))
    .on('error', handleError(taskName))
    .pipe(size())
    .pipe(gulp.dest('app/resources'))
    .on('end', () => gutil.log(gutil.colors.green(`[RSX:${taskName}] Finished lossy image minification.`)));
}

// Copy non-cdn flagged resources over to the dist folder
// Used before packaging the desktop application
export function copy() {
  const taskName = 'copy';
  gutil.log(`[RSX:${taskName}] Starting copy of non-CDN resources for packaging...`);
  try {
    const pkgsAll = require('../app/data/packages').all;
    const pkgsFiltered = pkgsAll.filter((rsx) => !rsx.cdn);
    gutil.log(`[RSX:${taskName}] ${pkgsFiltered.length} non-cdn resource entries detected.`);
    let paths = pkgsFiltered.reduce((currentPaths, rsx) => {
      if (rsx.img) { currentPaths.push(`app/${rsx.img}`); }
      if (rsx.imgPosX) { currentPaths.push(`app/${rsx.imgPosX}`); }
      if (rsx.imgNegX) { currentPaths.push(`app/${rsx.imgNegX}`); }
      if (rsx.imgPosY) { currentPaths.push(`app/${rsx.imgPosY}`); }
      if (rsx.imgNegY) { currentPaths.push(`app/${rsx.imgNegY}`); }
      if (rsx.imgPosZ) { currentPaths.push(`app/${rsx.imgPosZ}`); }
      if (rsx.imgNegZ) { currentPaths.push(`app/${rsx.imgNegZ}`); }
      if (rsx.audio) { currentPaths.push(`app/${rsx.audio}`); }
      if (rsx.plist) { currentPaths.push(`app/${rsx.plist}`); }
      if (rsx.font) { currentPaths.push(`app/${rsx.font}`); }
      return currentPaths;
    }, []);
    paths = _.uniq(paths);
    gutil.log(`[RSX:${taskName}] ${paths.length} unique file paths being copied for packaging.`);
    if (paths.length === 0) {
      gutil.log(`[RSX:${taskName}] No non-CDN files to copy.`);
      gutil.log(gutil.colors.green(`[RSX:${taskName}] Finished copying non-CDN resources.`));
      return Promise.resolve(); // No files to copy, resolve promise
    }
    return gulp.src(paths, { base: 'app', allowEmpty: true })
      .on('error', handleError(taskName))
      .pipe(gulp.dest('dist/src'))
      .on('end', () => gutil.log(gutil.colors.green(`[RSX:${taskName}] Finished copying non-CDN resources.`)));
  } catch (error) {
    gutil.log(gutil.colors.red(`[RSX:${taskName}] Error preparing file list:`), error);
    // This error is outside a stream, so we need to handle it differently
    // For a Gulp task, you might call a callback with an error: cb(error)
    // Or, if this function is directly used in a series, throwing is appropriate.
    throw error;
  }
}

// Copy cdn flagged resources over to the dist folder
// Used before uploading to S3
export function copyCdn() {
  const taskName = 'copyCdn';
  gutil.log(`[RSX:${taskName}] Starting copy of CDN resources for upload...`);
  try {
    const pkgsAll = require('../app/data/packages').all;
    const pkgsFiltered = pkgsAll.filter((rsx) => rsx.cdn);
    gutil.log(`[RSX:${taskName}] ${pkgsFiltered.length} CDN resource entries detected.`);
    let paths = pkgsFiltered.reduce((currentPaths, rsx) => {
      if (rsx.img) { currentPaths.push(`app/${rsx.img}`); }
      if (rsx.imgPosX) { currentPaths.push(`app/${rsx.imgPosX}`); }
      if (rsx.imgNegX) { currentPaths.push(`app/${rsx.imgNegX}`); }
      if (rsx.imgPosY) { currentPaths.push(`app/${rsx.imgPosY}`); }
      if (rsx.imgNegY) { currentPaths.push(`app/${rsx.imgNegY}`); }
      if (rsx.imgPosZ) { currentPaths.push(`app/${rsx.imgPosZ}`); }
      if (rsx.imgNegZ) { currentPaths.push(`app/${rsx.imgNegZ}`); }
      if (rsx.audio) { currentPaths.push(`app/${rsx.audio}`); }
      if (rsx.plist) { currentPaths.push(`app/${rsx.plist}`); }
      if (rsx.font) { currentPaths.push(`app/${rsx.font}`); }
      return currentPaths;
    }, []);
    paths = _.uniq(paths);
    gutil.log(`[RSX:${taskName}] ${paths.length} unique file paths being copied for CDN upload.`);
    if (paths.length === 0) {
      gutil.log(`[RSX:${taskName}] No CDN files to copy.`);
      gutil.log(gutil.colors.green(`[RSX:${taskName}] Finished copying CDN resources.`));
      return Promise.resolve(); // No files to copy, resolve promise
    }
    return gulp.src(paths, { base: 'app', allowEmpty: true })
      .on('error', handleError(taskName))
      .pipe(gulp.dest('dist/src'))
      .on('end', () => gutil.log(gutil.colors.green(`[RSX:${taskName}] Finished copying CDN resources.`)));
  } catch (error) {
    gutil.log(gutil.colors.red(`[RSX:${taskName}] Error preparing file list:`), error);
    throw error;
  }
}

// Copy web assets (e.g. favicon.ico) into build.
export function copyWeb() {
  const taskName = 'copyWeb';
  gutil.log(`[RSX:${taskName}] Starting copy of web assets (e.g., favicon)...`);
  return gulp.src('app/resources/web/*', { base: 'app/resources/web' })
    .on('error', handleError(taskName))
    .pipe(gulp.dest('dist/src'))
    .on('end', () => gutil.log(gutil.colors.green(`[RSX:${taskName}] Finished copying web assets.`)));
}

// Wholesale copy everything from /resources folder
// Used for testing
export function copyAll() {
  const taskName = 'copyAll';
  gutil.log(`[RSX:${taskName}] Starting wholesale copy of all resources from ./app/resources/** ...`);
  return gulp.src('./app/resources/**', { base: 'app' })
    .on('error', handleError(taskName))
    .pipe(gulp.dest('dist/src'))
    .on('end', () => gutil.log(gutil.colors.green(`[RSX:${taskName}] Finished wholesale copy of all resources.`)));
}

// Generate Packages
// https://github.com/gulpjs/gulp/blob/4.0/docs/recipes/running-shell-commands.md
// https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback
export function packages(cb) {
  const taskName = 'packages';
  gutil.log(`[RSX:${taskName}] Starting generation of packages...`);
  const command = `node scripts/generate_packages.js -d${development ? ' -fa' : ''}`;
  gutil.log(`[RSX:${taskName}] Executing command: ${command}`);

  const pkgsProc = exec(command, (err, stdout, stderr) => {
    if (err) {
      gutil.log(gutil.colors.red(`[RSX:${taskName}] Error during package generation script execution:`), err.message);
      if (err.stack) {
        gutil.log(gutil.colors.red(`[RSX:${taskName}] Stack Trace:`), err.stack);
      }
      if (stderr) {
        gutil.log(gutil.colors.red(`[RSX:${taskName}] Stderr:`), stderr);
      }
      gutil.log(gutil.colors.green(`[RSX:${taskName}] Finished package generation with errors.`));
      return cb(err); // Propagate error to Gulp
    }
    gutil.log(gutil.colors.green(`[RSX:${taskName}] Finished package generation successfully.`));
    return cb(); // Success
  });

  pkgsProc.stdout.on('data', (data) => {
    process.stdout.write(data); // Log stdout from script
  });
  pkgsProc.stderr.on('data', (data) => {
    process.stderr.write(data); // Log stderr from script (though errors are handled in callback)
  });
}

// replace URLs in the source code with the CDN url
export function buildUrls() {
  const taskName = 'buildUrls';
  gutil.log(`[RSX:${taskName}] Starting replacement of resource URLs with CDN path in dist/src/**/*.js...`);
  const cdnUrl = config.get('cdn');
  gutil.log(`[RSX:${taskName}] CDN URL: ${cdnUrl}`);
  return gulp.src('dist/src/**/*.js')
    .on('error', handleError(taskName))
    .pipe(replace(/(\/?)resources\/([^"|'|)]+)/g, `${cdnUrl}/resources/$2`))
    .on('error', handleError(taskName)) // Handle errors from replace
    .pipe(gulp.dest('dist/src'))
    .on('end', () => gutil.log(gutil.colors.green(`[RSX:${taskName}] Finished replacing resource URLs with CDN path.`)));
}

// replace codex URLs in the source code with the CDN url
// used for desktop build to link codex assets to CDN
export function codexUrls() {
  const taskName = 'codexUrls';
  gutil.log(`[RSX:${taskName}] Starting replacement of codex URLs with CDN path in dist/src/**/*.js...`);
  const cdnUrl = config.get('cdn');
  gutil.log(`[RSX:${taskName}] CDN URL for codex: ${cdnUrl}`);
  return gulp.src('dist/src/**/*.js')
    .on('error', handleError(taskName))
    .pipe(replace(/(\/?)resources\/codex\/([^"|'|)]+)/g, `${cdnUrl}/resources/codex/$2`))
    .on('error', handleError(taskName)) // Handle errors from replace
    .pipe(gulp.dest('dist/src'))
    .on('end', () => gutil.log(gutil.colors.green(`[RSX:${taskName}] Finished replacing codex URLs with CDN path.`)));
}

// replace URLS in the source code with the CDN url
export function sourceUrls() {
  const taskName = 'sourceUrls';
  gutil.log(`[RSX:${taskName}] Starting replacement of resource URLs with CDN path in app/data/resources.js...`);
  const cdnUrl = config.get('cdn');
  gutil.log(`[RSX:${taskName}] CDN URL: ${cdnUrl}`);
  return gulp.src('app/data/resources.js')
    .on('error', handleError(taskName))
    .pipe(replace(/(\/?)resources\/([^"|'|)]+)/g, `${cdnUrl}/resources/$2`))
    .on('error', handleError(taskName)) // Handle errors from replace
    .pipe(gulp.dest('dist/src')) // Assuming this was meant to be app/data or a different dest for source?
                               // For now, keeping it as dist/src as per original, but this might be a bug in original.
                               // If it's meant to modify in-place, this needs gulp-rename or similar.
    .on('end', () => gutil.log(gutil.colors.green(`[RSX:${taskName}] Finished replacing resource URLs in app/data/resources.js.`)));
}
