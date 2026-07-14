import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin/auth";
import {
  createPortfolioSignedUpload,
  type PortfolioUploadFolder,
} from "@/lib/admin/portfolio-storage";

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    fileName?: string;
    fileSize?: number;
    folder?: PortfolioUploadFolder;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { fileName, fileSize, folder } = body;

  if (!fileName || !folder || fileSize == null) {
    return NextResponse.json(
      { error: "fileName, fileSize, and folder are required" },
      { status: 400 },
    );
  }

  if (folder !== "photos" && folder !== "music") {
    return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
  }

  try {
    const result = await createPortfolioSignedUpload({
      fileName,
      fileSize,
      folder,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to prepare upload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
