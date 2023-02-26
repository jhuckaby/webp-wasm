# Overview

**webp-wasm** is a module for encoding and decoding WebP images using WebAssembly.  It borrows the WebP codecs from [Squoosh](https://github.com/GoogleChromeLabs/squoosh), an open-source web app made by Chrome Labs, but it is built specifically for Node.js.  Note that this will not be as fast as native C++ bindings to [libwebp](https://chromium.googlesource.com/webm/libwebp), but it's still very fast.

WebP image files are decoded to RGBA pixel buffers, similar to the browser [ImageData](https://developer.mozilla.org/en-US/docs/Web/API/ImageData) structure.  Likewise, when encoding pixels back to WebP, an ImageData-like object is expected, with an RGBA pixel buffer ([Uint8ClampedArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8ClampedArray)).  This is designed to interoperate with libraries such as [node-canvas](https://github.com/Automattic/node-canvas).

Please note that webp-wasm ships with WebAssembly components copied from [Squoosh](https://github.com/GoogleChromeLabs/squoosh), which is open source and has an [Apache 2.0 license](https://github.com/GoogleChromeLabs/squoosh/blob/dev/LICENSE).

## Features

- Encode and decode WebP images, with full support for alpha transparency.
- Dynamic loading of WebAssembly modules on first use, or by manually calling `load()`.
- Lots of available options for encoding.
- No memory leaks.

# Usage

Use [npm](https://www.npmjs.com/) to install the module:

```
npm install webp-wasm
```

Here is a simple usage example:

```js
const fs = require('fs/promises');
const webp = require('webp-wasm');

let buffer = await fs.readFile('my-image.webp');
let imgData = await webp.decode(buffer);
console.log(imgData);
```

This would output something like:

```
ImageData {
  data: Uint8ClampedArray(809600) [ ... ],
  width: 550,
  height: 368
}
```

And here is an example of encoding the pixel data back to WebP:

```js
let buffer = await webp.encode(imgData, { quality: 75 });
await fs.writeFile('my-new-image.webp', buffer);
```

## node-canvas

Here is an example of reading and writing a WebP image using webp-wasm and [node-canvas](https://github.com/Automattic/node-canvas):

```js
const fs = require('fs/promises');
const { createCanvas, createImageData } = require('canvas');
const webp = require('webp-wasm');

(async function() {
	// load WebP file from disk into buffer
	let inBuf = await fs.readFile('my-image.webp');
	
	// decode WebP into RGBA pixels (ImageData)
	let image = await webp.decode(inBuf);
	
	// create canvas and 2d context
	let canvas = createCanvas( image.width, image.height );
	let context = canvas.getContext('2d');
	
	// convert to node-canvas native ImageData object (it's strict about this)
	let imgData = createImageData(image.data, image.width, image.height);
	
	// render pixels onto canvas
	context.putImageData( imgData, 0, 0 );
	
	// draw something else on top, just to show we can
	context.save();
	context.translate(160, 160);
	context.beginPath();
	context.lineWidth = 14;
	context.strokeStyle = '#325FA2';
	context.fillStyle = '#eeeeee';
	context.arc(0, 0, 142, 0, Math.PI * 2, true);
	context.stroke();
	context.fill();
	context.restore();
	
	// extract modified pixels from canvas
	let finalImgData = context.getImageData(0, 0, image.width, image.height);
	
	// compress back to WebP
	let outBuf = await webp.encode(finalImgData, { quality: 75 });
	
	// save final WebP to disk
	await fs.writeFile('my-new-image.webp', outBuf);
})();
```

# API

## load

The WebP WebAssembly code is automatically loaded from disk and compiled on the first call to [encode()](#encode) or [decode()](#decode).  However, if you want more control over this process, you can await `load()` at any time.  This will load both the encoder and decoder WASM modules, making them ready for use.  Example:

```js
await webp.load();
```

**Note:** This is an asynchronous function, so it needs to be awaited, or promised.  It also supports classic callbacks, if that's your thing.

## decode

The `decode()` function decodes a WebP file into pixels.  Specifically, it takes a [Buffer](https://nodejs.org/api/buffer.html) or [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer), and produces an [ImageData](https://developer.mozilla.org/en-US/docs/Web/API/ImageData) object, containing the RGBA pixels and image dimensions.  Example use:

```js
const webp = require('webp-wasm');
let imgData = await webp.decode(buffer);
```

The resulting object will have the following properties:

| Property Name | Type | Description |
|---------------|------|-------------|
| `data` | [Uint8ClampedArray](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8ClampedArray) | The raw image pixel array in RGBA format. |
| `width` | Number | The image width in pixels. |
| `height` | Number | The image height in pixels. |

**Note:** This is an asynchronous function, so it needs to be awaited, or promised.  It also supports classic callbacks, if that's your thing.

## encode

The `encode()` function encodes an image into WebP format.  Specifically, it takes an [ImageData](https://developer.mozilla.org/en-US/docs/Web/API/ImageData) object containing RGBA pixels and image dimensions, an object containing encoder options, and produces a WebP binary [Buffer](https://nodejs.org/api/buffer.html) suitable for writing to a `.webp` file.  Example:

```js
let buffer = await webp.encode(imgData, { quality: 75 });
```

The options object has the following defaults, which you can override selectively on each call:

| Property Name | Default Value | Description |
|---------------|---------------|-------------|
| `quality` | 100 | Image quality, between 0 and 100. For lossy, 0 gives the smallest size and 100 the largest. For lossless, this parameter is the amount of effort put into the compression: 0 is the fastest but gives larger files compared to the slowest, but best, 100. |
| `target_size` | 0 | If non-zero, set the desired target size in bytes. |
| `target_PSNR` | 0 | If non-zero, specifies the minimal distortion to try to achieve. Takes precedence over target_size. |
| `method` | 4 | Quality/speed trade-off (0 = fast, 6 = slower-better). |
| `sns_strength` | 50 | Spatial Noise Shaping. 0 = off, 100 = maximum. |
| `filter_strength` | 60 | Range: 0 = off, 100 = strongest. |
| `filter_sharpness` | 0 | Range: 0 = off, 7 = least sharp. |
| `filter_type` | 1 | Filtering type: 0 = simple, 1 = strong (only used if filter_strength > 0 or autofilter > 0). |
| `partitions` | 0 | log2(number of token partitions) in 0..3.  Default is set to 0 for easier progressive decoding. |
| `segments` | 4 | Maximum number of segments to use, in 1..4. |
| `pass` | 1 | Number of entropy-analysis passes (in 1..10). |
| `show_compressed` | 0 | If true, export the compressed picture back.  In-loop filtering is not applied. |
| `preprocessing` | 0 | Preprocessing filter (0 = none, 1 = segment-smooth). |
| `autofilter` | 0 | Auto adjust filter's strength (0 = off, 1 = on). |
| `partition_limit` | 0 | Quality degradation allowed to fit the 512k limit on prediction modes coding (0 = no degradation, 100 = maximum possible degradation). |
| `alpha_compression` | 1 | Algorithm for encoding the alpha plane (0 = none, 1 = compressed with WebP lossless). |
| `alpha_filtering` | 1 | Predictive filtering method for alpha plane (0 = none, 1 = fast, 2 = best). |
| `alpha_quality` | 100 | Between 0 (smallest size) and 100 (lossless). |
| `lossless` | 0 | Set to 1 for lossless encoding (default is lossy). |
| `exact` | 0 | By default, RGB values in transparent areas will be modified to improve compression.  Set `exact` to 1 to prevent this. |
| `image_hint` | 0 | Hint for image type (lossless only for now). |
| `emulate_jpeg_size` | 0 | If true, compression parameters will be remapped to better match the expected output size from JPEG compression. Generally, the output size will be similar but the degradation will be lower. |
| `thread_level` | 0 | If non-zero, try and use multi-threaded encoding. |
| `low_memory` | 0 | Reduce memory usage (slower encoding). |
| `near_lossless` | 100 | Near lossless encoding (0 = max loss, 100 = off). |
| `use_delta_palette` | 0 | Reserved for future lossless feature. |
| `use_sharp_yuv` | 0 | If needed, use sharp (and slow) RGB->YUV conversion. |

**Note:** This is an asynchronous function, so it needs to be awaited, or promised.  It also supports classic callbacks, if that's your thing.

# Caveats

Unfortunately, the [Squoosh WebP decoder](https://github.com/GoogleChromeLabs/squoosh/blob/dev/codecs/webp/dec/webp_dec.cpp#L20-L23) requires a global [ImageData](https://developer.mozilla.org/en-US/docs/Web/API/ImageData) object definition, as it was originally written for use in browsers.  Since Node.js doesn't provide one of these, we automatically polyfill one for you:

```js
class ImageData {
	constructor(data, width, height) {
		this.data = data;
		this.width = width;
		this.height = height;
	}
}
if (!("ImageData" in global)) global.ImageData = ImageData;
```

This class **must** exist in the `global` object, but we only add it if it doesn't already exist (i.e. futureproofing -- one day Node.js may add this natively).

# Development

To install webp-wasm for development, run these commands:

```
git clone https://github.com/jhuckaby/webp-wasm.git
cd webp-wasm
npm install
```

To pull down the latest WebP WebAssembly code from Squoosh, run the build script:

```
npm run build
```

# License

Apache 2.0 licensed.  See the [LICENSE](LICENSE) file in this repository.

Also see the [Squoosh license](https://github.com/GoogleChromeLabs/squoosh/blob/dev/LICENSE) (also Apache 2.0).
