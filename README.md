# 🛒 Store-App & Multi-Tenant eCommerce Platform
### Modern E-Commerce, Digital Assets & Automated Site Provisioning

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.5.0-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&logo=mongodb)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis)
![Express](https://img.shields.io/badge/Express-5.2-000000?style=for-the-badge&logo=express)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)

**🌐 Multi-Tenant & Custom Domain Engine:** Zero-config automated site provisioning for templates and physical goods.

---

### 🌐 Language Selection / انتخاب زبان

[![Persian Documentation](https://img.shields.io/badge/%F0%9F%87%AE%F0%9F%87%B7_%D9%85%D8%B7%D8%A7%D9%84%D8%B9%D9%87_%D9%85%D8%B3%D8%AA%D9%86%D8%AF%D8%A7%D8%AA_%D9%81%D8%A7%D8%B1%D8%B3%DB%8C-0969DA?style=for-the-badge)](README.fa.md)

[👉 **برای مطالعه مستندات جامع به زبان فارسی کلیک کنید**](README.fa.md)

---

</div>

## Table of Contents
1. [Overview](#1-overview)
2. [Technical Architecture](#2-technical-architecture)
3. [Storefront & Customer Features](#3-storefront--customer-features)
4. [Admin Management Panel](#4-admin-management-panel)
5. [License Engine & Security](#5-license-engine--security)
6. [Multi-Tenant Provisioning](#6-multi-tenant-provisioning)
7. [Next-Rocket Performance Accelerator](#7-next-rocket-performance-accelerator)
8. [Payment Gateways, SMS & Email](#8-payment-gateways-sms--email)
9. [Installation & Getting Started](#9-installation--getting-started)
10. [Environment Variables](#10-environment-variables)
11. [License](#11-license)

---

## 1. Overview
**Store-App** is an enterprise-grade, full-stack eCommerce platform specifically engineered for digital products (scripts, CMS templates, downloadable files) as well as physical goods. 

Beyond standard online store features, it includes a turnkey **Automated Site Provisioning & Multi-Tenant Engine**. When customers purchase a website template, they can link their custom domain to receive an isolated, live website with automated DNS verification and Nginx virtual host configurations in seconds.

---

## 2. Technical Architecture

Built on an optimized dual-engine hybrid architecture:

```
[ User / Internet ]
        │
        ▼
   [ Nginx Reverse Proxy (SSL / Port 80 & 443) ]
        │
   ┌────┴───────────────────────────┐
   │                                │
   ▼                                ▼
[ Next.js 15 (Port 3000) ]     [ Core-Server Express 5 (Port 4000) ]
- SSR / SSG / App Router       - Multi-Tenant Host Router
- React 19 Client UI            - Automated Vhost & Provisioning
- NextAuth Authentication       - Standalone API Gateway
- Image & Bundle Optimization   - Cron Workers & Queue
   │                                │
   └─────────────┬──────────────────┘
                 ▼
     [ MongoDB 7.0 & Redis 7 ]
```

* **Frontend Engine:** Powered by **Next.js 15.5** (App Router), **React 19**, **TypeScript 5**, and **Tailwind CSS 3.4**.
* **Core Server Backend:** **Express 5** server orchestrating multi-tenant host routing, tenant database creation, and dynamic Nginx reverse proxy management.
* **Storage & Caching:** **MongoDB 7.0** with native high-performance driver connections + **Redis 7** for fast memory caching and session persistence.
* **DevOps Ready:** Multi-stage standalone Docker builds, Nginx reverse proxy, automated Certbot SSL, and Uptime Kuma monitoring.

---

## 3. Storefront & Customer Features

### 3.1. Catalog & Advanced Filtering (`/products`, `/categories`)
* **Multi-Faceted Search:** Filter by nested categories, price range, discounts, bestselling items, featured items, and custom technical specifications.
* **Product Detail Page (`/products/[slug]`):**
  * Modern responsive image gallery with modal zoom.
  * Badges for authenticity guarantee, instant digital download, and live interactive demo links.
  * Customer reviews and 5-star ratings with admin response capabilities.
  * AI-driven related product recommendations based on browsing behavior.
* **Blog & Article Engine (`/blog`, `/blog/[slug]`):** SEO-optimized articles with reading time estimates, category tag clouds, and mega-menu integration.

### 3.2. Cart & Checkout (`/cart`, `/checkout`)
* Hybrid real-time cart synchronization (Local + Cloud storage).
* Support for fixed and percentage-based promo discount codes with expiration and minimum order rules.
* Province and city selector with automated shipping cost calculation for physical items.
* Automatic digital checkout bypass for instant downloads (no postal address required).

### 3.3. Payment & Digital Invoicing (`/payment`, `/invoice/[orderId]`)
* Official gateway integrations with **Zarinpal** and **Zibal** (including sandbox environment support).
* Clean payment outcome screens (success, failed, cancelled, and pending).
* Automated official digital invoices with printable PDF generation.

### 3.4. Customer Portal & Dashboard (`/profile`, `/user`)
* **Central Dashboard:** Overview of recent orders, active digital downloads, support tickets, and wishlist items.
* **Secure Download Repository (`/profile/downloads`):** Lifetime access to temporary, signed expiring download URLs.
* **My Sites & License Manager (`/user/my-sites`):** Manage registered domains, run automated DNS A-record/CNAME verifications, and launch purchased templates.
* **Address Book (`/profile/addresses`):** Save and manage default physical shipping destinations.
* **Support Ticket Desk (`/profile/tickets`):** Submit priority tickets with file attachments and threaded admin responses.
* **Profile Settings:** Update personal details, mobile numbers, and passwords.
* **Wishlist (`/wishlist`):** Bookmark items for future purchases.

---

## 4. Admin Management Panel

Accessible at **`/admin`**, providing 50+ enterprise control modules:

| Admin Module | Capabilities & Description |
| :--- | :--- |
| **Analytical Dashboard (`/admin`)** | Real-time revenue charts, order velocity, sales analytics, active users, and system health status. |
| **Catalog Manager (`/admin/products`)** | Physical & digital product creation, file uploads, automated WebP image transformation, attributes, and scheduled discounts. |
| **Category Hierarchy (`/admin/categories`)** | Multi-level category tree, SEO slug generator, custom icons, featured images, and display priority ordering. |
| **Order Processing (`/admin/orders`)** | Payment verification logs, status pipeline (processing, shipped, completed, cancelled), and invoice printing. |
| **User Management (`/admin/users`)** | Role-based access control (Admin, User, Support), account suspension/activation, and user purchase history. |
| **Discount Engine (`/admin/discount-codes`)** | Fixed/percentage coupon creation, minimum spend criteria, per-user usage limits, and expiration dates. |
| **Support Helpdesk (`/admin/tickets`)** | Customer inquiry management, ticket status triage (Open, Answered, Closed), and department filtering. |
| **Advanced SEO Suite (`/admin/seo`)** | Page title & meta description management, OpenGraph configs, 301/302 URL redirects, and automated sitemap generator. |
| **Structured Data & Schema (`/admin/schemas`)** | Visual management of Schema.org JSON-LD (Product, Organization, FAQ, Article, Breadcrumb). |
| **Site Templates (`/admin/site-templates`)** | Package reusable site templates, define source folders, set baseline pricing, and link to downloadable products. |
| **Managed Instances (`/admin/site-instances`)** | Monitor provisioned customer websites, Nginx virtual host status, isolated database mapping, and domain controls. |
| **AI Assistant (`/admin/chatbot`)** | Google Gemini AI integration with customizable system prompts for 24/7 autonomous customer support. |
| **Homepage Visual Editor (`/admin/homepage-content`)** | Drag-and-drop editing of hero carousels, promotion banners, product showcase tabs, and trust badges. |
| **Header & Mega-Menu (`/admin/mega-menu-settings`)** | Multi-column dropdown menus with category thumbnails, social media links, and custom footer widgets. |
| **Background Cron Tasks (`/admin/cron-jobs`)** | Background task monitor: abandoned cart reminders, expired cache purges, and automated database backups. |
| **Payment Gateways (`/admin/payment-gateway`)** | Configure merchant credentials for Zarinpal and Zibal, toggle Sandbox mode, and inspect transaction logs. |
| **SMS & OTP (`/admin/sms`)** | SMS.ir gateway configuration, fast-pattern OTP templates, and order status notifications. |
| **Email Transports (`/admin/email-settings`)** | SMTP / Gmail / SendGrid integration with live HTML email template previewer. |
| **Asset Manager (`/admin/file-manager`)** | Integrated media library with automated WebP image conversion and responsive compression. |
| **A/B Testing (`/admin/ab-testing`)** | Run multi-variant conversion tests on homepage banners and product landing pages. |
| **Typography & Theme (`/admin/fonts`)** | Font selector supporting modern web typography and Persian/Arabic typefaces. |

---

## 5. License Engine & Security
* **Domain Lock Protection:** Built-in licensing mechanism that binds downloaded scripts and templates to customer-authorized domains.
* **Signed Download Links:** Download links are protected behind temporary signed tokens, preventing link sharing or unauthorized hotlinking.
* **Security Hardening:** Enterprise rate limiting, CSRF mitigation, input sanitization against NoSQL injection, and strict Content Security Policies (CSP).

---

## 6. Multi-Tenant Provisioning
1. Customer purchases a site template and assigns their custom domain (e.g. `myshop.com`).
2. Automated DNS checker queries A-records and CNAME entries to verify proper DNS resolution.
3. The Provisioning engine automatically:
   * Allocates an isolated file upload directory.
   * Generates an isolated MongoDB database and seeds starter demo data.
   * Creates an Nginx server block in `/etc/nginx/sites` and gracefully reloads Nginx.
   * Deploys the customer's standalone store instance with unique admin credentials.

---

## 7. Next-Rocket Performance Accelerator
Custom performance module engineered for maximum Google PageSpeed scores:
* In-memory cache layer + Redis for heavy queries.
* Automated responsive image conversion to WebP format.
* Critical CSS inlining and unused code elimination.
* Intelligent route preloading before user interaction.

---

## 8. Payment Gateways, SMS & Email
* **Payments:** Official support for **Zarinpal** (with error mapping and sandbox mode) + **Zibal**.
* **SMS Gateway:** High-speed integration with **SMS.ir** utilizing service line OTP patterns to bypass telecom blacklists.
* **Email:** Direct local SMTP and external SMTP provider support with responsive HTML email templates.

---

## 9. Installation & Getting Started

### Prerequisites
* **Node.js**: v20 or higher (Node 22 recommended)
* **MongoDB**: v6.0 or v7.0 (Local instance or MongoDB Atlas)
* **Redis**: Optional (for performance caching)
* **Docker**: Optional (for containerized deployment)

### Local Development Setup

```bash
# 1. Clone the repository
git clone <REPO_URL>
cd site/store-app

# 2. Install dependencies
npm install

# 3. Setup environment configuration
cp .env.example .env.local
# (Edit your database connection and credentials in .env.local)

# 4. Start Next.js frontend
npm run dev
# Application will run at http://localhost:3000

# 5. (Optional) Start Express Core-Server in a separate terminal
npm run core:dev
# Core API will run at http://localhost:4000
```

### Create Initial Administrator
To create the first admin user in an empty database:
```bash
node create-new-admin.js
```
* **Email:** `admin@example.com`
* **Password:** `Admin@123456`
* **Login URL:** `http://localhost:3000/admin/login`

### Production Build & Deployment
```bash
# Standalone optimized build
npm run build

# Start production server
npm start
```

### Running with Docker Compose
```bash
# Launch entire stack (Next.js, Core-Server, MongoDB, Redis, Nginx)
docker compose up -d --build
```

---

## 10. Environment Variables

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `MONGODB_URI` | MongoDB connection URI | `mongodb://localhost:27017/store-app` |
| `NEXTAUTH_SECRET` | NextAuth session signing key (32+ chars) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Canonical app URL for authentication | `http://localhost:3000` |
| `JWT_SECRET` | Custom JWT secret token | Random secure string |
| `REDIS_ENABLED` | Enable Redis caching layer | `true` / `false` |
| `REDIS_URL` | Redis server address | `redis://localhost:6379` |
| `SMSIR_API_KEY` | SMS.ir API authentication token | Your SMS.ir API Key |
| `ZARINPAL_MERCHANT_ID` | Zarinpal merchant gateway ID | Merchant UUID |
| `CORE_API_URL` | Express Core-Server internal URL | `http://127.0.0.1:4000` |

---

## 11. License
This project is licensed under the MIT License.

---

<div align="center">

[![Persian Documentation](https://img.shields.io/badge/%F0%9F%87%AE%F0%9F%87%B7_%D9%85%D8%B7%D8%A7%D9%84%D8%B9%D9%87_%D9%85%D8%B3%D8%AA%D9%86%D8%AF%D8%A7%D8%AA_%D9%81%D8%A7%D8%B1%D8%B3%DB%8C-0969DA?style=for-the-badge)](README.fa.md)

</div>