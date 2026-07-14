import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PhotoAdminForm } from "@/components/admin/PhotoAdminForm";
import { getAllPhotosForAdmin } from "@/lib/content/media";

export const dynamic = "force-dynamic";

export default async function AdminPhotosPage() {
  let photos: Awaited<ReturnType<typeof getAllPhotosForAdmin>> = [];

  try {
    photos = await getAllPhotosForAdmin();
  } catch {
    photos = [];
  }

  return (
    <div>
      <AdminPageHeader
        title="Photos"
        description="Upload images and manage photo metadata for the public gallery."
      />
      <PhotoAdminForm photos={photos} />
    </div>
  );
}
