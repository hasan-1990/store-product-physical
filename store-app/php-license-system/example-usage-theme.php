<?php
/**
 * نمونه استفاده از سیستم لایسنس در functions.php قالب وردپرس
 */

// 1. Include کردن فایل‌های لایسنس
require_once get_template_directory() . '/inc/class-license-manager.php';
require_once get_template_directory() . '/inc/license-settings-page.php';

// 2. ایجاد نمونه سراسری از License Manager
global $theme_license_manager;
$theme_license_manager = new License_Manager(
    '67890abcdef12345',                              // شناسه محصول (باید با productId در دیتابیس یکسان باشد)
    'قالب فروشگاهی من',                             // نام محصول
    'https://yoursite.com/api/licenses/verify'       // URL API شما
);

// 3. مثال: محدود کردن دسترسی به یک صفحه تنظیمات
function my_theme_advanced_settings_page() {
    global $theme_license_manager;
    
    // چک کردن لایسنس
    if (!$theme_license_manager->is_license_valid()) {
        wp_die(
            'این قابلیت فقط برای کاربران دارای لایسنس معتبر در دسترس است.',
            'نیاز به لایسنس معتبر'
        );
    }
    
    // نمایش صفحه تنظیمات پیشرفته
    ?>
    <div class="wrap">
        <h1>تنظیمات پیشرفته قالب</h1>
        <p>این بخش فقط با لایسنس معتبر قابل دسترسی است.</p>
        <!-- محتوای صفحه -->
    </div>
    <?php
}

// 4. مثال: غیرفعال کردن یک ویژگی بدون لایسنس
function my_theme_custom_feature() {
    global $theme_license_manager;
    
    if (!$theme_license_manager->is_license_valid()) {
        return; // خروج اگر لایسنس معتبر نباشد
    }
    
    // اجرای ویژگی فقط برای کاربران دارای لایسنس
    echo '<div class="premium-feature">این یک ویژگی پریمیوم است</div>';
}
add_action('wp_footer', 'my_theme_custom_feature');

// 5. مثال: نمایش پیام در صفحات قالب
function show_license_warning_on_front() {
    global $theme_license_manager;
    
    if (is_admin()) {
        return;
    }
    
    if (!$theme_license_manager->is_license_valid()) {
        echo '<div style="background: #fff3cd; color: #856404; padding: 15px; text-align: center; border-bottom: 3px solid #ffc107;">';
        echo '<strong>توجه:</strong> لایسنس این قالب فعال نیست. ';
        echo '<a href="' . admin_url('admin.php?page=license-settings') . '">فعال‌سازی لایسنس</a>';
        echo '</div>';
    }
}
add_action('wp_head', 'show_license_warning_on_front', 1);

// 6. مثال: محدود کردن ویجت‌ها
function register_premium_widgets() {
    global $theme_license_manager;
    
    // ویجت‌های رایگان
    register_widget('My_Basic_Widget');
    
    // ویجت‌های پریمیوم (فقط با لایسنس)
    if ($theme_license_manager->is_license_valid()) {
        register_widget('My_Premium_Widget_1');
        register_widget('My_Premium_Widget_2');
    }
}
add_action('widgets_init', 'register_premium_widgets');

// 7. مثال: Shortcode با چک لایسنس
function premium_shortcode($atts) {
    global $theme_license_manager;
    
    if (!$theme_license_manager->is_license_valid()) {
        return '<p style="color: red;">این shortcode فقط با لایسنس معتبر کار می‌کند.</p>';
    }
    
    // محتوای shortcode
    return '<div class="premium-content">محتوای ویژه</div>';
}
add_shortcode('premium_feature', 'premium_shortcode');

// 8. مثال: غیرفعال کردن تنظیمات Customizer بدون لایسنس
function customize_register_with_license($wp_customize) {
    global $theme_license_manager;
    
    // تنظیمات پایه (برای همه)
    $wp_customize->add_section('basic_settings', array(
        'title' => 'تنظیمات پایه',
    ));
    
    // تنظیمات پیشرفته (فقط با لایسنس)
    if ($theme_license_manager->is_license_valid()) {
        $wp_customize->add_section('advanced_settings', array(
            'title' => 'تنظیمات پیشرفته (Premium)',
        ));
    }
}
add_action('customize_register', 'customize_register_with_license');

// 9. مثال: AJAX برای چک کردن لایسنس
function ajax_check_license() {
    global $theme_license_manager;
    
    check_ajax_referer('license_check', 'nonce');
    
    $is_valid = $theme_license_manager->check_license_status();
    
    wp_send_json(array(
        'valid' => $is_valid,
        'message' => $is_valid ? 'لایسنس معتبر است' : 'لایسنس نامعتبر است'
    ));
}
add_action('wp_ajax_check_license', 'ajax_check_license');

// 10. مثال: چک خودکار لایسنس هر 12 ساعت
function schedule_license_check() {
    if (!wp_next_scheduled('check_license_cron')) {
        wp_schedule_event(time(), 'twicedaily', 'check_license_cron');
    }
}
add_action('wp', 'schedule_license_check');

function auto_check_license() {
    global $theme_license_manager;
    $theme_license_manager->check_license_status();
}
add_action('check_license_cron', 'auto_check_license');

// 11. پاک کردن زمان‌بند هنگام غیرفعال‌سازی قالب
function cleanup_on_deactivation() {
    wp_clear_scheduled_hook('check_license_cron');
}
add_action('switch_theme', 'cleanup_on_deactivation');
