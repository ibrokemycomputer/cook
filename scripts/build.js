// REQUIRE
// -----------------------------
const cwd = process.cwd();
const chalk = require('chalk');
const fs = require('fs').promises;
const Logger = require(`./utils/logger.js`);
const Spinner = require(`./utils/spinner.js`);
// const {generatePages} = require('./utils/performance');

// UTILS
const utils = require(`./utils/util.js`);
const {runFileLoop} = utils;


// PLUGINS
// -----------------------------
// const babelify = require('./plugins/babelify');
const {bundleAdd, bundleBuild} = require('./plugins/bundle');
const copySrc = require('./plugins/copy-src');
const createDist = require('./plugins/create-dist');
const createDirFromFile = require('./plugins/create-dir-from-file');
const customPlugins = require('./plugins/custom-plugins');
const generateSitemap = require('./plugins/generate-sitemap-xml');
const minifySrc = require('./plugins/minify-src');
const replaceInclude = require('./plugins/replace-include.js');
const replaceInline = require('./plugins/replace-inline.js');
const replaceMissingExternalLinkProtocol = require('./plugins/replace-external-link-protocol.js');
const replaceSrcPathForDev = require('./plugins/replace-src-path.js');
const replaceTemplateStrings = require('./plugins/replace-template-strings.js');
const setActiveLinks = require('./plugins/set-active-links.js');

// const {compressAndNextGen, optimizeSVG, replaceImgTags} = require('./plugins/images.js');

// GET SOURCE
const {getSrcConfig, getSrcFiles, getSrcImages} = require('./utils/get-src');

// USER 'MAIN.JS' CONFIG
const {
  // optimizeSVGs, 
  // optimizeImages, 
  plugins = {before: [], default: [], after: []}, 
} = require(`${cwd}/config/main.js`);

// USER 'DATA.JS' CONFIG
// Get user's data config object. We pass it into plugins (when necessary) 
// so that additional data can be added to it from plugins instead of needing 
// to manually define everything from the start in `/config/data.js`
const data = require(`${cwd}/config/data.js`);

// INIT BUNDLE.JS
// Init bundle plugin by creating temporary array for the build process.
// This will serve as a running cache so we don't bundle already-bundled files
// in subsequent pages in the file loop.
data.bundle = {
  css: {}, 
  js: {}, 
};


// BUILD
// -----------------------------
// async function build() {

class Build {

  constructor() {}

  async init() {

    // Show init message
    console.log(`${ chalk.blue('\n[Build]') } ${ chalk.blue.bold('`npm run build`') }`);

    // PLUGIN: Create `/dist` if not already made
    await createDist();

    // PLUGIN: Copy `/src` to `/dist`
    await copySrc();

    // CUSTOM PLUGINS: Run custom user plugins before file loop
    await customPlugins({data, plugins: plugins.before, log: 'Before' });

    // THE IMAGES LOOP
    // getSrcImages(images => {
    //   images.forEach(image => {
    //     // PLUGIN: Optimize .svg files with SVGO
    //     if (optimizeSVGs) optimizeSVG(image, 'image');
    //     // PLUGIN: Optimize raster images (jpg, jpeg, png) and convert to webp
    //     if (optimizeImages) compressAndNextGen(image);
    //   });
    // });

    // GET THE ALLOWED FILES 
    const files = await getSrcFiles();

    // PLUGIN: Convert allowed /dist .html file to directory
    await createDirFromFile({files, allowType: ['.html'] });

    // THE FILES LOOP
    await runFileLoop(files, fileLoop);
    async function fileLoop(fileName) {
      // Read and store the target file source.
      // We'll pass the string around between the plugins
      // then write back the updated/modified source to the file at the end
      let file = await getSrcConfig({fileName});

      // CUSTOM PLUGINS: Run custom user plugins during file loop
      await customPlugins({file, data, plugins: plugins.default});
      
      // PLUGIN: Render all ES6 template strings 
      replaceTemplateStrings({file, data, allowType: ['.html']});

      // PLUGIN: Add missing `http://` to user-added external link `[href]` values (`[href="www.xxxx.com"]`)
      await replaceMissingExternalLinkProtocol({file, allowType: ['.html']});
      
      // PLUGIN: Replace `[data-include]` in files
      await replaceInclude({file, allowType: ['.html']});

      // PLUGIN: Replace `[data-inline]` with external `<link>` and `<script>` tags
      await replaceInline({file, allowType: ['.html']});

      // PLUGIN: Replace <img> tags with <picture> elements
      // if (optimizeImages) replaceImgTags({file, allowType: ['.html']});

      // PLUGIN: Optimize inline <svg>'s with SVGO
      // if (optimizeSVGs) optimizeSVG(file, 'inline');

      // PLUGIN: Babelify standalone JS files
      // babelify({file, allowType: ['.js','.html']});

      // PLUGIN: `/src` is needed for `@import url()` calls when inlining source
      // Since we don't inline in 'development' mode, we need to remove `/src` paths
      // because `/src` doesn't exist in `/dist`
      replaceSrcPathForDev({file, allowType: ['.css','.html']});
      
      // PLUGIN: Find `<a>` tags whose [href] value matches the current page (link active state)
      setActiveLinks({file, allowType: ['.html']});

      // PLUGIN: Compile grouped CSS or JS for bundling
      bundleAdd({file, data, allowType: ['.html']});

      // PLUGIN: Minify Source
      minifySrc({file});
      
      // Write new, modified source back to the file
      fs.writeFile(file.path, file.src);

      return fileName;
    }

    // PLUGIN: Create `sitemap.xml` in the created `/dist` folder
    generateSitemap();

    // PLUGIN: Build and create bundled file
    await bundleBuild({data});

    // CUSTOM PLUGINS: Run custom user plugins after file loop
    await customPlugins({data, plugins: plugins.after, log: 'After' });

    // PLUGIN: Remove /dist/includes after build
    // cleanupDist();
  }

};

// Run build
const build = new Build();
build.init();
