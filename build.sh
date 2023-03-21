#!/bin/sh

# Download latest WebP WASM binaries and JS wrappers from Squoosh

# curl -o webp_node_dec.js "https://raw.githubusercontent.com/GoogleChromeLabs/squoosh/dev/codecs/webp/dec/webp_node_dec.js"
curl -o webp_node_dec.wasm "https://raw.githubusercontent.com/GoogleChromeLabs/squoosh/dev/codecs/webp/dec/webp_node_dec.wasm"

# curl -o webp_node_enc.js "https://raw.githubusercontent.com/GoogleChromeLabs/squoosh/dev/codecs/webp/enc/webp_node_enc.js"
curl -o webp_node_enc.wasm "https://raw.githubusercontent.com/GoogleChromeLabs/squoosh/dev/codecs/webp/enc/webp_node_enc.wasm"

echo "\nDone."
