# TableBite SaaS — LinkedIn Showcase & Project Guide

> **All screenshots are located in:** `public/showcase/`

## Screenshots Index
1. `public/showcase/01_landing_hero.png` — Landing Page (Desktop)
2. `public/showcase/02_landing_mobile.png` — Landing Page (Mobile)
3. `public/showcase/03_admin_login.png` — Manager Login & Protected Barrier
4. `public/showcase/04_owner_dashboard.png` — Restaurant Operations Hub
5. `public/showcase/05_kitchen_terminal.png` — Kitchen Display System (KDS)
6. `public/showcase/06_menu_stock_manager.png` — Menu & Stock Manager
7. `public/showcase/07_ai_menu_scanner.png` — AI OCR Paper Menu Scanner
8. `public/showcase/08_table_qr_print.png` — Printable Tabletop Acrylic QR Studio
9. `public/showcase/09_diner_mobile_menu.png` — Mobile Diner QR Experience (Table 4)
10. `public/showcase/10_diner_cart_drawer.png` — Diner Cart & Order Confirmation

---

## 3 Copy-Paste LinkedIn Templates

### Post Option 1: Founder & Problem-Solving Story (Recommended)
```markdown
Restaurants don't need another $3,000 clunky POS machine. 
And diners don't want to download a 100MB mobile app just to order dinner.

I spent the last few weeks building TableBite — a full-stack, multi-tenant QR Table Ordering SaaS with a real-time Kitchen Display System (KDS). 🍽️⚡

Here is how it works:

1️⃣ The Diner Experience (Zero App Downloads)
Customers sit at Table #4, point their phone camera at the acrylic stand, and the menu opens instantly in Safari or Chrome. They browse dishes with pure veg filters, instant search, and customize items in under 60 seconds.

2️⃣ 10-Second Menu Onboarding with AI
The hardest part for restaurant owners is typing 80+ dishes into a system. With TableBite, managers just take a photo of their physical paper menu. The AI OCR extracts the dishes, prices, and categories, and automatically pairs each dish with high-res food photos. Zero manual typing.

3️⃣ Real-Time Kitchen Display (KDS)
The moment a customer taps "Place Order", the kitchen screen chimes audibly with a live ticket countdown. Cooks can check off items as they cook and transition tickets from Pending ➔ Cooking ➔ Served.

4️⃣ Strict Multi-Tenant Security
Every restaurant gets an isolated database scope, custom URL (/r/your-restaurant), custom currency (₹, $, €), and isolated kitchen feeds. Restaurant A cannot view or touch Restaurant B's data.

💻 Tech Stack:
- Next.js 16 (App Router + Turbopack)
- React 19
- Supabase (PostgreSQL + Realtime WebSockets)
- Tailwind CSS
- Web Audio API (Tactile kitchen alerts)
- HTML5 Canvas QR Generation

Would love to hear your thoughts and feedback! What is your biggest pet peeve when ordering at a restaurant? 👇

#softwareengineering #nextjs #reactjs #webdevelopment #saas #supabase #fullstack #entrepreneurship #buildinginpublic
```

---

### Post Option 2: Engineering & System Architecture Deep Dive
```markdown
Building a Real-Time Multi-Tenant QR Ordering System with Next.js 16 & Supabase 🚀

Here are 4 engineering challenges I tackled while building TableBite:

1. Low-Latency Realtime Kitchen Broadcasts
Instead of polling endpoints every 3 seconds, TableBite leverages Supabase PostgreSQL Realtime channels over WebSockets. The kitchen screen subscribes to table events filtered strictly by `restaurant_id`. When a diner places an order from their phone, the kitchen screen renders the ticket and triggers a Web Audio API synthesizer chime in under 150ms.

2. AI Menu Ingestion & OCR Pipeline
Manual data entry is the #1 reason restaurant onboarding fails. I built an AI menu scanner endpoint that accepts photos of paper menus, detects dish titles and prices via OCR, classifies vegetarian/non-vegetarian attributes, and maps them to a curated culinary image resolution database.

3. Strict Multi-Tenant Isolation
Diners must be able to scan and order with zero friction (no login required), while manager operations (KDS, stock toggles, QR printing) require strict authentication. I implemented an `AdminAuthGuard` layer that validates Supabase JWTs and enforces tenant ownership so restaurant owners can never access another restaurant's dashboard or tickets.

4. 1-Click Acrylic Stand QR Studio
Rather than requiring third-party graphic design tools, the application dynamically generates vector QR codes embedded with table routing parameters (`/r/[slug]?table=[N]`), formatted directly for standard 4×6 tabletop acrylic stand print stylesheets.

Tech Stack: Next.js 16 • React 19 • Supabase • Tailwind CSS • TypeScript

Live demo & code repository in the comments! 👇

#nextjs #supabase #typescript #systemdesign #softwareengineering #webdev
```

---

### Post Option 3: Short & Punchy Launch Announcement
```markdown
Excited to unveil TableBite 🍽️ — A modern QR table ordering & real-time kitchen automation SaaS.

The problem: 
Paper menus get outdated, POS terminals cost a fortune, and waiter turnaround during peak dinner rushes is slow.

The solution:
📱 Diners scan tabletop QR codes to order in under 60s (zero app downloads).
📸 Restaurant owners photograph paper menus to auto-import dishes with AI & web photos.
🔔 Kitchen displays chime in real-time with live ticket timers.
📦 1-click Sold Out stock switches when ingredients run out.
🖨️ Print-ready acrylic table QR stand cards.

Built with Next.js 16, React 19, Supabase Realtime, and Tailwind CSS.

Check out the full walkthrough in the screenshots below! Thoughts? 👇

#saas #buildinpublic #fullstack #nextjs #webdev #tech
```
