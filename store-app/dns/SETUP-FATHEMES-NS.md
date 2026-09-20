# راهنمای تنظیم Nameserver برای fathemes.com

## ✅ وضعیت فعلی سرور DNS
- **سرور DNS:** CoreDNS (نصب شده و فعال)
- **IP سرور:** `91.107.175.150`
- **Zone File:** `/etc/coredns/db.fathemes.com`
- **وضعیت:** ✅ فعال و تست شده

## 📋 مراحل تنظیم در رجیسترار دامنه

### قدم 1: ثبت Glue Records (رکوردهای چسبنده)
در پنل رجیسترار دامنه (مثلاً nic.ir یا سایر رجیستراها) باید **Glue Records** را ثبت کنید:

```
ns1.fathemes.com    →    91.107.175.150
ns2.fathemes.com    →    91.107.175.150
```

**توجه:** این مرحله **ضروری** است چون nameserver‌ها جزء خود دامنه هستند.

### قدم 2: تنظیم Nameservers
بعد از ثبت Glue Records، nameserver‌های دامنه را تنظیم کنید:

```
Primary NS:     ns1.fathemes.com
Secondary NS:   ns2.fathemes.com
```

### قدم 3: صبر برای Propagation
- زمان انتشار DNS: **24-48 ساعت**
- برای سرعت بخشیدن می‌توانید TTL را کم کنید

## 🧪 تست تنظیمات

### تست محلی (روی سرور)
```bash
dig @127.0.0.1 fathemes.com
dig @127.0.0.1 fathemes.com NS
```

### تست عمومی (بعد از propagation)
```bash
# تست مستقیم از nameserver شما
nslookup fathemes.com ns1.fathemes.com
dig @91.107.175.150 fathemes.com

# تست از DNS عمومی
nslookup fathemes.com 8.8.8.8
dig @8.8.8.8 fathemes.com
```

### تست آنلاین
- https://dnschecker.org/#A/fathemes.com
- https://www.whatsmydns.net/#A/fathemes.com
- https://mxtoolbox.com/SuperTool.aspx?action=a%3afathemes.com

## 📝 رکوردهای DNS فعلی

```
fathemes.com.           IN  A       91.107.175.150
www.fathemes.com.       IN  A       91.107.175.150
ns1.fathemes.com.       IN  A       91.107.175.150
ns2.fathemes.com.       IN  A       91.107.175.150

fathemes.com.           IN  NS      ns1.fathemes.com.
fathemes.com.           IN  NS      ns2.fathemes.com.
```

## 🔧 دستورات مدیریت

### ریستارت DNS Server
```bash
ssh root@91.107.175.150
systemctl restart coredns
systemctl status coredns
```

### ویرایش Zone File
```bash
# روی سرور
nano /etc/coredns/db.fathemes.com

# بعد از تغییرات حتماً Serial را افزایش دهید
# مثال: 2025121401 → 2025121402

# ریستارت سرویس
systemctl restart coredns
```

### مشاهده لاگ‌ها
```bash
journalctl -u coredns -f
tail -f /var/log/coredns.log
```

## ⚠️ نکات مهم

1. **Glue Records اول:** حتماً قبل از تنظیم NS، Glue Records را ثبت کنید
2. **Serial Number:** هر بار که zone file را تغییر می‌دهید، Serial را افزایش دهید
3. **Propagation Time:** تغییرات DNS ممکن است تا 48 ساعت طول بکشد
4. **فایروال:** مطمئن شوید پورت 53 (TCP/UDP) باز است
5. **پشتیبان:** قبل از هر تغییر از فایل‌های config بکاپ بگیرید

## 🔍 عیب‌یابی

### اگر DNS کار نمی‌کند:
```bash
# چک کردن سرویس
systemctl status coredns

# چک کردن پورت 53
netstat -tulpn | grep :53

# تست داخلی
dig @127.0.0.1 fathemes.com

# چک فایروال
ufw status
iptables -L -n | grep 53
```

### اگر از خارج دسترسی نیست:
```bash
# باز کردن پورت 53 در فایروال
ufw allow 53/tcp
ufw allow 53/udp

# یا در iptables
iptables -A INPUT -p tcp --dport 53 -j ACCEPT
iptables -A INPUT -p udp --dport 53 -j ACCEPT
```

## 📞 پشتیبانی
در صورت بروز مشکل، فایل‌های زیر را بررسی کنید:
- `/etc/coredns/Corefile` - تنظیمات اصلی
- `/etc/coredns/db.fathemes.com` - Zone file دامنه
- `journalctl -u coredns` - لاگ‌های سرویس

---

**تاریخ تنظیم:** 2025-12-14  
**وضعیت:** ✅ فعال و آماده به کار
