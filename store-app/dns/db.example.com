$TTL    604800
@       IN      SOA     ns1.example.com. admin.example.com. (
                              2025122301         ; Serial
                              604800         ; Refresh
                               86400         ; Retry
                             2419200         ; Expire
                              604800 )       ; Negative Cache TTL
;
@       IN      NS      ns1.example.com.
@       IN      NS      ns2.example.com.
@       IN      A       YOUR_SERVER_IP
ns1     IN      A       YOUR_SERVER_IP
ns2     IN      A       YOUR_SERVER_IP
www     IN      A       YOUR_SERVER_IP

; Google Search Console Verification
@       IN      TXT     "google-site-verification=rhyF0g2AX9PYfj1nvC9oAEXU4ZJZPkyvy1C3PuJhVz8"

; Resend Email Configuration
resend._domainkey  IN  TXT  "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDkQ0k8JEcRlH68Mh7zJ10lRRZnie2+R3Lc3Q/ltodI5wBG4yEHUuhP7NaLoOITMwzgQmZDvoKGHYl4TulVRobeAkjB9/u7Hms8RIE4J8RRbu+3yajD2T14JrsJ0Kta96hZc35M06G71MUSzTbjxyK1v6Tp2ps3RteQs6X7WH6CIQIDAQAB"

; Amazon SES MX + SPF for host 'send'
send    IN  MX  10  feedback-smtp.us-east-1.amazonses.com.
send    IN  TXT     "v=spf1 include:amazonses.com ~all"

; Enable Receiving - MX for root domain
@       IN  MX  10  inbound-smtp.us-east-1.amazonses.com.

