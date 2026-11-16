# FreshBowl — Frontend Application (React + Vite + Tailwind CSS)

Frontend web application for **FreshBowl**, a diet salad ordering, custom bowl builder, and membership platform with **Cash on Delivery only** checkout.

## Project Structure

- `src/api/client.ts` — Axios instance configured with an automatic standalone frontend adapter (`localStorage` persistence). When your backend is ready, set `VITE_API_BASE_URL` to switch seamlessly to real HTTP requests.
- `src/data/mockStore.ts` — Initial client-side seed store (1 admin, 3 membership plans, 10 salads, 20 ingredients, sample members, subscriptions, favorites, and Cash on Delivery orders).
- `src/context/` — `AuthContext`, `CartContext`, and `ToastContext`.
- `src/components/` — `Navbar`, `Footer`, `AdminLayout`, `ConfirmModal`, `ProtectedRoute`, `SaladImage`.
- `src/pages/`
  - **Public & Member**: `HomePage`, `MenuPage`, `CustomizeSaladPage`, `CartPage`, `CheckoutPage` (Cash on Delivery only), `MyOrdersPage`, `MySubscriptionPage`, `AuthPage`.
  - **Admin**: `AdminDashboardPage`, `ManageMembersPage`, `ManagePlansPage`.

## Local Setup

```bash
npm install
npm run dev
```

Runs on `http://localhost:3000`.

## Demo Credentials

- **Admin**: `admin@freshbowl.com` / `Admin123!`
- **Member**: `member@freshbowl.com` / `Member123!`

## Connecting Your Backend Later

Set `VITE_API_BASE_URL` in `.env` (for example `VITE_API_BASE_URL=http://localhost:5000/api`) and `src/api/client.ts` will automatically send all Axios requests to your backend server instead of the local frontend adapter.
