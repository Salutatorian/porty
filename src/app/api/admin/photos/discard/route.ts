import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin/auth";
import { deletePortfolioStoragePath } from "@/lib/admin/portfolio-storage";

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { storagePath?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const storagePath = body.storagePath?.trim();
  if (!storagePath) {
    return NextResponse.json(
      { error: "storagePath is required" },
      { status: 400 },
    );
  }

  if (!storagePath.startsWith("photos/")) {
    return NextResponse.json({ error: "Invalid storage path" }, { status: 400 });
  }

  try {
    await deletePortfolioStoragePath(storagePath);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to discard upload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
