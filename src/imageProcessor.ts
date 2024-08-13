import sharp from "sharp";
import fs from "fs-extra";
import path from "path";

interface ImageOptions {
  width?: number;
  height?: number;
}

async function optimizeAndConvertImage(
  imagePath: string,
  outputDir: string,
  options: ImageOptions = {}
): Promise<void> {
  const ext = path.extname(imagePath);
  const baseName = path.basename(imagePath, ext);

  const fullSizePath = path.join(outputDir, baseName);
  const mobileSizePath = path.join(outputDir, `${baseName}-mobile`);

  // Create output directories if they don't exist
  await fs.ensureDir(fullSizePath);
  await fs.ensureDir(mobileSizePath);

  const sharpInstance = sharp(imagePath);

  // Original and webp conversion
  await sharpInstance.toFile(path.join(fullSizePath, `${baseName}${ext}`));
  await sharpInstance
    .toFormat("webp")
    .toFile(path.join(fullSizePath, `${baseName}.webp`));

  // Mobile version
  if (options.width || options.height) {
    const mobileInstance = sharp(imagePath).resize(
      options.width,
      options.height
    );

    await mobileInstance.toFile(path.join(mobileSizePath, `${baseName}${ext}`));
    await mobileInstance
      .toFormat("webp")
      .toFile(path.join(mobileSizePath, `${baseName}.webp`));
  }
}

async function getAllImageFiles(
  dirPath: string,
  imageFiles: string[] = []
): Promise<string[]> {
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
}

export async function processImages(folderPath: string): Promise<number> {
  const imageFiles = await getAllImageFiles(folderPath);

  if (imageFiles.length === 0) {
    return 0; // No images to process
  }

  for (const imageFile of imageFiles) {
    await optimizeAndConvertImage(imageFile, path.dirname(imageFile), {
      width: 800,
    });
  }

  return imageFiles.length;
}
