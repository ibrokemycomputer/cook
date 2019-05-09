// REQUIRE
// -----------------------------
const cwd = process.cwd();
const browserSync = require('browser-sync').create('Dev Server');
const chalk = require('chalk');
const packageJSON = require('../package.json');
const Logger = require(`./utils/logger.js`);
const { execSync } = require('child_process');

// Config
const {distPath,srcPath,startPath,watch} = require(`${cwd}/config/main.js`);

// Use paths from config or defaults
const watchFiles = watch && watch.length 
  ? watch 
  : [
    '/assets/css/*.css',
    '/**/*.html',
    '/assets/plugin/**/*.css',
    '/assets/plugin/**/*.js',
  ];

// INIT BROWSER-SYNC SERVER
// -----------------------------
browserSync.init({
  // Hide BrowserSync popup messages in UI
  notify: false,
  // Open the site in the browser automatically
  open: false,
  // The `localhost` port number to use (Defaults to `:3000`)
  port: packageJSON.config.devPort || 3000,
  // Where to serve `localhost` from (dev files)
  server: {
    baseDir: distPath,
    index: startPath,
  },
  // Automatically reload on `.css`, `.html`, and `.js` file changes
  //watch: true,
});
browserSync.emitter.on('init', () => {
  console.log(`\n${ chalk.blue('[Browsersync]') } ${ chalk.blue.bold('`npm run dev`') }\n`);
});

// WATCH DEV FILES FOR LIVERELOAD
// --------------------------------
// Watch changes to `/src` files and run the build process to copy
// to `/dist` equivalent, so we can run livereload on `/dist` to
// view includes.
watchFiles.forEach(path => {
  // Watch `/src` files for changes
  browserSync.watch(`${srcPath}${path}`).on('change', file => {
    // Store the changed file as an environment variable
    // Then when we run the build process below,
    // we'll use this now-defined variable to dictate
    // whether the whole build process is run, or just against
    // this changed file.
    process.env.DEV_CHANGED_PAGE = file;
    // Run the build process
    execSync('NODE_ENV=development LOGGER=true npm run build', {stdio: 'inherit'});
    // Reload changed page
    const fileDist = file.replace(`${srcPath}/`, `${distPath}/`);
    browserSync.reload(fileDist);
  });
});