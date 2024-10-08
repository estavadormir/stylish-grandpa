import sharp, { type FormatEnum } from "sharp";
import fs from "fs-extra";
import path from "path";

interface ImageOptions {
  width?: number;
  height?: number;
}

const MAX_FILE_SIZE_KB = 100; // Target size in KB

const compressImage = async (
  imagePath: string,
  outputPath: string,
  options: { format: keyof FormatEnum; quality: number }
): Promise<void> => {
  await sharp(imagePath)
    .toFormat(options.format, { quality: options.quality })
    .toFile(outputPath);

  const stats = await fs.stat(outputPath);
  if (stats.size / 1024 > MAX_FILE_SIZE_KB && options.quality > 10) {
    // Reduce the quality and try again if the image is too big
    options.quality -= 10;
    await compressImage(imagePath, outputPath, options);
  }
};

const optimizeAndConvertImage = async (
  imagePath: string,
  outputDir: string,
  options: ImageOptions = {}
): Promise<void> => {
  const ext = path.extname(imagePath);
  const baseName = path.basename(imagePath, ext);

  // Ensure output directory exists
  await fs.ensureDir(outputDir);

  // 1. Original format compressed
  const originalOutputFileName = `${baseName}${ext}`;
  const originalFullSizePath = path.join(outputDir, originalOutputFileName);
  await compressImage(imagePath, originalFullSizePath, {
    format: ext.substring(1) as keyof FormatEnum,
    quality: 80,
  });

  // 2. Original format mobile version
  if (options.width || options.height) {
    const originalMobileSizePath = path.join(
      outputDir,
      `${baseName}-mobile${ext}`
    );
    const originalMobileInstance = sharp(imagePath).resize(
      options.width,
      options.height
    );
    await compressImage(imagePath, originalMobileSizePath, {
      format: ext.substring(1) as keyof FormatEnum,
      quality: 80,
    });
  }

  // 3. WebP version
  const webpOutputFileName = `${baseName}.webp`;
  const webpFullSizePath = path.join(outputDir, webpOutputFileName);
  await compressImage(imagePath, webpFullSizePath, {
    format: "webp",
    quality: 80,
  });

  // 4. WebP mobile version
  if (options.width || options.height) {
    const webpMobileSizePath = path.join(outputDir, `${baseName}-mobile.webp`);
    await compressImage(imagePath, webpMobileSizePath, {
      format: "webp",
      quality: 80,
    });
  }
};

const getAllImageFiles = async (
  dirPath: string,
  imageFiles: string[] = []
): Promise<string[]> => {
  const fileNames = await fs.readdir(dirPath);

  for (const fileName of fileNames) {
    const filePath = path.join(dirPath, fileName);
    const stat = await fs.stat(filePath);

    if (stat.isDirectory()) {
      await getAllImageFiles(filePath, imageFiles);
    } else if (/\.(png|jpe?g|webp)$/i.test(fileName)) {
      imageFiles.push(filePath);
    }
  }

  return imageFiles;
};

export const processImages = async (folderPath: string): Promise<number> => {
  const imageFiles = await getAllImageFiles(folderPath);

  if (imageFiles.length === 0) {
    return 0; // No images to process
  }

  // Create an output directory
  const outputDir = path.join(folderPath, "optimized");
  await fs.ensureDir(outputDir);

  for (const imageFile of imageFiles) {
    await optimizeAndConvertImage(imageFile, outputDir, { width: 800 });
  }

  return imageFiles.length;
};
