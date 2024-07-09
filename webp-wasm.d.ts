// webp-wasm.d.ts

declare module "webp-wasm" {
    // Define the ImageData class
    class ImageData {
        constructor(data: Uint8ClampedArray, width: number, height: number);
        data: Uint8ClampedArray;
        width: number;
        height: number;
    }

    // Define the encode options interface
    interface EncodeOptions {
        quality?: number;
        target_size?: number;
        target_PSNR?: number;
        method?: number;
        sns_strength?: number;
        filter_strength?: number;
        filter_sharpness?: number;
        filter_type?: number;
        partitions?: number;
        segments?: number;
        pass?: number;
        show_compressed?: number;
        preprocessing?: number;
        autofilter?: number;
        partition_limit?: number;
        alpha_compression?: number;
        alpha_filtering?: number;
        alpha_quality?: number;
        lossless?: number;
        exact?: number;
        image_hint?: number;
        emulate_jpeg_size?: number;
        thread_level?: number;
        low_memory?: number;
        near_lossless?: number;
        use_delta_palette?: number;
        use_sharp_yuv?: number;
    }

    // Define the load function
    export function load(): Promise<void>;

    // Define the decode function
    export function decode(buffer: Buffer | ArrayBuffer): Promise<ImageData>;

    // Define the encode function
    export function encode(imageData: ImageData, options?: EncodeOptions): Promise<Buffer>;
	
	// For users who prefer callback-style:
	export function load(callback: (err: Error | null) => void): void;
	export function decode(buffer: Buffer | ArrayBuffer, callback: (err: Error | null, imgData: ImageData) => void): void;
	export function encode(imgData: ImageData, options: EncodeOptions, callback: (err: Error | null, buffer: Buffer) => void): void;
}