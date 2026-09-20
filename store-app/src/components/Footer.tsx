import FooterClient from './FooterClient';

// Server Component - فوتر ساده بدون نیاز به دیتابیس
export default async function FooterServer() {
  return (
    <div className="w-full">
      <FooterClient />
    </div>
  );
}
