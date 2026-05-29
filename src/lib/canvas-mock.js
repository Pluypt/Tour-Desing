// Browser-side canvas mock — replaces the Node.js `canvas` package
// which pdfjs-dist tries to require() but is not needed in the browser.
module.exports = {};
