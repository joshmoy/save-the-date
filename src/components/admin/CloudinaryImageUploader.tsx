"use client";

import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Progress,
  Stack,
  Text,
} from "@chakra-ui/react";
import { CheckCircle2, FolderOpen, ImageUp, ShieldCheck, TriangleAlert } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import {
  getCloudinaryImageFolder,
  mediaCategories,
  type MediaCategorySlug,
} from "../../data/mediaCategories";

const MAX_DIMENSION = 3200;
const MAX_OUTPUT_BYTES = 18 * 1024 * 1024;
const JPEG_QUALITIES = [0.9, 0.85, 0.8, 0.75];
const SUPPORTED_FILE_PATTERN = /\.(jpe?g|png|webp)$/i;

type UploadStatus = "queued" | "processing" | "uploading" | "complete" | "error";

type UploadItem = {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  outputBytes?: number;
  error?: string;
};

type SignatureResponse = {
  cloudName: string;
  apiKey: string;
  signature: string;
  asset_folder: string;
  timestamp: number;
  unique_filename: string;
  use_filename: string;
  error?: string;
};

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("The browser could not create an optimized JPEG."));
      },
      "image/jpeg",
      quality,
    );
  });
}

async function optimizeImage(file: File) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });

  if (!context) {
    bitmap.close();
    throw new Error("Your browser does not support image processing.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let blob = await canvasToBlob(canvas, JPEG_QUALITIES[0]);
  for (const quality of JPEG_QUALITIES.slice(1)) {
    if (blob.size <= MAX_OUTPUT_BYTES) break;
    blob = await canvasToBlob(canvas, quality);
  }

  canvas.width = 1;
  canvas.height = 1;

  if (blob.size > MAX_OUTPUT_BYTES) {
    throw new Error("The optimized image is still larger than 18 MB.");
  }

  return blob;
}

function uploadImage(
  blob: Blob,
  originalName: string,
  signature: SignatureResponse,
  onProgress: (progress: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`,
    );
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) {
        resolve();
        return;
      }

      try {
        const response = JSON.parse(request.responseText) as { error?: { message?: string } };
        reject(new Error(response.error?.message ?? "Cloudinary rejected the upload."));
      } catch {
        reject(new Error("Cloudinary rejected the upload."));
      }
    });
    request.addEventListener("error", () => reject(new Error("The upload connection failed.")));

    const formData = new FormData();
    const outputName = `${originalName.replace(/\.[^.]+$/, "")}.jpg`;
    formData.append("file", blob, outputName);
    formData.append("api_key", signature.apiKey);
    formData.append("signature", signature.signature);
    formData.append("timestamp", String(signature.timestamp));
    formData.append("asset_folder", signature.asset_folder);
    formData.append("unique_filename", signature.unique_filename);
    formData.append("use_filename", signature.use_filename);
    request.send(formData);
  });
}

export function CloudinaryImageUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<MediaCategorySlug>("traditional-marriage");
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [pageError, setPageError] = useState("");

  const totals = useMemo(
    () => ({
      complete: items.filter((item) => item.status === "complete").length,
      failed: items.filter((item) => item.status === "error").length,
    }),
    [items],
  );

  function updateItem(id: string, patch: Partial<UploadItem>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;

    const selected = Array.from(files)
      .filter((file) => SUPPORTED_FILE_PATTERN.test(file.name))
      .map((file) => ({
        id: `${file.webkitRelativePath || file.name}-${file.lastModified}-${file.size}`,
        file,
        status: "queued" as const,
        progress: 0,
      }));

    setPageError(
      selected.length === 0
        ? "No supported JPEG, PNG, or WebP images were found in that folder."
        : "",
    );
    setItems(selected);
  }

  async function handleUpload() {
    if (items.length === 0 || isUploading) return;

    setIsUploading(true);
    setPageError("");

    try {
      const response = await fetch("/api/media/cloudinary-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      });
      const signature = (await response.json()) as SignatureResponse;

      if (!response.ok) {
        throw new Error(signature.error ?? "Unable to authorize the Cloudinary upload.");
      }

      for (const item of items) {
        if (item.status === "complete") continue;

        try {
          updateItem(item.id, { status: "processing", progress: 0, error: undefined });
          const optimized = await optimizeImage(item.file);
          updateItem(item.id, {
            status: "uploading",
            outputBytes: optimized.size,
            progress: 0,
          });
          await uploadImage(optimized, item.file.name, signature, (progress) => {
            updateItem(item.id, { progress });
          });
          updateItem(item.id, { status: "complete", progress: 100 });
        } catch (error) {
          updateItem(item.id, {
            status: "error",
            error: error instanceof Error ? error.message : "Unable to process this image.",
          });
        }
      }
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to start the upload.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Box bg="gray.50" minH="calc(100vh - 73px)" py={{ base: 8, md: 12 }}>
      <Container maxW="1000px" mx="auto" px={6}>
        <Stack gap={8}>
          <Box>
            <Text textStyle="accent" color="roseWine" mb={2}>
              Media administration
            </Text>
            <Heading fontFamily="subheading" color="burgundy" fontSize={{ base: "3xl", md: "4xl" }}>
              Upload wedding photos
            </Heading>
            <Text color="gray.600" mt={2} maxW="680px">
              Select a local folder once. Your browser creates web-ready copies and uploads them
              directly to Cloudinary; the original files are never changed.
            </Text>
          </Box>

          <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" p={{ base: 5, md: 7 }}>
            <Stack gap={6}>
              <Box>
                <Text as="label" htmlFor="media-category" fontWeight="700" color="gray.800" display="block" mb={2}>
                  Wedding category
                </Text>
                <Box
                  as="select"
                  id="media-category"
                  value={category}
                  onChange={(event) => setCategory(event.currentTarget.value as MediaCategorySlug)}
                  disabled={isUploading}
                  w="full"
                  borderWidth="1px"
                  borderColor="gray.300"
                  borderRadius="md"
                  bg="white"
                  px={3}
                  py={3}
                  color="gray.800"
                >
                  {mediaCategories
                    .filter((item) => item.hasPhotos)
                    .map((item) => (
                      <option value={item.slug} key={item.slug}>
                        {item.title}
                      </option>
                    ))}
                </Box>
                <Text fontSize="sm" color="gray.500" mt={2}>
                  Cloudinary folder: {getCloudinaryImageFolder(category)}
                </Text>
              </Box>

              <Box
                borderWidth="2px"
                borderStyle="dashed"
                borderColor={items.length > 0 ? "oldRose" : "gray.300"}
                borderRadius="lg"
                px={6}
                py={10}
                textAlign="center"
                bg={items.length > 0 ? "cream" : "gray.50"}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(event) => handleFiles(event.target.files)}
                  disabled={isUploading}
                  style={{ display: "none" }}
                  {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
                />
                <FolderOpen size={36} color="#800020" aria-hidden="true" />
                <Heading fontFamily="subheading" fontSize="2xl" color="gray.800" mt={3}>
                  {items.length > 0
                    ? `${items.length} image${items.length === 1 ? "" : "s"} ready`
                    : "Choose an image folder"}
                </Heading>
                <Text color="gray.500" fontSize="sm" mt={1} mb={5}>
                  JPEG, PNG, or WebP · resized to 3200px · exported as JPEG
                </Text>
                <Button
                  type="button"
                  variant="outline"
                  color="burgundy"
                  borderColor="burgundy"
                  onClick={() => inputRef.current?.click()}
                  disabled={isUploading}
                >
                  <FolderOpen size={17} />
                  {items.length > 0 ? "Choose another folder" : "Select folder"}
                </Button>
              </Box>

              <Flex gap={3} align="center" color="gray.600" fontSize="sm">
                <ShieldCheck size={18} color="#2f855a" aria-hidden="true" />
                Originals stay on your device. Cloudinary credentials remain on the server.
              </Flex>

              {pageError ? (
                <Flex gap={2} align="center" color="red.600" fontSize="sm">
                  <TriangleAlert size={17} aria-hidden="true" />
                  <Text>{pageError}</Text>
                </Flex>
              ) : null}

              <Button
                type="button"
                bg="burgundy"
                color="white"
                _hover={{ bg: "cherryRose" }}
                size="lg"
                onClick={() => void handleUpload()}
                disabled={items.length === 0}
                loading={isUploading}
                loadingText="Processing and uploading"
              >
                <ImageUp size={18} />
                Upload {items.length || ""} image{items.length === 1 ? "" : "s"}
              </Button>
            </Stack>
          </Box>

          {items.length > 0 ? (
            <Box bg="white" borderWidth="1px" borderColor="gray.200" borderRadius="lg" overflow="hidden">
              <Flex justify="space-between" align="center" px={5} py={4} borderBottomWidth="1px" borderColor="gray.100">
                <Text fontWeight="700" color="gray.800">
                  Upload queue
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {totals.complete} complete
                  {totals.failed > 0 ? ` · ${totals.failed} failed` : ""}
                </Text>
              </Flex>
              <Stack gap={0}>
                {items.map((item) => (
                  <Box key={item.id} px={5} py={4} borderBottomWidth="1px" borderColor="gray.100" _last={{ borderBottomWidth: 0 }}>
                    <Flex justify="space-between" gap={4} align="start">
                      <Box minW={0}>
                        <Flex align="center" gap={2}>
                          {item.status === "complete" ? (
                            <CheckCircle2 size={16} color="#2f855a" aria-hidden="true" />
                          ) : item.status === "error" ? (
                            <TriangleAlert size={16} color="#c53030" aria-hidden="true" />
                          ) : null}
                          <Text fontSize="sm" fontWeight="600" color="gray.800" truncate>
                            {item.file.webkitRelativePath || item.file.name}
                          </Text>
                        </Flex>
                        {item.error ? (
                          <Text color="red.600" fontSize="xs" mt={1}>
                            {item.error}
                          </Text>
                        ) : null}
                      </Box>
                      <Text flexShrink={0} fontSize="xs" color="gray.500" textTransform="capitalize">
                        {item.status}
                        {item.outputBytes ? ` · ${formatBytes(item.outputBytes)}` : ""}
                      </Text>
                    </Flex>
                    {item.status === "uploading" ? (
                      <Progress.Root value={item.progress} size="xs" colorPalette="red" mt={3}>
                        <Progress.Track>
                          <Progress.Range />
                        </Progress.Track>
                      </Progress.Root>
                    ) : null}
                  </Box>
                ))}
              </Stack>
            </Box>
          ) : null}
        </Stack>
      </Container>
    </Box>
  );
}
