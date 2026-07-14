import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { MusicAdminUpload } from "@/components/admin/MusicAdminUpload";

export default function AdminMusicPage() {
  return (
    <div>
      <AdminPageHeader
        title="Music player"
        description="Upload audio, set metadata, and control the bottom music player."
      />
      <MusicAdminUpload />
    </div>
  );
}
