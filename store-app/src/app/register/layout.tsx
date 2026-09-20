import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ثبت‌نام - فروشگاه هاب",
  description: "ثبت‌نام در فروشگاه هاب",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}