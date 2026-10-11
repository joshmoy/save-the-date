import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getCloudinaryImageFolder, getMediaCategory } from "../../../../src/data/mediaCategories";
import { canAccessRole, getCurrentSession } from "../../../../src/lib/auth";

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
    );
  }

  return { cloudName, apiKey, apiSecret };
}

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session || !canAccessRole(session, ["super_admin"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { category?: string } | null;
  const category = body?.category ? getMediaCategory(body.category) : undefined;

  if (!category?.hasPhotos) {
    return NextResponse.json({ error: "Select a valid photo category." }, { status: 400 });
  }

  try {
    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000);
    const assetFolder = getCloudinaryImageFolder(category.slug);
    const signedParameters = {
      asset_folder: assetFolder,
      timestamp,
      unique_filename: "true",
      use_filename: "true",
    };
    const parameterString = Object.entries(signedParameters)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
    const signature = crypto
      .createHash("sha1")
      .update(`${parameterString}${apiSecret}`)
      .digest("hex");

    return NextResponse.json({
      cloudName,
      apiKey,
      signature,
      ...signedParameters,
    });
  } catch (error) {
    console.error("Unable to create Cloudinary upload signature:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to configure image upload." },
      { status: 500 },
    );
  }
}
