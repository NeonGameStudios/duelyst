import path from 'path';
import gulp from 'gulp';
import gutil from 'gulp-util';
import gif from 'gulp-if';
import rename from 'gulp-rename';
import uglify from 'uglify-es';
import composer from 'gulp-uglify/composer';
import notify from 'gulp-notify';

// Browserify
// https://github.com/gulpjs/gulp/blob/master/docs/recipes/fast-browserify-builds-with-watchify.md
import browserify from 'browserify';
import watchify from 'watchify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import coffeeify from 'coffeeify';
import glslify from 'glslify';
import hbsfy from 'hbsfy';
import envify from 'envify/custom';
import babelify from 'babelify';
import uglifyify from 'uglifyify';
import bundleCollapser from 'bundle-collapser/plugin';
import {
  opts, config, env, version, production, staging, development,
} from './shared';

const minify = composer(uglify, console);

// Browserify options
// https://github.com/substack/node-browserify#usage
// if env == 'production' || env == 'staging' then false else true,
const bundlerOpts = {
  paths: [path.join(__dirname, '..')],
  debug: development,
  cache: {},
  packageCache: {},
  extensions: ['.coffee', '.js'],
  // ignoreMissing: true,
  // detectGlobals: false
};

const entries = ['./app/index'];
if (config.get('datGuiEditorEnabled')) {
  entries.push('./app/tools/editor.coffee');
}

// gutil.log(`bundler options: ${JSON.stringify(opts)}`)

// Initialize bundler
gutil.log('[BROWSERIFY] Initializing Browserify...');
let bundler;
try {
  bundler = browserify(entries, bundlerOpts);
  if (opts.watch) {
    gutil.log('[BROWSERIFY] Enabling Watchify.');
    bundler = watchify(bundler);
  }
  gutil.log('[BROWSERIFY] Browserify initialized successfully.');
} catch (error) {
  gutil.log(gutil.colors.red('[BROWSERIFY] Error during Browserify initialization:'), error);
  // Propagate error to Gulp by throwing it, as this is outside a stream
  throw error;
}

// Apply bundler transforms
gutil.log('[BROWSERIFY] Applying transforms...');
try {
  // bundler.transform(aliasify, aliasConfig)
  gutil.log('[BROWSERIFY] Applying coffeeify transform.');
  bundler.transform(coffeeify);
  gutil.log('[BROWSERIFY] Applying hbsfy transform.');
  bundler.transform(hbsfy);
  gutil.log('[BROWSERIFY] Applying glslify transform.');
  bundler.transform(glslify);
  gutil.log('[BROWSERIFY] Applying envify transform.');
  bundler.transform(envify({
  NODE_ENV: env,
  VERSION: version,
  API_URL: config.get('api'),
  FIREBASE_URL: config.get('firebase.url'),
  ALL_CARDS_AVAILABLE: config.get('allCardsAvailable'),
  AI_TOOLS_ENABLED: config.get('aiToolsEnabled'),
  RECORD_CLIENT_LOGS: config.get('recordClientLogs'),
  INVITE_CODES_ACTIVE: config.get('inviteCodesActive'),
  RECAPTCHA_ACTIVE: config.get('recaptcha.enabled'),
  BUGSNAG_WEB: config.get('bugsnag.web_key'),
  BUGSNAG_DESKTOP: config.get('bugsnag.desktop_key'),
  TRACKING_PIXELS_ENABLED: false,
  LANDING_PAGE_URL: '/',
  REFERRER_PAGE_URLS: '',
}));
  // bundler.transform(babelify, {
  //   compact: false
  // })
  if (opts.minify) {
    gutil.log('[BROWSERIFY] Applying uglifyify transform for minification.');
    bundler.transform(uglifyify);
    // bundler.plugin(bundleCollapser)
  }
  gutil.log('[BROWSERIFY] Transforms applied successfully.');
} catch (error) {
  gutil.log(gutil.colors.red('[BROWSERIFY] Error applying transforms:'), error);
  // Propagate error to Gulp
  throw error;
}

// Re-bundle on update
bundler.on('update', () => {
  gutil.log('[BROWSERIFY] Watchify detected a change, re-bundling...');
  bundle();
});

// Log bundler updates
bundler.on('update', (files) => {
  gutil.log('[BROWSERIFY] Bundle updating');
  files.map((file) => gutil.log(` [CHANGED] ${file}`));
});

// Log bundler output
bundler.on('log', gutil.log.bind(gutil, '[BROWSERIFY]'));

// export bundle function
export default function bundle() {
  gutil.log('[BROWSERIFY] Starting bundle process...');
  return bundler.bundle()
  // log errors if they happen
    .on('error', function (error) {
      gutil.log(gutil.colors.red('[BROWSERIFY] Error during bundling:'), error.message);
      if (error.annotated) {
        gutil.log(gutil.colors.red('[BROWSERIFY] Annotated Error:'), error.annotated);
      } else if (error.stack) {
        gutil.log(gutil.colors.red('[BROWSERIFY] Stack Trace:'), error.stack);
      }
      notify.onError({
        title: 'Browserify Error',
        message: '<%= error.message %>',
        // Optional: emit an error event to stop the stream if notify doesn't do it.
        // This is often handled by how Gulp tasks are set up, but being explicit can help.
      }).call(this, error); // Call notify.onError with `this` context and error
      // Ensure the stream ends to prevent Gulp from hanging
      this.emit('end');
    })
    .pipe(source('index.js'))
    .pipe(buffer())
    .on('error', function (error) { // Catch errors from vinyl-buffer as well
      gutil.log(gutil.colors.red('[BROWSERIFY] Error after bundling (e.g., vinyl-buffer):'), error);
      this.emit('end');
    })
    .pipe(gif(opts.minify, minify({ mangle: true })
      .on('error', function (error) { // Catch errors from uglify
        gutil.log(gutil.colors.red('[BROWSERIFY] Error during minification (uglify):'), error);
        this.emit('end');
      }),
    ))
    .pipe(rename((p) => {
      gutil.log(`[BROWSERIFY] Renaming output to 'duelyst${p.extname}'`);
      p.basename = 'duelyst';
      return p.basename;
    }))
    .pipe(notify({
      title: 'Gulp Watch', // Default title
      message: (file) => {
        if (file.isNull()) {
          return; // Do notreturning anything if the file is null
        }
        const successMessage = `[BROWSERIFY] Successfully bundled and wrote ${file.relative}`;
        gutil.log(successMessage);
        return successMessage;
      },
      onLast: true, // Only notify on the last file
    }))
    .pipe(gulp.dest('dist/src'))
    .on('end', () => {
      gutil.log('[BROWSERIFY] Finished bundle process.');
    });
}
