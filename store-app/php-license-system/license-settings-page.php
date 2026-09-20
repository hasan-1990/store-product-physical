<?php
/**
 * صفحه تنظیمات لایسنس برای پنل وردپرس
 * این فایل یک صفحه ادمین ایجاد می‌کند که کاربر می‌تواند لایسنس را فعال کند
 */

if (!defined('ABSPATH')) {
    exit;
}

// Include کلاس License Manager
require_once get_template_directory() . '/inc/class-license-manager.php';

class License_Settings_Page {
    
    private $license_manager;
    
    public function __construct() {
        // ایجاد نمونه از License Manager
        $this->license_manager = new License_Manager(
            'YOUR_PRODUCT_ID',      // شناسه محصول
            'نام قالب یا افزونه',   // نام محصول
            'https://yoursite.com/api/licenses/verify' // URL API
        );
        
        // اضافه کردن منو
        add_action('admin_menu', array($this, 'add_menu_page'));
        
        // پردازش فرم
        add_action('admin_init', array($this, 'handle_form_submission'));
    }
    
    /**
     * اضافه کردن صفحه منو
     */
    public function add_menu_page() {
        add_menu_page(
            'تنظیمات لایسنس',           // عنوان صفحه
            'لایسنس',                    // عنوان منو
            'manage_options',            // سطح دسترسی
            'license-settings',          // slug
            array($this, 'render_page'), // تابع نمایش
            'dashicons-admin-network',   // آیکون
            100                          // اولویت
        );
    }
    
    /**
     * پردازش فرم
     */
    public function handle_form_submission() {
        if (!isset($_POST['license_action'])) {
            return;
        }
        
        // بررسی nonce
        if (!isset($_POST['license_nonce']) || !wp_verify_nonce($_POST['license_nonce'], 'license_action')) {
            return;
        }
        
        // بررسی دسترسی
        if (!current_user_can('manage_options')) {
            return;
        }
        
        $action = sanitize_text_field($_POST['license_action']);
        
        if ($action === 'activate') {
            $license_key = isset($_POST['license_key']) ? sanitize_text_field($_POST['license_key']) : '';
            
            if (!empty($license_key)) {
                $result = $this->license_manager->activate_license($license_key);
                
                if (isset($result['valid']) && $result['valid']) {
                    add_settings_error(
                        'license_messages',
                        'license_activated',
                        'لایسنس با موفقیت فعال شد!',
                        'success'
                    );
                } else {
                    $message = isset($result['message']) ? $result['message'] : 'خطا در فعال‌سازی لایسنس';
                    add_settings_error(
                        'license_messages',
                        'license_error',
                        $message,
                        'error'
                    );
                }
            }
        } elseif ($action === 'deactivate') {
            $this->license_manager->delete_license();
            add_settings_error(
                'license_messages',
                'license_deactivated',
                'لایسنس غیرفعال شد',
                'success'
            );
        } elseif ($action === 'check') {
            $this->license_manager->check_license_status();
            add_settings_error(
                'license_messages',
                'license_checked',
                'وضعیت لایسنس بررسی شد',
                'success'
            );
        }
    }
    
    /**
     * نمایش صفحه تنظیمات
     */
    public function render_page() {
        $license_key = $this->license_manager->get_license_key();
        $is_valid = $this->license_manager->is_license_valid();
        $license_data = $this->license_manager->get_license_data();
        
        ?>
        <div class="wrap" dir="rtl">
            <h1>تنظیمات لایسنس</h1>
            
            <?php settings_errors('license_messages'); ?>
            
            <div class="card" style="max-width: 800px; margin-top: 20px;">
                <h2>وضعیت لایسنس</h2>
                
                <?php if ($is_valid): ?>
                    <div class="notice notice-success inline">
                        <p><strong>✓ لایسنس فعال است</strong></p>
                    </div>
                    
                    <?php if (isset($license_data['license'])): ?>
                        <table class="form-table">
                            <tr>
                                <th>کلید لایسنس:</th>
                                <td><code><?php echo esc_html($license_key); ?></code></td>
                            </tr>
                            <tr>
                                <th>دامنه:</th>
                                <td><?php echo esc_html($license_data['license']['domain']); ?></td>
                            </tr>
                            <tr>
                                <th>وضعیت:</th>
                                <td>
                                    <span class="dashicons dashicons-yes-alt" style="color: green;"></span>
                                    <?php echo esc_html($license_data['license']['status']); ?>
                                </td>
                            </tr>
                            <?php if (isset($license_data['license']['activatedAt'])): ?>
                            <tr>
                                <th>تاریخ فعال‌سازی:</th>
                                <td><?php echo esc_html(date_i18n('Y/m/d H:i', strtotime($license_data['license']['activatedAt']))); ?></td>
                            </tr>
                            <?php endif; ?>
                            <?php if (isset($license_data['license']['expiresAt']) && $license_data['license']['expiresAt']): ?>
                            <tr>
                                <th>تاریخ انقضا:</th>
                                <td><?php echo esc_html(date_i18n('Y/m/d', strtotime($license_data['license']['expiresAt']))); ?></td>
                            </tr>
                            <?php endif; ?>
                        </table>
                    <?php endif; ?>
                    
                    <form method="post" style="margin-top: 20px;">
                        <?php wp_nonce_field('license_action', 'license_nonce'); ?>
                        <input type="hidden" name="license_action" value="deactivate">
                        <button type="submit" class="button button-secondary">
                            غیرفعال‌سازی لایسنس
                        </button>
                        <button type="submit" name="license_action" value="check" class="button">
                            بررسی مجدد وضعیت
                        </button>
                    </form>
                    
                <?php else: ?>
                    <div class="notice notice-warning inline">
                        <p><strong>⚠ لایسنس فعال نیست</strong></p>
                        <p>برای استفاده از تمام امکانات، لطفاً لایسنس را فعال کنید.</p>
                    </div>
                    
                    <form method="post" style="margin-top: 20px;">
                        <?php wp_nonce_field('license_action', 'license_nonce'); ?>
                        <input type="hidden" name="license_action" value="activate">
                        
                        <table class="form-table">
                            <tr>
                                <th scope="row">
                                    <label for="license_key">کلید لایسنس</label>
                                </th>
                                <td>
                                    <input 
                                        type="text" 
                                        id="license_key" 
                                        name="license_key" 
                                        value="<?php echo esc_attr($license_key); ?>" 
                                        class="regular-text code"
                                        placeholder="XXXX-XXXX-XXXX-XXXX"
                                        style="direction: ltr; text-align: left;"
                                    >
                                    <p class="description">
                                        کلید لایسنس خود را که از پنل کاربری دریافت کرده‌اید، وارد کنید.
                                    </p>
                                </td>
                            </tr>
                        </table>
                        
                        <?php submit_button('فعال‌سازی لایسنس', 'primary', 'submit', false); ?>
                    </form>
                <?php endif; ?>
            </div>
            
            <!-- راهنما -->
            <div class="card" style="max-width: 800px; margin-top: 20px;">
                <h2>راهنمای فعال‌سازی</h2>
                <ol>
                    <li>به پنل کاربری سایت فروشگاه مراجعه کنید</li>
                    <li>از منوی "مدیریت لایسنس‌ها" کلید لایسنس خود را کپی کنید</li>
                    <li>کلید لایسنس را در فیلد بالا وارد کنید</li>
                    <li>روی دکمه "فعال‌سازی لایسنس" کلیک کنید</li>
                </ol>
                
                <p><strong>نکته:</strong> لایسنس فقط برای دامنه ثبت شده در پنل کاربری معتبر است.</p>
                
                <p>
                    <strong>پشتیبانی:</strong> 
                    در صورت بروز مشکل با پشتیبانی تماس بگیرید.
                </p>
            </div>
        </div>
        
        <style>
            .card h2 {
                margin-top: 0;
                padding-bottom: 10px;
                border-bottom: 1px solid #ddd;
            }
            .notice.inline {
                margin: 15px 0;
                padding: 10px 15px;
            }
        </style>
        <?php
    }
}

// ایجاد نمونه از کلاس
new License_Settings_Page();
