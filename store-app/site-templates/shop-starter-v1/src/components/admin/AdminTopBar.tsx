import { Bell, Search } from 'lucide-react';

type AdminTopBarProps = {
  adminName: string;
};

export function AdminTopBar({ adminName }: AdminTopBarProps) {
  const firstName = adminName.split(' ')[0] || adminName;

  return (
    <header className="mb-10 flex items-center justify-between">
      <div>
        <h1 className="font-display text-2xl text-on-surface md:text-[32px] md:leading-10">
          خوش آمدید، {firstName}
        </h1>
        <p className="text-sm text-on-surface-variant">مروری بر وضعیت امروز فروشگاه</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" strokeWidth={1.5} />
          <input
            type="search"
            placeholder="جستجو..."
            className="w-64 rounded-lg border-none bg-surface-container-low py-2 pl-4 pr-10 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>
        <button
          type="button"
          aria-label="اعلان‌ها"
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-on-surface-variant"
        >
          <Bell className="h-5 w-5" strokeWidth={1.5} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-600" />
        </button>
      </div>
    </header>
  );
}
