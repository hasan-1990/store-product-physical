import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface ProcessFileRequest {
  filePath: string;
  productId: string;
  fileType: 'theme' | 'plugin' | 'auto-detect';
  apiUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { filePath, productId, fileType, apiUrl = process.env.NEXT_PUBLIC_API_URL } = await request.json() as ProcessFileRequest;

    if (!filePath || !productId || !fileType) {
      return NextResponse.json(
        { success: false, error: 'پارامترهای مورد نیاز ارسال نشده است' },
        { status: 400 }
      );
    }

    // بررسی وجود فایل
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: 'فایل یافت نشد' },
        { status: 404 }
      );
    }

    const result = await processUploadedFile({
      filePath,
      productId,
      fileType: fileType === 'auto-detect' ? 'theme' : fileType, // پیش‌فرض theme
      apiUrl: apiUrl || 'https://yourstore.com/api/licenses'
    });

    return NextResponse.json({
      success: true,
      message: 'فایل با موفقیت پردازش شد',
      processedFilePath: result.processedFilePath,
      injectedFiles: result.injectedFiles,
      fileName: path.basename(result.processedFilePath)
    });

  } catch (error) {
    console.error('خطا در پردازش فایل:', error);
    return NextResponse.json(
      { success: false, error: 'خطا در پردازش فایل' },
      { status: 500 }
    );
  }
}

async function processUploadedFile(params: {
  filePath: string;
  productId: string;
  fileType: 'theme' | 'plugin';
  apiUrl: string;
}) {
  const { filePath, productId, fileType, apiUrl } = params;
  
  // ایجاد پوشه موقت
  const tempDir = path.join(process.cwd(), 'temp', uuidv4());
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    // استخراج فایل ZIP
    const zip = new AdmZip(filePath);
    zip.extractAllTo(tempDir, true);

    // پیدا کردن پوشه اصلی پروژه
    const projectDir = findProjectDirectory(tempDir, fileType);
    
    if (!projectDir) {
      throw new Error('ساختار پروژه نامعتبر است');
    }

    // تزریق کد لایسنس
    const injectedFiles = await injectLicenseCode(projectDir, productId, fileType, apiUrl);

    // ایجاد فایل ZIP جدید
    const processedFilePath = createProcessedZip(projectDir, filePath);

    // پاک کردن فایل‌های موقت
    fs.rmSync(tempDir, { recursive: true, force: true });

    return {
      processedFilePath,
      injectedFiles
    };

  } catch (error) {
    // پاک کردن فایل‌های موقت در صورت خطا
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    throw error;
  }
}

function findProjectDirectory(extractPath: string, fileType: 'theme' | 'plugin'): string | null {
  const items = fs.readdirSync(extractPath);
  
  // بررسی آیا فایل‌ها مستقیماً در root هستند
  if (fileType === 'theme') {
    if (items.includes('style.css') || items.includes('functions.php')) {
      return extractPath;
    }
  } else if (fileType === 'plugin') {
    const phpFiles = items.filter(item => item.endsWith('.php') && item !== 'index.php');
    if (phpFiles.length > 0) {
      const mainFile = phpFiles.find(file => {
        const content = fs.readFileSync(path.join(extractPath, file), 'utf8');
        return content.includes('Plugin Name:');
      });
      if (mainFile) {
        return extractPath;
      }
    }
  }

  // جستجو در زیرپوشه‌ها
  for (const item of items) {
    const itemPath = path.join(extractPath, item);
    if (fs.statSync(itemPath).isDirectory()) {
      const result = findProjectDirectory(itemPath, fileType);
      if (result) return result;
    }
  }

  return null;
}

async function injectLicenseCode(
  projectDir: string,
  productId: string,
  fileType: 'theme' | 'plugin',
  apiUrl: string
): Promise<string[]> {
  const injectedFiles: string[] = [];

  if (fileType === 'theme') {
    // تزریق در قالب
    await injectThemeLicense(projectDir, productId, apiUrl);
    injectedFiles.push('license/class-license-manager.php', 'functions.php');
  } else {
    // تزریق در افزونه
    await injectPluginLicense(projectDir, productId, apiUrl);
    injectedFiles.push('includes/class-license-manager.php', 'main-plugin-file.php');
  }

  return injectedFiles;
}

async function injectThemeLicense(projectDir: string, productId: string, apiUrl: string) {
  // ایجاد پوشه license
  const licenseDir = path.join(projectDir, 'license');
  if (!fs.existsSync(licenseDir)) {
    fs.mkdirSync(licenseDir);
  }

  // ایجاد کلاس License Manager
  const licenseManagerCode = generateLicenseManagerClass(productId, apiUrl);
  fs.writeFileSync(path.join(licenseDir, 'class-license-manager.php'), licenseManagerCode);

  // تزریق کد در functions.php
  const functionsPath = path.join(projectDir, 'functions.php');
  const licenseCode = generateThemeLicenseCode(productId);

  if (fs.existsSync(functionsPath)) {
    let functionsContent = fs.readFileSync(functionsPath, 'utf8');
    
    if (!functionsContent.includes('License_Manager')) {
      // اضافه کردن کد لایسنس بعد از <?php
      functionsContent = functionsContent.replace(
        /(<\?php[\s\S]*?)(\n|$)/,
        `$1\n${licenseCode}\n$2`
      );
      fs.writeFileSync(functionsPath, functionsContent);
    }
  } else {
    // ایجاد functions.php جدید
    const newFunctionsCode = `<?php\n${licenseCode}`;
    fs.writeFileSync(functionsPath, newFunctionsCode);
  }
}

async function injectPluginLicense(projectDir: string, productId: string, apiUrl: string) {
  // ایجاد پوشه includes
  const includesDir = path.join(projectDir, 'includes');
  if (!fs.existsSync(includesDir)) {
    fs.mkdirSync(includesDir);
  }

  // ایجاد کلاس License Manager
  const licenseManagerCode = generateLicenseManagerClass(productId, apiUrl);
  fs.writeFileSync(path.join(includesDir, 'class-license-manager.php'), licenseManagerCode);

  // پیدا کردن فایل اصلی افزونه
  const phpFiles = fs.readdirSync(projectDir).filter(file => 
    file.endsWith('.php') && file !== 'index.php'
  );

  let mainPluginFile = null;
  for (const file of phpFiles) {
    const content = fs.readFileSync(path.join(projectDir, file), 'utf8');
    if (content.includes('Plugin Name:')) {
      mainPluginFile = file;
      break;
    }
  }

  if (mainPluginFile) {
    const mainFilePath = path.join(projectDir, mainPluginFile);
    let mainFileContent = fs.readFileSync(mainFilePath, 'utf8');
    
    if (!mainFileContent.includes('License_Manager')) {
      const licenseCode = generatePluginLicenseCode(productId);
      
      // اضافه کردن کد بعد از header comment
      mainFileContent = mainFileContent.replace(
        /(\*\/\s*)/,
        `$1\n${licenseCode}\n`
      );
      fs.writeFileSync(mainFilePath, mainFileContent);
    }
  }
}

function createProcessedZip(projectDir: string, originalFilePath: string): string {
  const zip = new AdmZip();
  
  // اضافه کردن همه فایل‌ها به ZIP
  zip.addLocalFolder(projectDir);
  
  // ایجاد نام فایل جدید
  const parsedPath = path.parse(originalFilePath);
  const processedFilePath = path.join(
    parsedPath.dir,
    `${parsedPath.name}-licensed${parsedPath.ext}`
  );
  
  // نوشتن فایل ZIP
  zip.writeZip(processedFilePath);
  
  return processedFilePath;
}

function generateLicenseManagerClass(productId: string, apiUrl: string): string {
  return `<?php
/**
 * License Manager Class - Auto Generated
 * Product ID: ${productId}
 * Generated: ${new Date().toISOString()}
 */

if (!defined('ABSPATH')) {
    exit;
}

class License_Manager {
    
    private $api_url = '${apiUrl}';
    private $product_id = '${productId}';
    private $cache_duration = 24 * HOUR_IN_SECONDS;
    
    public function __construct() {
        // License system initialization
    }
    
    public function verify_license() {
        $license_key = $this->get_license_key();
        
        if (empty($license_key)) {
            return false;
        }
        
        // Check cache first
        $cache_key = 'license_status_' . md5($license_key . $this->product_id);
        $cached_result = get_transient($cache_key);
        
        if ($cached_result !== false) {
            return $cached_result === 'valid';
        }
        
        // Verify with server
        $result = $this->check_license_with_server($license_key);
        
        // Cache result
        set_transient($cache_key, $result ? 'valid' : 'invalid', $this->cache_duration);
        
        return $result;
    }
    
    private function check_license_with_server($license_key) {
        $domain = $this->get_current_domain();
        
        $response = wp_remote_post($this->api_url . '/verify', array(
            'body' => json_encode(array(
                'licenseKey' => $license_key,
                'domain' => $domain,
                'productId' => $this->product_id
            )),
            'headers' => array(
                'Content-Type' => 'application/json'
            ),
            'timeout' => 30,
            'sslverify' => false
        ));
        
        if (is_wp_error($response)) {
            error_log('License verification error: ' . $response->get_error_message());
            return false;
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        return isset($data['success']) && $data['success'] === true;
    }
    
    public function activate_license($license_key) {
        $domain = $this->get_current_domain();
        
        $response = wp_remote_post($this->api_url . '/activate', array(
            'body' => json_encode(array(
                'licenseKey' => $license_key,
                'domain' => $domain,
                'productId' => $this->product_id
            )),
            'headers' => array(
                'Content-Type' => 'application/json'
            ),
            'timeout' => 30,
            'sslverify' => false
        ));
        
        if (is_wp_error($response)) {
            return false;
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (isset($data['success']) && $data['success'] === true) {
            update_option($this->get_license_option_name(), $license_key);
            $this->clear_license_cache($license_key);
            return true;
        }
        
        return false;
    }
    
    private function get_license_key() {
        return get_option($this->get_license_option_name(), '');
    }
    
    private function get_license_option_name() {
        return 'license_key_' . $this->product_id;
    }
    
    private function get_current_domain() {
        $domain = parse_url(home_url(), PHP_URL_HOST);
        return str_replace('www.', '', $domain);
    }
    
    private function clear_license_cache($license_key) {
        $cache_key = 'license_status_' . md5($license_key . $this->product_id);
        delete_transient($cache_key);
    }
    
    public function get_license_status() {
        $license_key = $this->get_license_key();
        
        if (empty($license_key)) {
            return 'no_license';
        }
        
        if ($this->verify_license()) {
            return 'active';
        }
        
        return 'invalid';
    }
}
?>`;
}

function generateThemeLicenseCode(productId: string): string {
  return `
// =============================================================================
// 🔐 License System - Auto Generated on ${new Date().toLocaleString('fa-IR')}
// Product ID: ${productId}
// =============================================================================

require_once get_template_directory() . '/license/class-license-manager.php';

add_action('after_setup_theme', 'check_theme_license_${productId}');

function check_theme_license_${productId}() {
    $license_manager = new License_Manager();
    
    if (!$license_manager->verify_license()) {
        add_action('admin_notices', 'show_theme_license_warning_${productId}');
        
        // محدود کردن ویژگی‌های قالب
        add_action('wp_head', 'add_unlicensed_notice_${productId}');
        remove_theme_support('custom-header');
        remove_theme_support('custom-background');
        
        // محدود کردن منوها
        add_filter('wp_get_nav_menus', function($menus) {
            return array_slice($menus, 0, 1); // فقط یک منو
        });
    }
}

function show_theme_license_warning_${productId}() {
    $license_url = admin_url('themes.php?page=theme-license-${productId}');
    echo '<div class="notice notice-error is-dismissible">';
    echo '<p><strong>⚠️ این قالب نیاز به فعال‌سازی لایسنس دارد</strong></p>';
    echo '<p>برای استفاده کامل از ویژگی‌های قالب، لطفاً لایسنس خود را فعال کنید.</p>';
    echo '<p><a href="' . $license_url . '" class="button-primary">فعال‌سازی لایسنس</a></p>';
    echo '</div>';
}

function add_unlicensed_notice_${productId}() {
    if (!is_admin()) {
        echo '<!-- قالب نیاز به لایسنس معتبر دارد -->';
    }
}

// صفحه تنظیمات لایسنس
add_action('admin_menu', 'add_theme_license_menu_${productId}');

function add_theme_license_menu_${productId}() {
    add_theme_page(
        'تنظیمات لایسنس',
        '🔐 لایسنس قالب', 
        'manage_options',
        'theme-license-${productId}',
        'theme_license_settings_page_${productId}'
    );
}

function theme_license_settings_page_${productId}() {
    $license_manager = new License_Manager();
    $message = '';
    
    if (isset($_POST['submit'])) {
        $license_key = sanitize_text_field($_POST['license_key']);
        
        if (!empty($license_key)) {
            if ($license_manager->activate_license($license_key)) {
                $message = '<div class="notice notice-success"><p>✅ لایسنس با موفقیت فعال شد!</p></div>';
            } else {
                $message = '<div class="notice notice-error"><p>❌ خطا در فعال‌سازی لایسنس! لطفاً کلید را بررسی کنید.</p></div>';
            }
        }
    }
    
    $current_license = get_option('license_key_${productId}', '');
    $license_status = $license_manager->get_license_status();
    
    ?>
    <div class="wrap">
        <h1>🔐 تنظیمات لایسنس قالب</h1>
        <?php echo $message; ?>
        
        <div class="card" style="max-width: 600px;">
            <h2>وضعیت فعلی لایسنس</h2>
            <?php if ($license_status === 'active'): ?>
                <p style="color: green; font-size: 16px;"><strong>✅ لایسنس فعال و معتبر است</strong></p>
                <p>تمامی ویژگی‌های قالب در دسترس شما قرار دارد.</p>
            <?php elseif ($license_status === 'invalid'): ?>
                <p style="color: red; font-size: 16px;"><strong>❌ لایسنس نامعتبر است</strong></p>
                <p>لطفاً کلید لایسنس صحیح را وارد کنید.</p>
            <?php else: ?>
                <p style="color: orange; font-size: 16px;"><strong>⚠️ لایسنس تنظیم نشده است</strong></p>
                <p>برای استفاده کامل از قالب، لطفاً لایسنس خود را فعال کنید.</p>
            <?php endif; ?>
        </div>
        
        <form method="post" action="" style="max-width: 600px;">
            <table class="form-table">
                <tr>
                    <th scope="row">
                        <label for="license_key">کلید لایسنس</label>
                    </th>
                    <td>
                        <input type="text" 
                               id="license_key" 
                               name="license_key" 
                               value="<?php echo esc_attr($current_license); ?>" 
                               class="regular-text" 
                               placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                               style="direction: ltr;" />
                        <p class="description">
                            کلید لایسنس خود را از پنل کاربری فروشگاه دریافت کنید.
                        </p>
                    </td>
                </tr>
            </table>
            
            <?php submit_button('فعال‌سازی لایسنس', 'primary', 'submit', false); ?>
        </form>
        
        <div class="card" style="max-width: 600px; margin-top: 20px;">
            <h3>📋 راهنمای فعال‌سازی</h3>
            <ol>
                <li>وارد پنل کاربری خود در سایت فروشگاه شوید</li>
                <li>به بخش "لایسنس‌های من" بروید</li>
                <li>کلید لایسنس مربوط به این قالب را کپی کنید</li>
                <li>در فیلد بالا وارد کرده و ذخیره کنید</li>
                <li>منتظر تأیید سرور باشید</li>
            </ol>
            
            <h3>🔧 پشتیبانی</h3>
            <p>در صورت مشکل در فعال‌سازی لایسنس، با پشتیبانی تماس بگیرید.</p>
        </div>
    </div>
    <?php
}

// =============================================================================
// End License System
// =============================================================================
`;
}

function generatePluginLicenseCode(productId: string): string {
  return `
// =============================================================================
// 🔐 License System - Auto Generated on ${new Date().toLocaleString('fa-IR')}
// Product ID: ${productId}
// =============================================================================

require_once plugin_dir_path(__FILE__) . 'includes/class-license-manager.php';

class Plugin_License_Handler_${productId} {
    
    private $license_manager;
    
    public function __construct() {
        $this->license_manager = new License_Manager();
        
        register_activation_hook(__FILE__, array($this, 'activate_plugin'));
        add_action('plugins_loaded', array($this, 'init_plugin'));
        add_action('admin_menu', array($this, 'add_license_menu'));
        add_action('admin_notices', array($this, 'admin_notices'));
    }
    
    public function activate_plugin() {
        if (!$this->license_manager->verify_license()) {
            add_option('plugin_license_warning_${productId}', true);
        }
    }
    
    public function init_plugin() {
        if ($this->license_manager->verify_license()) {
            $this->load_premium_features();
        } else {
            $this->load_limited_features();
        }
    }
    
    private function load_premium_features() {
        do_action('plugin_premium_loaded_${productId}');
    }
    
    private function load_limited_features() {
        do_action('plugin_limited_loaded_${productId}');
    }
    
    public function admin_notices() {
        if (get_option('plugin_license_warning_${productId}')) {
            $license_url = admin_url('options-general.php?page=plugin-license-${productId}');
            echo '<div class="notice notice-warning is-dismissible">';
            echo '<p><strong>⚠️ این افزونه نیاز به فعال‌سازی لایسنس دارد</strong></p>';
            echo '<p><a href="' . $license_url . '" class="button-primary">فعال‌سازی لایسنس</a></p>';
            echo '</div>';
        }
    }
    
    public function add_license_menu() {
        add_options_page(
            'تنظیمات لایسنس افزونه',
            '🔐 لایسنس افزونه',
            'manage_options',
            'plugin-license-${productId}',
            array($this, 'license_settings_page')
        );
    }
    
    public function license_settings_page() {
        // نمایش صفحه تنظیمات لایسنس
        include plugin_dir_path(__FILE__) . 'includes/license-settings-page.php';
    }
}

new Plugin_License_Handler_${productId}();

// =============================================================================
// End License System
// =============================================================================
`;
}