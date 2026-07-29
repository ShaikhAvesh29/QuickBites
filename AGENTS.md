# Role & Project Context
You are operating within the Google Antigravity environment. Your objective is to build **QuickBite**, a "Click & Collect" pre-ordering PWA for a college canteen. 
The system requires two interfaces within the same repository: a mobile-first Student Interface and a tablet-optimized Admin Panel.

**Tech Stack:** Next.js (App Router), React, Tailwind CSS, shadcn/ui, and Supabase (PostgreSQL, PostgREST API, Realtime, Auth).

# Antigravity Execution Directives
As an autonomous agent, you must utilize your Editor, Terminal, and Browser capabilities to execute this project. Output the following Antigravity Artifacts:
1. **Task List:** Structured breakdown of Auth setup, Database schema, UI routing, and API connections.
2. **Implementation Plan:** Technical blueprint for major features (e.g., Auth flow, Ticket Generation, Kanban board).
3. **Walkthroughs & Screenshots:** Browser captures of before/after states for UI components and testing steps.

# Core Requirements (Zero Fluff)

## 1. Authentication & User Profiles (Supabase Auth)
* Implement a clean **Sign Up / Login** flow using Supabase Email/Password or Google OAuth.
* Create a protected route logic: Unauthenticated users cannot view the cart or checkout.
* On successful signup, automatically trigger a Supabase function (or API call) to insert the user into a public `profiles` table to store their name and phone number.

## 2. Supabase Database Schema
Use your terminal capabilities to initialize the Supabase project and create this exact schema:
* `profiles`: `id` (references auth.users), `full_name`, `phone_number`.
* `menu_items`: `id`, `name`, `price`, `category`, `image_url`, `is_available` (boolean).
* `orders`: `id`, `user_id` (foreign key to profiles), `order_code` (unique 4-digit string for the ticket), `total_amount`, `pickup_time`, `status` (pending, preparing, ready, completed), `payment_status` (pending, paid).
* `order_items`: `id`, `order_id`, `item_id`, `quantity`.

## 3. Student Interface (Consumer App)
* **Live Menu:** Fetch and display only items where `is_available = true`.
* **Checkout & Ticketing Flow:** 
  1. Authenticated students select a 15-minute `pickup_time` slot. 
  2. Generate a dynamic UPI deep link (`upi://pay?pa=...`) for payment.
  3. Upon order creation, generate a secure **Digital Ticket**. This ticket must display the 4-digit `order_code`, the student's name (fetched from `profiles`), and live status updates.
* **My Orders:** A dashboard for the user to view their current active ticket and past order history.

## 4. Admin Panel (Kitchen & Inventory)
* **Kanban Board:** Build a time-based queue where `orders` are sorted by `pickup_time` (earliest at the top). Display the `order_code` and the student's name on each card.
* **Realtime Updates:** Use `supabase.channel('custom-insert-channel')` to instantly push new orders to the screen.
* **Inventory Control:** Create a CRUD interface for `menu_items`. I must be able to add items, instantly edit prices, and toggle `is_available` to true/false.

# Strict Constraints
* Do not mock APIs. Connect directly to Supabase using `@supabase/supabase-js`.
* Ensure row-level security (RLS) is enabled on Supabase so students can only read their own orders.
* If a package is missing, use your terminal access to install it automatically.