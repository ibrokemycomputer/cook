// REQUIRE
// -----------------------------
const cwd = process.cwd();
const chalk = require('chalk');
const fs = require('fs');
const utils = require(`./utils/util.js`);
const Logger = require(`./utils/logger.js`);
const {generatePages} = require('./utils/performance');


// PLUGINS
// -----------------------------
const babelify = require('./plugins/babelify');
const cleanupDist = require('./plugins/cleanup-dist');
const copySrc = require('./plugins/copy-src');
const createDist = require('./plugins/create-dist');
const createDirFromFile = require('./plugins/create-dir-from-file');
const customPlugins = require('./plugins/custom-plugins');
const minifySrc = require('./plugins/minify-src');
const replaceIncludes = require('./plugins/replace-includes.js');
const replaceInline = require('./plugins/replace-inline.js');
const replaceMissingExternalLinkProtocol = require('./plugins/replace-external-link-protocol.js');
const replaceSrcPathForDev = require('./plugins/replace-src-path.js');
const replaceTemplateStrings = require('./plugins/replace-template-strings.js');
const setActiveLinks = require('./plugins/set-active-links.js');

const {compressAndNextGen, replaceImgTags, optimizeSVG} = require('./plugins/images.js');

// GET SOURCE
const {getSrcConfig, getSrcFiles, getSrcImages} = require('./utils/get-src');

// USER 'MAIN.JS' CONFIG
const {
  convertPageToDirectory, 
  optimizeSVGs, 
  optimizeImages, 
  pagePerformanceTest, 
  plugins = {before: [], default: [], after: []}, 
  replaceExternalLinkProtocol = {enabled:true}, 
} = require(`${cwd}/config/main.js`);

// USER 'DATA.JS' CONFIG
// Get user's data config object. We pass it into plugins (when necessary) 
// so that additional data can be added from plugins instead of needing 
// to manually added everything to `/config/data.js`
const data = require(`${cwd}/config/data.js`);


// BUILD
// -----------------------------
async function build() {
  // Show init message
  console.log(`${ chalk.blue('\n[Build]') } ${ chalk.blue.bold('`npm run build`') }`);

  // PLUGIN: Create `/dist` if not already made
  await createDist();

  // PLUGIN: Copy `/src` to `/dist`
  await copySrc();

  // CUSTOM PLUGINS: Run custom user plugins before file loop
  await customPlugins({data, plugins: plugins.before, log: true });

  // PERFORMANCE: Generate X number of pages to test performance
  if (pagePerformanceTest > 0) await generatePages(pagePerformanceTest); 

  // THE IMAGES LOOP
  await getSrcImages(async images => {
    images.forEach(image => {
      // PLUGIN: Optimize .svg files with SVGO
      if (optimizeSVGs !== false) optimizeSVG(image, 'image');
      // PLUGIN: Optimize raster images (jpg, jpeg, png) and convert to webp
      if (optimizeImages !== false) compressAndNextGen(image);
    })
  });

  // THE FILES LOOP
  await getSrcFiles(async files => {

    // Run tasks on matched files
    await files.forEach(async (fileName) => {
      
      // Open file and store file info for use in plugins
      // We'll pass around the source string between the plugins
      // Then write back the updated/modified source to the file at the end
      let file = await getSrcConfig({fileName});

      // CUSTOM PLUGINS: Run custom user plugins during file loop
      await customPlugins({file, data, plugins: plugins.default});

      // PLUGIN: Render all ES6 template strings 
      await replaceTemplateStrings({file, data, allowType: ['.html']});

      // PLUGIN: Add missing `http://` to user-added external link `[href]` values (`[href="www.xxxx.com"]`)
      if (replaceExternalLinkProtocol.enabled) await replaceMissingExternalLinkProtocol({file, allowType: ['.html']});

      // PLUGIN: Replace `[data-include]` in files
      await replaceIncludes({file, allowType: ['.html']});

      // PLUGIN: Replace `[data-inline]` with external `<link>` and `<script>` tags
      await replaceInline({file, allowType: ['.html']});

      // PLUGIN: Replace <img> tags with <picture> elements
      if (optimizeImages !== false) await replaceImgTags({file, allowType: ['.html']});

      // PLUGIN: Optimize inline <svg>'s with SVGO
      if (optimizeSVGs !== false) await optimizeSVG(file, 'inline');

      // PLUGIN: Babelify standalone JS files
      await babelify({file, allowType: ['.js','.html']});

      // PLUGIN: `/src` is needed for `@import url()` calls when inlining source
      // Since we don't inline in 'development' mode, we need to remove `/src` paths
      // because `/src` doesn't exist in `/dist`
      await replaceSrcPathForDev({file, allowType: ['.css','.html']});
      
      // PLUGIN: Find `<a>` tags whose [href] value matches the current page (link active state)
      await setActiveLinks({file, allowType: ['.html']});

      // PLUGIN: Minify Source
      await minifySrc({file});

      // PLUGIN: Create directory from .html file
      if (convertPageToDirectory) createDirFromFile({file, allowType: ['.html'], excludePath: ['dist/index']});
      
      // Write new, modified source back to the file
      fs.writeFileSync(file.path, file.src);

    });
  });

  // CUSTOM PLUGINS: Run custom user plugins after file loop
  await customPlugins({data, plugins: plugins.after, log: true });

  // PLUGIN: Remove /dist/includes after build
  cleanupDist();

};
build();