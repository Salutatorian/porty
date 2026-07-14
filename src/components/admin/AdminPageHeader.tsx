type AdminPageHeaderProps = {
  title: string;
  description?: string;
};

export function AdminPageHeader({ title, description }: AdminPageHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-[20px] font-medium tracking-tight text-neutral-900 dark:text-neutral-100">
        {title}
      </h1>
      {description ? (
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-neutral-500">
          {description}
        </p>
      ) : null}
    </div>
  );
}
