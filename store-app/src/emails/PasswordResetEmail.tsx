import * as React from 'react';
import { Html, Head, Preview, Body, Container, Section, Text, Button } from '@react-email/components';

interface PasswordResetEmailProps {
  resetLink: string;
  email: string;
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({ resetLink, email }) => (
  <Html lang="fa" dir="rtl">
    <Head />
    <Preview>درخواست بازیابی رمز عبور برای حساب شما</Preview>
    <Body style={{ background: '#f4f4f4', fontFamily: 'Tahoma, Arial, sans-serif', margin: 0, padding: 0 }}>
      <Container style={{ maxWidth: 600, margin: '0 auto', background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.08)' }}>
        <Section style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 15 }}>🔐</div>
          <h1 style={{ margin: 0, fontSize: 28 }}>بازیابی رمز عبور</h1>
        </Section>
        <Section style={{ padding: '40px 30px' }}>
          <Text style={{ color: '#2d3748', fontSize: 18, margin: '0 0 16px' }}>سلام،</Text>
          <Text style={{ color: '#4a5568', margin: '0 0 16px' }}>
            درخواست بازیابی رمز عبور برای حساب کاربری <b>{email}</b> دریافت شد.
          </Text>
          <Text style={{ color: '#4a5568', margin: '0 0 24px' }}>
            برای تغییر رمز عبور خود، روی دکمه زیر کلیک کنید:
          </Text>
          <Button
            href={resetLink}
            style={{ display: 'inline-block', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', padding: '15px 40px', borderRadius: 25, fontWeight: 'bold', textDecoration: 'none', fontSize: 16, margin: '24px 0' }}
          >
            تغییر رمز عبور
          </Button>
          <Section style={{ background: '#fff5f5', border: '2px solid #fc8181', padding: 20, borderRadius: 8, margin: '25px 0' }}>
            <Text style={{ color: '#c53030', fontWeight: 'bold', margin: 0 }}>⚠️ نکات امنیتی:</Text>
            <ul style={{ color: '#742a2a', margin: 0, paddingRight: 20 }}>
              <li>این لینک تا <b>30 دقیقه</b> معتبر است</li>
              <li>اگر شما درخواست نکرده‌اید، این ایمیل را نادیده بگیرید</li>
              <li>رمز عبور خود را با کسی به اشتراک نگذارید</li>
              <li>از رمزهای قوی و منحصر به فرد استفاده کنید</li>
            </ul>
          </Section>
          <Section style={{ background: '#f7fafc', padding: 15, borderRadius: 8, marginTop: 25 }}>
            <Text style={{ color: '#4a5568', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              <b>مشکل در کلیک روی دکمه؟</b><br />
              لینک زیر را کپی کرده و در مرورگر خود باز کنید:<br />
              <a href={resetLink} style={{ color: '#667eea', wordBreak: 'break-all' }}>{resetLink}</a>
            </Text>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default PasswordResetEmail;
