// REQUIRE
// -----------------------------
const cwd = process.cwd();
const utils = require(`./util.js`);
const Logger = require(`./logger.js`);

const SVGO = require('svgo');
const imagemin = require('imagemin');
const imageminSvgo = require('imagemin-svgo');
const imageminWebp = require('imagemin-webp');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');

const fileloop = require('filehound');

// Config
const {customImgDir, customImgTypes, distPath} = require(`${cwd}/config/main.js`);

// PLUGIN OPTIONS
// -----------------------------
const imgDir = `${cwd}/dist${customImgDir || '/assets/img'}`;
const imgTypes = customImgTypes || ['jpg','jpeg','png'];
const svgo = new SVGO({
  plugins: [
    { removeDimensions: true },
    { removeViewBox: false },
    { removeUnknownsAndDefaults: true }
  ]
});


// DEFINE
// -----------------------------
async function compressAndNextGen() {
  imgTypes.forEach(type => {
    fileloop.create().paths(imgDir).ext(type).find((err, files) => {
      err ? console.log(err) : files.forEach(async function(file) {
        if (validSource(file)) {
          await compress(file, type);
          await convertToWebp(file);
        }
      })
    });
  })
}


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

async function optimizeSVG(file, type) {
  // Early Exit: Only allow `html` extensions
  if (file.ext !== 'html') return;
  if (type === 'image') {
    compress(file, 'svg')
  } else {
    // Make source traversable with JSDOM
    let dom = utils.jsdom.dom({src: file.src});
    // Store all <svg> tags
    const svgs = dom.window.document.querySelectorAll(`svg`);
    await compressInlineSVGs(svgs);
    Logger.success(`${file.name} inline SVGs optimized.`);
  }
}


async function editMarkup(images, file) {
  images.forEach(el => {
    if (el.getAttribute('data-optimize') !== 'disabled') { 
      Logger.system(`Editing img tags in ${file.name}`);

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
          Logger.warning(`${file.name} will be edited`);
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
  Logger.success(`${file} optimized.`);
}


// convert to webp
async function convertToWebp(file) {
	const output = file.replace(/\/[^/]+$/, "");
	imagemin([file], output, {
		use: [
			imageminWebp({ quality: 80 })
		]
  })
  Logger.success(`${file} converted to webp.`);
}


module.exports = {compressAndNextGen, replaceImgTags, optimizeSVG};