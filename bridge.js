// This allows us to require the two WEBP WASM wrappers which are ES6 Modules (ESM),
// but bridge them back to regular Node.js (plain JavaScript) code.
// Thanks to the NPM "esm" module for enabling this kind of thing.

require = require("esm")(module/*, options*/);
module.exports = {
	enc: require("./webp_node_enc.js"),
	dec: require("./webp_node_dec.js")
};
