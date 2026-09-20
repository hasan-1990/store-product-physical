import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ورود - فروشگاه هاب",
  description: "ورود به حساب کاربری فروشگاه هاب",
};

export default function AuthLayout({
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