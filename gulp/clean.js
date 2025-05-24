import gulp from 'gulp';
import del from 'del';
import gutil from 'gulp-util';

// Generic error handler for del tasks
function handleDelError(taskName, error) {
  gutil.log(gutil.colors.red(`[Clean:${taskName}] Error during deletion:`), error);
  // Rethrow or return a rejected promise to propagate the error
  return Promise.reject(error);
}

// Generic success handler for del tasks
function handleDelSuccess(taskName, pathsToDelete, deletedPaths) {
  gutil.log(`[Clean:${taskName}] Attempted to delete:`, pathsToDelete);
  if (deletedPaths && deletedPaths.length > 0) {
    gutil.log(`[Clean:${taskName}] Successfully deleted:`);
    deletedPaths.forEach(p => gutil.log(gutil.colors.green(`  - ${p}`)));
  } else {
    gutil.log(`[Clean:${taskName}] No files or directories found to delete for paths:`, pathsToDelete);
  }
  gutil.log(gutil.colors.green(`[Clean:${taskName}] Finished successfully.`));
}

// Cleans out all build output folders folder
export function all() {
  const taskName = 'all';
  const pathsToDelete = ['dist'];
  gutil.log(`[Clean:${taskName}] Starting deletion of:`, pathsToDelete);
  return del(pathsToDelete)
    .then(deletedPaths => handleDelSuccess(taskName, pathsToDelete, deletedPaths))
    .catch(error => handleDelError(taskName, error));
}

// Cleans out app code only
export function app() {
  const taskName = 'app';
  const pathsToDelete = ['dist/src/duelyst.js'];
  gutil.log(`[Clean:${taskName}] Starting deletion of:`, pathsToDelete);
  return del(pathsToDelete)
    .then(deletedPaths => handleDelSuccess(taskName, pathsToDelete, deletedPaths))
    .catch(error => handleDelError(taskName, error));
}

// Cleans out HTML/CSS only
export function web() {
  const taskName = 'web';
  const pathsToDelete = [
    'dist/src/duelyst.css',
    'dist/src/index.html',
    'dist/src/vendor.js',
  ];
  gutil.log(`[Clean:${taskName}] Starting deletion of:`, pathsToDelete);
  return del(pathsToDelete)
    .then(deletedPaths => handleDelSuccess(taskName, pathsToDelete, deletedPaths))
    .catch(error => handleDelError(taskName, error));
}

// Cleans out localization files only
export function locales() {
  const taskName = 'locales';
  const pathsToDelete = ['dist/src/resources/locales'];
  gutil.log(`[Clean:${taskName}] Starting deletion of:`, pathsToDelete);
  return del(pathsToDelete)
    .then(deletedPaths => handleDelSuccess(taskName, pathsToDelete, deletedPaths))
    .catch(error => handleDelError(taskName, error));
}

// Cleans out git remotes from the dist folder
export function git() {
  const taskName = 'git';
  const pathsToDelete = ['dist/git-remotes'];
  gutil.log(`[Clean:${taskName}] Starting deletion of:`, pathsToDelete);
  return del(pathsToDelete)
    .then(deletedPaths => handleDelSuccess(taskName, pathsToDelete, deletedPaths))
    .catch(error => handleDelError(taskName, error));
}
