import { selectFolder } from "./cli";
import { processImages } from "./imageProcessor";
import ora from "ora";

const main = async (): Promise<void> => {
  displayWelcomeMessage();

  try {
    const folderPath = await selectFolder();

    if (!folderPath) {
      console.log(
        "Oups, sorry that you didn't like us enough to make your images smaller."
      );
      return;
    }

    const spinner = ora("Optimizing images...").start();

    const imagesProcessed = await processImages(folderPath);

    if (imagesProcessed > 0) {
      spinner.succeed("All images have been optimized!");
    } else {
      spinner.fail("No images found in the selected folder! ❌");
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
};

const displayWelcomeMessage = (): void => {
  console.log(`
    ⛱️  Welcome to the Image Optimizer CLI!  ⛱️
    -----------------------------------------
        Let's make your images faster and smaller!
  `);
};

main();
