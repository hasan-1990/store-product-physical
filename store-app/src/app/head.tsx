export default function HeadRoot() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
  return (
    <>
      <link rel="canonical" href={base.replace(/\/$/, '') + '/'} />
    </>
  );
}
