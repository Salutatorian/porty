import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BlogAdminForm } from "@/components/admin/BlogAdminForm";

export default function AdminBlogsPage() {
  return (
    <div>
      <AdminPageHeader
        title="Blogs"
        description="Write and publish blog posts for the public site."
      />
      <BlogAdminForm />
    </div>
  );
}
