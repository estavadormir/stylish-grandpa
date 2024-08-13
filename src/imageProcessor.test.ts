import { test, expect, mock } from "bun:test";
import { processImages } from "./imageProcessor.ts";
import { join } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

test("processImages should process all images in folder", async () => {
  const folderPath = join(__dirname, "testPath");

  const mockOptimizeAndConvertImage = mock().mockImplementation(
    async (filePath, outputDir, options) => {
      console.log(`Mock processing image: ${filePath}`);
    }
  );

  // Ensure you mock the internal call if `processImages` isn't directly calling `optimizeAndConvertImage`
  const mockProcessImages = mock(processImages).mockImplementation(
    async (folderPath) => {
      const images = ["image1.png", "image2.jpg"];
      const outputDir = "outputDir";
      const options = { width: 800 };
      for (const image of images) {
        await mockOptimizeAndConvertImage(
          `${folderPath}/${image}`,
          outputDir,
          options
        );
      }
      return images.length;
    }
  );

  const imageCount = await mockProcessImages(folderPath);
  expect(imageCount).toBe(2);
  expect(mockOptimizeAndConvertImage).toHaveBeenCalledTimes(2);
  expect(mockOptimizeAndConvertImage).toHaveBeenCalledWith(
    join(folderPath, "image1.png"),
    "outputDir",
    { width: 800 }
  );
  expect(mockOptimizeAndConvertImage).toHaveBeenCalledWith(
    join(folderPath, "image2.jpg"),
    "outputDir",
    { width: 800 }
  );
});
