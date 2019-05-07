# TODO

1. **More documentation!**/ comments
2. More config options
3. Try/Catch blocks & more graceful error handling
4. Testing (E2E, Unit?)

## Site

Some sort of `noscript` warning.  
A no-css warning/fallback.  
Do something if user has images disabled.  
Page transitions/app-shell.  

### Plugins

* SCSS plugin?

### Other

* Add opt-in to set active state on parent of nested pages

## Build

* Retina images

* Double check all settings (make sure they dont fail if unset, and document defaults/requirements)

* Currently, when making a change, all files are checked/updated. Instead, need to only update `/dist` with delta changes.

* Fix nested-page extensions and/or remove 'auto-generate folder + `index.html`' feature

* Both pages resolve/load, which will cause analytics issues

* Add some file type checking/error handling to the template string replacement

## Babel

1. [HOLD] Babelify inline scripts?

## Dependencies

1. Replace `rimraf` with a simple function?