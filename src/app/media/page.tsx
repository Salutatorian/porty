import { MediaPageContent } from "@/components/media/MediaPageContent";
import { getPublishedPhotos } from "@/lib/content/media";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const photos = await getPublishedPhotos();
  return <MediaPageContent photos={photos} />;
}
