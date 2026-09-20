<?php
/**
 * Plugin Name: My Premium Plugin
 * Description: یک افزونه پریمیوم با سیستم لایسنس
 * Version: 1.0.0
 * Author: Your Name
 */

if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('MY_PLUGIN_VERSION', '1.0.0');
define('MY_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('MY_PLUGIN_URL', plugin_dir_url(__FILE__));

// Include License Manager
require_once MY_PLUGIN_DIR . 'inc/class-license-manager.php';
require_once MY_PLUGIN_DIR . 'inc/license-settings-page.php';

class My_Premium_Plugin {
    
    private $license_manager;
    
    public function __construct() {
        // ایجاد License Manager
        $this->license_manager = new License_Manager(
            'plugin-12345-abc',                          // Product ID
            'My Premium Plugin',                         // Product Name
            'https://yoursite.com/api/licenses/verify'   // API URL
        );
        
        // Hooks
        add_action('plugins_loaded', array($this, 'init'));
        add_action('admin_notices', array($this, 'license_notice'));
        
        // فقط اگر لایسنس معتبر بود، قابلیت‌ها را فعال کن
        if ($this->license_manager->is_license_valid()) {
            $this->load_premium_features();
        } else {
            $this->load_basic_features();
        }
    }
    
    public function init() {
        // مقداردهی اولیه افزونه
        load_plugin_textdomain('my-premium-plugin', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }
    
    public function license_notice() {
        if (!$this->license_manager->is_license_valid()) {
            $settings_url = admin_url('admin.php?page=license-settings');
            ?>
            <div class="notice notice-warning">
                <p>
                    <strong>My Premium Plugin:</strong> 
                    لطفاً لایسنس افزونه را فعال کنید تا از تمام امکانات استفاده کنید.
                    <a href="<?php echo esc_url($settings_url); ?>">فعال‌سازی لایسنس</a>
                </p>
            </div>
            <?php
        }
    }
    
    private function load_premium_features() {
        // بارگذاری قابلیت‌های پریمیوم
        require_once MY_PLUGIN_DIR . 'inc/premium-feature-1.php';
        require_once MY_PLUGIN_DIR . 'inc/premium-feature-2.php';
        require_once MY_PLUGIN_DIR . 'inc/advanced-settings.php';
        
        // Register Premium Post Types
        add_action('init', array($this, 'register_premium_post_types'));
        
        // Add Premium Meta Boxes
        add_action('add_meta_boxes', array($this, 'add_premium_meta_boxes'));
    }
    
    private function load_basic_features() {
        // بارگذاری فقط قابلیت‌های پایه
        require_once MY_PLUGIN_DIR . 'inc/basic-feature.php';
    }
    
    public function register_premium_post_types() {
        // ثبت Post Type ویژه (فقط با لایسنس)
        register_post_type('premium_item', array(
            'labels' => array(
                'name' => 'آیتم‌های پریمیوم',
                'singular_name' => 'آیتم پریمیوم'
            ),
            'public' => true,
            'has_archive' => true,
            'supports' => array('title', 'editor', 'thumbnail'),
        ));
    }
    
    public function add_premium_meta_boxes() {
        add_meta_box(
            'premium_options',
            'تنظیمات پریمیوم',
            array($this, 'render_premium_meta_box'),
            'post',
            'side',
            'default'
        );
    }
    
    public function render_premium_meta_box($post) {
        ?>
        <p>این متاباکس فقط با لایسنس معتبر نمایش داده می‌شود.</p>
        <!-- محتوای متاباکس -->
        <?php
    }
    
    // Activation Hook
    public static function activate() {
        flush_rewrite_rules();
    }
    
    // Deactivation Hook
    public static function deactivate() {
        flush_rewrite_rules();
        wp_clear_scheduled_hook('my_plugin_license_check');
    }
}

// Initialize Plugin
new My_Premium_Plugin();

// Activation/Deactivation
register_activation_hook(__FILE__, array('My_Premium_Plugin', 'activate'));
register_deactivation_hook(__FILE__, array('My_Premium_Plugin', 'deactivate'));
