'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface EmailSettings {
  enabled: boolean;
  useResend: boolean;
  resendApiKey: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpSecure: boolean;
  fromName: string;
  fromAddress: string;
  supportEmail: string;
  supportPhone: string;
  logoUrl: string;
  templates?: {
    order: 'modern' | 'classic' | 'minimal' | 'elegant';
    reset: 'modern' | 'classic' | 'minimal' | 'elegant';
    ticket: 'modern' | 'classic' | 'minimal' | 'elegant';
    invoice: 'modern' | 'classic' | 'minimal' | 'elegant';
  };
}

export default function EmailSettingsPage() {
  const [settings, setSettings] = useState<EmailSettings>({
    enabled: true,
    useResend: false,
    resendApiKey: '',
    smtpHost: 'localhost',
    smtpPort: 25,
    smtpUser: '',
    smtpPass: '',
    smtpSecure: false,
    fromName: 'فروشگاه آنلاین',
    fromAddress: 'noreply@store.com',
    supportEmail: 'support@store.com',
    supportPhone: '021-12345678',
    logoUrl: '',
    templates: {
      order: 'modern',
      reset: 'modern',
      ticket: 'modern',
      invoice: 'modern'
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'smtp' | 'resend' | 'templates' | 'preview' | 'bulk-send' | 'email-list'>('smtp');
  const [previewType, setPreviewType] = useState<'order' | 'reset' | 'ticket' | 'invoice'>('order');
  
  // Bulk Send States
  const [bulkEmailSubject, setBulkEmailSubject] = useState('');
  const [bulkEmailBody, setBulkEmailBody] = useState('');
  const [bulkEmailTemplate, setBulkEmailTemplate] = useState<'modern' | 'classic' | 'minimal' | 'elegant'>('modern');
  const [bulkSending, setBulkSending] = useState(false);
  
  // Email List States
  const [emailList, setEmailList] = useState<Array<{email: string, name?: string, source: string, createdAt: string, groups?: string[]}>>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newEmailName, setNewEmailName] = useState('');
  const [loadingEmails, setLoadingEmails] = useState(false);
  
  // Email Groups States
  const [emailGroups, setEmailGroups] = useState<Array<{_id: string, name: string, description?: string}>>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [showGroupModal, setShowGroupModal] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // Get token from localStorage for authentication
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/admin/email-settings', {
        headers,
        credentials: 'include' // Include cookies for NextAuth session
      });
      
      const result = await response.json();

      if (result.success && result.data) {
        setSettings(prev => ({
          ...prev,
          ...result.data
        }));
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
      toast.error('خطا در بارگذاری تنظیمات');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Debug: Check session
      const sessionCheck = await fetch('/api/auth/session');
      const sessionData = await sessionCheck.json();
      console.log('Current session:', sessionData);

      // Get token from localStorage for authentication
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/admin/email-settings', {
        method: 'PUT',
        headers,
        credentials: 'include', // Include cookies for NextAuth session
        body: JSON.stringify({ settings })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('✅ تنظیمات ایمیل با موفقیت ذخیره شد');
      } else {
        toast.error('❌ ' + (result.error || 'خطا در ذخیره تنظیمات'));
      }
    } catch (error) {
      console.error('Error saving email settings:', error);
      toast.error('خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast.error('لطفاً ایمیل مقصد را وارد کنید');
      return;
    }

    try {
      setTesting(true);

      const response = await fetch('/api/admin/email-settings/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: testEmail })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('✅ ایمیل تست با موفقیت ارسال شد!');
      } else {
        toast.error('❌ ' + (result.error || 'خطا در ارسال ایمیل'));
      }
    } catch (error) {
      console.error('Error testing email:', error);
      toast.error('خطا در ارسال ایمیل تست');
    } finally {
      setTesting(false);
    }
  };

  const handleInputChange = (field: keyof EmailSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTemplateChange = (emailType: 'order' | 'reset' | 'ticket' | 'invoice', template: 'modern' | 'classic' | 'minimal' | 'elegant') => {
    setSettings(prev => ({
      ...prev,
      templates: {
        ...prev.templates!,
        [emailType]: template
      }
    }));
    const templateNames = { modern: 'مدرن', classic: 'کلاسیک', minimal: 'مینیمال', elegant: 'الگانت' };
    toast.success(`قالب ${templateNames[template]} انتخاب شد`);
  };

  // Fetch email groups
  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/admin/email-groups', {
        headers,
        credentials: 'include'
      });
      
      const result = await response.json();
      if (result.success && result.data) {
        setEmailGroups(result.data);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      toast.error('خطا در بارگذاری گروه‌ها');
    }
  };

  // Fetch email list from users
  const fetchEmailList = async () => {
    try {
      setLoadingEmails(true);
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/admin/email-list', {
        headers,
        credentials: 'include'
      });
      
      const result = await response.json();
      if (result.success && result.data) {
        setEmailList(result.data);
      }
    } catch (error) {
      console.error('Error loading email list:', error);
      toast.error('خطا در بارگذاری لیست ایمیل‌ها');
    } finally {
      setLoadingEmails(false);
    }
  };

  // Create new group
  const handleCreateGroup = async () => {
    if (!newGroupName) {
      toast.error('لطفاً نام گروه را وارد کنید');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/admin/email-groups', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ name: newGroupName, description: newGroupDescription })
      });

      const result = await response.json();
      if (result.success) {
        toast.success('✅ گروه با موفقیت ایجاد شد');
        setNewGroupName('');
        setNewGroupDescription('');
        setShowGroupModal(false);
        fetchGroups();
      } else {
        toast.error('❌ ' + (result.error || 'خطا در ایجاد گروه'));
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('خطا در ایجاد گروه');
    }
  };

  // Delete group
  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('آیا از حذف این گروه اطمینان دارید؟')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/admin/email-groups?id=${groupId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });

      const result = await response.json();
      if (result.success) {
        toast.success('✅ گروه حذف شد');
        fetchGroups();
        fetchEmailList();
      } else {
        toast.error('❌ ' + (result.error || 'خطا در حذف گروه'));
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('خطا در حذف گروه');
    }
  };

  // Add email to group
  const handleAddToGroup = async (email: string, groupId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/admin/email-list/add-to-group', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ email, groupId })
      });

      const result = await response.json();
      if (result.success) {
        toast.success('✅ ایمیل به گروه اضافه شد');
        fetchEmailList();
      } else {
        toast.error('❌ ' + (result.error || 'خطا در افزودن به گروه'));
      }
    } catch (error) {
      console.error('Error adding to group:', error);
      toast.error('خطا در افزودن به گروه');
    }
  };

  // Remove email from group
  const handleRemoveFromGroup = async (email: string, groupId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/admin/email-list/remove-from-group', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ email, groupId })
      });

      const result = await response.json();
      if (result.success) {
        toast.success('✅ ایمیل از گروه حذف شد');
        fetchEmailList();
      } else {
        toast.error('❌ ' + (result.error || 'خطا در حذف از گروه'));
      }
    } catch (error) {
      console.error('Error removing from group:', error);
      toast.error('خطا در حذف از گروه');
    }
  };

  // Add new email to list
  const handleAddEmail = async () => {
    if (!newEmail) {
      toast.error('لطفاً ایمیل را وارد کنید');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/admin/email-list', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ email: newEmail, name: newEmailName })
      });

      const result = await response.json();
      if (result.success) {
        toast.success('✅ ایمیل با موفقیت اضافه شد');
        setNewEmail('');
        setNewEmailName('');
        fetchEmailList();
      } else {
        toast.error('❌ ' + (result.error || 'خطا در افزودن ایمیل'));
      }
    } catch (error) {
      console.error('Error adding email:', error);
      toast.error('خطا در افزودن ایمیل');
    }
  };

  // Generate promotional email HTML
  const generatePromotionalEmail = (content: string, template: 'modern' | 'classic' | 'minimal' | 'elegant') => {
    const header = getEmailHeader(template);
    const footer = getEmailFooter(template);
    
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; direction: rtl;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <tr>
            <td>
              ${header}
              <div style="padding: 40px 30px; color: #333; line-height: 1.8;">
                ${content}
              </div>
              ${footer}
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  };

  // Send bulk email
  const handleBulkSend = async () => {
    if (!bulkEmailSubject || !bulkEmailBody) {
      toast.error('لطفاً موضوع و متن ایمیل را وارد کنید');
      return;
    }

    // Get emails from selected groups
    const emails: string[] = [];
    if (selectedGroups.length > 0) {
      const groupEmails = emailList
        .filter(item => item.groups?.some(g => selectedGroups.includes(g)))
        .map(item => item.email);
      emails.push(...groupEmails);
    }

    // Remove duplicates
    const uniqueEmails = [...new Set(emails)];

    if (uniqueEmails.length === 0) {
      toast.error('لطفاً حداقل یک گروه انتخاب کنید');
      return;
    }

    try {
      setBulkSending(true);
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Generate beautiful HTML email
      const htmlBody = generatePromotionalEmail(bulkEmailBody, bulkEmailTemplate);

      const response = await fetch('/api/admin/bulk-email', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          subject: bulkEmailSubject,
          body: htmlBody,
          recipients: uniqueEmails
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success(`✅ ایمیل به ${uniqueEmails.length} نفر ارسال شد`);
        setBulkEmailSubject('');
        setBulkEmailBody('');
        setSelectedGroups([]);
      } else {
        toast.error('❌ ' + (result.error || 'خطا در ارسال ایمیل'));
      }
    } catch (error) {
      console.error('Error sending bulk email:', error);
      toast.error('خطا در ارسال ایمیل گروهی');
    } finally {
      setBulkSending(false);
    }
  };

  const getEmailHeader = (style: 'modern' | 'classic' | 'minimal' | 'elegant' = 'modern') => {
    if (style === 'modern') {
      return `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; position: relative; overflow: hidden;">
          <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
          <div style="position: absolute; bottom: -30px; left: -30px; width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
          ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="${settings.fromName}" style="max-width: 150px; margin-bottom: 20px; position: relative; z-index: 1;">` : ''}
          <h1 style="margin: 0; font-size: 28px; position: relative; z-index: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${settings.fromName}</h1>
        </div>
      `;
    } else if (style === 'classic') {
      return `
        <div style="background: #1a202c; color: white; padding: 30px 20px; text-align: center; border-bottom: 5px solid #d4af37;">
          ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="${settings.fromName}" style="max-width: 120px; margin-bottom: 15px;">` : ''}
          <h1 style="margin: 0; font-size: 26px; font-family: Georgia, serif; letter-spacing: 1px;">${settings.fromName}</h1>
          <div style="width: 60px; height: 3px; background: #d4af37; margin: 15px auto 0;"></div>
        </div>
      `;
    } else if (style === 'elegant') {
      return `
        <div style="background: linear-gradient(to bottom, #0a0a0a, #1a1a1a); padding: 60px 20px 40px; text-align: center; border-top: 3px solid #d4af37; position: relative; overflow: hidden;">
          <!-- Corner Ornaments -->
          <div style="position: absolute; top: 0; right: 0; width: 100px; height: 100px; background: linear-gradient(135deg, transparent 50%, rgba(212, 175, 55, 0.1) 50%); border-bottom-left-radius: 100%;"></div>
          <div style="position: absolute; top: 0; left: 0; width: 100px; height: 100px; background: linear-gradient(225deg, transparent 50%, rgba(212, 175, 55, 0.1) 50%); border-bottom-right-radius: 100%;"></div>
          
          <!-- Top Decorative Line -->
          <div style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%); width: 200px; height: 1px; background: linear-gradient(to right, transparent, #d4af37, transparent); opacity: 0.5;"></div>
          
          <div style="max-width: 550px; margin: 0 auto; padding: 35px; background: radial-gradient(ellipse at center, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0.02) 100%); border: 2px solid rgba(212, 175, 55, 0.4); border-radius: 20px; box-shadow: 0 15px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(212, 175, 55, 0.2); position: relative;">
            
            <!-- Inner Corner Details -->
            <div style="position: absolute; top: 10px; right: 10px; width: 30px; height: 30px; border-top: 2px solid rgba(212, 175, 55, 0.5); border-right: 2px solid rgba(212, 175, 55, 0.5); border-top-right-radius: 5px;"></div>
            <div style="position: absolute; top: 10px; left: 10px; width: 30px; height: 30px; border-top: 2px solid rgba(212, 175, 55, 0.5); border-left: 2px solid rgba(212, 175, 55, 0.5); border-top-left-radius: 5px;"></div>
            <div style="position: absolute; bottom: 10px; right: 10px; width: 30px; height: 30px; border-bottom: 2px solid rgba(212, 175, 55, 0.5); border-right: 2px solid rgba(212, 175, 55, 0.5); border-bottom-right-radius: 5px;"></div>
            <div style="position: absolute; bottom: 10px; left: 10px; width: 30px; height: 30px; border-bottom: 2px solid rgba(212, 175, 55, 0.5); border-left: 2px solid rgba(212, 175, 55, 0.5); border-bottom-left-radius: 5px;"></div>
            
            ${settings.logoUrl ? `
            <div style="margin-bottom: 25px;">
              <img src="${settings.logoUrl}" alt="${settings.fromName}" style="max-width: 160px; filter: drop-shadow(0 6px 12px rgba(212, 175, 55, 0.4)); border: 3px solid rgba(212, 175, 55, 0.3); border-radius: 10px; padding: 10px; background: rgba(0, 0, 0, 0.5);">
            </div>
            ` : ''}
            
            <div style="background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.2), transparent); padding: 2px; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 36px; color: #f4d03f; font-family: 'Georgia', serif; letter-spacing: 3px; text-transform: uppercase; font-weight: 300; text-shadow: 0 0 20px rgba(212, 175, 55, 0.6), 0 2px 4px rgba(0, 0, 0, 0.8);">${settings.fromName}</h1>
            </div>
            
            <!-- Ornamental Divider -->
            <div style="display: flex; align-items: center; justify-content: center; margin: 25px 0;">
              <div style="flex: 1; height: 1px; background: linear-gradient(to right, transparent, rgba(212, 175, 55, 0.6) 50%, transparent);"></div>
              <div style="margin: 0 15px; width: 8px; height: 8px; background: #d4af37; transform: rotate(45deg); box-shadow: 0 0 10px rgba(212, 175, 55, 0.8);"></div>
              <div style="margin: 0 5px; width: 6px; height: 6px; background: #d4af37; border-radius: 50%; box-shadow: 0 0 8px rgba(212, 175, 55, 0.8);"></div>
              <div style="margin: 0 15px; width: 8px; height: 8px; background: #d4af37; transform: rotate(45deg); box-shadow: 0 0 10px rgba(212, 175, 55, 0.8);"></div>
              <div style="flex: 1; height: 1px; background: linear-gradient(to left, transparent, rgba(212, 175, 55, 0.6) 50%, transparent);"></div>
            </div>
            
            <p style="margin: 0; color: #c4c4c4; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; font-weight: 300;">Premium Experience</p>
          </div>
        </div>
      `;
    } else {
      return `
        <div style="background: white; padding: 30px 20px; text-align: center; border-bottom: 2px solid #e2e8f0;">
          ${settings.logoUrl ? `<img src="${settings.logoUrl}" alt="${settings.fromName}" style="max-width: 100px; margin-bottom: 10px;">` : ''}
          <h1 style="margin: 0; font-size: 22px; color: #2d3748; font-weight: 600;">${settings.fromName}</h1>
        </div>
      `;
    }
  };

  const getEmailFooter = (style: 'modern' | 'classic' | 'minimal' | 'elegant' = 'modern') => {
    if (style === 'modern') {
      return `
        <div style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); padding: 30px 20px; text-align: center; color: #666; font-size: 14px; border-radius: 0 0 10px 10px; margin-top: 30px;">
          <p style="margin: 10px 0;">📞 پشتیبانی: <strong style="color: #667eea;">${settings.supportPhone}</strong></p>
          <p style="margin: 10px 0;">📧 ایمیل: <a href="mailto:${settings.supportEmail}" style="color: #667eea; text-decoration: none; font-weight: 500;">${settings.supportEmail}</a></p>
          <div style="margin: 20px 0; padding-top: 20px; border-top: 1px solid #cbd5e0;">
            <p style="margin: 5px 0; color: #a0aec0; font-size: 12px;">این ایمیل به صورت خودکار ارسال شده است.</p>
          </div>
        </div>
      `;
    } else if (style === 'classic') {
      return `
        <div style="background: #f8f9fa; padding: 30px 20px; text-align: center; color: #666; font-size: 14px; margin-top: 30px; border-top: 3px solid #d4af37;">
          <p style="margin: 10px 0; color: #1a202c;">📞 <strong>${settings.supportPhone}</strong> | 📧 <a href="mailto:${settings.supportEmail}" style="color: #1a202c; text-decoration: none;">${settings.supportEmail}</a></p>
          <p style="margin: 20px 0 10px; color: #999; font-size: 12px; font-style: italic;">
            این ایمیل به صورت خودکار ارسال شده است.
          </p>
        </div>
      `;
    } else if (style === 'elegant') {
      return `
        <div style="background: linear-gradient(to top, #0a0a0a, #1a1a1a); padding: 50px 20px 40px; text-align: center; margin-top: 50px; border-top: 2px solid rgba(212, 175, 55, 0.4); position: relative; overflow: hidden;">
          
          <!-- Decorative Top Border -->
          <div style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 300px; height: 2px; background: linear-gradient(to right, transparent, #d4af37, transparent); box-shadow: 0 0 10px rgba(212, 175, 55, 0.6);"></div>
          
          <!-- Bottom Corner Ornaments -->
          <div style="position: absolute; bottom: 0; right: 0; width: 80px; height: 80px; background: linear-gradient(315deg, transparent 50%, rgba(212, 175, 55, 0.08) 50%); border-top-left-radius: 100%;"></div>
          <div style="position: absolute; bottom: 0; left: 0; width: 80px; height: 80px; background: linear-gradient(45deg, transparent 50%, rgba(212, 175, 55, 0.08) 50%); border-top-right-radius: 100%;"></div>
          
          <div style="max-width: 600px; margin: 0 auto;">
            
            <!-- Ornamental Divider Top -->
            <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 30px;">
              <div style="flex: 1; height: 1px; background: linear-gradient(to right, transparent, rgba(212, 175, 55, 0.4));"></div>
              <div style="margin: 0 20px;">
                <svg width="30" height="30" style="opacity: 0.6;">
                  <circle cx="15" cy="15" r="12" fill="none" stroke="#d4af37" stroke-width="1"/>
                  <circle cx="15" cy="15" r="4" fill="#d4af37"/>
                </svg>
              </div>
              <div style="flex: 1; height: 1px; background: linear-gradient(to left, transparent, rgba(212, 175, 55, 0.4));"></div>
            </div>
            
            <!-- Contact Cards -->
            <div style="display: flex; justify-content: center; gap: 40px; margin-bottom: 35px; flex-wrap: wrap;">
              <div style="background: linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(212, 175, 55, 0.05)); border: 1px solid rgba(212, 175, 55, 0.3); padding: 20px 30px; border-radius: 12px; min-width: 200px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);">
                <div style="margin-bottom: 10px;">
                  <svg width="24" height="24" style="display: inline-block; vertical-align: middle; margin-left: 8px;">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="#d4af37" stroke-width="2"/>
                    <path d="M8 12 L11 9 L11 15" stroke="#d4af37" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                    <path d="M13 9 L16 12 L13 15" stroke="#d4af37" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                  </svg>
                  <span style="color: #d4af37; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">تماس مستقیم</span>
                </div>
                <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600; letter-spacing: 0.5px;">${settings.supportPhone}</p>
              </div>
              
              <div style="background: linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(212, 175, 55, 0.05)); border: 1px solid rgba(212, 175, 55, 0.3); padding: 20px 30px; border-radius: 12px; min-width: 200px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);">
                <div style="margin-bottom: 10px;">
                  <svg width="24" height="24" style="display: inline-block; vertical-align: middle; margin-left: 8px;">
                    <rect x="4" y="6" width="16" height="12" rx="2" fill="none" stroke="#d4af37" stroke-width="2"/>
                    <path d="M4 8 L12 13 L20 8" stroke="#d4af37" stroke-width="2" fill="none" stroke-linecap="round"/>
                  </svg>
                  <span style="color: #d4af37; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">پست الکترونیک</span>
                </div>
                <p style="margin: 0;">
                  <a href="mailto:${settings.supportEmail}" style="color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; letter-spacing: 0.5px; transition: color 0.3s;">${settings.supportEmail}</a>
                </p>
              </div>
            </div>
            
            <!-- Decorative Separator -->
            <div style="margin: 35px 0;">
              <div style="display: flex; align-items: center; justify-content: center;">
                <div style="width: 6px; height: 6px; background: #d4af37; border-radius: 50%; opacity: 0.4; margin: 0 8px;"></div>
                <div style="width: 8px; height: 8px; background: #d4af37; border-radius: 50%; opacity: 0.6; margin: 0 8px;"></div>
                <div style="width: 10px; height: 10px; background: #d4af37; border-radius: 50%; opacity: 0.8; margin: 0 8px;"></div>
                <div style="width: 12px; height: 2px; background: linear-gradient(to right, #d4af37, transparent); opacity: 0.5; width: 60px;"></div>
                <div style="width: 12px; height: 2px; background: linear-gradient(to left, #d4af37, transparent); opacity: 0.5; width: 60px;"></div>
                <div style="width: 10px; height: 10px; background: #d4af37; border-radius: 50%; opacity: 0.8; margin: 0 8px;"></div>
                <div style="width: 8px; height: 8px; background: #d4af37; border-radius: 50%; opacity: 0.6; margin: 0 8px;"></div>
                <div style="width: 6px; height: 6px; background: #d4af37; border-radius: 50%; opacity: 0.4; margin: 0 8px;"></div>
              </div>
            </div>
            
            <!-- Footer Text -->
            <div style="background: rgba(212, 175, 55, 0.05); border: 1px solid rgba(212, 175, 55, 0.15); border-radius: 10px; padding: 20px; margin-bottom: 25px;">
              <p style="margin: 0; color: #999; font-size: 12px; font-style: italic; letter-spacing: 1px; line-height: 1.8;">
                این پیام به صورت خودکار از سیستم ارسال شده است<br>
                <span style="color: #d4af37; font-weight: 500;">لطفاً به این ایمیل پاسخ ندهید</span>
              </p>
            </div>
            
            <!-- Signature -->
            <div style="padding-top: 20px; border-top: 1px solid rgba(212, 175, 55, 0.2);">
              <p style="margin: 0; color: #666; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">
                With Regards,
              </p>
              <p style="margin: 8px 0 0; color: #d4af37; font-family: 'Brush Script MT', cursive; font-size: 24px; font-weight: 300; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);">
                ${settings.fromName}
              </p>
            </div>
          </div>
        </div>
      `;
    } else {
      return `
        <div style="background: white; padding: 25px 20px; text-align: center; color: #718096; font-size: 13px; margin-top: 30px; border-top: 1px solid #e2e8f0;">
          <p style="margin: 8px 0;">${settings.supportPhone} • ${settings.supportEmail}</p>
          <p style="margin: 15px 0 0; color: #cbd5e0; font-size: 11px;">این ایمیل به صورت خودکار ارسال شده است.</p>
        </div>
      `;
    }
  };

  const getOrderEmailContent = (style: 'modern' | 'classic' | 'minimal' | 'elegant') => {
    if (style === 'modern') {
      return `
        <div style="padding: 40px 30px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; margin-bottom: 15px;">
                ✅ سفارش ثبت شد
              </div>
              <h2 style="color: #1a202c; margin: 15px 0 10px; font-size: 26px;">سفارش شما با موفقیت ثبت شد!</h2>
              <p style="color: #718096; line-height: 1.8; font-size: 15px;">از خرید شما متشکریم. سفارش شما در حال آماده‌سازی است.</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #667eea30;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div>
                    <p style="margin: 0; color: #a0aec0; font-size: 13px;">شماره سفارش</p>
                    <p style="margin: 5px 0 0; color: #667eea; font-weight: bold; font-size: 18px;">#12345</p>
                  </div>
                  <div>
                    <p style="margin: 0; color: #a0aec0; font-size: 13px;">تاریخ ثبت</p>
                    <p style="margin: 5px 0 0; color: #2d3748; font-weight: 600;">1405/10/17</p>
                  </div>
                </div>
            </div>

            <h3 style="color: #2d3748; margin: 30px 0 20px; font-size: 18px; display: flex; align-items: center;">
              <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 4px; height: 20px; display: inline-block; margin-left: 10px; border-radius: 2px;"></span>
              محصولات سفارش
            </h3>
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
              <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                      <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                          <th style="padding: 15px; text-align: right; font-weight: 600;">محصول</th>
                          <th style="padding: 15px; text-align: center; font-weight: 600;">تعداد</th>
                          <th style="padding: 15px; text-align: left; font-weight: 600;">قیمت</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr style="border-bottom: 1px solid #f7fafc;">
                          <td style="padding: 15px; color: #2d3748;">قالب وردپرس حرفه‌ای</td>
                          <td style="padding: 15px; text-align: center; color: #718096;">×1</td>
                          <td style="padding: 15px; text-align: left; color: #2d3748; font-weight: 600;">250,000 تومان</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #f7fafc;">
                          <td style="padding: 15px; color: #2d3748;">افزونه فروشگاهی</td>
                          <td style="padding: 15px; text-align: center; color: #718096;">×2</td>
                          <td style="padding: 15px; text-align: left; color: #2d3748; font-weight: 600;">150,000 تومان</td>
                      </tr>
                  </tbody>
                  <tfoot>
                      <tr style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);">
                          <td colspan="2" style="padding: 18px; text-align: right; font-weight: 700; color: #1a202c; font-size: 16px;">جمع کل:</td>
                          <td style="padding: 18px; text-align: left; font-weight: 700; color: #667eea; font-size: 20px;">550,000 تومان</td>
                      </tr>
                  </tfoot>
              </table>
            </div>

            <div style="background: linear-gradient(135deg, #10b98115 0%, #05966915 100%); border: 2px solid #10b981; border-radius: 12px; padding: 20px; margin: 30px 0; text-align: center;">
                <h3 style="color: #047857; margin: 0 0 10px; font-size: 18px;">✨ مراحل بعدی</h3>
                <p style="color: #065f46; margin: 0; line-height: 1.8;">سفارش شما پس از تایید نهایی آماده ارسال خواهد شد.</p>
            </div>
        </div>
      `;
    } else if (style === 'classic') {
      return `
        <div style="padding: 40px 30px; background: #fafafa;">
            <h2 style="color: #1a202c; margin-top: 0; font-family: Georgia, serif; text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 15px;">تایید سفارش</h2>
            <p style="color: #4a5568; line-height: 1.9; text-align: center; font-size: 16px;">سفارش شما با موفقیت در سیستم ثبت گردید.</p>
            
            <table style="width: 100%; margin: 30px 0; background: white; border: 2px solid #d4af37;">
                <tr>
                  <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1a202c; width: 40%;">شماره سفارش:</td>
                  <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; color: #d4af37; font-weight: bold;">#12345</td>
                </tr>
                <tr>
                  <td style="padding: 15px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1a202c;">تاریخ:</td>
                  <td style="padding: 15px; border-bottom: 1px solid #e2e8f0;">1405/10/17</td>
                </tr>
                <tr>
                  <td style="padding: 15px; font-weight: bold; color: #1a202c;">وضعیت:</td>
                  <td style="padding: 15px; color: #10b981; font-weight: bold;">✓ پرداخت شده</td>
                </tr>
            </table>

            <h3 style="color: #1a202c; margin: 30px 0 20px; font-family: Georgia, serif; border-right: 4px solid #d4af37; padding-right: 15px;">اقلام سفارش</h3>
            <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #cbd5e0;">
                <thead>
                    <tr style="background: #1a202c; color: white;">
                        <th style="padding: 12px; text-align: right;">شرح محصول</th>
                        <th style="padding: 12px; text-align: center;">تعداد</th>
                        <th style="padding: 12px; text-align: left;">مبلغ</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px;">قالب وردپرس حرفه‌ای</td>
                        <td style="padding: 12px; text-align: center;">1</td>
                        <td style="padding: 12px; text-align: left;">250,000 تومان</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px;">افزونه فروشگاهی</td>
                        <td style="padding: 12px; text-align: center;">2</td>
                        <td style="padding: 12px; text-align: left;">150,000 تومان</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr style="background: #f8f9fa; border-top: 2px solid #d4af37;">
                        <td colspan="2" style="padding: 15px; text-align: right; font-weight: bold; font-size: 16px;">جمع کل:</td>
                        <td style="padding: 15px; text-align: left; font-weight: bold; color: #d4af37; font-size: 18px;">550,000 تومان</td>
                    </tr>
                </tfoot>
            </table>

            <div style="background: white; border: 2px solid #10b981; padding: 20px; margin: 30px 0; text-align: center;">
                <p style="color: #065f46; margin: 0; font-weight: 600;">سفارش شما در حال پردازش می‌باشد و به زودی ارسال خواهد شد.</p>
            </div>
        </div>
      `;
    } else if (style === 'elegant') {
      return `
        <div style="padding: 60px 30px; background: linear-gradient(to bottom, #1a1a1a 0%, #0a0a0a 50%, #000000 100%); position: relative; overflow: hidden;">
            
            <!-- Background Pattern -->
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.03; background-image: repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(212, 175, 55, 0.3) 35px, rgba(212, 175, 55, 0.3) 36px); pointer-events: none;"></div>
            
            <div style="max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0.02) 100%); border: 2px solid rgba(212, 175, 55, 0.3); border-radius: 20px; padding: 50px 40px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(212, 175, 55, 0.2); position: relative;">
              
              <!-- Corner Decorations -->
              <div style="position: absolute; top: -2px; right: -2px; width: 50px; height: 50px; border-top: 3px solid #d4af37; border-right: 3px solid #d4af37; border-top-right-radius: 20px;"></div>
              <div style="position: absolute; top: -2px; left: -2px; width: 50px; height: 50px; border-top: 3px solid #d4af37; border-left: 3px solid #d4af37; border-top-left-radius: 20px;"></div>
              <div style="position: absolute; bottom: -2px; right: -2px; width: 50px; height: 50px; border-bottom: 3px solid #d4af37; border-right: 3px solid #d4af37; border-bottom-right-radius: 20px;"></div>
              <div style="position: absolute; bottom: -2px; left: -2px; width: 50px; height: 50px; border-bottom: 3px solid #d4af37; border-left: 3px solid #d4af37; border-bottom-left-radius: 20px;"></div>
              
              <!-- Header Section -->
              <div style="text-align: center; margin-bottom: 45px; padding-bottom: 35px; border-bottom: 2px solid rgba(212, 175, 55, 0.3); position: relative;">
                
                <!-- Decorative Badge -->
                <div style="display: inline-block; position: relative; margin-bottom: 25px;">
                  <div style="background: linear-gradient(135deg, #d4af37 0%, #f4d03f 50%, #d4af37 100%); padding: 4px; border-radius: 30px; box-shadow: 0 0 20px rgba(212, 175, 55, 0.5);">
                    <div style="background: #000000; padding: 12px 35px; border-radius: 27px; position: relative;">
                      <span style="color: #d4af37; font-size: 14px; letter-spacing: 3px; text-transform: uppercase; font-weight: 700; text-shadow: 0 2px 10px rgba(212, 175, 55, 0.5);">
                        <svg width="20" height="20" style="display: inline-block; vertical-align: middle; margin-left: 8px;">
                          <path d="M10 2 L12 8 L18 8 L13 12 L15 18 L10 14 L5 18 L7 12 L2 8 L8 8 Z" fill="#d4af37" stroke="#f4d03f" stroke-width="0.5"/>
                        </svg>
                        تأیید سفارش VIP
                      </span>
                    </div>
                  </div>
                </div>
                
                <h2 style="color: #f4d03f; margin: 0 0 15px; font-size: 32px; font-family: 'Georgia', serif; font-weight: 400; letter-spacing: 2px; text-shadow: 0 0 30px rgba(212, 175, 55, 0.4), 0 4px 8px rgba(0, 0, 0, 0.8);">سفارش شما ثبت گردید</h2>
                
                <!-- Ornamental Divider -->
                <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                  <div style="width: 50px; height: 1px; background: linear-gradient(to right, transparent, #d4af37);"></div>
                  <div style="margin: 0 12px; width: 6px; height: 6px; background: #d4af37; transform: rotate(45deg);"></div>
                  <div style="margin: 0 6px; width: 4px; height: 4px; background: #d4af37; border-radius: 50%;"></div>
                  <div style="margin: 0 12px; width: 6px; height: 6px; background: #d4af37; transform: rotate(45deg);"></div>
                  <div style="width: 50px; height: 1px; background: linear-gradient(to left, transparent, #d4af37);"></div>
                </div>
                
                <p style="color: #aaa; margin: 0; font-size: 15px; line-height: 1.8; letter-spacing: 0.5px;">با تشکر از اعتماد شما به خدمات پریمیوم ما</p>
              </div>
              
              <!-- Order Details Cards -->
              <div style="display: flex; gap: 25px; margin-bottom: 40px; flex-wrap: wrap; justify-content: space-between;">
                
                <div style="flex: 1; min-width: 250px; background: linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(212, 175, 55, 0.06)); border: 2px solid rgba(212, 175, 55, 0.3); padding: 25px; border-radius: 15px; text-align: center; position: relative; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);">
                  <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #000; padding: 5px 20px; border: 2px solid #d4af37; border-radius: 20px;">
                    <span style="color: #d4af37; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600;">Order ID</span>
                  </div>
                  <p style="margin: 20px 0 0; color: #fff; font-size: 28px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 2px; text-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);">#12345</p>
                  <div style="margin-top: 12px; width: 60%; height: 2px; background: linear-gradient(to right, transparent, #d4af37, transparent); margin-left: auto; margin-right: auto;"></div>
                </div>
                
                <div style="flex: 1; min-width: 250px; background: linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(212, 175, 55, 0.06)); border: 2px solid rgba(212, 175, 55, 0.3); padding: 25px; border-radius: 15px; text-align: center; position: relative; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);">
                  <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #000; padding: 5px 20px; border: 2px solid #d4af37; border-radius: 20px;">
                    <span style="color: #d4af37; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; font-weight: 600;">Date</span>
                  </div>
                  <p style="margin: 20px 0 0; color: #fff; font-size: 20px; font-weight: 600; letter-spacing: 1px;">1405/10/17</p>
                  <p style="margin: 8px 0 0; color: #888; font-size: 13px;">14:30 PM</p>
                </div>
                
              </div>

              <!-- Products Table -->
              <div style="background: linear-gradient(to bottom, #000000, #0a0a0a); border: 2px solid rgba(212, 175, 55, 0.4); border-radius: 15px; overflow: hidden; margin: 35px 0; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); position: relative;">
                
                <!-- Table Header with Ornament -->
                <div style="background: linear-gradient(90deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.1), rgba(212, 175, 55, 0.2)); padding: 20px 25px; border-bottom: 2px solid rgba(212, 175, 55, 0.4); position: relative;">
                  <div style="position: absolute; top: 50%; left: 20px; transform: translateY(-50%); width: 40px; height: 40px; border: 2px solid rgba(212, 175, 55, 0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <div style="width: 20px; height: 20px; background: #d4af37; border-radius: 50%; box-shadow: 0 0 15px rgba(212, 175, 55, 0.6);"></div>
                  </div>
                  <h3 style="margin: 0; color: #d4af37; font-size: 16px; text-transform: uppercase; letter-spacing: 3px; font-weight: 400; text-align: center;">اقلام سفارش</h3>
                </div>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background: linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.08)); border-bottom: 1px solid rgba(212, 175, 55, 0.3);">
                      <th style="padding: 18px 20px; text-align: right; color: #d4af37; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; font-weight: 600;">محصول</th>
                      <th style="padding: 18px 20px; text-align: center; color: #d4af37; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; font-weight: 600;">تعداد</th>
                      <th style="padding: 18px 20px; text-align: left; color: #d4af37; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; font-weight: 600;">قیمت</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.1); transition: background 0.3s;">
                      <td style="padding: 22px 20px; color: #fff; font-size: 15px; font-weight: 500;">
                        <div style="display: flex; align-items: center;">
                          <div style="width: 6px; height: 6px; background: #d4af37; border-radius: 50%; margin-left: 12px; box-shadow: 0 0 8px rgba(212, 175, 55, 0.6);"></div>
                          قالب وردپرس حرفه‌ای
                        </div>
                      </td>
                      <td style="padding: 22px 20px; text-align: center; color: #999; font-size: 15px;">×1</td>
                      <td style="padding: 22px 20px; text-align: left; color: #d4af37; font-weight: 600; font-size: 16px;">250,000 <span style="font-size: 13px; color: #999;">تومان</span></td>
                    </tr>
                    <tr style="border-bottom: 1px solid rgba(212, 175, 55, 0.1);">
                      <td style="padding: 22px 20px; color: #fff; font-size: 15px; font-weight: 500;">
                        <div style="display: flex; align-items: center;">
                          <div style="width: 6px; height: 6px; background: #d4af37; border-radius: 50%; margin-left: 12px; box-shadow: 0 0 8px rgba(212, 175, 55, 0.6);"></div>
                          افزونه فروشگاهی
                        </div>
                      </td>
                      <td style="padding: 22px 20px; text-align: center; color: #999; font-size: 15px;">×2</td>
                      <td style="padding: 22px 20px; text-align: left; color: #d4af37; font-weight: 600; font-size: 16px;">150,000 <span style="font-size: 13px; color: #999;">تومان</span></td>
                    </tr>
                  </tbody>
                </table>
                
                <!-- Total Section -->
                <div style="background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%); padding: 28px 25px; border-top: 3px solid #d4af37; position: relative;">
                  <div style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: #000; padding: 5px 15px; border: 2px solid #d4af37; border-radius: 20px;">
                    <span style="color: #d4af37; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700;">TOTAL</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px;">
                    <span style="color: #fff; font-size: 17px; text-transform: uppercase; letter-spacing: 2px; font-weight: 400;">مبلغ کل سفارش:</span>
                    <div style="text-align: left;">
                      <span style="color: #f4d03f; font-size: 32px; font-weight: 700; font-family: 'Georgia', serif; text-shadow: 0 0 20px rgba(244, 208, 63, 0.5), 0 2px 4px rgba(0, 0, 0, 0.8);">550,000</span>
                      <span style="color: #aaa; font-size: 16px; font-weight: 400; margin-right: 8px;">تومان</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Status Box -->
              <div style="text-align: center; margin-top: 40px; padding: 30px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.08)); border: 2px solid rgba(16, 185, 129, 0.4); border-radius: 15px; position: relative; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);">
                <div style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #10b981, #059669); padding: 8px 25px; border-radius: 20px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
                  <span style="color: #fff; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700;">✓ Confirmed</span>
                </div>
                <p style="margin: 15px 0 0; color: #10b981; font-size: 16px; font-weight: 600; line-height: 1.8; letter-spacing: 0.5px;">
                  سفارش شما در اولویت قرار گرفت و به زودی<br>
                  توسط تیم پشتیبانی اختصاصی پردازش خواهد شد
                </p>
              </div>
            </div>
        </div>
      `;
    } else {
      return `
        <div style="padding: 30px 25px;">
            <h2 style="color: #2d3748; margin: 0 0 20px; font-size: 22px; font-weight: 600;">سفارش ثبت شد ✓</h2>
            <p style="color: #718096; line-height: 1.7; margin: 0 0 25px;">از خرید شما سپاسگزاریم.</p>
            
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="margin: 8px 0; color: #a0aec0; font-size: 13px;">شماره سفارش</p>
                <p style="margin: 0; color: #2d3748; font-weight: 700; font-size: 20px;">#12345</p>
                <p style="margin: 15px 0 8px; color: #a0aec0; font-size: 13px;">تاریخ</p>
                <p style="margin: 0; color: #2d3748;">1405/10/17</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
                <thead>
                    <tr style="border-bottom: 2px solid #2d3748;">
                        <th style="padding: 12px 0; text-align: right; font-weight: 600; color: #2d3748;">محصول</th>
                        <th style="padding: 12px 0; text-align: center; font-weight: 600; color: #2d3748;">تعداد</th>
                        <th style="padding: 12px 0; text-align: left; font-weight: 600; color: #2d3748;">قیمت</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px 0; color: #4a5568;">قالب وردپرس حرفه‌ای</td>
                        <td style="padding: 12px 0; text-align: center; color: #a0aec0;">1</td>
                        <td style="padding: 12px 0; text-align: left; color: #2d3748;">250,000</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px 0; color: #4a5568;">افزونه فروشگاهی</td>
                        <td style="padding: 12px 0; text-align: center; color: #a0aec0;">2</td>
                        <td style="padding: 12px 0; text-align: left; color: #2d3748;">150,000</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr style="border-top: 2px solid #2d3748;">
                        <td colspan="2" style="padding: 15px 0; text-align: right; font-weight: 700; color: #2d3748;">جمع:</td>
                        <td style="padding: 15px 0; text-align: left; font-weight: 700; color: #2d3748; font-size: 18px;">550,000</td>
                    </tr>
                </tfoot>
            </table>
        </div>
      `;
    }
  };

  const getEmailPreview = (type: 'order' | 'reset' | 'ticket' | 'invoice') => {
    const selectedTemplate = settings.templates?.[type] || 'modern';
    
    const baseStyle = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>پیش‌نمایش ایمیل</title>
      </head>
      <body style="font-family: Tahoma, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: ${selectedTemplate === 'minimal' ? '0' : '10px'}; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    `;

    const endStyle = `
          </div>
      </body>
      </html>
    `;

    if (type === 'order') {
      return baseStyle + getEmailHeader(selectedTemplate) + getOrderEmailContent(selectedTemplate) + getEmailFooter(selectedTemplate) + endStyle;
    }

    if (type === 'reset') {
      return baseStyle + getEmailHeader(selectedTemplate) + `
        <div style="padding: 40px 30px;">
            <h2 style="color: #2d3748; margin-top: 0;">🔑 بازیابی رمز عبور</h2>
            <p style="color: #4a5568; line-height: 1.8;">درخواستی برای بازیابی رمز عبور حساب کاربری شما دریافت شد.</p>
            
            <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <p style="color: #92400e; margin: 0;"><strong>⚠️ توجه:</strong> اگر این درخواست توسط شما انجام نشده، لطفاً این ایمیل را نادیده بگیرید.</p>
            </div>

            <p style="color: #4a5568; line-height: 1.8;">برای تنظیم رمز عبور جدید، روی دکمه زیر کلیک کنید:</p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    🔐 تنظیم رمز عبور جدید
                </a>
            </div>

            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <p style="color: #4a5568; margin: 10px 0; font-size: 14px;"><strong>لینک بازیابی:</strong></p>
                <p style="color: #667eea; margin: 10px 0; word-break: break-all; font-size: 13px; font-family: monospace;">
                    https://store.com/reset-password?token=abc123xyz789
                </p>
                <p style="color: #ef4444; margin: 10px 0; font-size: 13px;">⏰ این لینک تا 1 ساعت آینده معتبر است.</p>
            </div>
        </div>
      ` + getEmailFooter(selectedTemplate) + endStyle;
    }

    if (type === 'ticket') {
      return baseStyle + getEmailHeader(selectedTemplate) + `
        <div style="padding: 40px 30px;">
            <h2 style="color: #2d3748; margin-top: 0;">🎫 پاسخ جدید به تیکت شما</h2>
            <p style="color: #4a5568; line-height: 1.8;">پاسخ جدیدی برای تیکت پشتیبانی شما ثبت شده است.</p>
            
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 25px 0; border-right: 4px solid #667eea;">
                <p style="margin: 10px 0;"><strong style="color: #2d3748;">شماره تیکت:</strong> <span style="color: #667eea;">#TKT-456</span></p>
                <p style="margin: 10px 0;"><strong style="color: #2d3748;">موضوع:</strong> مشکل در ورود به حساب کاربری</p>
                <p style="margin: 10px 0;"><strong style="color: #2d3748;">وضعیت:</strong> <span style="color: #10b981;">✅ پاسخ داده شده</span></p>
            </div>

            <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 15px;">
                    <strong style="color: #667eea;">👤 پشتیبانی فنی</strong>
                    <span style="color: #9ca3af; font-size: 13px; margin-right: 10px;">2 ساعت پیش</span>
                </div>
                <p style="color: #4a5568; line-height: 1.8; margin: 0;">
                    سلام و وقت بخیر،<br><br>
                    مشکل شما بررسی و برطرف شد. لطفاً مجدداً تلاش کنید و در صورت ادامه مشکل، با ما در ارتباط باشید.<br><br>
                    با تشکر،<br>
                    تیم پشتیبانی
                </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="#" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    مشاهده تیکت
                </a>
            </div>
        </div>
      ` + getEmailFooter(selectedTemplate) + endStyle;
    }

    if (type === 'invoice') {
      return baseStyle + getEmailHeader(selectedTemplate) + `
        <div style="padding: 40px 30px;">
            <h2 style="color: #2d3748; margin-top: 0;">📄 فاکتور سفارش شما</h2>
            <p style="color: #4a5568; line-height: 1.8;">فاکتور سفارش شما آماده شده است.</p>
            
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                    <div>
                        <p style="margin: 5px 0; color: #6b7280; font-size: 13px;">شماره فاکتور</p>
                        <p style="margin: 5px 0; color: #1f2937; font-weight: bold; font-size: 16px;">#INV-2024-001</p>
                    </div>
                    <div style="text-align: left;">
                        <p style="margin: 5px 0; color: #6b7280; font-size: 13px;">تاریخ صدور</p>
                        <p style="margin: 5px 0; color: #1f2937; font-weight: bold;">1405/10/17</p>
                    </div>
                </div>
                
                <div style="border-top: 1px solid #e5e7eb; padding-top: 15px;">
                    <p style="margin: 5px 0; color: #6b7280; font-size: 13px;">صادر شده برای:</p>
                    <p style="margin: 5px 0; color: #1f2937; font-weight: bold;">علی احمدی</p>
                    <p style="margin: 5px 0; color: #6b7280; font-size: 13px;">ali@example.com</p>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background: #667eea; color: white;">
                        <th style="padding: 12px; text-align: right;">شرح</th>
                        <th style="padding: 12px; text-align: center;">تعداد</th>
                        <th style="padding: 12px; text-align: center;">قیمت واحد</th>
                        <th style="padding: 12px; text-align: left;">جمع</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px;">قالب وردپرس</td>
                        <td style="padding: 12px; text-align: center;">1</td>
                        <td style="padding: 12px; text-align: center;">250,000</td>
                        <td style="padding: 12px; text-align: left;">250,000 تومان</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px;">هزینه ارسال</td>
                        <td style="padding: 12px; text-align: center;">-</td>
                        <td style="padding: 12px; text-align: center;">30,000</td>
                        <td style="padding: 12px; text-align: left;">30,000 تومان</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr style="background: #f7fafc;">
                        <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold;">جمع کل:</td>
                        <td style="padding: 12px; text-align: left; font-weight: bold; color: #667eea; font-size: 18px;">280,000 تومان</td>
                    </tr>
                </tfoot>
            </table>

            <div style="background: #ecfdf5; border: 2px solid #10b981; border-radius: 8px; padding: 15px; margin: 25px 0;">
                <p style="color: #065f46; margin: 0; text-align: center;">✅ <strong>پرداخت شده</strong></p>
            </div>

            <p style="color: #6b7280; font-size: 13px; margin-top: 30px;">
                برای دانلود نسخه PDF فاکتور، می‌توانید به پنل کاربری خود مراجعه کنید.
            </p>
        </div>
      ` + getEmailFooter(selectedTemplate) + endStyle;
    }

    return baseStyle + endStyle;
  };

  const quickSetupGmail = () => {
    setSettings(prev => ({
      ...prev,
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpSecure: true,
      useResend: false
    }));
    toast.success('تنظیمات Gmail اعمال شد');
  };

  const quickSetupLocal = () => {
    setSettings(prev => ({
      ...prev,
      smtpHost: 'localhost',
      smtpPort: 2525,
      smtpUser: '',
      smtpPass: '',
      smtpSecure: false,
      useResend: false
    }));
    toast.success('تنظیمات Local SMTP اعمال شد');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">در حال بارگذاری تنظیمات ایمیل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">⚙️ تنظیمات ایمیل</h1>
            <p className="text-purple-300">پیکربندی سیستم ارسال ایمیل سایت</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>در حال ذخیره...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>ذخیره تنظیمات</span>
              </>
            )}
          </button>
        </div>

        {/* Status Card */}
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-purple-500/30 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${settings.enabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <div>
                <h3 className="text-lg font-semibold text-white">وضعیت سیستم ایمیل</h3>
                <p className={`text-sm ${settings.enabled ? 'text-green-400' : 'text-red-400'}`}>
                  {settings.enabled ? '✅ فعال' : '❌ غیرفعال'}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => handleInputChange('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>

        {/* Tabs */}
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-purple-500/30">
          <div className="border-b border-gray-700">
            <nav className="flex space-x-4 space-x-reverse px-6">
              <button
                onClick={() => setActiveTab('smtp')}
                className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'smtp'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                📧 تنظیمات SMTP
              </button>
              <button
                onClick={() => setActiveTab('resend')}
                className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'resend'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                🚀 Resend API
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'templates'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                📝 تنظیمات عمومی
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'preview'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                👁️ پیش‌نمایش قالب‌ها
              </button>
              <button
                onClick={() => setActiveTab('bulk-send')}
                className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'bulk-send'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                📨 ارسال گروهی
              </button>
              <button
                onClick={() => {
                  setActiveTab('email-list');
                  fetchEmailList();
                }}
                className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'email-list'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                📋 مدیریت لیست
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* SMTP Tab */}
            {activeTab === 'smtp' && (
              <div className="space-y-6">
                {/* Quick Setup */}
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={quickSetupGmail}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                  >
                    📧 Gmail Quick Setup
                  </button>
                  <button
                    onClick={quickSetupLocal}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                  >
                    💻 Local SMTP
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      value={settings.smtpHost}
                      onChange={(e) => handleInputChange('smtpHost', e.target.value)}
                      placeholder="smtp.gmail.com"
                      className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      SMTP Port
                    </label>
                    <input
                      type="number"
                      value={settings.smtpPort}
                      onChange={(e) => handleInputChange('smtpPort', parseInt(e.target.value))}
                      placeholder="587"
                      className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Username / Email
                    </label>
                    <input
                      type="text"
                      value={settings.smtpUser}
                      onChange={(e) => handleInputChange('smtpUser', e.target.value)}
                      placeholder="your-email@gmail.com"
                      className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password / App Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={settings.smtpPass}
                        onChange={(e) => handleInputChange('smtpPass', e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-lg">
                  <input
                    type="checkbox"
                    id="smtpSecure"
                    checked={settings.smtpSecure}
                    onChange={(e) => handleInputChange('smtpSecure', e.target.checked)}
                    className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="smtpSecure" className="text-white cursor-pointer">
                    🔒 استفاده از اتصال امن (SSL/TLS)
                  </label>
                </div>

                {/* Help Text */}
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-blue-400 font-semibold mb-2">📖 راهنمای تنظیمات Gmail:</h4>
                  <ol className="text-blue-200 text-sm space-y-1 mr-5 list-decimal">
                    <li>به <a href="https://myaccount.google.com/apppasswords" target="_blank" className="underline">Google App Passwords</a> بروید</li>
                    <li>یک App Password جدید ایجاد کنید</li>
                    <li>رمز 16 رقمی را در فیلد Password وارد کنید</li>
                    <li>Host: smtp.gmail.com | Port: 587 | Secure: ✅</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Resend API Tab */}
            {activeTab === 'resend' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg">
                  <input
                    type="checkbox"
                    id="useResend"
                    checked={settings.useResend}
                    onChange={(e) => handleInputChange('useResend', e.target.checked)}
                    className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="useResend" className="text-white cursor-pointer">
                    🚀 استفاده از Resend API به جای SMTP
                  </label>
                </div>

                {settings.useResend && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Resend API Key
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={settings.resendApiKey}
                        onChange={(e) => handleInputChange('resendApiKey', e.target.value)}
                        placeholder="re_••••••••••••"
                        className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>

                    <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4">
                      <h4 className="text-purple-400 font-semibold mb-2">🔑 دریافت API Key:</h4>
                      <ol className="text-purple-200 text-sm space-y-1 mr-5 list-decimal">
                        <li>به <a href="https://resend.com" target="_blank" className="underline">Resend.com</a> بروید</li>
                        <li>در پنل خود وارد شوید یا ثبت نام کنید</li>
                        <li>از بخش API Keys یک کلید جدید ایجاد کنید</li>
                        <li>کلید را در فیلد بالا وارد کنید</li>
                      </ol>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* General Settings Tab */}
            {activeTab === 'templates' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      نام فرستنده
                    </label>
                    <input
                      type="text"
                      value={settings.fromName}
                      onChange={(e) => handleInputChange('fromName', e.target.value)}
                      placeholder="فروشگاه آنلاین"
                      className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      ایمیل فرستنده
                    </label>
                    <input
                      type="email"
                      value={settings.fromAddress}
                      onChange={(e) => handleInputChange('fromAddress', e.target.value)}
                      placeholder="noreply@store.com"
                      className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      ایمیل پشتیبانی
                    </label>
                    <input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                      placeholder="support@store.com"
                      className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      تلفن پشتیبانی
                    </label>
                    <input
                      type="text"
                      value={settings.supportPhone}
                      onChange={(e) => handleInputChange('supportPhone', e.target.value)}
                      placeholder="021-12345678"
                      className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    لوگوی ایمیل (URL)
                  </label>
                  <input
                    type="url"
                    value={settings.logoUrl}
                    onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                    placeholder="https://store.com/logo.png"
                    className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
                  />
                  <p className="text-gray-400 text-sm mt-1">این لوگو در هدر ایمیل‌های ارسالی نمایش داده می‌شود</p>
                </div>
              </div>
            )}

            {/* Preview Tab */}
            {activeTab === 'preview' && (
              <div className="space-y-6">
                {/* Template Selector */}
                <div className="flex gap-2 mb-6 flex-wrap">
                  <button
                    onClick={() => setPreviewType('order')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      previewType === 'order'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    📦 تایید سفارش
                  </button>
                  <button
                    onClick={() => setPreviewType('reset')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      previewType === 'reset'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    🔑 بازیابی رمز عبور
                  </button>
                  <button
                    onClick={() => setPreviewType('ticket')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      previewType === 'ticket'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    🎫 پاسخ تیکت
                  </button>
                  <button
                    onClick={() => setPreviewType('invoice')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      previewType === 'invoice'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    📄 فاکتور
                  </button>
                </div>

                {/* Template Style Selector */}
                <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-4 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <label className="text-white font-semibold">🎨 طراحی قالب ایمیل</label>
                    <span className="text-xs text-gray-400 italic">هر طرح layout و استایل منحصر به فرد دارد</span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                      onClick={() => handleTemplateChange(previewType, 'modern')}
                      className={`px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium ${
                        settings.templates?.[previewType] === 'modern'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {settings.templates?.[previewType] === 'modern' && <span>✓</span>}
                      🚀 مدرن
                    </button>
                    
                    <button
                      onClick={() => handleTemplateChange(previewType, 'classic')}
                      className={`px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium ${
                        settings.templates?.[previewType] === 'classic'
                          ? 'bg-gradient-to-r from-gray-800 to-yellow-700 text-white shadow-lg scale-105'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {settings.templates?.[previewType] === 'classic' && <span>✓</span>}
                      📜 کلاسیک
                    </button>
                    
                    <button
                      onClick={() => handleTemplateChange(previewType, 'minimal')}
                      className={`px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium ${
                        settings.templates?.[previewType] === 'minimal'
                          ? 'bg-white text-gray-800 shadow-lg scale-105'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {settings.templates?.[previewType] === 'minimal' && <span>✓</span>}
                      ✨ مینیمال
                    </button>
                    
                    <button
                      onClick={() => handleTemplateChange(previewType, 'elegant')}
                      className={`px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium ${
                        settings.templates?.[previewType] === 'elegant'
                          ? 'bg-gradient-to-r from-black via-yellow-900 to-black text-yellow-400 shadow-lg shadow-yellow-500/50 border-2 border-yellow-600 scale-105'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {settings.templates?.[previewType] === 'elegant' && <span>✓</span>}
                      👑 الگانت
                    </button>
                  </div>
                </div>

                {/* Preview Container */}
                <div className="bg-white rounded-lg p-6 shadow-xl">
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {previewType === 'order' && '📦 پیش‌نمایش ایمیل تایید سفارش'}
                      {previewType === 'reset' && '🔑 پیش‌نمایش ایمیل بازیابی رمز عبور'}
                      {previewType === 'ticket' && '🎫 پیش‌نمایش ایمیل پاسخ تیکت'}
                      {previewType === 'invoice' && '📄 پیش‌نمایش ایمیل فاکتور'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      این پیش‌نمایشی از ایمیلی است که به کاربران ارسال می‌شود
                    </p>
                  </div>

                  {/* Email Preview */}
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <iframe
                      srcDoc={getEmailPreview(previewType)}
                      className="w-full h-[600px] bg-white"
                      title="Email Preview"
                    />
                  </div>
                </div>

                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-blue-400 font-semibold mb-2">💡 نکته:</h4>
                  <p className="text-blue-200 text-sm">
                    این قالب‌ها به صورت خودکار از تنظیمات شما (نام، لوگو، اطلاعات پشتیبانی) استفاده می‌کنند.
                    پس از تغییر تنظیمات، قالب‌ها به‌روزرسانی می‌شوند.
                  </p>
                </div>
              </div>
            )}

            {/* Bulk Send Tab */}
            {activeTab === 'bulk-send' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-blue-400 font-semibold mb-2">📨 ارسال ایمیل گروهی</h4>
                  <p className="text-blue-200 text-sm">
                    می‌توانید ایمیل تبلیغاتی خود را به چندین گیرنده به صورت همزمان ارسال کنید
                  </p>
                </div>

                {/* Email Subject */}
                <div>
                  <label className="block text-white font-medium mb-2">📋 موضوع ایمیل</label>
                  <input
                    type="text"
                    value={bulkEmailSubject}
                    onChange={(e) => setBulkEmailSubject(e.target.value)}
                    placeholder="مثال: پیشنهاد ویژه - تخفیف 50%"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                {/* Email Body */}
                <div>
                  <label className="block text-white font-medium mb-2">📝 متن ایمیل</label>
                  <textarea
                    value={bulkEmailBody}
                    onChange={(e) => setBulkEmailBody(e.target.value)}
                    placeholder="<h2>🎉 پیشنهاد ویژه</h2>&#10;<p>سلام عزیز،</p>&#10;<p>ما یک پیشنهاد ویژه برای شما داریم:</p>&#10;<ul>&#10;<li>تخفیف 50% روی همه محصولات</li>&#10;<li>ارسال رایگان</li>&#10;</ul>&#10;<p>با تشکر</p>"
                    rows={8}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400 font-mono text-sm"
                  />
                  <p className="text-gray-400 text-xs mt-2">
                    💡 از HTML استفاده کنید: &lt;h2&gt;عنوان&lt;/h2&gt;، &lt;p&gt;پاراگراف&lt;/p&gt;، &lt;ul&gt;&lt;li&gt;لیست&lt;/li&gt;&lt;/ul&gt;
                  </p>
                </div>

                {/* Template Selector */}
                <div>
                  <label className="block text-white font-medium mb-2">🎨 انتخاب قالب تبلیغاتی</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                      onClick={() => setBulkEmailTemplate('modern')}
                      className={`px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium ${
                        bulkEmailTemplate === 'modern'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105 border-2 border-purple-400'
                          : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
                      }`}
                    >
                      {bulkEmailTemplate === 'modern' && <span>✓</span>}
                      🚀 مدرن
                    </button>
                    
                    <button
                      onClick={() => setBulkEmailTemplate('classic')}
                      className={`px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium ${
                        bulkEmailTemplate === 'classic'
                          ? 'bg-gradient-to-r from-gray-800 to-yellow-700 text-white shadow-lg scale-105 border-2 border-yellow-600'
                          : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
                      }`}
                    >
                      {bulkEmailTemplate === 'classic' && <span>✓</span>}
                      📜 کلاسیک
                    </button>
                    
                    <button
                      onClick={() => setBulkEmailTemplate('minimal')}
                      className={`px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium ${
                        bulkEmailTemplate === 'minimal'
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105 border-2 border-cyan-400'
                          : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
                      }`}
                    >
                      {bulkEmailTemplate === 'minimal' && <span>✓</span>}
                      ✨ مینیمال
                    </button>
                    
                    <button
                      onClick={() => setBulkEmailTemplate('elegant')}
                      className={`px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium ${
                        bulkEmailTemplate === 'elegant'
                          ? 'bg-gradient-to-r from-black to-yellow-600 text-white shadow-lg scale-105 border-2 border-yellow-500'
                          : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700'
                      }`}
                    >
                      {bulkEmailTemplate === 'elegant' && <span>✓</span>}
                      👑 الگانت
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs mt-2">
                    💡 قالب انتخابی شامل header، footer و طراحی حرفه‌ای می‌شود
                  </p>
                </div>

                {/* Select from Email Groups */}
                <div>
                  <label className="block text-white font-medium mb-2">👥 انتخاب گروه ایمیل</label>
                  <button
                    onClick={() => {
                      fetchGroups();
                      fetchEmailList();
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors mb-3"
                  >
                    🔄 بارگذاری گروه‌ها
                  </button>
                  
                  {emailGroups.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-gray-800/30 p-3 rounded-lg border border-gray-700">
                      {emailGroups.map((group) => {
                        const groupEmailCount = emailList.filter(item => item.groups?.includes(group._id)).length;
                        return (
                          <label key={group._id} className="flex items-start gap-3 p-3 bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg hover:from-purple-600/30 hover:to-pink-600/30 cursor-pointer transition-all">
                            <input
                              type="checkbox"
                              checked={selectedGroups.includes(group._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedGroups([...selectedGroups, group._id]);
                                } else {
                                  setSelectedGroups(selectedGroups.filter(id => id !== group._id));
                                }
                              }}
                              className="w-5 h-5 mt-1 text-purple-600 bg-gray-700 border-gray-600 rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold text-sm">{group.name}</p>
                              {group.description && <p className="text-gray-300 text-xs mt-1">{group.description}</p>}
                              <p className="text-purple-300 text-xs mt-1">👤 {groupEmailCount} عضو</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm bg-gray-800/30 p-4 rounded-lg">
                      هیچ گروهی وجود ندارد. ابتدا به تب "مدیریت لیست" بروید و گروه ایجاد کنید.
                    </p>
                  )}
                  
                  {selectedGroups.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <span className="text-purple-400 font-semibold">
                        {selectedGroups.length} گروه انتخاب شده ({emailList.filter(item => item.groups?.some(g => selectedGroups.includes(g))).length} ایمیل)
                      </span>
                      <button
                        onClick={() => setSelectedGroups([])}
                        className="text-red-400 hover:text-red-300 underline"
                      >
                        لغو انتخاب همه
                      </button>
                    </div>
                  )}
                </div>

                {/* Send Button */}
                <div className="flex gap-4">
                  <button
                    onClick={handleBulkSend}
                    disabled={bulkSending || (!bulkEmailSubject || !bulkEmailBody)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
                  >
                    {bulkSending ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>در حال ارسال...</span>
                      </>
                    ) : (
                      <>
                        <span>📨</span>
                        <span>ارسال گروهی ایمیل</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                  <h4 className="text-yellow-400 font-semibold mb-2">⚠️ توجه:</h4>
                  <ul className="text-yellow-200 text-sm space-y-1 list-disc list-inside">
                    <li>ارسال بیش از حد ایمیل ممکن است باعث بلاک شدن شما توسط سرویس‌دهنده شود</li>
                    <li>حتماً محتوای ایمیل را قبل از ارسال بررسی کنید</li>
                    <li>مطمئن شوید تنظیمات SMTP یا Resend به درستی پیکربندی شده باشد</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Email List Tab */}
            {activeTab === 'email-list' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4">
                  <h4 className="text-purple-400 font-semibold mb-2">📋 مدیریت لیست ایمیل و گروه‌ها</h4>
                  <p className="text-purple-200 text-sm">
                    ایجاد گروه، مشاهده کاربران و مدیریت اعضای هر گروه
                  </p>
                </div>

                {/* Groups Management */}
                <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-semibold">🗂️ گروه‌های ایمیل</h4>
                    <button
                      onClick={() => {
                        setShowGroupModal(true);
                        fetchGroups();
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all text-sm"
                    >
                      ➕ گروه جدید
                    </button>
                  </div>

                  {emailGroups.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {emailGroups.map((group) => {
                        const groupEmailCount = emailList.filter(item => item.groups?.includes(group._id)).length;
                        return (
                          <div key={group._id} className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h5 className="text-white font-semibold">{group.name}</h5>
                                {group.description && <p className="text-gray-300 text-xs mt-1">{group.description}</p>}
                              </div>
                              <button
                                onClick={() => handleDeleteGroup(group._id)}
                                className="text-red-400 hover:text-red-300 text-sm"
                              >
                                🗑️
                              </button>
                            </div>
                            <p className="text-purple-300 text-sm">👤 {groupEmailCount} عضو</p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm text-center py-4">
                      هیچ گروهی وجود ندارد. برای شروع یک گروه جدید ایجاد کنید.
                    </p>
                  )}
                </div>

                {/* Group Creation Modal */}
                {showGroupModal && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowGroupModal(false)}>
                    <div className="bg-gray-900 border border-purple-500/30 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                      <h4 className="text-white font-semibold mb-4">➕ ایجاد گروه جدید</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-gray-300 text-sm mb-2">نام گروه *</label>
                          <input
                            type="text"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            placeholder="مثلاً: مشتریان VIP"
                            className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
                          />
                        </div>
                        <div>
                          <label className="block text-gray-300 text-sm mb-2">توضیحات (اختیاری)</label>
                          <textarea
                            value={newGroupDescription}
                            onChange={(e) => setNewGroupDescription(e.target.value)}
                            placeholder="توضیحات درباره این گروه..."
                            rows={3}
                            className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={handleCreateGroup}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                        >
                          ایجاد گروه
                        </button>
                        <button
                          onClick={() => {
                            setShowGroupModal(false);
                            setNewGroupName('');
                            setNewGroupDescription('');
                          }}
                          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all"
                        >
                          انصراف
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add New Email Form */}
                <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-6">
                  <h4 className="text-white font-semibold mb-4">➕ افزودن ایمیل جدید</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">آدرس ایمیل *</label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="example@domain.com"
                        className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">نام (اختیاری)</label>
                      <input
                        type="text"
                        value={newEmailName}
                        onChange={(e) => setNewEmailName(e.target.value)}
                        placeholder="نام کاربر"
                        className="w-full px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddEmail}
                    className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                  >
                    ➕ افزودن به لیست
                  </button>
                </div>

                {/* Email List Table */}
                <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg overflow-hidden">
                  <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                    <h4 className="text-white font-semibold">📧 لیست ایمیل‌ها ({emailList.length} مورد)</h4>
                    <button
                      onClick={() => {
                        fetchEmailList();
                        fetchGroups();
                      }}
                      disabled={loadingEmails}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                    >
                      {loadingEmails ? '🔄' : '🔄'} بارگذاری مجدد
                    </button>
                  </div>

                  {loadingEmails ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : emailList.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-900/50">
                          <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">ایمیل</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">نام</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">گروه‌ها</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">منبع</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">عملیات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {emailList.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-700/30">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{item.email}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.name || '-'}</td>
                              <td className="px-6 py-4 text-sm">
                                <div className="flex flex-wrap gap-1">
                                  {item.groups && item.groups.length > 0 ? (
                                    item.groups.map((groupId) => {
                                      const group = emailGroups.find(g => g._id === groupId);
                                      return group ? (
                                        <span key={groupId} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                                          {group.name}
                                          <button
                                            onClick={() => handleRemoveFromGroup(item.email, groupId)}
                                            className="hover:text-red-400"
                                          >
                                            ×
                                          </button>
                                        </span>
                                      ) : null;
                                    })
                                  ) : (
                                    <span className="text-gray-500 text-xs">-</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                                  {item.source}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleAddToGroup(item.email, e.target.value);
                                      e.target.value = '';
                                    }
                                  }}
                                  className="px-3 py-1 bg-gray-700 text-white rounded text-xs border border-gray-600 focus:outline-none focus:border-purple-400"
                                >
                                  <option value="">+ افزودن به گروه</option>
                                  {emailGroups
                                    .filter(g => !item.groups?.includes(g._id))
                                    .map(group => (
                                      <option key={group._id} value={group._id}>{group.name}</option>
                                    ))
                                  }
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <p className="text-gray-400 mb-4">هیچ ایمیلی در لیست موجود نیست</p>
                      <p className="text-gray-500 text-sm">از فرم بالا برای افزودن ایمیل استفاده کنید</p>
                    </div>
                  )}
                </div>

                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                  <h4 className="text-blue-400 font-semibold mb-2">💡 نکته:</h4>
                  <ul className="text-blue-200 text-sm space-y-1 list-disc list-inside">
                    <li>کاربرانی که در سایت ثبت‌نام می‌کنند به صورت خودکار به این لیست اضافه می‌شوند</li>
                    <li>می‌توانید ایمیل‌های دستی نیز به لیست اضافه کنید</li>
                    <li>از این لیست در تب "ارسال گروهی" برای ارسال ایمیل تبلیغاتی استفاده کنید</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Test Email Section */}
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-purple-500/30 p-6 mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">📨 تست ارسال ایمیل</h3>
          <p className="text-gray-300 mb-4 text-sm">
            برای اطمینان از صحت تنظیمات، یک ایمیل تستی ارسال کنید
          </p>
          <div className="flex gap-4">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="your-email@example.com"
              className="flex-1 px-4 py-2 bg-gray-800/50 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:border-purple-400"
            />
            <button
              onClick={handleTestEmail}
              disabled={testing || !testEmail}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {testing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>در حال ارسال...</span>
                </>
              ) : (
                <>
                  <span>📨</span>
                  <span>ارسال ایمیل تست</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
