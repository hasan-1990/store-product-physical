<?php
/**
 * License Manager Class
 * سیستم مدیریت لایسنس برای قالب‌ها و افزونه‌های وردپرس
 * 
 * @package YourTheme/Plugin
 * @version 1.0.0
 */

if (!defined('ABSPATH')) {
    exit; // جلوگیری از دسترسی مستقیم
}

class License_Manager {
    
    /**
     * URL سرور لایسنس شما
     */
    private $api_url = 'https://yoursite.com/api/licenses/verify';
    
    /**
     * شناسه محصول (باید برای هر قالب/افزونه متفاوت باشد)
     */
    private $product_id = 'YOUR_PRODUCT_ID';
    
    /**
     * نام محصول
     */
    private $product_name = 'YOUR_PRODUCT_NAME';
    
    /**
     * نسخه محصول
     */
    private $product_version = '1.0.0';
    
    /**
     * مدت زمان کش (به ثانیه) - 24 ساعت
     */
    private $cache_duration = 86400;
    
    /**
     * Option name برای ذخیره لایسنس
     */
    private $license_key_option = 'license_key';
    private $license_status_option = 'license_status';
    private $license_data_option = 'license_data';
    
    /**
     * سازنده کلاس
     */
    public function __construct($product_id = null, $product_name = null, $api_url = null) {
        if ($product_id) {
            $this->product_id = $product_id;
        }
        
        if ($product_name) {
            $this->product_name = $product_name;
        }
        
        if ($api_url) {
            $this->api_url = $api_url;
        }
        
        // اضافه کردن prefix برای option names
        $this->license_key_option = $this->product_id . '_license_key';
        $this->license_status_option = $this->product_id . '_license_status';
        $this->license_data_option = $this->product_id . '_license_data';
        
        // Hook ها
        add_action('admin_init', array($this, 'check_license_status'));
        add_action('admin_notices', array($this, 'show_license_notices'));
    }
    
    /**
     * دریافت دامنه فعلی سایت
     */
    private function get_current_domain() {
        $domain = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : '';
        
        // حذف www
        $domain = str_replace('www.', '', $domain);
        
        // حذف پورت
        $domain = explode(':', $domain)[0];
        
        return strtolower(trim($domain));
    }
    
    /**
     * ذخیره کلید لایسنس
     */
    public function save_license_key($license_key) {
        $license_key = sanitize_text_field($license_key);
        update_option($this->license_key_option, $license_key);
        
        // پاک کردن کش
        delete_transient($this->license_status_option);
        delete_option($this->license_data_option);
    }
    
    /**
     * دریافت کلید لایسنس
     */
    public function get_license_key() {
        return get_option($this->license_key_option, '');
    }
    
    /**
     * حذف لایسنس
     */
    public function delete_license() {
        delete_option($this->license_key_option);
        delete_option($this->license_status_option);
        delete_option($this->license_data_option);
        delete_transient($this->license_status_option);
    }
    
    /**
     * فعال‌سازی لایسنس
     */
    public function activate_license($license_key = null) {
        if (!$license_key) {
            $license_key = $this->get_license_key();
        }
        
        if (empty($license_key)) {
            return array(
                'valid' => false,
                'message' => 'کلید لایسنس وارد نشده است'
            );
        }
        
        // ذخیره کلید لایسنس
        $this->save_license_key($license_key);
        
        // ارسال درخواست به سرور
        $domain = $this->get_current_domain();
        
        $response = $this->call_api(array(
            'licenseKey' => $license_key,
            'domain' => $domain,
            'productId' => $this->product_id,
            'ipAddress' => $this->get_client_ip(),
            'userAgent' => isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '',
        ));
        
        if ($response && isset($response['valid'])) {
            // ذخیره وضعیت
            update_option($this->license_status_option, $response['valid'] ? 'active' : 'invalid');
            update_option($this->license_data_option, $response);
            
            // کش کردن برای 24 ساعت
            if ($response['valid']) {
                set_transient($this->license_status_option, 'active', $this->cache_duration);
            }
            
            return $response;
        }
        
        return array(
            'valid' => false,
            'message' => 'خطا در ارتباط با سرور لایسنس'
        );
    }
    
    /**
     * چک کردن وضعیت لایسنس
     */
    public function check_license_status() {
        $license_key = $this->get_license_key();
        
        if (empty($license_key)) {
            return false;
        }
        
        // چک کردن کش
        $cached_status = get_transient($this->license_status_option);
        if ($cached_status === 'active') {
            return true;
        }
        
        // چک کردن از سرور
        $result = $this->activate_license($license_key);
        
        return isset($result['valid']) && $result['valid'];
    }
    
    /**
     * آیا لایسنس فعال است؟
     */
    public function is_license_valid() {
        $license_key = $this->get_license_key();
        
        if (empty($license_key)) {
            return false;
        }
        
        // چک کش
        $cached_status = get_transient($this->license_status_option);
        if ($cached_status === 'active') {
            return true;
        }
        
        // چک از دیتابیس
        $status = get_option($this->license_status_option, 'invalid');
        return $status === 'active';
    }
    
    /**
     * دریافت IP کلاینت
     */
    private function get_client_ip() {
        $ip = '';
        
        if (isset($_SERVER['HTTP_CLIENT_IP'])) {
            $ip = $_SERVER['HTTP_CLIENT_IP'];
        } elseif (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
        } elseif (isset($_SERVER['REMOTE_ADDR'])) {
            $ip = $_SERVER['REMOTE_ADDR'];
        }
        
        return sanitize_text_field($ip);
    }
    
    /**
     * فراخوانی API
     */
    private function call_api($data) {
        $response = wp_remote_post($this->api_url, array(
            'method' => 'POST',
            'timeout' => 15,
            'headers' => array(
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode($data),
            'sslverify' => true,
        ));
        
        if (is_wp_error($response)) {
            error_log('License API Error: ' . $response->get_error_message());
            return false;
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        return $data;
    }
    
    /**
     * نمایش اعلان‌های لایسنس
     */
    public function show_license_notices() {
        if (!$this->is_license_valid()) {
            $license_key = $this->get_license_key();
            
            if (empty($license_key)) {
                $this->show_notice(
                    'لطفاً لایسنس ' . $this->product_name . ' را فعال کنید تا از تمام امکانات استفاده کنید.',
                    'warning'
                );
            } else {
                $this->show_notice(
                    'لایسنس ' . $this->product_name . ' نامعتبر است. لطفاً لایسنس معتبر وارد کنید.',
                    'error'
                );
            }
        }
    }
    
    /**
     * نمایش اعلان
     */
    private function show_notice($message, $type = 'info') {
        $class = 'notice notice-' . $type . ' is-dismissible';
        printf('<div class="%1$s"><p>%2$s</p></div>', esc_attr($class), esc_html($message));
    }
    
    /**
     * غیرفعال کردن قابلیت‌ها در صورت عدم فعالیت لایسنس
     */
    public function require_valid_license() {
        if (!$this->is_license_valid()) {
            wp_die(
                'لایسنس این محصول فعال نیست. لطفاً ابتدا لایسنس را فعال کنید.',
                'لایسنس غیرفعال',
                array('back_link' => true)
            );
        }
    }
    
    /**
     * دریافت اطلاعات لایسنس
     */
    public function get_license_data() {
        return get_option($this->license_data_option, array());
    }
}
