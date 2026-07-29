# Role & Project Context
You are an expert full-stack developer building a Progressive Web App (PWA) called **QuickBite**. 
QuickBite is a "Click & Collect" pre-ordering system for a college canteen. 
It consists of two main interfaces built within the same repository: a Student/Consumer facing mobile web app, and an Admin/Kitchen dashboard.

**Tech Stack:** 
* Frontend: Next.js (App Router), React, Tailwind CSS, shadcn/ui (for rapid UI components).
* Backend/Database: Supabase (PostgreSQL, PostgREST API, Realtime).
* Deployment: Vercel.

---

# Architecture & File Structure Requirements

## 1. The Student Interface (Consumer App)
* **Target Audience:** College students ordering food between lectures. Must be hyper-optimized for mobile browsers.
* **Core Flow:** 
  1. View live menu (hide out-of-stock items).
  2. Add items to cart.
  3. Select a specific 15-minute pickup time slot (e.g., 12:30 PM). 
  4. Pay via a dynamic UPI deep link (`upi://pay?pa=...`).
  5. Receive a digital ticket with a 4-digit order code and live status.

## 2. The Admin Panel (Kitchen/Owner Dashboard)
* **Target Audience:** Canteen owner and kitchen staff. Optimized for tablets/desktops.
* **Core Flow (Order Management):**
  1. A Kanban-style board sorted by **Pickup Time** (earliest at the top).
  2. Ability to update order status: `Pending` -> `Preparing` -> `Ready` -> `Completed`.
  3. Real-time updates: The board must update instantly without refreshing when a new order is placed.
* **Core Flow (Menu Management - STRICT REQUIREMENT):**
  The owner must have full CRUD control over the menu without touching code. You must build an interface to:
  1. **Add Items:** Upload new items with a Name, Category, and Price.
  2. **Change Prices:** Edit the price of any existing item instantly.
  3. **Remove/Hide Items:** A toggle switch to mark an item `is_available = false`, which instantly hides it from the Student Interface.

---

# Database Schema (Supabase)
Please initialize the following tables:

**1. `menu_items`**
* `id` (uuid, primary key)
* `name` (text)
* `price` (numeric)
* `category` (text)
* `image_url` (text, optional)
* `is_available` (boolean, default: true)

**2. `orders`**
* `id` (uuid, primary key)
* `order_code` (text, 4-digit string)
* `student_name` (text)
* `total_amount` (numeric)
* `pickup_time` (timestamp/time)
* `status` (text: 'pending', 'preparing', 'ready', 'completed')
* `created_at` (timestamp)

**3. `order_items`**
* `id` (uuid, primary key)
* `order_id` (uuid, foreign key to orders)
* `item_id` (uuid, foreign key to menu_items)
* `quantity` (integer)

---

# Execution Rules
* Do not build complex user authentication (no email/password flows) for version 1 to save time. Rely on name/phone inputs for orders.
* Use Supabase Realtime (`supabase.channel`) for updating the kitchen dashboard.
* Write clean, modular, and heavily commented code. 
* Do not generate placeholder APIs; connect directly to Supabase using `@supabase/supabase-js`.