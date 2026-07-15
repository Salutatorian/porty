import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin/auth";
import { deletePhotoRecord } from "@/lib/admin/portfolio-storage";

async function handleDelete(id: string) {
  await deletePhotoRecord(id);
  revalidatePath("/media");
  revalidatePath("/admin/photos");
  return NextResponse.json({ id });
}

export async function DELETE(request: Request) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    return await handleDelete(id);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete photo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const id = body.id?.trim();
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    return await handleDelete(id);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete photo";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
