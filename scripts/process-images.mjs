import { access, mkdir, readdir, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const SUPPORTED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic"]);
const DEFAULT_INPUT = path.join(os.homedir(), "Documents", "wedding", "trad");
const MAX_WIDTH = 3200;
const MAX_FILE_SIZE = 18 * 1024 * 1024;
const QUALITY_STEPS = [90, 85, 80, 75];
const CONCURRENCY = 3;

function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function parseArguments() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const positional = args.filter((argument) => argument !== "--force");

  if (positional.length > 1) {
    throw new Error("Usage: npm run media:process-images -- [input-folder] [--force]");
  }

  const input = path.resolve(positional[0] ?? DEFAULT_INPUT);
  const output = path.join(path.dirname(input), `${path.basename(input)}-optimized`);

  return { force, input, output };
}

async function collectImages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectImages(entryPath)));
    } else if (entry.isFile() && SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(entryPath);
    }
  }

  return files;
}

async function outputExists(outputPath) {
  try {
    await access(outputPath);
    return true;
  } catch {
    return false;
  }
}

async function optimizeImage(inputPath, outputPath, force) {
  if (!force && (await outputExists(outputPath))) {
    return { status: "skipped", inputPath, outputPath };
  }

  await mkdir(path.dirname(outputPath), { recursive: true });

  let outputSize = 0;
  let quality = QUALITY_STEPS[0];

  for (quality of QUALITY_STEPS) {
    await sharp(inputPath, { failOn: "error" })
      .rotate()
      .resize({
        width: MAX_WIDTH,
        height: MAX_WIDTH,
        fit: "inside",
        withoutEnlargement: true,
      })
      .flatten({ background: "#ffffff" })
      .toColourspace("srgb")
      .jpeg({
        quality,
        progressive: true,
        mozjpeg: true,
        chromaSubsampling: "4:4:4",
      })
      .toFile(outputPath);

    outputSize = (await stat(outputPath)).size;
    if (outputSize <= MAX_FILE_SIZE) break;
  }

  if (outputSize > MAX_FILE_SIZE) {
    throw new Error(
      `Could not reduce ${path.basename(inputPath)} below ${formatBytes(MAX_FILE_SIZE)}.`,
    );
  }

  const inputSize = (await stat(inputPath)).size;
  return { status: "processed", inputPath, outputPath, inputSize, outputSize, quality };
}

async function runWorkers(items, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function run() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, run));
  return results;
}

async function main() {
  const { force, input, output } = parseArguments();

  const inputStats = await stat(input).catch(() => null);
  if (!inputStats?.isDirectory()) {
    throw new Error(
      `Input folder does not exist: ${input}\nCopy the repository to the computer containing the photos, or provide the correct folder path.`,
    );
  }

  const images = await collectImages(input);
  if (images.length === 0) {
    throw new Error(`No supported images found in ${input}`);
  }

  console.log(`Input:  ${input}`);
  console.log(`Output: ${output}`);
  console.log(`Found ${images.length} image${images.length === 1 ? "" : "s"}.\n`);

  const results = await runWorkers(images, async (inputPath) => {
    const relativePath = path.relative(input, inputPath);
    const parsedPath = path.parse(relativePath);
    const outputPath = path.join(output, parsedPath.dir, `${parsedPath.name}.jpg`);
    const result = await optimizeImage(inputPath, outputPath, force);

    if (result.status === "skipped") {
      console.log(`Skipped:   ${relativePath}`);
    } else {
      console.log(
        `Processed: ${relativePath} (${formatBytes(result.inputSize)} → ${formatBytes(result.outputSize)}, quality ${result.quality})`,
      );
    }

    return result;
  });

  const processed = results.filter((result) => result.status === "processed");
  const skipped = results.filter((result) => result.status === "skipped");
  const originalBytes = processed.reduce((total, result) => total + result.inputSize, 0);
  const outputBytes = processed.reduce((total, result) => total + result.outputSize, 0);

  console.log("\nComplete.");
  console.log(`Processed: ${processed.length}`);
  console.log(`Skipped:   ${skipped.length}`);
  if (processed.length > 0) {
    console.log(`Size:      ${formatBytes(originalBytes)} → ${formatBytes(outputBytes)}`);
  }
  console.log(`Files are ready in: ${output}`);
}

main().catch((error) => {
  console.error(`\nImage processing failed: ${error.message}`);
  process.exitCode = 1;
});
