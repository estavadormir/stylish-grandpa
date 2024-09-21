import sharp from "sharp";
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
  options: sharp.WebpOptions
): Promise<void> => {
  await sharp(imagePath).toFormat("webp", options).toFile(outputPath);

  const stats = await fs.stat(outputPath);
  if (
    stats.size / 1024 > MAX_FILE_SIZE_KB &&
    options.quality &&
    options.quality > 10
  ) {
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

  const outputFileName = `${baseName}.webp`;
  const fullSizePath = path.join(outputDir, outputFileName);

  await fs.ensureDir(outputDir);

  const initialOptions: sharp.WebpOptions = { quality: 80 };
  await compressImage(imagePath, fullSizePath, initialOptions);

  // Mobile version
  if (options.width || options.height) {
    const mobileInstance = sharp(imagePath).resize(
      options.width,
      options.height
    );
    const mobileSizePath = path.join(outputDir, `${baseName}-mobile.webp`);

    await compressImage(imagePath, mobileSizePath, { quality: 80 });
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
