# Multi-Tenant QR-Code Restaurant Ordering System
## Architecture & Technical Specification Document

---

## 1. Executive Overview

This system is a **Multi-Tenant SaaS platform** enabling dining establishments to offer instant, frictionless table-side ordering via dynamic QR codes. 

* **Diners** scan a table-specific QR code, view the live digital menu, customize items, and place orders directly from their mobile browser without downloading an app or registering an account.
* **Kitchen Staff / Managers** receive orders in real time on a dedicated dashboard with audible chimes, update order statuses, manage live menu item availability, and generate printable table QR codes.
* **Tenancy Model:** Every restaurant is completely isolated with its own URL slug, branding, menu, tables, and staff credentials.

---

## 2. High-Level System Architecture

```mermaid
flowchart TB
    subgraph Diners["Diners (Mobile Web - No App / No Login)"]
        D1["Scan Table QR Code\n(/r/[slug]?table=[number])"] --> D2["Browse Dynamic Menu\n(Categories, Veg/Non-Veg, Search)"]
        D2 --> D3["Cart & Special Notes\n(Local State + Session)"]
        D3 --> D4["Place Order\n(Status: PENDING)"]
        D4 --> D5{"Can Cancel?"}
        D5 -- "Until Kitchen Confirms" --> D6["Cancel Order Button"]
        D5 -- "Once Confirmed" --> D7["Live Tracking:\nConfirmed -> Preparing -> Served"]
    end

    subgraph AppServer["Next.js App Router (Vercel)"]
        API1["Public Dynamic Route\n/r/[slug]"]
        API2["Auth & Admin Portal\n/admin/[slug]/*"]
        API3["Server Actions & API Routes\n(Order Mutations, Verification)"]
    end

    subgraph Database["Supabase (Backend as a Service)"]
        PG["PostgreSQL Database\n(Multi-Tenant Schema)"]
        RT["Supabase Realtime Engine\n(WebSockets / Postgres Changes)"]
        Auth["Supabase Auth\n(Restaurant Staff/Admin)"]
        Storage["Supabase Storage\n(Dish Photos & Restaurant Logos)"]
    end

    subgraph Kitchen["Kitchen & Management (Tablet / Desktop)"]
        K1["Live Orders Screen (KDS)\n(Loud Audio Chime on New Order)"]
        K2["Order Action:\n[Accept/Confirm] | [Reject] | [Served]"]
        K3["1-Click 'Sold Out' Toggle"]
        K4["Table QR Code Generator & PDF Print"]
    end

    Diners <--> AppServer
    Kitchen <--> AppServer
    AppServer <--> PG
    AppServer <--> Auth
    AppServer <--> Storage
    RT -. "Instant New Order Push" .-> K1
    RT -. "Status Change Push (Lock Cancel)" .-> D7
```

---

## 3. Order Lifecycle & Cancellation State Machine

The cancellation window is strictly enforced on both the client UI and the database level:

```mermaid
stateDiagram-v2
    [*] --> PENDING : Diner places order from Table QR
    
    state PENDING {
        [*] --> WaitingForKitchen
        note right of WaitingForKitchen: Diner CAN cancel order freely
    }

    PENDING --> CANCELLED_BY_CUSTOMER : Diner taps 'Cancel Order'
    PENDING --> REJECTED : Kitchen taps 'Reject' (e.g. out of ingredients)
    PENDING --> CONFIRMED : Kitchen taps 'Confirm & Accept'
    
    state CONFIRMED {
        [*] --> Preparing
        note right of Preparing: Cancellation LOCKED. Cooking starts.
    }
    
    CONFIRMED --> PREPARING : Kitchen marks 'In the Pan / Cooking'
    PREPARING --> READY : Kitchen marks 'Ready for Pickup / Serving'
    READY --> SERVED : Waiter delivers to Table
    SERVED --> COMPLETED : Table bill settled at counter/POS
    
    CANCELLED_BY_CUSTOMER --> [*]
    REJECTED --> [*]
    COMPLETED --> [*]
```

---

## 4. End-to-End Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Diner (Mobile)
    participant NextApp as Next.js App
    participant DB as Supabase DB
    participant Realtime as Supabase Realtime
    actor Staff as Kitchen Staff (Tablet)

    Customer->>NextApp: Scans QR: /r/spicy-bites?table=5
    NextApp->>DB: Fetch restaurant config & active menu items
    DB-->>NextApp: Restaurant details, categories, items
    NextApp-->>Customer: Render branded mobile menu for Table #5

    Customer->>NextApp: Submits Order (Items, Table 5, Notes)
    NextApp->>DB: Insert Order (status: 'PENDING')
    DB-->>Realtime: Event: INSERT on orders table
    Realtime-->>Staff: WebSocket push: New order on Table 5!
    Note over Staff: Loud audio chime alerts kitchen

    alt Customer Cancels Before Confirmation
        Customer->>NextApp: Tap 'Cancel Order'
        NextApp->>DB: Update order status to 'CANCELLED' WHERE status = 'PENDING'
        DB-->>Realtime: Event: UPDATE order status = 'CANCELLED'
        Realtime-->>Staff: Order card marked 'Cancelled by Table 5'
    else Kitchen Confirms Order
        Staff->>NextApp: Tap 'Confirm & Accept'
        NextApp->>DB: Update status to 'CONFIRMED'
        DB-->>Realtime: Event: UPDATE order status = 'CONFIRMED'
        Realtime-->>Customer: WebSocket push: Order Confirmed!
        Note over Customer: 'Cancel Order' button disappears instantly
        Customer-->>Customer: Display "Cooking your food..."
    end

    Staff->>NextApp: Tap 'Served'
    NextApp->>DB: Update status to 'SERVED'
    DB-->>Realtime: Event: UPDATE order status = 'SERVED'
    Realtime-->>Customer: Display "Enjoy your meal!"
```

---

## 5. Database Schema (PostgreSQL on Supabase)

Multi-tenancy is enforced via `restaurant_id` across all relational tables:

```mermaid
erDiagram
    RESTAURANTS ||--o{ TABLES : has
    RESTAURANTS ||--o{ CATEGORIES : has
    CATEGORIES ||--o{ MENU_ITEMS : contains
    RESTAURANTS ||--o{ ORDERS : receives
    ORDERS ||--o{ ORDER_ITEMS : contains
    MENU_ITEMS ||--o{ ORDER_ITEMS : references
    RESTAURANTS ||--o{ STAFF_USERS : employs

    RESTAURANTS {
        uuid id PK
        string name
        string slug UK "e.g. burger-house"
        string logo_url
        string banner_url
        string currency "e.g. $, ₹, €"
        boolean is_active
        timestamp created_at
    }

    TABLES {
        uuid id PK
        uuid restaurant_id FK
        integer table_number
        string qr_code_url
        boolean is_active
    }

    CATEGORIES {
        uuid id PK
        uuid restaurant_id FK
        string name "e.g. Starters, Drinks"
        integer sort_order
    }

    MENU_ITEMS {
        uuid id PK
        uuid restaurant_id FK
        uuid category_id FK
        string name
        text description
        decimal price
        string image_url
        boolean is_veg
        boolean is_available "1-click Sold Out switch"
        integer sort_order
    }

    ORDERS {
        uuid id PK
        uuid restaurant_id FK
        integer table_number
        string customer_name
        string customer_phone
        string status "PENDING, CONFIRMED, PREPARING, SERVED, CANCELLED, REJECTED"
        text notes
        decimal total_amount
        timestamp created_at
        timestamp updated_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid menu_item_id FK
        string item_name
        decimal item_price
        integer quantity
        text notes
    }

    STAFF_USERS {
        uuid id PK "Supabase Auth UID"
        uuid restaurant_id FK
        string role "ADMIN, KITCHEN_STAFF"
    }
```

---

## 6. Page & Routing Structure

```
src/
├── app/
│   ├── (customer)/
│   │   └── r/[slug]/
│   │       ├── page.tsx               <-- Diner menu (/r/my-cafe?table=3)
│   │       └── order/[orderId]/
│   │           └── page.tsx           <-- Live order status & cancel screen
│   │
│   ├── (admin)/
│   │   └── admin/
│   │       ├── login/                 <-- Staff / Manager login
│   │       └── [slug]/
│   │           ├── live-orders/       <-- Kitchen Display Screen (Audio alerts + Kanban)
│   │           ├── menu/              <-- Add/edit dishes & 'Sold Out' toggles
│   │           ├── tables/            <-- Table manager & batch QR PDF generator
│   │           └── settings/          <-- Restaurant branding, name, currency
│   │
│   └── api/                           <-- API endpoints for webhooks / printing
```

---

## 7. Key Operational Features

### A. Frictionless Customer Experience
1. **Zero Registration:** Diner scans and immediately sees the menu for their specific table.
2. **Veg / Non-Veg Filters:** One-tap toggle on the menu header.
3. **Session Persistence:** Active orders stored in `localStorage` + URL query parameters so accidental refresh never loses order status.
4. **Order Stacking:** Diners can place a 2nd or 3rd round of orders (drinks, dessert) to the same table.

### B. Kitchen Display System (KDS)
1. **Audible Chime Alert:** Web Audio API sound loop triggers continuously on new `PENDING` orders until staff acknowledges.
2. **Visual Urgency:** Color-coded order cards that show elapsed time (e.g., yellow for < 2 min, orange for > 5 min).
3. **Large High-Contrast Buttons:** Designed for grease/busy kitchen tablet screens.

### C. Printable QR Codes
1. One-click generation of high-resolution vector/canvas QR cards.
2. Each card clearly prints:
   - Restaurant Name & Logo
   - Prominent **Table #[Number]** badge
   - "Scan camera to order" instruction

---

## 8. Implementation Phases

1. **Phase 1: Project Setup & Database Foundations**
   - Initialize Next.js 14/15 with Tailwind CSS and Lucide icons.
   - Configure Supabase client and establish Postgres database tables with multi-tenant foreign keys.
2. **Phase 2: Customer Mobile Ordering UI**
   - Build dynamic menu layout (`/r/[slug]?table=X`).
   - Implement Cart drawer, dietary tags (Veg/Non-Veg), and order checkout.
   - Implement customer live tracking screen with dynamic cancellation button.
3. **Phase 3: Kitchen Display & Real-Time Sync**
   - Setup Supabase Realtime subscriptions for instantaneous order insertion and status updates.
   - Implement Web Audio chime alarm for incoming orders.
   - Add status mutation controls (`Confirm`, `Cancel`, `Served`, `Reject`).
4. **Phase 4: Restaurant Admin & Menu Management**
   - Menu CRUD interface with instant "Sold Out" availability toggles.
   - Table management and QR Code generator/print utility.
   - Multi-tenant settings (restaurant branding and currency).
