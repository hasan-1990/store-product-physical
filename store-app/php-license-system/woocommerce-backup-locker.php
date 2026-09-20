<?php
/**
 * WooCommerce Integration for Backup Locker
 * یکپارچه‌سازی با ووکامرس برای قفل‌گذاری خودکار بکاپ در زمان دانلود
 * 
 * @package License_Manager
 * @version 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

// بارگذاری کلاس Backup Locker
require_once __DIR__ . '/class-backup-locker.php';

class WooCommerce_Backup_Locker_Integration {
    
    private $locker;
    
    /**
     * سازنده کلاس
     */
    public function __construct() {
        $this->locker = new Backup_Locker();
        
        // Hook برای فیلتر کردن لینک دانلود
        add_filter('woocommerce_download_product_filepath', array($this, 'lock_backup_before_download'), 10, 5);
        
        // اضافه کردن فیلد دامنه به صفحه checkout
        add_action('woocommerce_after_order_notes', array($this, 'add_domain_field_to_checkout'));
        
        // ذخیره دامنه در order meta
        add_action('woocommerce_checkout_update_order_meta', array($this, 'save_domain_to_order'));
        
        // نمایش دامنه در صفحه order
        add_action('woocommerce_admin_order_data_after_billing_address', array($this, 'display_domain_in_order'));
        
        // اضافه کردن ستون دامنه به جدول سفارشات
        add_filter('manage_edit-shop_order_columns', array($this, 'add_domain_column'));
        add_action('manage_shop_order_posts_custom_column', array($this, 'display_domain_column'), 10, 2);
    }
    
    /**
     * قفل کردن بکاپ قبل از دانلود
     */
    public function lock_backup_before_download($filepath, $product, $download_id, $order_id, $email) {
        // چک کردن اینکه آیا فایل یک بکاپ Duplicator است
        if (!$this->is_duplicator_backup($filepath)) {
            return $filepath; // فایل عادی، بدون تغییر
        }
        
        // دریافت دامنه از order meta
        $domain = get_post_meta($order_id, '_customer_domain', true);
        
        if (empty($domain)) {
            // اگر دامنه ثبت نشده، از ایمیل دامنه استخراج می‌کنیم (fallback)
            $domain = $this->extract_domain_from_email($email);
        }
        
        if (empty($domain)) {
            // اگر هنوز دامنه نداریم، فایل اصلی را برمی‌گردانیم
            error_log('WooCommerce Backup Locker: No domain found for order #' . $order_id);
            return $filepath;
        }
        
        // قفل کردن فایل
        $result = $this->locker->lock_backup($filepath, $domain);
        
        if ($result['success']) {
            // لاگ موفقیت
            error_log(sprintf(
                'WooCommerce Backup Locker: Locked backup for order #%d, domain: %s, file: %s',
                $order_id,
                $domain,
                $result['locked_filename']
            ));
            
            // اضافه کردن یادداشت به سفارش
            $order = wc_get_order($order_id);
            if ($order) {
                $order->add_order_note(sprintf(
                    'فایل بکاپ با دامنه %s قفل شد. فایل: %s',
                    $domain,
                    $result['locked_filename']
                ));
            }
            
            // برگرداندن فایل قفل‌شده
            return $result['locked_file'];
        } else {
            // لاگ خطا
            error_log(sprintf(
                'WooCommerce Backup Locker ERROR: Failed to lock backup for order #%d. Error: %s',
                $order_id,
                $result['message']
            ));
            
            // برگرداندن فایل اصلی در صورت خطا
            return $filepath;
        }
    }
    
    /**
     * بررسی اینکه آیا فایل یک بکاپ Duplicator است
     */
    private function is_duplicator_backup($filepath) {
        // چک کردن پسوند ZIP
        if (pathinfo($filepath, PATHINFO_EXTENSION) !== 'zip') {
            return false;
        }
        
        // چک کردن اینکه نام فایل شامل الگوی Duplicator است
        $filename = basename($filepath);
        
        // الگوی معمول: YYYYMMDD_name_hash_timestamp_archive.zip
        if (preg_match('/^\d{8}_.*_[a-f0-9]+_\d{14}_archive\.zip$/i', $filename)) {
            return true;
        }
        
        // چک کردن محتوای ZIP (وجود installer.php)
        if (class_exists('ZipArchive')) {
            $zip = new ZipArchive();
            if ($zip->open($filepath) === true) {
                $has_installer = $zip->locateName('installer.php') !== false;
                $zip->close();
                return $has_installer;
            }
        }
        
        return false;
    }
    
    /**
     * استخراج دامنه از ایمیل
     */
    private function extract_domain_from_email($email) {
        if (empty($email) || !is_email($email)) {
            return '';
        }
        
        $parts = explode('@', $email);
        return isset($parts[1]) ? strtolower(trim($parts[1])) : '';
    }
    
    /**
     * اضافه کردن فیلد دامنه به صفحه checkout
     */
    public function add_domain_field_to_checkout($checkout) {
        // فقط برای محصولاتی که بکاپ Duplicator هستند
        if (!$this->cart_has_backup_product()) {
            return;
        }
        
        echo '<div id="domain_field_section" style="clear: both; margin-top: 20px; padding: 20px; background: #f7f7f7; border: 1px solid #ddd; border-radius: 5px;">';
        
        echo '<h3 style="margin-top: 0;">🌐 ' . __('اطلاعات دامنه') . '</h3>';
        
        echo '<p class="description" style="margin-bottom: 15px;">';
        echo 'این بکاپ با دامنه شما قفل خواهد شد و فقط روی آن دامنه قابل نصب است.';
        echo '</p>';
        
        woocommerce_form_field('customer_domain', array(
            'type'          => 'text',
            'class'         => array('form-row-wide'),
            'label'         => 'دامنه سایت شما',
            'placeholder'   => 'example.com',
            'required'      => true,
            'default'       => $this->get_customer_domain_from_previous_orders(),
        ), $checkout->get_value('customer_domain'));
        
        echo '<div style="background: #fff3cd; border-right: 4px solid #ffc107; padding: 12px; margin-top: 10px;">';
        echo '<strong>⚠️ نکات مهم:</strong>';
        echo '<ul style="margin: 8px 0 0 20px; padding: 0;">';
        echo '<li>فقط نام دامنه را وارد کنید (بدون www و http://)</li>';
        echo '<li>مثال صحیح: <code>mysite.com</code></li>';
        echo '<li>این دامنه غیرقابل تغییر خواهد بود</li>';
        echo '</ul>';
        echo '</div>';
        
        echo '</div>';
        
        // اضافه کردن JavaScript برای اعتبارسنجی
        ?>
        <script>
        jQuery(document).ready(function($) {
            // نرمال‌سازی دامنه
            $('input[name="customer_domain"]').on('blur', function() {
                var domain = $(this).val();
                
                // حذف http://, https://, www.
                domain = domain.replace(/^(https?:\/\/)?(www\.)?/i, '');
                
                // حذف slash
                domain = domain.replace(/\/+/g, '');
                
                // حذف پورت
                domain = domain.replace(/:\d+$/, '');
                
                // lowercase
                domain = domain.toLowerCase().trim();
                
                $(this).val(domain);
            });
            
            // اعتبارسنجی فرم
            $('form.checkout').on('checkout_place_order', function() {
                var domain = $('input[name="customer_domain"]').val();
                
                if (!domain || domain.length < 3) {
                    alert('لطفاً دامنه سایت خود را وارد کنید');
                    $('input[name="customer_domain"]').focus();
                    return false;
                }
                
                // بررسی فرمت ساده دامنه
                if (!/^[a-z0-9\-\.]+\.[a-z]{2,}$/i.test(domain)) {
                    alert('فرمت دامنه صحیح نیست. مثال صحیح: example.com');
                    $('input[name="customer_domain"]').focus();
                    return false;
                }
                
                return true;
            });
        });
        </script>
        <?php
    }
    
    /**
     * بررسی اینکه آیا سبد خرید شامل محصول بکاپ است
     */
    private function cart_has_backup_product() {
        if (!function_exists('WC')) {
            return false;
        }
        
        $cart = WC()->cart;
        if (!$cart) {
            return false;
        }
        
        foreach ($cart->get_cart() as $cart_item) {
            $product = $cart_item['data'];
            
            // چک کردن اینکه محصول دانلودی است
            if (!$product->is_downloadable()) {
                continue;
            }
            
            // چک کردن فایل‌های دانلودی
            $downloads = $product->get_downloads();
            foreach ($downloads as $download) {
                $file = $download->get_file();
                if ($this->is_duplicator_backup($file)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * دریافت دامنه از سفارشات قبلی مشتری
     */
    private function get_customer_domain_from_previous_orders() {
        if (!is_user_logged_in()) {
            return '';
        }
        
        $customer_id = get_current_user_id();
        
        // دریافت آخرین سفارش
        $orders = wc_get_orders(array(
            'customer_id' => $customer_id,
            'limit' => 1,
            'orderby' => 'date',
            'order' => 'DESC',
        ));
        
        if (empty($orders)) {
            return '';
        }
        
        $last_order = $orders[0];
        $domain = get_post_meta($last_order->get_id(), '_customer_domain', true);
        
        return $domain;
    }
    
    /**
     * ذخیره دامنه در order meta
     */
    public function save_domain_to_order($order_id) {
        if (!empty($_POST['customer_domain'])) {
            $domain = sanitize_text_field($_POST['customer_domain']);
            
            // نرمال‌سازی دامنه
            $domain = strtolower(trim($domain));
            $domain = str_replace('www.', '', $domain);
            $domain = preg_replace('/:[0-9]+$/', '', $domain);
            $domain = preg_replace('#^https?://#', '', $domain);
            $domain = rtrim($domain, '/');
            
            update_post_meta($order_id, '_customer_domain', $domain);
        }
    }
    
    /**
     * نمایش دامنه در صفحه ویرایش سفارش
     */
    public function display_domain_in_order($order) {
        $domain = get_post_meta($order->get_id(), '_customer_domain', true);
        
        if (!empty($domain)) {
            ?>
            <div class="order-domain-section" style="margin-top: 15px;">
                <h3 style="margin-bottom: 10px;">🌐 دامنه مشتری</h3>
                <p style="margin: 0;">
                    <strong>دامنه:</strong> 
                    <code style="background: #f0f0f1; padding: 3px 8px; border-radius: 3px; font-size: 13px;">
                        <?php echo esc_html($domain); ?>
                    </code>
                </p>
                <p class="description" style="margin: 5px 0 0 0;">
                    فایل‌های بکاپ این سفارش با این دامنه قفل شده‌اند
                </p>
            </div>
            <?php
        }
    }
    
    /**
     * اضافه کردن ستون دامنه به جدول سفارشات
     */
    public function add_domain_column($columns) {
        $new_columns = array();
        
        foreach ($columns as $key => $column) {
            $new_columns[$key] = $column;
            
            // اضافه کردن ستون دامنه بعد از ستون نام
            if ($key === 'order_status') {
                $new_columns['customer_domain'] = '🌐 دامنه';
            }
        }
        
        return $new_columns;
    }
    
    /**
     * نمایش محتوای ستون دامنه
     */
    public function display_domain_column($column, $post_id) {
        if ($column === 'customer_domain') {
            $domain = get_post_meta($post_id, '_customer_domain', true);
            
            if (!empty($domain)) {
                echo '<code style="font-size: 11px;">' . esc_html($domain) . '</code>';
            } else {
                echo '—';
            }
        }
    }
}

// فعال‌سازی یکپارچه‌سازی
if (class_exists('WooCommerce')) {
    new WooCommerce_Backup_Locker_Integration();
}
