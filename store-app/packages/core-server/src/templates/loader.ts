import type { Router } from 'express';
import { registerShopStarterRoutes } from '../../../../site-templates/shop-starter-v1/register';

const TEMPLATE_REGISTRARS: Record<string, (router: Router) => void> = {
  'shop-starter-v1': registerShopStarterRoutes,
};

export function mountTemplateRoutes(router: Router): void {
  for (const register of Object.values(TEMPLATE_REGISTRARS)) {
    register(router);
  }
}

export function getRegisteredTemplateSlugs(): string[] {
  return Object.keys(TEMPLATE_REGISTRARS);
}
