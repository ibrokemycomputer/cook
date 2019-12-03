/**
 * @file replace-inline.js
 * @description Replace external `<link>` and `<script>` calls inline
 */

// REQUIRE
// -----------------------------
const cwd = process.cwd();
const chalk = require('chalk');
const fs = require('fs-extra');
const utils = require(`../utils/util.js`);
const Logger = require(`../utils/logger.js`);

// Config
const {distPath} = require('../utils/config.js');

// DEFINE
// -----------------------------
/**
 * @description Replace external `<link>` and `<script>` calls inline
 * @param {Object} obj - Deconstructed options object
 * @property {Object} obj.file - The current file's info (name, extension, path, src, etc.)
 * @property {Array} [obj.allowType] - Allowed file types (Opt-in)
 * @property {Array} [obj.disallowType] - Disallowed file types (Opt-out)
 */
class ReplaceInline {
  constructor({file, allowType, disallowType, excludePaths = []}) {
    this.opts = {file, allowType, disallowType, excludePaths};
    this.file = file;
    this.allowType = allowType;
    this.disallowType = disallowType;
    this.excludePaths = excludePaths;
  }

  // INIT
  // -----------------------------
  // Note: `process.env.DEV_CHANGED_PAGE` is defined in `browserSync.watch()` in dev.js
  async init() {
    // Early Exit: File type not allowed
    const allowed = utils.isAllowedType(this.opts);
    if (!allowed) return;
    // Early Exit: Do not replace files locally
    if (process.env.NODE_ENV === 'development') return;

    // Destructure options
    const { file } = this;

    // Make source traversable with JSDOM
    let dom = utils.jsdom.dom({src: file.src});

    // Store all <link inline> and <scripts inline>
    const inlineLinkSelector = utils.getSelector(utils.attr.inline, 'link');
    const inlineScriptSelector = utils.getSelector(utils.attr.inline, 'script');
    const links = dom.window.document.querySelectorAll(inlineLinkSelector);
    const scripts = dom.window.document.querySelectorAll(inlineScriptSelector);

    // REPLACE INLINE CSS
    await this.replaceLinks({links, file});
    // REPLACE INLINE SCRIPT
    await this.replaceScripts({scripts, file});

    // Store updated file source
    file.src = utils.setSrc({dom});
  }


  // HELPER METHODS
  // -----------------------------

  /**
   * @description TODO
   * @param {Object} opts - Options object
   * @property {Object} links - Query-selected group of `<link>` tags
   * @property {Object} file - The current file being modified
   * @private
   */
  async replaceLinks({links}) {
    await Promise.all([...links].map(el => this.replaceTag(el,'href')));
  }

  /**
   * @description TODO
   * @param {Object} opts - Options object
   * @property {Object} scripts - Query-selected group of `<script>` tags
   * @property {Object} file - The current file being modified
   * @private
   */
  async replaceScripts({scripts}) {
    await Promise.all([...scripts].map(el => this.replaceTag(el,'src')));
  }

  /**
   * @description Replace target tag with inline source equivalent
   * @param {Object} el - The target `<link>` or `<script>` tag to replace
   * @param {String} type - Either `href` or `src`, depending on the tag type
   * @param {Object} scope - Reference to `this` context
   */
  async replaceTag(el,type) {
    // Format path-to-source
    // If running locally, it adds `https://localhost` to the path
    // So our early exit would fail without formatting
    const formatPath = this.formatPath(el[type]);
    // Early Exit: Not a relative path to CSS file, likely external
    if (formatPath.charAt(0) !== '/') return;
    // Store path to file in dist directory
    const replacePath = `${distPath}${formatPath}`;
    const test = this.file.path === 'dist/demos/index.html'
    try {
      const replaceSrc = await fs.readFile(replacePath, 'utf-8');
      // Add new `<style>` tag and then delete `<link>`
      const tagType = type === 'href' ? 'style' : 'script';
      el.insertAdjacentHTML('beforebegin', `<${tagType}>${replaceSrc}</${tagType}>`);
      el.remove();
      // Show terminal message
      Logger.success(`/${this.file.path} - Replaced link[${utils.attr.inline}]: ${ chalk.green(formatPath) }`);
    }
    catch (err) { Logger.error(`Could not find ${replacePath}, skipping this include`) }
  }

  /**
   * @description Remove localhost path when testing locally
   * NOTE: If running `dev:prod` locally, the href will include `https://localhost`
   * so the path would be something like: `/dist/https://localhost/assets/css/...`.
   * So, we strip that out for local testing
   * @param {String} path - The string path to format
   * @returns {String}
   * @private
   */
  formatPath(path) {
    const pathSplit = path.split('https://localhost');
    return pathSplit[pathSplit.length - 1];
  }
    

  // EXPORT WRAPPER
  // -----------------------------
  // Export function wrapper instead of class for `build.js` simplicity
  static async export(opts) {
    return new ReplaceInline(opts).init();
  }
}

// EXPORT
// -----------------------------
module.exports = ReplaceInline.export;