type PageHeaderProps = {
  title: string;
  description?: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header>
      <h1 className="page-title">{title}</h1>
      {description && <p className="mt-2 text-base text-on-surface-variant">{description}</p>}
    </header>
  );
}
