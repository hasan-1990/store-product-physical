export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatPrice(price: number): string {
  return `${price.toLocaleString('fa-IR')} تومان`;
}

const baseStyles = `
  :root { --bg:#faf9f7; --card:#fff; --text:#1a1a1a; --muted:#666; --accent:#8b5a2b; --border:#e8e4df; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: Tahoma, 'Segoe UI', sans-serif; background:var(--bg); color:var(--text); line-height:1.6; }
  a { color:inherit; text-decoration:none; }
  img { max-width:100%; display:block; }
  .wrap { max-width:1100px; margin:0 auto; padding:0 1rem; }
  header { background:var(--card); border-bottom:1px solid var(--border); position:sticky; top:0; z-index:10; }
  .header-inner { display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.9rem 0; }
  .brand { font-weight:700; font-size:1.25rem; }
  nav { display:flex; flex-wrap:wrap; gap:.75rem 1.25rem; font-size:.9rem; }
  nav a:hover { color:var(--accent); }
  .btn { display:inline-block; background:var(--accent); color:#fff; padding:.55rem 1.1rem; border-radius:6px; border:0; cursor:pointer; font:inherit; }
  .btn:hover { opacity:.92; }
  .btn-outline { background:transparent; color:var(--accent); border:1px solid var(--accent); }
  main { padding:1.5rem 0 3rem; }
  .hero { display:grid; grid-template-columns:1fr 1fr; gap:2rem; align-items:center; margin-bottom:2.5rem; }
  .hero h1 { font-size:2rem; margin:.25rem 0; }
  .eyebrow { color:var(--accent); font-size:.85rem; font-weight:600; }
  .muted { color:var(--muted); }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:1.25rem; }
  .card { background:var(--card); border:1px solid var(--border); border-radius:10px; overflow:hidden; }
  .card-body { padding:1rem; }
  .card h3 { margin:0 0 .35rem; font-size:1rem; }
  .price { font-weight:700; color:var(--accent); }
  .features { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:1rem; margin:2rem 0; }
  .feature { background:var(--card); border:1px solid var(--border); border-radius:8px; padding:1rem; }
  footer { border-top:1px solid var(--border); padding:1.5rem 0; text-align:center; color:var(--muted); font-size:.85rem; }
  .form { max-width:420px; margin:0 auto; }
  .form label { display:block; margin:.75rem 0 .25rem; font-size:.9rem; }
  .form input, .form textarea, .form select { width:100%; padding:.55rem .65rem; border:1px solid var(--border); border-radius:6px; font:inherit; }
  .cart-table { width:100%; border-collapse:collapse; }
  .cart-table th, .cart-table td { padding:.65rem; border-bottom:1px solid var(--border); text-align:right; }
  @media (max-width:768px) { .hero { grid-template-columns:1fr; } }
`;

type NavLink = { label: string; href: string };
type SiteInfo = { name: string; tagline?: string; description?: string };

export function layoutHtml(options: {
  title: string;
  site: SiteInfo;
  navLinks: NavLink[];
  body: string;
  extraHead?: string;
  extraScript?: string;
}): string {
  const nav = options.navLinks
    .map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(options.title)}</title>
  <style>${baseStyles}</style>
  ${options.extraHead ?? ''}
</head>
<body>
  <header><div class="wrap header-inner">
    <a class="brand" href="/">${esc(options.site.name)}</a>
    <nav>${nav}<a href="/cart">سبد خرید</a><a href="/admin/login">مدیریت</a></nav>
  </div></header>
  <main><div class="wrap">${options.body}</div></main>
  <footer><div class="wrap">© ${esc(options.site.name)} — powered by core-server</div></footer>
  ${options.extraScript ?? ''}
</body>
</html>`;
}
