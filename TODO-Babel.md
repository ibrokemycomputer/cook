# Babel Steps

## Compiling

1. Ignore src/assets/scripts/vendor
1. Babelify src/assets/scripts/plugins
1. Babelify src/assets/scripts/*.js
1. Babelify config.customBabelDirs
1. Markup

## Markup

1. Find script tags that **don't** have [data-compile="false"] set
1. Clone node and edit markup
    - Add `type="module"` to existing DOM node
    - Add `nomodule` to new node.
    - Compile new node and append to DOM after OG node
1. Babelify inline scripts
    - Extract contents, then repeat the process from above to the inline tag.