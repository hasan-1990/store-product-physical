/** نقطه ورود Express — API + static + UI */
export {
  registerShopStarterAll as registerShopStarterRoutes,
  registerShopStarterApi,
  shopStarterTemplate,
  SHOP_STARTER_SLUG,
} from './express/routes';

export { registerShopStarterStatic } from './express/static';
export { registerShopStarterUi } from './express/ui/routes';
