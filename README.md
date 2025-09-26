# La Taberna - Group Pre-Order System

## 1. The Problem

This project addresses the management of group bookings (+6 people) for the La Taberna restaurant. The high volume of orders from these groups, managed via `resdiary.com`, is overloading the kitchen's capacity. The objective is to create a solution that automates the pre-order process for these groups, allowing the kitchen to prepare in advance, optimise resources, and improve service efficiency.

## 2. The Solution

An automated system is being built in two main phases:

### Phase 1: Data Automation and Storage (Completed)

An automation agent (Google Apps Script) monitors a Gmail inbox for booking emails from `resdiary.com`. This agent extracts key booking data and stores it securely in a **Supabase** database. This eliminates the need to manually process each email.

### Phase 2: Pre-Order Portal and Notifications (Completed)

This phase has been completed in this repository. The system now includes:

1.  **Pre-Order Page (for the Customer):** A web page deployed on Vercel that customers access via a unique link sent by email. Here, they can view their booking details and select dishes for their group.
2.  **Admin Panel (for Staff):** An internal panel where restaurant staff can manage menus, view the day's bookings, and review pre-orders submitted by customers.
3.  **Automated Notifications:** An automated Supabase Edge Function that triggers with each new booking, generates the unique link, and emails it to the customer using Resend.

## 3. Technology Stack

*   **Frontend:** Next.js 14 (App Router) with TypeScript
*   **Styling:** Tailwind CSS
*   **Database:** Supabase (PostgreSQL)
*   **Authentication:** Supabase Auth
*   **Deployment:** Vercel
*   **Data Validation:** Zod
*   **Server State Management:** TanStack React Query