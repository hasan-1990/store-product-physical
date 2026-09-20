import type { Express } from 'express';
import path from 'path';
import { coreConfig } from '@core-shared';
import { withHub } from '../../middleware';
import { layoutHtml } from '../html';
import { scanNextPages, type ScannedPage } from './page-scanner';

let cachedPages: ScannedPage[] | null = null;

function getPages(): ScannedPage[] {
  if (!cachedPages) {
    const appRoot = path.join(coreConfig.storeAppRoot, 'src', 'app');
    cachedPages = scanNextPages(appRoot);
  }
  return cachedPages;
}

function groupPages(pages: ScannedPage[]): Record<string, ScannedPage[]> {
  const groups: Record<string, ScannedPage[]> = {};
  for (const page of pages) {
    const parts = page.path.split('/').filter(Boolean);
    const key = parts[0] || 'root';
    if (!groups[key]) groups[key] = [];
    groups[key].push(page);
  }
  return groups;
}

function guessApiPath(pagePath: string): string | null {
  if (pagePath.startsWith('/admin/')) {
    const rest = pagePath.slice('/admin/'.length);
    return `/api/admin/${rest}`;
  }
  if (pagePath.startsWith('/user/')) {
    const rest = pagePath.slice('/user/'.length);
    return `/api/user/${rest}`;
  }
  if (pagePath.startsWith('/panel/')) {
    return `/api/panel${pagePath.slice('/panel'.length)}`;
  }
  return null;
}

function renderSpaShell(currentPath: string): string {
  const pages = getPages();
  const groups = groupPages(pages);
  const navSections = Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, items]) => {
      const links = items
        .map((p) => {
          const active = p.path === currentPath ? ' style="color:var(--accent);font-weight:600"' : '';
          const label = p.path === '/' ? 'خانه' : p.path;
          return `<a href="${p.path}" data-spa${active}>${label}</a>`;
        })
        .join('');
      return `<div class="nav-group"><div class="nav-group-title">${group}</div>${links}</div>`;
    })
    .join('');

  const body = `
<style>
  .spa-layout { display:grid; grid-template-columns:260px 1fr; gap:1rem; min-height:70vh; }
  .spa-sidebar { background:var(--card); border:1px solid var(--border); border-radius:12px; padding:1rem; max-height:80vh; overflow:auto; font-size:.82rem; }
  .spa-sidebar a { display:block; padding:.2rem 0; opacity:.9; }
  .spa-sidebar a:hover { color:var(--accent); }
  .nav-group { margin-bottom:.75rem; }
  .nav-group-title { font-weight:700; margin-bottom:.35rem; color:var(--muted); text-transform:uppercase; font-size:.7rem; }
  .spa-main { background:var(--card); border:1px solid var(--border); border-radius:12px; padding:1.25rem; }
  .spa-toolbar { display:flex; gap:.5rem; flex-wrap:wrap; margin-bottom:1rem; }
  #spa-content pre { background:#12121a; padding:1rem; border-radius:8px; overflow:auto; max-height:50vh; font-size:.8rem; }
  @media (max-width:900px) { .spa-layout { grid-template-columns:1fr; } }
</style>
<div class="spa-layout">
  <aside class="spa-sidebar">${navSections}</aside>
  <section class="spa-main">
    <h1 id="spa-title">${currentPath}</h1>
    <p class="muted">صفحه مهاجرت‌یافته از Next — داده از API بارگذاری می‌شود.</p>
    <div class="spa-toolbar">
      <button class="btn btn-sm" id="spa-reload">بارگذاری مجدد</button>
      <a class="btn btn-sm btn-outline" id="spa-api-link" href="#" target="_blank" rel="noopener">مشاهده API</a>
    </div>
    <div id="spa-content"><p class="muted">در حال بارگذاری…</p></div>
  </section>
</div>
<script>
(function(){
  const TOKEN_KEY='hub_token';
  function getToken(){return localStorage.getItem(TOKEN_KEY);}
  function authHeaders(){const t=getToken();const h={'Accept':'application/json'};if(t)h['Authorization']='Bearer '+t;return h;}
  const path=${JSON.stringify(currentPath)};
  const apiGuess=${JSON.stringify(guessApiPath(currentPath))};

  async function load(){
    const title=document.getElementById('spa-title');
    const content=document.getElementById('spa-content');
    const apiLink=document.getElementById('spa-api-link');
    title.textContent=path;
    if(!apiGuess){
      content.innerHTML='<p class="muted">برای این مسیر API خودکار تعریف نشده. از منوی کناری صفحات مرتبط را انتخاب کنید.</p>';
      apiLink.style.display='none';
      return;
    }
    apiLink.href=apiGuess;
    apiLink.style.display='inline-block';
    content.innerHTML='<p class="muted">در حال بارگذاری…</p>';
    try{
      const res=await fetch(apiGuess,{headers:authHeaders(),credentials:'include'});
      const text=await res.text();
      let pretty=text;
      try{pretty=JSON.stringify(JSON.parse(text),null,2);}catch(e){}
      content.innerHTML='<p class="'+(res.ok?'alert-ok':'alert-error')+'">HTTP '+res.status+'</p><pre>'+pretty.replace(/</g,'&lt;')+'</pre>';
    }catch(err){
      content.innerHTML='<p class="alert alert-error">خطا: '+String(err)+'</p>';
    }
  }
  document.getElementById('spa-reload').addEventListener('click',load);
  document.querySelectorAll('[data-spa]').forEach(function(a){
    a.addEventListener('click',function(e){
      if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
      e.preventDefault();
      history.pushState({},'',a.getAttribute('href'));
      location.reload();
    });
  });
  load();
})();
</script>`;

  return layoutHtml({
    title: currentPath,
    siteName: 'Store Hub',
    body,
    extraHead: '',
    navExtra: [{ label: 'ادمین', href: '/admin' }],
  });
}

export function registerHubSpaRoutes(_app: Express): void {
  console.warn(
    '[core-server] registerHubSpaRoutes غیرفعال است — UI را از http://localhost:3000 باز کنید.',
  );
}
