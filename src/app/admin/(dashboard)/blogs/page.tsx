import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BlogAdminForm } from "@/components/admin/BlogAdminForm";
import { getAllBlogsForAdmin } from "@/lib/content/blogs";

export default async function AdminBlogsPage() {
  const posts = await getAllBlogsForAdmin();

  return (
    <div>
      <AdminPageHeader
        title="Blogs"
        description="Write, edit, and publish blog posts for the public site."
      />
      <BlogAdminForm posts={posts} />
    </div>
  );
}
