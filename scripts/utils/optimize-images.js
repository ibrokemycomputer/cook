/**
 * @file babelify.js
 * @description Babelify scripts and replace script tags with type=module/nomodule
 */

// REQUIRE
// -----------------------------
const cwd = process.cwd();
const Logger = require(`./logger.js`);
const fileloop = require('filehound');

const imagemin = require('imagemin');
const imageminSvgo = require('imagemin-svgo');
const imageminWebp = require('imagemin-webp');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');

// Config
const {customImgDir, customImgTypes} = require(`${cwd}/config/main.js`);

// PLUGIN OPTIONS
// -----------------------------
const imgDir = `${cwd}/dist${customImgDir || '/assets/img'}`;
const imgTypes = customImgTypes || ['jpg','jpeg','png','svg'];

// DEFINE
// -----------------------------
async function optimizeImages() {
  imgTypes.forEach(type => {
    fileloop.create().paths(imgDir).ext(type).find((err, files) => {
      err ? console.log(err) : files.forEach(async function(file) {
        if (validSource(file)) {
          const image = await compress(file, type);
          if (type !== 'svg') {
            const webp = await convert(file);
            // Show terminal message: Done
            Logger.success(`${file.path} - Compressed & Converted to WebP.`);
          } 
          else {
            // Show terminal message: Done
            Logger.success(`${file.path} - Optimized via SVGO.`);
          }
        }
      })
    });
  })
}


// HELPER METHODS
// -----------------------------

function validSource(src) {
  return (
    !src.includes('android-chrome') &&
    !src.includes('-touch-') &&
    !src.includes('favicon-') &&
    !src.includes('firefox_app_')
  );
}

async function compress(file, type) {
	const output = file.replace(/\/[^/]+$/, "");
	// skip sys tmp files
	if (file.indexOf('/tmp/') > -1) return;
	// raster image? compress appropriately
	if (type !== 'svg') {
		imagemin([file], output, {
			plugins: [
				imageminMozjpeg({ quality: 80 }),
				imageminPngquant({ quality: '65-80' })
			]
		})
	} else {
		imagemin([file], output, {
			use: [
				imageminSvgo({
					plugins: [
						{ removeHiddenElems: false },
						{ removeDimensions: true },
						{ removeViewBox: false }
					]
				})
			]
		})
	}
}

// convert to webp
async function convert(file) {
	const output = file.replace(/\/[^/]+$/, "");
	imagemin([file], output, {
		use: [
			imageminWebp({ quality: 80 })
		]
	})
}

// EXPORT
// -----------------------------
module.exports = optimizeImages;
