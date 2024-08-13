import fs from "fs-extra";
import path from "path";
const { prompt } = require("enquirer");

const ROOT_DIRECTORY = "/";

async function listDirectories(
  dir: string
): Promise<Array<{ name: string; value: string }>> {
  const files = await fs.readdir(dir);
  const directories = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    try {
      const stats = await fs.stat(fullPath);
      if (stats.isDirectory()) {
        directories.push({ name: file, value: fullPath });
      }
    } catch (error) {
      // Skip files that can't be accessed
    }
  }

  return directories;
}

export async function selectFolder(): Promise<string | null> {
  let currentDir = ROOT_DIRECTORY;

  while (true) {
    const directories = await listDirectories(currentDir);
    if (currentDir !== ROOT_DIRECTORY) {
      directories.unshift({ name: "Back", value: "##BACK##" });
    }
    directories.push({ name: "Confirm Selection", value: "##CONFIRM##" });

    const response = await prompt({
      type: "select",
      name: "folderPath",
      message: `Current Directory: ${currentDir}`,
      choices: directories,
    });

    // Handle special cases
    if (response.folderPath === "Confirm Selection") {
      return currentDir;
    } else if (response.folderPath === "Back") {
      currentDir = path.dirname(currentDir);
      continue;
    }

    let selectedPath = response.folderPath;

    // Ensure selected path is absolute
    if (!path.isAbsolute(selectedPath)) {
      selectedPath = path.resolve(currentDir, selectedPath);
    }

    try {
      const stats = await fs.stat(selectedPath);
      if (stats.isDirectory()) {
        currentDir = selectedPath;
      } else {
        console.error(`Selected path is not a directory: ${selectedPath}`);
      }
    } catch (error) {
      console.error(
        `Unable to access selected path: ${selectedPath}, error: ${error}`
      );
    }
  }
}
