import fs from 'fs-extra';
import path from 'path';
import { provisioningConfig } from './config';

export type NginxMode = 'maintenance' | 'active';

export function buildNginxConfig(slug: string, domain: string, mode: NginxMode): string {
  const upstreamPort = provisioningConfig.coreServerPort;

  if (mode === 'maintenance') {
    return `# Auto-generated maintenance vhost for ${slug}
server {
    listen 80;
    server_name ${domain} www.${domain};

    location / {
        default_type text/html;
        return 503 '<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>در حال راه‌اندازی</title></head><body style="font-family:tahoma;text-align:center;padding:40px"><h1>سایت در حال راه‌اندازی است</h1><p>لطفاً DNS دامنه <strong>${domain}</strong> را به IP سرور تنظیم کنید.</p><p>رکورد A: @ → ${provisioningConfig.serverPublicIp || 'SERVER_IP'}</p></body></html>';
    }
}
`;
  }

  return `# Auto-generated active vhost for ${slug} → core-server
server {
    listen 80;
    server_name ${domain} www.${domain};

    location / {
        proxy_pass http://127.0.0.1:${upstreamPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
`;
}

export async function writeNginxConfig(
  slug: string,
  domain: string,
  mode: NginxMode,
): Promise<string> {
  await fs.ensureDir(provisioningConfig.nginxSitesDir);
  const configPath = path.join(provisioningConfig.nginxSitesDir, `${slug}.conf`);
  const content = buildNginxConfig(slug, domain, mode);
  await fs.writeFile(configPath, content, 'utf8');
  return configPath;
}

export async function reloadNginx(): Promise<void> {
  if (process.env.NODE_ENV === 'development') return;
  try {
    const { execa } = await import('execa');
    await execa('nginx', ['-s', 'reload'], { reject: false });
  } catch {
    // Nginx may not be available in dev
  }
}
