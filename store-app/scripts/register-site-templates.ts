import path from 'path';
import { syncTemplatesFromDisk } from '../src/lib/provisioning/template-registry';

async function main() {
  process.chdir(path.join(__dirname, '..'));

  console.log('🔄 همگام‌سازی قالب‌ها از دیسک...\n');
  const result = await syncTemplatesFromDisk();

  if (result.synced.length > 0) {
    console.log('✅ ثبت/به‌روزرسانی شد:');
    result.synced.forEach((slug) => console.log(`   - ${slug}`));
  }

  if (result.skipped.length > 0) {
    console.log('\n⏭️  رد شد (بدون template.config.json معتبر):');
    result.skipped.forEach((folder) => console.log(`   - ${folder}`));
  }

  if (result.synced.length === 0 && result.skipped.length === 0) {
    console.log('⚠️  هیچ پوشه‌ای در site-templates/ یافت نشد.');
  }

  console.log('');
}

main().catch((error) => {
  console.error('❌ خطا:', error instanceof Error ? error.message : error);
  process.exit(1);
});
