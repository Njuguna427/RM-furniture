# Richy Furniture (Netlify + Supabase)

Static shop in `public/`, backend in `netlify/functions/`, data in Supabase. The old PHP version is in `old-php/` (not deployed).

## 1. Supabase (database)
1. Create a free project at supabase.com.
2. SQL Editor: paste and run `supabase/schema.sql` (tables, security, sample products, delivery zones).
3. Project Settings -> API: copy the **Project URL** and the **service_role** key (secret, never put it in front-end code).

## 2. Edit your details
`public/js/config.js`: WhatsApp number (format `2547XXXXXXXX`), phone, email, location, hours.

## 3. Deploy on Netlify
1. Push this folder to GitHub (the `.gitignore` keeps secrets out).
2. Netlify -> Add new site -> Import from Git. Settings are read from `netlify.toml`.
3. Site settings -> Environment variables:

| Variable | Value |
|---|---|
| SUPABASE_URL | your project URL |
| SUPABASE_SERVICE_KEY | service_role key |
| ADMIN_KEY | a long password you choose (admin login) |
| MPESA_ENV | `sandbox` (later `production`) |
| MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET | from developer.safaricom.co.ke |
| MPESA_SHORTCODE | sandbox: 174379 |
| MPESA_PASSKEY | from the Daraja app |
| MPESA_TYPE | optional: `CustomerBuyGoodsOnline` if you use a Till |

4. Redeploy after adding variables.

## 4. Use it
- Shop: your Netlify URL. Admin: `/admin.html` (enter ADMIN_KEY).
- Test M-Pesa in sandbox first. Go live by switching to production keys and your real Paybill/Till.

## Notes
- Prices, delivery fees and stock are always read from the database on the server, never trusted from the browser.
- Replace the sample Unsplash photos with your own product photos (paste URLs in Admin -> Products).
- Not included: customer accounts, reviews, email/SMS confirmations.
