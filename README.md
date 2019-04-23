# Pathfinder Build

---
## Todo

Add relevant information to this README, or better yet start a [wiki](https://gitlab.pint.com/pathfinder/build/wikis/home)!

## Build Process

* Creates `/dist`
* Copies `/src` to `/dist`
* Replaces file content with plugin actions:
  * Inline 'external' file calls (link, script, etc.)
  * Replace/inline include files (`[data-include]`)
  * Set `<a>` tags whose `[href]` matches the current page as 'active' (`[data-active]`)
* Minifies code in `/dist`