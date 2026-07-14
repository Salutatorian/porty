import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { getAdminDashboardData } from "@/lib/admin/dashboard";

const quickActions = [
  { label: "New project", href: "/admin/projects" },
  { label: "Upload photo", href: "/admin/photos" },
  { label: "New blog post", href: "/admin/blogs" },
  { label: "Upload music", href: "/admin/music" },
];

function formatRelativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AdminOverviewPage() {
  let stats = {
    projects: 0,
    photos: 0,
    blogPosts: 0,
  };
  let activity: Awaited<ReturnType<typeof getAdminDashboardData>>["activity"] =
    [];

  try {
    const data = await getAdminDashboardData();
    stats = data.stats;
    activity = data.activity;
  } catch {
    // Dashboard still renders with empty data if Supabase is unavailable.
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Overview"
        description="Manage projects, photos, blogs, and music for The Greater Engine."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard label="Published projects" value={stats.projects} />
        <AdminStatCard label="Photos" value={stats.photos} />
        <AdminStatCard label="Blog posts" value={stats.blogPosts} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-[12px] border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#161616]">
          <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <h2 className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
              Recent activity
            </h2>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {activity.length === 0 ? (
              <p className="px-4 py-8 text-[13px] text-neutral-500">
                No recent edits yet.
              </p>
            ) : (
              activity.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-1 px-4 py-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:gap-4"
                >
                  <p className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
                    {item.title}
                  </p>
                  <p className="text-[12px] text-neutral-500">{item.type}</p>
                  <p className="text-[12px] tabular-nums text-neutral-400">
                    {formatRelativeTime(item.updatedAt)}
                  </p>
                  <p className="text-[12px] text-neutral-500">{item.status}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[12px] border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#161616]">
          <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <h2 className="text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
              Quick actions
            </h2>
          </div>
          <div className="flex flex-col gap-1 p-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-[7px] px-3 py-2 text-[13px] text-neutral-600 transition hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800/80"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
