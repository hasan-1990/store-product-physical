import type { LucideIcon } from 'lucide-react';

type FilterSectionProps = {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
};

export function FilterSection({ icon: Icon, title, children }: FilterSectionProps) {
  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center gap-2 text-primary">
        <Icon className="h-5 w-5" />
        <h4 className="filter-label">{title}</h4>
      </div>
      {children}
    </section>
  );
}
