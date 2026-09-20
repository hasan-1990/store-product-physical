export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatPrice(price: number): string {
  return `${Number(price).toLocaleString('fa-IR')} تومان`;
}

const headAssets = `
  <link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>
  <link rel="stylesheet" href="/api/fonts/dynamic.css">
  <link rel="stylesheet" href="/_next/static/css/app/layout.css">
  <link rel="stylesheet" href="/styles/megamenu.css">
  <style>
    @font-face{font-family:'Yekan';src:url('/fonts/Yekan_400_normal_1758132753132.woff2') format('woff2');font-display:swap;font-weight:400;font-style:normal;}
    html,body{margin:0;padding:0;overflow-x:hidden;}
    body{font-family:'Yekan',Tahoma,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased;}
    .hub-mega-panel{display:none;position:absolute;top:100%;right:0;min-width:280px;z-index:9999;}
    .hub-mega-wrap:hover .hub-mega-panel,.hub-mega-wrap:focus-within .hub-mega-panel{display:block;}
  </style>`;

export const hubAuthScript = `
<script>
const TOKEN_KEY='hub_token';
const USER_KEY='user';
function getToken(){return localStorage.getItem(TOKEN_KEY);}
function setToken(t){localStorage.setItem(TOKEN_KEY,t);}
function clearToken(){localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(USER_KEY);}
function authHeaders(){const t=getToken();const h={'Accept':'application/json'};if(t)h['Authorization']='Bearer '+t;return h;}
</script>`;

const hubUiScript = `
<script>
(function(){
  const megaBtn=document.getElementById('hub-mega-btn');
  const megaPanel=document.getElementById('hub-mega-panel');
  if(megaBtn&&megaPanel){
    fetch('/api/mega-menu').then(r=>r.json()).then(function(j){
      if(!j||!j.success||!j.data) return;
      const cats=(j.data.categories||j.data||[]).slice(0,12);
      if(!cats.length) return;
      megaPanel.innerHTML=cats.map(function(c){
        const href='/products?categoryId='+(c.id||c._id||'');
        return '<a href="'+href+'" class="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700">'+String(c.name||'')+'</a>';
      }).join('');
    }).catch(function(){});
  }
  const mobileBtn=document.getElementById('hub-mobile-btn');
  const mobileMenu=document.getElementById('hub-mobile-menu');
  if(mobileBtn&&mobileMenu){
    mobileBtn.addEventListener('click',function(){mobileMenu.classList.toggle('hidden');});
  }
})();
</script>`;

type NavLink = { label: string; href: string };

function renderSiteHeader(siteName: string, navExtra: NavLink[] = []): string {
  const links = [
    { label: 'خانه', href: '/' },
    { label: 'محصولات', href: '/products' },
    { label: 'درباره ما', href: '/about' },
    { label: 'قالب‌ها', href: '/templates' },
    ...navExtra,
  ];

  const desktopLinks = links
    .map(
      (l) =>
        `<a href="${esc(l.href)}" class="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">${esc(l.label)}</a>`,
    )
    .join('');

  const mobileLinks = links
    .map(
      (l) =>
        `<a href="${esc(l.href)}" class="block text-gray-300 hover:text-white hover:bg-white/10 px-4 py-3 rounded-lg text-base font-medium">${esc(l.label)}</a>`,
    )
    .join('');

  return `<nav class="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 shadow-2xl border-b border-purple-500/20 relative z-[9998]">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-20 min-h-[80px] gap-4">
      <a href="/" class="flex items-center gap-2 flex-shrink-0 group">
        <div class="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        </div>
        <span class="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">${esc(siteName)}</span>
      </a>
      <div class="hidden lg:flex items-center gap-1 flex-wrap">${desktopLinks}
        <div class="relative hub-mega-wrap">
          <button type="button" id="hub-mega-btn" class="text-gray-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-medium">دسته‌بندی‌ها ▾</button>
          <div id="hub-mega-panel" class="hub-mega-panel bg-white rounded-xl shadow-2xl border border-gray-100 py-2 max-h-80 overflow-auto"></div>
        </div>
      </div>
      <form action="/products" method="get" class="hidden md:flex flex-1 max-w-md mx-4">
        <input name="search" placeholder="جستجوی محصول..." class="w-full rounded-r-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500">
        <button type="submit" class="bg-orange-500 hover:bg-orange-600 text-white px-4 rounded-l-lg text-sm">جستجو</button>
      </form>
      <div class="flex items-center gap-3">
        <a href="/cart" class="relative p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg" title="سبد خرید">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
        </a>
        <a href="/login" class="hidden sm:inline text-gray-300 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-white/10">ورود</a>
        <a href="/user/my-sites" class="hidden sm:inline text-gray-300 hover:text-white text-sm px-3 py-2 rounded-lg hover:bg-white/10">سایت‌های من</a>
        <button type="button" id="hub-mobile-btn" class="lg:hidden p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg">
          <svg class="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>
    </div>
    <div id="hub-mobile-menu" class="hidden lg:hidden border-t border-purple-500/20 pb-4 space-y-1">${mobileLinks}
      <a href="/cart" class="block text-gray-300 hover:text-white hover:bg-white/10 px-4 py-3 rounded-lg">سبد خرید</a>
      <a href="/login" class="block text-gray-300 hover:text-white hover:bg-white/10 px-4 py-3 rounded-lg">ورود</a>
    </div>
  </div>
</nav>`;
}

function renderSiteFooter(siteName: string): string {
  return `<footer class="relative bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white py-10 px-4 mt-auto">
  <div class="container mx-auto max-w-7xl">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-10 mb-8">
      <div>
        <div class="flex items-center gap-3 mb-4">
          <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <svg class="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
          </div>
          <h3 class="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">${esc(siteName)}</h3>
        </div>
        <p class="text-gray-300 text-sm leading-relaxed">فروشگاه آنلاین محصولات دیجیتال و قالب‌های سایت</p>
      </div>
      <div>
        <h4 class="text-lg font-semibold mb-3">دسترسی سریع</h4>
        <ul class="grid grid-cols-2 gap-2 text-gray-300 text-sm">
          <li><a href="/about" class="hover:text-purple-400">درباره ما</a></li>
          <li><a href="/contact" class="hover:text-purple-400">تماس با ما</a></li>
          <li><a href="/products" class="hover:text-purple-400">محصولات</a></li>
          <li><a href="/faq" class="hover:text-purple-400">سوالات متداول</a></li>
        </ul>
      </div>
    </div>
    <div class="border-t border-white/10 pt-6 text-center text-gray-400 text-sm">© ${new Date().getFullYear()} ${esc(siteName)}</div>
  </div>
</footer>`;
}

export function layoutHtml(options: {
  title: string;
  siteName: string;
  body: string;
  extraHead?: string;
  extraScript?: string;
  navExtra?: NavLink[];
  fullWidth?: boolean;
}): string {
  const mainClass = options.fullWidth ? 'flex-1 w-full' : 'flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8';

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(options.title)}</title>
  ${headAssets}
  ${options.extraHead ?? ''}
</head>
<body class="antialiased min-h-screen flex flex-col bg-white text-gray-900">
  ${renderSiteHeader(options.siteName, options.navExtra)}
  <main class="${mainClass}">${options.body}</main>
  ${renderSiteFooter(options.siteName)}
  ${hubAuthScript}
  ${hubUiScript}
  ${options.extraScript ?? ''}
</body>
</html>`;
}
