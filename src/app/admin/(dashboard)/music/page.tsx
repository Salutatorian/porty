import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { MusicAdminForm } from "@/components/admin/MusicAdminForm";
import { getAllMusicForAdmin } from "@/lib/content/music";

export default async function AdminMusicPage() {
  const tracks = await getAllMusicForAdmin();

  return (
    <div>
      <AdminPageHeader
        title="Music player"
        description="Upload audio, set metadata, and control the bottom music player."
      />
      <MusicAdminForm tracks={tracks} />
    </div>
  );
}
