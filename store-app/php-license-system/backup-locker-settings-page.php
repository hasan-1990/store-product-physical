<?php
/**
 * Backup Manager Settings Page
 * صفحه مدیریت و قفل‌گذاری فایل‌های بکاپ
 * 
 * @package License_Manager
 * @version 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

// بارگذاری کلاس Backup Locker
require_once __DIR__ . '/class-backup-locker.php';

/**
 * اضافه کردن منو به پنل وردپرس
 */
function backup_locker_add_admin_menu() {
    add_menu_page(
        'مدیریت بکاپ‌ها',                    // عنوان صفحه
        'مدیریت بکاپ',                       // عنوان منو
        'manage_options',                   // دسترسی
        'backup-locker',                    // slug
        'backup_locker_settings_page',      // تابع نمایش
        'dashicons-database-export',        // آیکون
        80                                  // موقعیت
    );
}
add_action('admin_menu', 'backup_locker_add_admin_menu');

/**
 * صفحه تنظیمات
 */
function backup_locker_settings_page() {
    // بررسی دسترسی
    if (!current_user_can('manage_options')) {
        wp_die('شما دسترسی لازم را ندارید');
    }
    
    // ایجاد instance
    $locker = new Backup_Locker();
    
    // دریافت لیست بکاپ‌ها
    $backups = $locker->get_available_backups();
    
    // پردازش درخواست قفل‌گذاری
    $lock_result = null;
    if (isset($_POST['lock_backup']) && check_admin_referer('lock_backup_action', 'lock_backup_nonce')) {
        $source_file = sanitize_text_field($_POST['source_file']);
        $domain = sanitize_text_field($_POST['domain']);
        
        $lock_result = $locker->lock_backup($source_file, $domain);
    }
    
    ?>
    <div class="wrap" dir="rtl">
        <h1>
            <span class="dashicons dashicons-database-export" style="font-size: 30px; margin-left: 10px;"></span>
            مدیریت فایل‌های بکاپ Duplicator
        </h1>
        
        <p class="description">
            این ابزار به شما امکان می‌دهد فایل‌های بکاپ Duplicator را با دامنه مشخص قفل کنید تا فقط روی آن دامنه قابل نصب باشند.
        </p>
        
        <hr style="margin: 20px 0;">
        
        <?php if ($lock_result): ?>
            <div class="notice notice-<?php echo $lock_result['success'] ? 'success' : 'error'; ?> is-dismissible">
                <p>
                    <strong><?php echo $lock_result['success'] ? '✅ موفق' : '❌ خطا'; ?>:</strong>
                    <?php echo esc_html($lock_result['message']); ?>
                </p>
                
                <?php if ($lock_result['success']): ?>
                    <p>
                        <strong>فایل قفل‌شده:</strong> 
                        <code><?php echo esc_html($lock_result['locked_filename']); ?></code>
                    </p>
                    <p>
                        <strong>حجم فایل:</strong> 
                        <?php echo size_format($lock_result['filesize']); ?>
                    </p>
                    <p>
                        <strong>هش دامنه:</strong> 
                        <code style="font-size: 11px;"><?php echo esc_html($lock_result['domain_hash']); ?></code>
                    </p>
                    <?php if ($lock_result['cached']): ?>
                        <p style="color: #2196F3;">
                            <span class="dashicons dashicons-update"></span>
                            این فایل از کش بازیابی شده است (برای صرفه‌جویی در زمان و منابع)
                        </p>
                    <?php endif; ?>
                <?php endif; ?>
            </div>
        <?php endif; ?>
        
        <div class="card" style="max-width: 100%; margin-top: 20px;">
            <h2>📋 فایل‌های بکاپ موجود</h2>
            
            <?php if (empty($backups)): ?>
                <div class="notice notice-warning inline">
                    <p>
                        <span class="dashicons dashicons-warning"></span>
                        هیچ فایل بکاپی در پوشه پیدا نشد.
                    </p>
                    <p>
                        لطفاً فایل‌های بکاپ Duplicator را در مسیر زیر قرار دهید:<br>
                        <code><?php echo esc_html(wp_upload_dir()['basedir'] . '/duplicator-backups'); ?></code>
                    </p>
                </div>
            <?php else: ?>
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th>نام فایل</th>
                            <th>حجم</th>
                            <th>تاریخ ایجاد</th>
                            <th>عملیات</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($backups as $backup): ?>
                            <tr>
                                <td>
                                    <strong><?php echo esc_html($backup['filename']); ?></strong>
                                </td>
                                <td>
                                    <?php echo size_format($backup['filesize']); ?>
                                </td>
                                <td>
                                    <?php echo date_i18n('Y/m/d H:i', $backup['modified']); ?>
                                </td>
                                <td>
                                    <button type="button" class="button button-primary lock-backup-btn" 
                                            data-file="<?php echo esc_attr($backup['filepath']); ?>"
                                            data-filename="<?php echo esc_attr($backup['filename']); ?>">
                                        <span class="dashicons dashicons-lock"></span>
                                        قفل کردن با دامنه
                                    </button>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
        
        <!-- Modal قفل‌گذاری -->
        <div id="lock-modal" style="display: none; position: fixed; z-index: 999999; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7);">
            <div style="background: white; margin: 50px auto; padding: 30px; max-width: 600px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                <h2 style="margin-top: 0;">
                    <span class="dashicons dashicons-lock" style="font-size: 28px; vertical-align: middle;"></span>
                    قفل کردن فایل بکاپ
                </h2>
                
                <form method="post" action="" id="lock-form">
                    <?php wp_nonce_field('lock_backup_action', 'lock_backup_nonce'); ?>
                    <input type="hidden" name="lock_backup" value="1">
                    <input type="hidden" name="source_file" id="modal-source-file" value="">
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-weight: bold; margin-bottom: 5px;">
                            📄 فایل انتخاب‌شده:
                        </label>
                        <div style="background: #f5f5f5; padding: 10px; border-radius: 5px;">
                            <code id="modal-filename" style="word-break: break-all;"></code>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label for="domain" style="display: block; font-weight: bold; margin-bottom: 5px;">
                            🌐 دامنه مجاز:
                        </label>
                        <input type="text" 
                               name="domain" 
                               id="domain" 
                               class="regular-text" 
                               placeholder="example.com" 
                               required
                               style="width: 100%; padding: 8px; font-size: 14px; direction: ltr; text-align: left;">
                        <p class="description">
                            دامنه‌ای که این بکاپ فقط روی آن قابل نصب خواهد بود (بدون www و http://)
                        </p>
                        
                        <div style="background: #fff3cd; border-right: 4px solid #ffc107; padding: 10px; margin-top: 10px;">
                            <strong>نکات مهم:</strong>
                            <ul style="margin: 5px 0 0 20px; padding: 0;">
                                <li>فقط نام دامنه را وارد کنید، مثال: <code>example.com</code></li>
                                <li>www و پروتکل (http://) را وارد نکنید</li>
                                <li>دامنه به صورت SHA-256 هش می‌شود و غیرقابل تغییر خواهد بود</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div style="text-align: left; margin-top: 25px; padding-top: 20px; border-top: 1px solid #ddd;">
                        <button type="button" class="button" id="close-modal">
                            انصراف
                        </button>
                        <button type="submit" class="button button-primary" style="margin-right: 10px;">
                            <span class="dashicons dashicons-lock"></span>
                            قفل کردن فایل
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <div class="card" style="margin-top: 20px;">
            <h2>📖 راهنمای استفاده</h2>
            
            <div style="background: #e3f2fd; border-right: 4px solid #2196F3; padding: 15px; margin-bottom: 15px;">
                <h3 style="margin-top: 0;">چگونه کار می‌کند؟</h3>
                <ol style="margin-right: 20px;">
                    <li>یک فایل بکاپ Duplicator از لیست بالا انتخاب کنید</li>
                    <li>روی دکمه "قفل کردن با دامنه" کلیک کنید</li>
                    <li>دامنه مجاز را وارد کنید (مثال: <code>mysite.com</code>)</li>
                    <li>فایل جدید با پسوند <code>-LOCKED-xxxxxxxx.zip</code> ایجاد می‌شود</li>
                    <li>این فایل فقط روی دامنه مشخص‌شده قابل نصب است</li>
                </ol>
            </div>
            
            <div style="background: #f3e5f5; border-right: 4px solid #9c27b0; padding: 15px; margin-bottom: 15px;">
                <h3 style="margin-top: 0;">ویژگی‌های امنیتی</h3>
                <ul style="margin-right: 20px;">
                    <li>✅ دامنه به صورت SHA-256 هش می‌شود (غیرقابل بازگشت)</li>
                    <li>✅ اعتبارسنجی اتوماتیک در هنگام نصب</li>
                    <li>✅ نمایش پیام خطای حرفه‌ای برای دامنه‌های غیرمجاز</li>
                    <li>✅ کش فایل‌های قفل‌شده برای 7 روز</li>
                    <li>✅ پاکسازی خودکار فایل‌های قدیمی</li>
                </ul>
            </div>
            
            <div style="background: #fff3cd; border-right: 4px solid #ffc107; padding: 15px;">
                <h3 style="margin-top: 0;">⚠️ نکات مهم</h3>
                <ul style="margin-right: 20px;">
                    <li>فایل اصلی تغییر نمی‌کند و فایل جدیدی با نام <code>*-LOCKED-*.zip</code> ایجاد می‌شود</li>
                    <li>فایل‌های قفل‌شده در پوشه <code>wp-content/uploads/locked-backups/</code> ذخیره می‌شوند</li>
                    <li>برای نصب روی دامنه دیگر، باید فایل جدیدی با دامنه جدید قفل کنید</li>
                    <li>فایل‌های قفل‌شده بعد از 7 روز به صورت خودکار حذف می‌شوند</li>
                </ul>
            </div>
        </div>
        
        <div class="card" style="margin-top: 20px; background: #f8f9fa;">
            <h3>🔧 تنظیمات پیشرفته</h3>
            
            <table class="form-table">
                <tr>
                    <th>مسیر فایل‌های بکاپ:</th>
                    <td>
                        <code><?php echo esc_html(wp_upload_dir()['basedir'] . '/duplicator-backups'); ?></code>
                    </td>
                </tr>
                <tr>
                    <th>مسیر فایل‌های قفل‌شده:</th>
                    <td>
                        <code><?php echo esc_html(wp_upload_dir()['basedir'] . '/locked-backups'); ?></code>
                    </td>
                </tr>
                <tr>
                    <th>مدت زمان کش:</th>
                    <td>7 روز</td>
                </tr>
                <tr>
                    <th>الگوریتم هش:</th>
                    <td>SHA-256 با SALT سفارشی</td>
                </tr>
            </table>
        </div>
    </div>
    
    <style>
        .lock-backup-btn {
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        .lock-backup-btn .dashicons {
            font-size: 16px;
            width: 16px;
            height: 16px;
        }
        #lock-modal input[type="text"] {
            border: 2px solid #ddd;
            border-radius: 5px;
        }
        #lock-modal input[type="text"]:focus {
            border-color: #2196F3;
            outline: none;
        }
    </style>
    
    <script>
    jQuery(document).ready(function($) {
        // باز کردن Modal
        $('.lock-backup-btn').on('click', function() {
            var file = $(this).data('file');
            var filename = $(this).data('filename');
            
            $('#modal-source-file').val(file);
            $('#modal-filename').text(filename);
            $('#lock-modal').fadeIn(200);
            $('#domain').focus();
        });
        
        // بستن Modal
        $('#close-modal').on('click', function() {
            $('#lock-modal').fadeOut(200);
            $('#lock-form')[0].reset();
        });
        
        // بستن با کلیک بیرون Modal
        $('#lock-modal').on('click', function(e) {
            if (e.target.id === 'lock-modal') {
                $('#lock-modal').fadeOut(200);
                $('#lock-form')[0].reset();
            }
        });
        
        // بستن با ESC
        $(document).on('keydown', function(e) {
            if (e.key === 'Escape') {
                $('#lock-modal').fadeOut(200);
                $('#lock-form')[0].reset();
            }
        });
        
        // نرمال‌سازی دامنه
        $('#domain').on('blur', function() {
            var domain = $(this).val();
            
            // حذف http://, https://, www.
            domain = domain.replace(/^(https?:\/\/)?(www\.)?/i, '');
            
            // حذف slash انتهایی
            domain = domain.replace(/\/+$/, '');
            
            // حذف پورت
            domain = domain.replace(/:\d+$/, '');
            
            // تبدیل به lowercase
            domain = domain.toLowerCase().trim();
            
            $(this).val(domain);
        });
    });
    </script>
    <?php
}

/**
 * اضافه کردن استایل‌های ادمین
 */
function backup_locker_admin_styles() {
    ?>
    <style>
        .backup-locker-page .card {
            padding: 20px;
            background: white;
            border: 1px solid #ccd0d4;
            box-shadow: 0 1px 1px rgba(0,0,0,.04);
        }
        .backup-locker-page .card h2 {
            margin-top: 0;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
    </style>
    <?php
}
add_action('admin_head', 'backup_locker_admin_styles');
