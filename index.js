// WebP Encoder and Decoder Library
// Copyright (c) 2023 Joseph Huckaby
// Released under the Apache-2.0 License

const Path = require('path');
const fs = require('fs');
const util = require('util');

var webp = {
	enc: require('./webp_node_enc.js'),
	dec: require('./webp_node_dec.js')
};

var encoder = null;
var decoder = null;

// we need ImageData in global for the WASM decoder to work
class ImageData {
	constructor(data, width, height) {
		this.data = data;
		this.width = width;
		this.height = height;
	}
}
if (!("ImageData" in global)) global.ImageData = ImageData;

// set defaults for encode -- override on call to encode()
const DEFAULT_ENCODE_OPTS = {
	quality: 100,
	target_size: 0,
	target_PSNR: 0,
	method: 4,
	sns_strength: 50,
	filter_strength: 60,
	filter_sharpness: 0,
	filter_type: 1,
	partitions: 0,
	segments: 4,
	pass: 1,
	show_compressed: 0,
	preprocessing: 0,
	autofilter: 0,
	partition_limit: 0,
	alpha_compression: 1,
	alpha_filtering: 1,
	alpha_quality: 100,
	lossless: 0,
	exact: 0,
	image_hint: 0,
	emulate_jpeg_size: 0,
	thread_level: 0,
	low_memory: 0,
	near_lossless: 100,
	use_delta_palette: 0,
	use_sharp_yuv: 0
};

module.exports = {
	
	load(callback) {
		// dynamically load and compile webassembly modules
		var self = this;
		this.loadEncoder( function(err) {
			if (err) return callback(err);
			self.loadDecoder( callback );
		} );
	},
	
	loadEncoder(callback) {
		// load and compile encoder wasm
		if (encoder) return callback();
		
		fs.readFile( Path.join(__dirname, 'webp_node_enc.wasm'), function(err, buf) {
			if (err) return callback(err);
			
			webp.enc({ wasmBinary: buf }).then( function(module) {
				encoder = module;
				callback();
			}); // promise
		} ); // fs.readFile
	},
	
	loadDecoder(callback) {
		// load and compile decoder wasm
		if (decoder) return callback();
		
		fs.readFile( Path.join(__dirname, 'webp_node_dec.wasm'), function(err, buf) {
			if (err) return callback(err);
			
			webp.dec({ wasmBinary: buf }).then( function(module) {
				decoder = module;
				callback();
			}); // promise
		} ); // fs.readFile
	},
	
	decode(buffer = null, callback = null) {
		// decode WebP binary buffer to pixel array
		// accepts Buffer or ArrayBuffer
		// returns ImageData: { data(Uint8ClampedArray), width, height } 
		var self = this;
		
		if (!decoder) {
			// need to dynamically load decoder first
			this.loadDecoder( function(err) {
				if (err) return callback(err);
				self.decode(buffer, callback);
			} );
			return;
		}
		
		var imgData = null;
		try { imgData = decoder.decode( buffer.buffer || buffer ); }
		catch (err) { return callback(err); }
		
		callback( null, imgData );
	},
	
	encode(imgData = null, userOpts = {}, callback = null) {
		// encode pixel array to WebP binary buffer
		// returns Node.js Buffer
		var self = this;
		
		if (!encoder) {
			// need to dynamically load encoder first
			this.loadEncoder( function(err) {
				if (err) return callback(err);
				self.encode(imgData, userOpts, callback);
			} );
			return;
		}
		
		var opts = Object.assign( {}, DEFAULT_ENCODE_OPTS, userOpts );
		var result = null;
		
		try { result = encoder.encode( imgData.data, imgData.width, imgData.height, opts ); }
		catch (err) { return callback(err); }
		
		callback( null, Buffer.from(result.buffer) );
	}
	
};

module.exports.load = util.promisify( module.exports.load );
module.exports.decode = util.promisify( module.exports.decode );
module.exports.encode = util.promisify( module.exports.encode );
