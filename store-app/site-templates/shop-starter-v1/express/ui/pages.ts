import type { TenantRequest } from '../middleware';
import { tenantDb } from '../middleware';
import { listProducts, getProductBySlug, getSiteContent } from '../services/catalog';
import { esc, formatPrice, layoutHtml } from './html';

type SiteContent = {
  site: { name: string; tagline: string; description: string };
  navLinks: { label: string; href: string }[];
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
    image: string;
  };
  features: { title: string; description: string }[];
};

const defaultContent: SiteContent = {
  site: { name: 'فروشگاه', tagline: '', description: '' },
  navLinks: [
    { label: 'محصولات', href: '/products' },
  ],
  hero: {
    eyebrow: 'خوش آمدید',
    title: 'فروشگاه آنلاین',
    description: 'محصولات با کیفیت',
    ctaLabel: 'مشاهده محصولات',
    ctaHref: '/products',
    image: '/images/hero.jpg',
  },
  features: [],
};

async function loadContent(req: TenantRequest): Promise<SiteContent> {
  const db = await tenantDb(req);
  const raw = await getSiteContent(db);
  if (!raw) return defaultContent;
  return raw as unknown as SiteContent;
}

function productCard(p: {
  slug: string;
  name: string;
  price: number;
  image: string;
  categoryLabel?: string;
}) {
  return `<article class="card">
    <a href="/products/${esc(p.slug)}"><img src="${esc(p.image)}" alt="${esc(p.name)}" height="180" style="object-fit:cover;width:100%"></a>
    <div class="card-body">
      <p class="muted" style="margin:0;font-size:.8rem">${esc(p.categoryLabel ?? '')}</p>
      <h3><a href="/products/${esc(p.slug)}">${esc(p.name)}</a></h3>
      <p class="price">${esc(formatPrice(p.price))}</p>
    </div>
  </article>`;
}

export async function renderHome(req: TenantRequest): Promise<string> {
  const db = await tenantDb(req);
  const [content, products] = await Promise.all([
    loadContent(req),
    listProducts(db, { activeOnly: true }),
  ]);
  const featured = products.slice(0, 4);
  const features = content.features
    .map(
      (f) =>
        `<div class="feature"><strong>${esc(f.title)}</strong><p class="muted" style="margin:.35rem 0 0">${esc(f.description)}</p></div>`,
    )
    .join('');

  const body = `
    <section class="hero">
      <div>
        <p class="eyebrow">${esc(content.hero.eyebrow)}</p>
        <h1>${esc(content.hero.title)}</h1>
        <p class="muted">${esc(content.hero.description)}</p>
        <p style="margin-top:1.25rem"><a class="btn" href="${esc(content.hero.ctaHref)}">${esc(content.hero.ctaLabel)}</a></p>
      </div>
      <div><img src="${esc(content.hero.image)}" alt="" style="border-radius:12px;max-height:320px;object-fit:cover;width:100%"></div>
    </section>
    ${features ? `<section class="features">${features}</section>` : ''}
    <section>
      <h2 style="margin-bottom:1rem">محصولات منتخب</h2>
      <div class="grid">${featured.map(productCard).join('') || '<p class="muted">محصولی ثبت نشده — seed را اجرا کنید.</p>'}</div>
    </section>`;

  return layoutHtml({
    title: `${content.site.name} | ${content.site.tagline}`,
    site: content.site,
    navLinks: content.navLinks,
    body,
  });
}

export async function renderProducts(req: TenantRequest): Promise<string> {
  const db = await tenantDb(req);
  const content = await loadContent(req);
  const category = typeof req.query.cat === 'string' ? req.query.cat : undefined;
  const products = await listProducts(db, { category, activeOnly: true });

  const body = `
    <h1>محصولات</h1>
    <p class="muted">${products.length} محصول</p>
    <div class="grid" style="margin-top:1.25rem">
      ${products.map(productCard).join('') || '<p class="muted">محصولی یافت نشد.</p>'}
    </div>`;

  return layoutHtml({
    title: `محصولات | ${content.site.name}`,
    site: content.site,
    navLinks: content.navLinks,
    body,
  });
}

export async function renderProduct(req: TenantRequest, slug: string): Promise<string | null> {
  const db = await tenantDb(req);
  const content = await loadContent(req);
  const product = await getProductBySlug(db, slug);
  if (!product) return null;

  const body = `
    <p><a class="muted" href="/products">← بازگشت به محصولات</a></p>
    <div class="hero" style="margin-top:1rem">
      <div>
        <p class="eyebrow">${esc(product.category)}</p>
        <h1>${esc(product.name)}</h1>
        <p class="price" style="font-size:1.35rem">${esc(formatPrice(product.price))}</p>
        <p class="muted">${esc(product.shortDescription)}</p>
        <form id="add-cart" style="margin-top:1.25rem;display:flex;gap:.5rem;align-items:center">
          <input type="number" name="quantity" value="1" min="1" style="width:70px;padding:.45rem">
          <button type="submit" class="btn">افزودن به سبد</button>
        </form>
      </div>
      <div><img src="${esc(product.image)}" alt="${esc(product.name)}" style="border-radius:12px"></div>
    </div>`;

  const script = `<script>
document.getElementById('add-cart').addEventListener('submit', async (e) => {
  e.preventDefault();
  const qty = Number(e.target.quantity.value) || 1;
  const res = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId: ${JSON.stringify(product.id)}, quantity: qty }),
  });
  const data = await res.json();
  alert(data.success ? 'به سبد اضافه شد' : (data.error || 'خطا'));
});
</script>`;

  return layoutHtml({
    title: `${product.name} | ${content.site.name}`,
    site: content.site,
    navLinks: content.navLinks,
    body,
    extraScript: script,
  });
}

export async function renderCart(req: TenantRequest): Promise<string> {
  const content = await loadContent(req);
  const body = `
    <h1>سبد خرید</h1>
    <div id="cart-root"><p class="muted">در حال بارگذاری...</p></div>
    <p style="margin-top:1.5rem"><a class="btn btn-outline" href="/products">ادامه خرید</a></p>`;

  const script = `<script>
(async () => {
  const root = document.getElementById('cart-root');
  const res = await fetch('/api/cart');
  const json = await res.json();
  if (!json.success || !json.data.length) {
    root.innerHTML = '<p class="muted">سبد خرید خالی است.</p>';
    return;
  }
  const rows = json.data.map(i => '<tr><td>'+i.name+'</td><td>'+i.quantity+'</td><td>'+i.price.toLocaleString('fa-IR')+' تومان</td></tr>').join('');
  root.innerHTML = '<table class="cart-table"><thead><tr><th>محصول</th><th>تعداد</th><th>قیمت</th></tr></thead><tbody>'+rows+'</tbody></table>';
})();
</script>`;

  return layoutHtml({
    title: `سبد خرید | ${content.site.name}`,
    site: content.site,
    navLinks: content.navLinks,
    body,
    extraScript: script,
  });
}

export async function renderAdminLogin(req: TenantRequest): Promise<string> {
  const content = await loadContent(req);
  const body = `
    <h1 style="text-align:center">ورود مدیر</h1>
    <form class="form" id="login-form">
      <label>ایمیل</label>
      <input type="email" name="email" required>
      <label>رمز عبور</label>
      <input type="password" name="password" required minlength="6">
      <p style="margin-top:1.25rem"><button class="btn" type="submit" style="width:100%">ورود</button></p>
      <p id="login-msg" class="muted" style="text-align:center"></p>
    </form>`;

  const script = `<script>
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const res = await fetch('/api/auth/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }),
  });
  const data = await res.json();
  const msg = document.getElementById('login-msg');
  if (data.success) { window.location.href = '/admin'; return; }
  msg.textContent = data.error || 'خطا در ورود';
});
</script>`;

  return layoutHtml({
    title: `ورود مدیر | ${content.site.name}`,
    site: content.site,
    navLinks: content.navLinks,
    body,
    extraScript: script,
  });
}

export async function renderAdminDashboard(req: TenantRequest): Promise<string | null> {
  const { getAdminFromRequest } = await import('../auth');
  if (!getAdminFromRequest(req)) return null;

  const content = await loadContent(req);
  const body = `
    <h1>پنل مدیریت</h1>
    <p class="muted">فاز بعدی: UI کامل ادمین. فعلاً از API استفاده کنید.</p>
    <ul>
      <li><a href="/api/admin/stats">آمار (JSON)</a></li>
      <li><a href="/api/admin/orders">سفارشات (JSON)</a></li>
    </ul>
    <p><button class="btn btn-outline" id="logout">خروج</button></p>`;

  const script = `<script>
document.getElementById('logout').onclick = async () => {
  await fetch('/api/auth/admin/login', { method: 'DELETE' });
  window.location.href = '/admin/login';
};
</script>`;

  return layoutHtml({
    title: `مدیریت | ${content.site.name}`,
    site: content.site,
    navLinks: content.navLinks,
    body,
    extraScript: script,
  });
}
