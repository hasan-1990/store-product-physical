import { Headphones } from 'lucide-react';

export function SupportFab() {
  return (
    <button
      type="button"
      aria-label="پشتیبانی"
      className="fixed bottom-8 left-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-on-surface text-white shadow-2xl transition-transform hover:scale-110 active:scale-95 md:bottom-12 md:left-12"
    >
      <Headphones className="h-6 w-6" strokeWidth={1.5} />
    </button>
  );
}
