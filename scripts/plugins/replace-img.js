// REQUIRE
// -----------------------------
const cwd = process.cwd();
const utils = require(`../utils/util.js`);
const Logger = require(`../utils/logger.js`);
const SVGO = require('svgo');

// Config
const {distPath} = require(`${cwd}/config/main.js`);

const svgo = new SVGO({
  plugins: [
    { removeDimensions: true },
    { removeViewBox: false },
    { removeUnknownsAndDefaults: true }
  ]
});

async function replaceImgTags({file, allowType, disallowType}) {
  // Early Exit: File type not allowed
  const allowed = utils.isAllowedType({file,allowType,disallowType});
  if (!allowed) return;

  // Early Exit: Do not replace files locally
  if (process.env.NODE_ENV === 'development') return;

  // Make source traversable with JSDOM
  let dom = utils.jsdom.dom({src: file.src});

  // Store all <img> & <svg> tags
  const images = dom.window.document.querySelectorAll(`img`);
  const svgs = dom.window.document.querySelectorAll(`svg`);

  await compressInlineSVGs(svgs);
  await editMarkup(images, file);
  
  file.src = utils.setSrc({dom});
  Logger.success(`Edited image markup in ${file.name}`);

}

function validSource(src) {
  return ( !src.includes('//') );
}

async function compressInlineSVGs(svgs) {
  svgs.forEach(el => {
    if (el.getAttribute('data-optimize') !== 'disabled') {
      svgo.optimize(el.outerHTML).then(result => {
        console.log(result);
        el.insertAdjacentHTML('beforebegin', result.data);
        el.remove();
      })
    }
  });
}

async function editMarkup(images, file) {
  images.forEach(el => {
    if (el.getAttribute('data-optimize') !== 'disabled') { 
      Logger.system(`Editing img tags in ${file.name}`);

      const originalFileSource = el.getAttribute('src');
      if (validSource(originalFileSource)) {
        const webpFileSource = originalFileSource.replace(/\.[^/.]+$/, "");
        let originalFiletype = el.getAttribute('src').split('.').pop();
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


module.exports = replaceImgTags;