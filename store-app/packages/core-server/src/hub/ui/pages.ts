import { connectHubDb } from '@core-shared';
import { getPublicSettings } from '../services/public-settings';
import { listHubProducts, getHubProductById } from '../services/products';
import { listHubHomepageCategories } from '../services/categories';
import { esc, formatPrice, layoutHtml } from './html';

async function siteName(): Promise<string> {
  const db = await connectHubDb();
  const settings = await getPublicSettings(db);
  return String(settings.site_name || 'فاتمز');
}

function productCard(p: {
  id?: string;
  _id?: string;
  name?: string;
  price?: number;
  originalPrice?: number;
  imageUrl?: string;
  image?: string;
  slug?: string;
  productType?: string;
  stock?: number;
}) {
  const id = p.id || p._id || '';
  const img = p.imageUrl || p.image || '/images/products/placeholder.svg';
  const outOfStock = p.stock === 0;
  const discount =
    p.originalPrice && p.originalPrice > Number(p.price || 0)
      ? Math.round(((p.originalPrice - Number(p.price)) / p.originalPrice) * 100)
      : 0;

  return `<article class="relative flex w-full flex-col overflow-hidden bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 min-h-[280px]">
    <a href="/products/${esc(id)}" class="relative flex h-40 overflow-hidden bg-gray-50 rounded-t-xl">
      <img src="${esc(img)}" alt="${esc(p.name)}" class="object-cover w-full h-full hover:scale-105 transition-transform duration-300" loading="lazy">
      ${discount > 0 ? `<span class="absolute top-2 left-2 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">-${discount}%</span>` : ''}
      ${p.productType === 'managed-site' ? '<span class="absolute top-2 right-2 rounded-full bg-purple-600 px-2 py-0.5 text-xs text-white">سایت اختصاصی</span>' : ''}
      ${outOfStock ? '<div class="absolute inset-0 bg-black/50 flex items-center justify-center"><span class="bg-white text-gray-900 px-2 py-1 rounded text-xs font-bold">ناموجود</span></div>' : ''}
    </a>
    <div class="p-3 flex flex-col flex-1 justify-between">
      <a href="/products/${esc(id)}"><h3 class="text-sm font-medium text-slate-900 hover:text-orange-600 line-clamp-2 mb-2">${esc(p.name)}</h3></a>
      <div class="flex items-center justify-between gap-2">
        <span class="text-base font-bold text-orange-600">${esc(formatPrice(Number(p.price || 0)))}</span>
      </div>
      <a href="/products/${esc(id)}" class="mt-3 block text-center w-full py-2 text-sm font-medium rounded-lg ${outOfStock ? 'bg-gray-200 text-gray-500 pointer-events-none' : 'bg-orange-500 text-white hover:bg-orange-600'}">${outOfStock ? 'ناموجود' : 'مشاهده محصول'}</a>
    </div>
  </article>`;
}

function categoryCard(c: { id?: string; _id?: string; name?: string; slug?: string; imageUrl?: string }) {
  const id = c.id || c._id || c.slug || '';
  const href = c.slug ? `/products?search=${encodeURIComponent(c.slug)}` : `/products?categoryId=${esc(id)}`;
  return `<a href="${href}" class="group block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-purple-200 transition-all">
    <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center mb-3 text-lg font-bold">${esc(String(c.name || '?').charAt(0))}</div>
    <h3 class="font-semibold text-gray-900 group-hover:text-purple-700">${esc(c.name)}</h3>
  </a>`;
}

export async function renderHubHome(): Promise<string> {
  const db = await connectHubDb();
  const [name, settings, productsResult, categoriesResult] = await Promise.all([
    siteName(),
    getPublicSettings(db),
    listHubProducts(db, { page: 1, limit: 8, active: true, featured: true }),
    listHubHomepageCategories(db, { limit: 8 }),
  ]);
  const products = productsResult.data || [];
  const categories = categoriesResult.categories || [];

  const heroTitle = String(settings.hero_title || settings.site_name || name);
  const heroDesc = String(settings.site_description || settings.seo_description || '');

  const body = `
    <section class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white px-6 py-14 sm:py-20 mb-10">
      <div class="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_#ec4899,_transparent_50%)]"></div>
      <div class="relative max-w-3xl">
        <p class="text-purple-200 text-sm mb-3">فروشگاه آنلاین</p>
        <h1 class="text-3xl sm:text-5xl font-bold leading-tight mb-4">${esc(heroTitle)}</h1>
        <p class="text-gray-300 text-base sm:text-lg leading-relaxed mb-8">${esc(heroDesc)}</p>
        <div class="flex flex-wrap gap-3">
          <a href="/products" class="inline-flex items-center bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-medium transition-colors">مشاهده محصولات</a>
          <a href="/templates" class="inline-flex items-center border border-white/30 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-medium transition-colors">قالب‌های سایت</a>
        </div>
      </div>
    </section>
    ${
      categories.length
        ? `<section class="mb-12">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-900">دسته‌بندی‌ها</h2>
        <a href="/products" class="text-purple-600 hover:text-purple-800 text-sm font-medium">همه محصولات ←</a>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">${categories.map(categoryCard).join('')}</div>
    </section>`
        : ''
    }
    <section>
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-900">محصولات منتخب</h2>
        <a href="/products" class="text-purple-600 hover:text-purple-800 text-sm font-medium">مشاهده همه ←</a>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        ${products.map(productCard).join('') || '<p class="text-gray-500 col-span-full text-center py-8">محصولی ثبت نشده است.</p>'}
      </div>
    </section>`;

  return layoutHtml({ title: name, siteName: name, body });
}

export async function renderHubProducts(search?: string): Promise<string> {
  const db = await connectHubDb();
  const name = await siteName();
  const result = await listHubProducts(db, {
    page: 1,
    limit: 48,
    active: true,
    search,
  });
  const products = result.data || [];

  const body = `
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">محصولات</h1>
      <p class="text-gray-500 mt-2">${products.length} محصول</p>
    </div>
    <form method="get" class="flex flex-col sm:flex-row gap-3 mb-8 max-w-xl">
      <input name="search" placeholder="جستجو..." value="${esc(search || '')}" class="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500">
      <button class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-medium" type="submit">جستجو</button>
    </form>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      ${products.map(productCard).join('') || '<p class="text-gray-500 col-span-full text-center py-8">محصولی یافت نشد.</p>'}
    </div>`;

  return layoutHtml({ title: `محصولات | ${name}`, siteName: name, body });
}

export async function renderHubProduct(id: string): Promise<string | null> {
  const db = await connectHubDb();
  const name = await siteName();
  const product = await getHubProductById(db, id);
  if (!product) return null;

  const img = product.imageUrl || '/images/products/placeholder.svg';
  const body = `
    <a href="/products" class="muted">← بازگشت</a>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-top:1rem">
      <img src="${esc(img)}" alt="${esc(product.name)}" style="border-radius:12px">
      <div>
        <h1>${esc(product.name)}</h1>
        <p class="price" style="font-size:1.25rem">${esc(formatPrice(Number(product.price || 0)))}</p>
        <p class="muted">${esc(String(product.description || ''))}</p>
        <button class="btn" id="add-cart" data-id="${esc(product.id)}" style="margin-top:1rem">افزودن به سبد</button>
      </div>
    </div>`;

  const extraScript = `<script>
document.getElementById('add-cart')?.addEventListener('click',async()=>{
  const productId=document.getElementById('add-cart').dataset.id;
  const r=await fetch('/api/cart',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId,quantity:1})});
  const j=await r.json();
  alert(j.success?'به سبد اضافه شد':(j.error||'خطا'));
});
</script>`;

  return layoutHtml({
    title: `${product.name} | ${name}`,
    siteName: name,
    body,
    extraScript,
  });
}

export async function renderHubCart(): Promise<string> {
  const name = await siteName();
  const body = `
    <h1>سبد خرید</h1>
    <div id="cart-root"><p class="muted">در حال بارگذاری...</p></div>
    <p style="margin-top:1rem"><a class="btn" href="/products">ادامه خرید</a></p>`;

  const extraScript = `<script>
(async()=>{
  const root=document.getElementById('cart-root');
  try{
    const r=await fetch('/api/cart');
    const j=await r.json();
    if(!j.success||!j.data?.length){
      root.innerHTML='<p class="muted">سبد خرید خالی است.</p>';
      return;
    }
    const rows=j.data.map(i=>'<tr><td>'+i.name+'</td><td>'+i.quantity+'</td><td>'+Number(i.price).toLocaleString('fa-IR')+'</td></tr>').join('');
    root.innerHTML='<table><thead><tr><th>محصول</th><th>تعداد</th><th>قیمت</th></tr></thead><tbody>'+rows+'</tbody></table>';
  }catch(e){root.innerHTML='<p class="alert alert-error">خطا در بارگذاری سبد</p>';}
})();
</script>`;

  return layoutHtml({ title: `سبد خرید | ${name}`, siteName: name, body, extraScript });
}

export async function renderHubLogin(): Promise<string> {
  const name = await siteName();
  const body = `
    <h1>ورود</h1>
    <form class="form" id="login-form">
      <label>ایمیل</label>
      <input type="email" name="email" required dir="ltr">
      <label>رمز عبور</label>
      <input type="password" name="password" required>
      <p id="login-msg"></p>
      <button class="btn" type="submit" style="margin-top:1rem;width:100%">ورود</button>
    </form>
    <p class="muted" style="text-align:center;margin-top:1rem">حساب ندارید؟ <a href="/register">ثبت‌نام</a></p>`;

  const extraScript = `<script>
document.getElementById('login-form').addEventListener('submit',async(e)=>{
  e.preventDefault();
  const fd=new FormData(e.target);
  const msg=document.getElementById('login-msg');
  msg.textContent='';
  const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:fd.get('email'),password:fd.get('password')})});
  const j=await r.json();
  if(j.success&&j.data?.token){setToken(j.data.token);location.href='/user/my-sites';}
  else{msg.innerHTML='<span class="alert alert-error">'+(j.error||'خطا در ورود')+'</span>';}
});
</script>`;

  return layoutHtml({ title: `ورود | ${name}`, siteName: name, body, extraScript });
}

export async function renderHubRegister(): Promise<string> {
  const name = await siteName();
  const body = `
    <h1>ثبت‌نام</h1>
    <form class="form" id="reg-form">
      <label>نام</label>
      <input name="name" required>
      <label>ایمیل</label>
      <input type="email" name="email" required dir="ltr">
      <label>موبایل</label>
      <input name="phone" required dir="ltr" placeholder="09123456789" pattern="09[0-9]{9}">
      <label>رمز عبور</label>
      <input type="password" name="password" required minlength="6">
      <p id="reg-msg"></p>
      <button class="btn" type="submit" style="margin-top:1rem;width:100%">ثبت‌نام</button>
    </form>`;

  const extraScript = `<script>
document.getElementById('reg-form').addEventListener('submit',async(e)=>{
  e.preventDefault();
  const fd=new FormData(e.target);
  const msg=document.getElementById('reg-msg');
  const r=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:fd.get('name'),email:fd.get('email'),phone:fd.get('phone'),password:fd.get('password')})});
  const j=await r.json();
  if(j.success){msg.innerHTML='<span class="alert alert-ok">ثبت‌نام شد — وارد شوید</span>';setTimeout(()=>location.href='/login',1200);}
  else{msg.innerHTML='<span class="alert alert-error">'+(j.error||'خطا')+'</span>';}
});
</script>`;

  return layoutHtml({ title: `ثبت‌نام | ${name}`, siteName: name, body, extraScript });
}

export async function renderHubTemplates(): Promise<string> {
  const db = await connectHubDb();
  const name = await siteName();
  const templates = await db
    .collection('siteTemplates')
    .find({ active: true })
    .sort({ createdAt: -1 })
    .toArray();

  const cards = templates
    .map(
      (t) => `<article class="card">
      <div class="card-body">
        <h3>${esc(t.name)}</h3>
        <p class="muted">${esc(t.shortDescription || '')}</p>
        <p class="price">${t.basePrice ? esc(formatPrice(Number(t.basePrice))) : ''}</p>
        <a class="btn btn-sm" href="/products?search=${encodeURIComponent(String(t.slug))}">مشاهده</a>
      </div>
    </article>`,
    )
    .join('');

  const body = `
    <h1>قالب‌های سایت</h1>
    <p class="muted">قالب managed-site را خریداری کنید و دامنه خود را وصل کنید.</p>
    <div class="grid" style="margin-top:1rem">${cards || '<p class="muted">قالبی ثبت نشده است.</p>'}</div>`;

  return layoutHtml({ title: `قالب‌ها | ${name}`, siteName: name, body });
}

export async function renderHubMySites(): Promise<string> {
  const name = await siteName();
  const body = `
    <h1>سایت‌های من</h1>
    <div id="sites-root"><p class="muted">در حال بارگذاری...</p></div>`;

  const extraScript = `<script>
(async()=>{
  const root=document.getElementById('sites-root');
  const t=getToken();
  if(!t){root.innerHTML='<p class="muted">ابتدا <a href="/login">وارد شوید</a></p>';return;}
  const r=await fetch('/api/user/my-sites',{headers:authHeaders()});
  const j=await r.json();
  if(!j.success){root.innerHTML='<p class="alert alert-error">'+(j.error||'خطا')+'</p>';return;}
  if(!j.instances?.length){root.innerHTML='<p class="muted">سایتی ندارید — <a href="/templates">قالب‌ها</a></p>';return;}
  root.innerHTML=j.instances.map(i=>{
    let admin='';
    if(i.status==='active'&&i.tenantAdmin){
      admin='<p dir="ltr">ادمین: '+i.tenantAdmin.email+' / '+i.tenantAdmin.password+'</p>';
    }
    return '<div class="panel"><h3 dir="ltr">'+i.domain+'</h3><p>وضعیت: '+i.status+'</p>'+admin+'</div>';
  }).join('');
})();
</script>`;

  return layoutHtml({ title: `سایت‌های من | ${name}`, siteName: name, body, extraScript });
}

export async function renderHubAdminLogin(): Promise<string> {
  const name = await siteName();
  const body = `
    <h1>ورود ادمین</h1>
    <form class="form" id="admin-login">
      <label>ایمیل</label>
      <input type="email" name="email" required dir="ltr">
      <label>رمز عبور</label>
      <input type="password" name="password" required>
      <p id="msg"></p>
      <button class="btn" type="submit" style="margin-top:1rem;width:100%">ورود</button>
    </form>`;

  const extraScript = `<script>
document.getElementById('admin-login').addEventListener('submit',async(e)=>{
  e.preventDefault();
  const fd=new FormData(e.target);
  const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:fd.get('email'),password:fd.get('password')})});
  const j=await r.json();
  if(j.success&&j.data?.token&&j.data?.user?.role==='admin'){setToken(j.data.token);location.href='/admin';}
  else{document.getElementById('msg').innerHTML='<span class="alert alert-error">دسترسی ادمین نیست</span>';}
});
</script>`;

  return layoutHtml({ title: `ادمین | ${name}`, siteName: name, body, extraScript });
}

export async function renderHubAdminDashboard(): Promise<string> {
  const name = await siteName();
  const body = `
    <h1>پنل ادمین</h1>
    <div class="grid">
      <a class="panel" href="/admin/site-instances"><strong>سایت‌های مشتری</strong><p class="muted">مدیریت instanceها</p></a>
      <a class="panel" href="/admin/site-templates"><strong>قالب‌ها</strong><p class="muted">site-templates</p></a>
      <a class="panel" href="/admin/products"><strong>محصولات</strong><p class="muted">لیست محصولات هاب</p></a>
    </div>
    <p style="margin-top:1rem"><button class="btn btn-outline btn-sm" onclick="clearToken();location.href='/admin/login'">خروج</button></p>`;

  const extraScript = `<script>if(!getToken())location.href='/admin/login';</script>`;
  return layoutHtml({ title: `ادمین | ${name}`, siteName: name, body, extraScript });
}

export async function renderHubAdminSiteInstances(): Promise<string> {
  const name = await siteName();
  const body = `<h1>سایت‌های مشتری</h1><div id="list"><p class="muted">بارگذاری...</p></div><p><a href="/admin">← بازگشت</a></p>`;
  const extraScript = `<script>
(async()=>{
  const t=getToken(); if(!t){location.href='/admin/login';return;}
  const r=await fetch('/api/admin/site-instances',{headers:authHeaders()});
  const j=await r.json();
  const el=document.getElementById('list');
  if(!j.success){el.innerHTML='<p class="alert alert-error">خطا</p>';return;}
  el.innerHTML='<table><tr><th>دامنه</th><th>وضعیت</th><th>قالب</th></tr>'+
    (j.instances||[]).map(i=>'<tr><td dir="ltr">'+i.domain+'</td><td>'+i.status+'</td><td>'+i.templateSlug+'</td></tr>').join('')+'</table>';
})();
</script>`;
  return layoutHtml({ title: `Instances | ${name}`, siteName: name, body, extraScript });
}

export async function renderHubAdminSiteTemplates(): Promise<string> {
  const name = await siteName();
  const body = `<h1>قالب‌های ثبت‌شده</h1><div id="list"><p class="muted">بارگذاری...</p></div><p><a href="/admin">← بازگشت</a></p>`;
  const extraScript = `<script>
(async()=>{
  const t=getToken(); if(!t){location.href='/admin/login';return;}
  const r=await fetch('/api/admin/site-templates',{headers:authHeaders()});
  const j=await r.json();
  const el=document.getElementById('list');
  if(!j.success){el.innerHTML='<p class="alert alert-error">خطا</p>';return;}
  el.innerHTML='<table><tr><th>نام</th><th>slug</th><th>فعال</th></tr>'+
    (j.templates||[]).map(t=>'<tr><td>'+t.name+'</td><td>'+t.slug+'</td><td>'+(t.active?'بله':'خیر')+'</td></tr>').join('')+'</table>';
})();
</script>`;
  return layoutHtml({ title: `Templates | ${name}`, siteName: name, body, extraScript });
}

export async function renderHubAdminProducts(): Promise<string> {
  const name = await siteName();
  const body = `<h1>محصولات</h1><div id="list"><p class="muted">بارگذاری...</p></div><p><a href="/admin">← بازگشت</a></p>`;
  const extraScript = `<script>
(async()=>{
  const t=getToken(); if(!t){location.href='/admin/login';return;}
  const r=await fetch('/api/admin/products',{headers:authHeaders()});
  const j=await r.json();
  const el=document.getElementById('list');
  el.innerHTML='<table><tr><th>نام</th><th>قیمت</th><th>فعال</th></tr>'+
    (j.data||[]).map(p=>'<tr><td>'+p.name+'</td><td>'+Number(p.price).toLocaleString('fa-IR')+'</td><td>'+(p.active?'بله':'خیر')+'</td></tr>').join('')+'</table>';
})();
</script>`;
  return layoutHtml({ title: `محصولات | ${name}`, siteName: name, body, extraScript });
}

export async function renderHubCheckout(): Promise<string> {
  const name = await siteName();
  const body = `
    <h1>تسویه حساب</h1>
    <div id="checkout"><p class="muted">بارگذاری سبد...</p></div>`;
  const extraScript = `<script>
(async()=>{
  const root=document.getElementById('checkout');
  const t=getToken();
  const cart=await fetch('/api/cart'+(t?'':'?sessionId=local')).then(r=>r.json());
  if(!cart.success||!cart.data?.length){root.innerHTML='<p class="muted">سبد خالی است — <a href="/products">خرید</a></p>';return;}
  const total=cart.data.reduce((s,i)=>s+i.price*i.quantity,0);
  root.innerHTML='<p>مبلغ: '+total.toLocaleString('fa-IR')+' تومان</p>'+
    '<label>دامنه سایت (managed-site)</label><input id="siteDomain" dir="ltr" placeholder="shop.example.com">'+
    '<button class="btn" id="payBtn" style="margin-top:1rem">ثبت سفارش</button>';
  document.getElementById('payBtn').onclick=async()=>{
    const items=cart.data.map(i=>({productId:i.productId||i._id,name:i.name,price:i.price,quantity:i.quantity,productType:i.productType,provisioningType:i.provisioningType,templateSlug:i.templateSlug,siteDomain:document.getElementById('siteDomain').value}));
    const r=await fetch('/api/orders/create',{method:'POST',headers:{'Content-Type':'application/json',...authHeaders()},body:JSON.stringify({userId:t?JSON.parse(atob(t.split('.')[1])).userId:null,items,totalAmount:total,paymentStatus:'pending',contactInfo:{}})});
    const j=await r.json();
    if(!j.success){alert(j.error||'خطا');return;}
    if(total<=0){
      await fetch('/api/orders/'+j.orderId+'/complete',{method:'POST'});
      location.href='/user/my-sites';return;
    }
    const pay=await fetch('/api/payment/initiate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId:j.orderId,amount:total})});
    const pj=await pay.json();
    if(pj.paymentUrl)location.href=pj.paymentUrl; else alert(pj.error||'خطا درگاه');
  };
})();
</script>`;
  return layoutHtml({ title: `تسویه | ${name}`, siteName: name, body, extraScript });
}

export async function renderHubPaymentSuccess(orderId?: string, refId?: string): Promise<string> {
  const name = await siteName();
  const body = `
    <h1>پرداخت موفق</h1>
    <p class="alert alert-ok">سفارش شما ثبت شد.</p>
    ${orderId ? `<p dir="ltr">Order: ${orderId}</p>` : ''}
    ${refId ? `<p dir="ltr">Ref: ${refId}</p>` : ''}
    <p><a class="btn" href="/user/my-sites">سایت‌های من</a></p>`;
  const extraScript = orderId ? `<script>
fetch('/api/orders/${orderId}/complete',{method:'POST'}).catch(()=>{});
</script>` : '';
  return layoutHtml({ title: `پرداخت موفق | ${name}`, siteName: name, body, extraScript });
}

export async function renderHubProfile(): Promise<string> {
  const name = await siteName();
  const body = `
    <h1>پروفایل</h1>
    <div id="profile"><p class="muted">بارگذاری...</p></div>
    <h2 style="margin-top:2rem">محصولات دیجیتال</h2>
    <div id="digital"><p class="muted">...</p></div>`;
  const extraScript = `<script>
(async()=>{
  const t=getToken(); if(!t){location.href='/login';return;}
  const p=await fetch('/api/user/profile',{headers:authHeaders()}).then(r=>r.json());
  const el=document.getElementById('profile');
  if(p.user) el.innerHTML='<p>'+p.user.name+'</p><p dir="ltr">'+p.user.email+'</p>';
  const d=await fetch('/api/user/digital-products',{headers:authHeaders()}).then(r=>r.json());
  document.getElementById('digital').innerHTML=(d.products||[]).map(p=>'<div class="panel">'+p.name+' <button class="btn btn-sm" onclick="dl(\\''+p.productId+'\\')">دانلود</button></div>').join('')||'<p class="muted">محصول دیجیتالی ندارید</p>';
})();
async function dl(id){
  const r=await fetch('/api/download/generate',{method:'POST',headers:{'Content-Type':'application/json',...authHeaders()},body:JSON.stringify({productId:id})});
  const j=await r.json();
  if(j.downloadToken) location.href='/api/download/file?token='+encodeURIComponent(j.downloadToken);
  else alert(j.error||'خطا');
}
</script>`;
  return layoutHtml({ title: `پروفایل | ${name}`, siteName: name, body, extraScript });
}
