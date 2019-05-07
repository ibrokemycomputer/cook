// REQUIRE
// -----------------------------
const cwd = process.cwd();
const utils = require(`../utils/util.js`);
const Logger = require(`../utils/logger.js`);

const SVGO = require('svgo');
const imagemin = require('imagemin');
const imageminSvgo = require('imagemin-svgo');
const imageminWebp = require('imagemin-webp');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');

const fileloop = require('filehound');

// Config
const {customImgDir, customImgTypes, svgOpts} = require(`${cwd}/config/main.js`);

// PLUGIN OPTIONS
// -----------------------------
const imgDir = `${cwd}/dist${customImgDir || '/assets/img'}`;
const imgTypes = customImgTypes || ['jpg','jpeg','png'];
const svgoOpts = svgOpts || {
  plugins: [
    { removeDimensions: true },
    { removeViewBox: false },
    { removeUnknownsAndDefaults: false }
  ]
};
const svgo = new SVGO(svgoOpts);


// DEFINE
// -----------------------------

/**
 * @description Get images and update HTML markup
 * 
 * @param {Object} Obj Deconstructed object
 * @param {Object} Obj.file File object
 * @param {Array} Obj.allowType Allowed files types
 * @param {Array} Obj.disallowType Disallowed files types
 */
async function replaceImgTags({file, allowType, disallowType}) {
  // Early Exit: File type not allowed
  const allowed = utils.isAllowedType({file,allowType,disallowType});
  if (!allowed) return;

  // Early Exit: Do not replace files locally
  if (process.env.NODE_ENV === 'development') return;

  // Make source traversable with JSDOM
  let dom = utils.jsdom.dom({src: file.src});

  // Store all <img> tags
  const images = dom.window.document.querySelectorAll(`img`);

  await editMarkup(images, file);
  
  file.src = utils.setSrc({dom});
  Logger.success(`Edited image markup in ${file.name}`);
}


/**
 * @description Compress SVGs with svgo
 * 
 * @param {Object} file File object
 * @param {String} [type] Type of file (image or html)
 */
async function optimizeSVG(file, type) {
  // Early Exit: Only allow `html` extensions
  if (file.ext !== 'html') return;

  // When SVG is an external call to a .svg file
  if (type === 'image') {
    compress(file, 'svg')
  } 
  // When SVG is inline in the markup
  else {
    // Make source traversable with JSDOM
    let dom = utils.jsdom.dom({src: file.src});
    // Store all <svg> tags
    const svgs = dom.window.document.querySelectorAll(`svg`);
    // Add `[xmlns:xlink="http://www.w3.org/1999/xlink"]` to each <svg> instance
    // before trying to run SVGO, or it will throw a namespace error in terminal
    svgs.forEach(s => s.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink'));
    await compressInlineSVGs(svgs);
    Logger.success(`${file.name} inline SVGs optimized.`);
  }
}


/**
 * @description Convert <img> tags to <picture> elements
 * 
 * @param {Array} images Images queried with jsdom
 * @param {String} file File object
 */
async function editMarkup(images, file) {
  images.forEach(el => {
    if (el.getAttribute('data-optimize') !== 'disabled') { 
      const originalFileSource = el.getAttribute('src');
      if (validSource(originalFileSource)) {
        const webpFileSource = originalFileSource.replace(/\.[^/.]+$/, "");
        let originalFiletype = file.ext;
        if (originalFiletype === 'jpg') originalFiletype = 'jpeg';
        const typesToConvert = ['jpeg','png'];
        let attributes = '';
        const attrs = el.attrs;
        for (let p in attrs) attributes += `${p}="${attrs[p]}"`;

        if (typesToConvert.includes(originalFiletype) && !el.parentNode !== 'picture') {
          let markup = 
            `<picture>
              <source srcset="${webpFileSource}.webp" type="image/webp">
              <source srcset="${originalFileSource}" type="image/${originalFiletype}">
              <img src="${originalFileSource}" ${attributes}>
              </picture>`;
          el.insertAdjacentHTML('beforebegin', markup);
          el.remove();
        }
      }
    }
  })
}


function validSource(src) {
  return ( 
    !src.includes('android-chrome') &&
    !src.includes('-touch-') &&
    !src.includes('favicon-') &&
    !src.includes('firefox_app_') &&
    !src.includes('//')
  );
}

/**
 * @description Compress inline svgs with svgo
 * 
 * @param {Array} svgs Svgs queried with jsdom
 */
async function compressInlineSVGs(svgs) {
  svgs.forEach(el => {
    if (el.getAttribute('data-optimize') !== 'disabled') {
      svgo.optimize(el.outerHTML).then(result => {
        el.insertAdjacentHTML('beforebegin', result.data);
        el.remove();
      })
    }
  });
}

// TODO: Remove filehound
async function compressAndNextGen(image) {
  if (validSource(image)) {
    await compress(image, 'other');
    await convertToWebp(image);
  }
}

// compress with imagemin
async function compress(image, type) {
  const output = image.replace(/\/[^/]+$/, "");  
	// raster image? compress appropriately
	if (type !== 'svg') {
		imagemin([image], output, {
			plugins: [
				imageminMozjpeg({ quality: 80 }),
				imageminPngquant({ quality: [0.65, 0.8] })
			]
		})
	} else {
		imagemin([image], output, {
			use: [
				imageminSvgo(svgoOpts)
			]
		})
  }
  Logger.success(`${image} optimized.`);
}


// convert to webp
async function convertToWebp(image) {
	const output = image.replace(/\/[^/]+$/, "");
	imagemin([image], output, {
		use: [
			imageminWebp({ quality: 80 })
		]
  })
  Logger.success(`${image} converted to webp.`);
}


module.exports = {compressAndNextGen, replaceImgTags, optimizeSVG};