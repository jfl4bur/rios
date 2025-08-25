const fs = require('fs');
const path = require('path');

let sharpImpl = null;
try {
  sharpImpl = require('sharp');
} catch (e) {
  // sharp not available (Windows/CI build issues) — we will fallback to no-op implementations
  sharpImpl = null;
}

module.exports = {
  isAvailable: () => !!sharpImpl,
  // returns metadata or null
  metadata: async (input) => {
    if (!sharpImpl) return null;
    try {
      const img = sharpImpl(input);
      return await img.metadata();
    } catch (e) { return null; }
  },
  // process image: returns path of processed file or null if not processed
  processToFile: async (inputBufferOrPath, outPath, options) => {
    if (!sharpImpl) return null;
    try {
      const img = Buffer.isBuffer(inputBufferOrPath) ? sharpImpl(inputBufferOrPath) : sharpImpl(inputBufferOrPath);
      let pipeline = img;
      if (options && options.resize && options.resize.width) pipeline = pipeline.resize(options.resize.width);
      const fmt = options && options.format ? options.format : null;
      if (fmt === 'png') await pipeline.png({ quality: options.quality || 80 }).toFile(outPath);
      else if (fmt === 'webp') await pipeline.webp({ quality: options.quality || 80 }).toFile(outPath);
      else await pipeline.jpeg({ quality: options.quality || 80 }).toFile(outPath);
      return outPath;
    } catch (e) { return null; }
  },
  // generate thumbnail at width and return path or null
  generateThumbnail: async (sourcePath, thumbPath, width) => {
    if (!sharpImpl) return null;
    try {
      await sharpImpl(sourcePath).resize({ width: width || 300 }).jpeg({ quality: 70 }).toFile(thumbPath);
      return thumbPath;
    } catch (e) { return null; }
  }
};
