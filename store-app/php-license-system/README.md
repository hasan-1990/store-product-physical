# 📦 PHP License System

فایل‌های PHP برای پیاده‌سازی سیستم لایسنس در قالب‌ها و افزونه‌های وردپرس.

---

## 📄 فایل‌های موجود

### 1. `class-license-manager.php`
**کلاس اصلی مدیریت لایسنس**

قابلیت‌ها:
- ✅ ارتباط با API سرور لایسنس
- ✅ چک کردن اعتبار لایسنس
- ✅ کش کردن نتایج (24 ساعت)
- ✅ مدیریت فعال‌سازی/غیرفعال‌سازی
- ✅ نمایش اعلان‌های ادمین

### 2. `license-settings-page.php`
**صفحه تنظیمات در پنل وردپرس**

شامل:
- ✅ فرم ورود License Key
- ✅ نمایش وضعیت لایسنس
- ✅ دکمه‌های فعال‌سازی/غیرفعال‌سازی
- ✅ راهنمای کامل

### 3. `example-usage-theme.php`
**نمونه‌های استفاده در قالب وردپرس**

10 مثال کاربردی:
- محدود کردن صفحات تنظیمات
- غیرفعال کردن ویژگی‌ها
- محدود کردن ویجت‌ها
- Shortcode با لایسنس
- Customizer settings
- و موارد دیگر...

### 4. `example-plugin-main.php`
**نمونه پیاده‌سازی در افزونه وردپرس**

ساختار کامل افزونه با:
- بارگذاری شرطی قابلیت‌ها
- Hook های activation/deactivation
- مدیریت Post Types و Meta Boxes

---

## 🚀 نصب سریع

### برای قالب وردپرس:

#### گام 1: کپی فایل‌ها

```
your-theme/
├── inc/
│   ├── class-license-manager.php       ← کپی کنید
│   └── license-settings-page.php       ← کپی کنید
└── functions.php
```

#### گام 2: Include در functions.php

```php
<?php
// در ابتدای functions.php

require_once get_template_directory() . '/inc/class-license-manager.php';
require_once get_template_directory() . '/inc/license-settings-page.php';

// ایجاد نمونه سراسری
global $theme_license;
$theme_license = new License_Manager(
    '67890abcdef12345',                              // Product ID از MongoDB
    'قالب فروشگاهی شما',                             // نام محصول
    'https://yoursite.com/api/licenses/verify'       // URL API
);
```

#### گام 3: استفاده در قالب

```php
function my_premium_feature() {
    global $theme_license;
    
    if (!$theme_license->is_license_valid()) {
        return; // خروج اگر لایسنس معتبر نباشد
    }
    
    // کد قابلیت پریمیوم
    ?>
    <div class="premium-widget">
        این یک ویژگی پریمیوم است!
    </div>
    <?php
}
add_action('wp_footer', 'my_premium_feature');
```

---

### برای افزونه وردپرس:

#### گام 1: ساختار افزونه

```
my-premium-plugin/
├── my-premium-plugin.php              ← فایل اصلی
├── inc/
│   ├── class-license-manager.php      ← کپی کنید
│   └── license-settings-page.php      ← کپی کنید
├── inc/premium/
│   ├── feature-1.php
│   └── feature-2.php
└── readme.txt
```

#### گام 2: فایل اصلی افزونه

```php
<?php
/**
 * Plugin Name: My Premium Plugin
 * Description: یک افزونه پریمیوم با سیستم لایسنس
 * Version: 1.0.0
 * Author: Your Name
 */

if (!defined('ABSPATH')) exit;

define('MY_PLUGIN_DIR', plugin_dir_path(__FILE__));

require_once MY_PLUGIN_DIR . 'inc/class-license-manager.php';
require_once MY_PLUGIN_DIR . 'inc/license-settings-page.php';

class My_Premium_Plugin {
    private $license;
    
    public function __construct() {
        $this->license = new License_Manager(
            'plugin-abc-123',
            'My Premium Plugin',
            'https://yoursite.com/api/licenses/verify'
        );
        
        if ($this->license->is_license_valid()) {
            $this->load_premium_features();
        } else {
            add_action('admin_notices', array($this, 'license_notice'));
        }
    }
    
    private function load_premium_features() {
        require_once MY_PLUGIN_DIR . 'inc/premium/feature-1.php';
        require_once MY_PLUGIN_DIR . 'inc/premium/feature-2.php';
    }
    
    public function license_notice() {
        ?>
        <div class="notice notice-warning">
            <p>لطفاً لایسنس افزونه را فعال کنید.</p>
        </div>
        <?php
    }
}

new My_Premium_Plugin();
```

---

## ⚙️ تنظیمات

### تنظیمات ضروری در `class-license-manager.php`:

```php
class License_Manager {
    
    // 1. URL سرور لایسنس (HTTPS الزامی)
    private $api_url = 'https://yoursite.com/api/licenses/verify';
    
    // 2. شناسه محصول (باید با productId در MongoDB یکسان باشد)
    private $product_id = 'YOUR_PRODUCT_ID';
    
    // 3. نام محصول
    private $product_name = 'YOUR_PRODUCT_NAME';
    
    // 4. مدت کش (ثانیه)
    private $cache_duration = 86400; // 24 ساعت
    
    // ...
}
```

### پیدا کردن Product ID:

```javascript
// در MongoDB Shell یا Compass
db.products.find({ name: "نام محصول شما" })
// _id رو کپی کنید
```

---

## 📖 مثال‌های کاربردی

### 1. محدود کردن یک صفحه تنظیمات

```php
function advanced_settings_page() {
    global $theme_license;
    
    // چک لایسنس
    $theme_license->require_valid_license();
    
    // صفحه تنظیمات
    ?>
    <div class="wrap">
        <h1>تنظیمات پیشرفته</h1>
        <!-- محتوا -->
    </div>
    <?php
}

add_menu_page(
    'تنظیمات پیشرفته',
    'تنظیمات پیشرفته',
    'manage_options',
    'advanced-settings',
    'advanced_settings_page'
);
```

### 2. Shortcode با چک لایسنس

```php
function premium_gallery_shortcode($atts) {
    global $theme_license;
    
    if (!$theme_license->is_license_valid()) {
        return '<p style="color:red;">این shortcode نیاز به لایسنس معتبر دارد.</p>';
    }
    
    // کد گالری
    return '<div class="premium-gallery">...</div>';
}
add_shortcode('premium_gallery', 'premium_gallery_shortcode');
```

### 3. محدود کردن ویجت

```php
class Premium_Widget extends WP_Widget {
    
    public function widget($args, $instance) {
        global $theme_license;
        
        if (!$theme_license->is_license_valid()) {
            echo '<p>این ویجت نیاز به لایسنس دارد.</p>';
            return;
        }
        
        // محتوای ویجت
        echo $args['before_widget'];
        // ...
        echo $args['after_widget'];
    }
}

function register_premium_widgets() {
    global $theme_license;
    
    if ($theme_license->is_license_valid()) {
        register_widget('Premium_Widget');
    }
}
add_action('widgets_init', 'register_premium_widgets');
```

### 4. چک دوره‌ای خودکار

```php
// هر 12 ساعت یکبار چک کن
function schedule_license_check() {
    if (!wp_next_scheduled('auto_check_license')) {
        wp_schedule_event(time(), 'twicedaily', 'auto_check_license');
    }
}
add_action('wp', 'schedule_license_check');

function auto_check_license() {
    global $theme_license;
    $theme_license->check_license_status();
}
add_action('auto_check_license', 'auto_check_license');

// پاکسازی هنگام غیرفعال‌سازی
function cleanup_schedule() {
    wp_clear_scheduled_hook('auto_check_license');
}
register_deactivation_hook(__FILE__, 'cleanup_schedule');
```

---

## 🔍 API Methods

### متدهای عمومی کلاس `License_Manager`:

#### `save_license_key($license_key)`
ذخیره کلید لایسنس در دیتابیس.

```php
$license->save_license_key('ABCD-EFGH-IJKL-MNOP');
```

#### `get_license_key()`
دریافت کلید لایسنس ذخیره شده.

```php
$key = $license->get_license_key();
```

#### `activate_license($license_key = null)`
فعال‌سازی لایسنس.

```php
$result = $license->activate_license('ABCD-EFGH-IJKL-MNOP');
if ($result['valid']) {
    echo 'فعال شد!';
}
```

#### `is_license_valid()`
چک کردن اعتبار لایسنس (از کش).

```php
if ($license->is_license_valid()) {
    // کد پریمیوم
}
```

#### `check_license_status()`
چک مجدد از سرور (بدون کش).

```php
$is_valid = $license->check_license_status();
```

#### `delete_license()`
حذف کامل لایسنس.

```php
$license->delete_license();
```

#### `require_valid_license()`
اجبار به لایسنس معتبر (در غیر این صورت wp_die).

```php
$license->require_valid_license();
```

#### `get_license_data()`
دریافت اطلاعات کامل لایسنس.

```php
$data = $license->get_license_data();
echo $data['license']['domain']; // example.com
```

---

## 🔒 امنیت

### نکات امنیتی:

1. **همیشه HTTPS**: API URL باید HTTPS باشه
2. **Server-Side Check**: هیچ وقت فقط به کش اعتماد نکنید
3. **IP Logging**: IP فعال‌سازی‌ها ذخیره می‌شه
4. **Caching**: کش برای کاهش بار، نه امنیت

### مثال چک امن:

```php
// ✅ درست
if (!$license->is_license_valid()) {
    return; // محدود کردن
}

// ❌ غلط - قابل دستکاری
if (get_option('my_license_valid') == 'yes') {
    // کاربر می‌تونه option رو تغییر بده
}
```

---

## 🐛 عیب‌یابی

### مشکل: لایسنس فعال نمی‌شه

**چک کنید:**
1. API URL درست باشه (با https://)
2. Product ID یکسان باشه
3. دامنه درست وارد شده (بدون www)
4. سرور در دسترس باشه

**Debug:**
```php
// فعال کردن خطاها
error_reporting(E_ALL);
ini_set('display_errors', 1);

// چک کردن response
$result = $license->activate_license('XXXX-XXXX-XXXX-XXXX');
var_dump($result); // نمایش پاسخ کامل
```

### مشکل: خطای SSL Certificate

```php
// موقت برای تست (فقط در localhost)
// در call_api متد:
'sslverify' => false, // فقط برای تست!
```

### مشکل: کش قدیمی

```php
// پاک کردن کش دستی
delete_transient($this->license_status_option);
delete_option($this->license_data_option);
```

---

## 📊 لاگ و مانیتورینگ

### اضافه کردن لاگ:

```php
// در متد call_api
private function call_api($data) {
    // لاگ درخواست
    error_log('License API Request: ' . print_r($data, true));
    
    $response = wp_remote_post($this->api_url, [...]);
    
    if (is_wp_error($response)) {
        error_log('License API Error: ' . $response->get_error_message());
        return false;
    }
    
    // لاگ پاسخ
    $body = wp_remote_retrieve_body($response);
    error_log('License API Response: ' . $body);
    
    return json_decode($body, true);
}
```

---

## ⚡ بهینه‌سازی

### کاهش بار سرور:

```php
// کش طولانی‌تر (48 ساعت)
private $cache_duration = 172800;
```

### Fallback برای خرابی سرور:

```php
if (is_wp_error($response)) {
    // اگر سرور down بود، از آخرین کش استفاده کن
    $cached = get_transient($this->license_status_option);
    if ($cached) {
        return array('valid' => true);
    }
}
```

---

## 📞 پشتیبانی

- **مستندات کامل:** `../LICENSE-SYSTEM-README.md`
- **راهنمای سریع:** `../QUICK-START-LICENSE.md`
- **نمونه‌های بیشتر:** `example-usage-theme.php` و `example-plugin-main.php`

---

**نسخه:** 1.0.0  
**سازگار با:** WordPress 5.0+  
**نیازمندی‌ها:** PHP 7.4+, cURL enabled
