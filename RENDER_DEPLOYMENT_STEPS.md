# Bhawani CRM Render Deployment Steps

## What is ready

- Backend is Express + Prisma + MySQL.
- Frontend is React + Vite.
- MySQL search API issue has been fixed for Render/MySQL.
- Local backend, frontend, database migration, seed, and API smoke tests were checked before packaging.

## Before deploying

Get these values from the database provider:

```env
DATABASE_URL=mysql://DB_USER:DB_PASSWORD@DB_HOST:3306/DB_NAME?connectTimeout=15000
```

If the database is on Hostinger, enable remote MySQL access. If Hostinger asks for allowed IPs, add Render outbound IPs from the Render service `Connect` tab after creating the backend service.

## Backend on Render

Create a new Web Service from this repository.

```txt
Root Directory: backend
Build Command: npm install --include=dev && npm run build && npm run prisma:deploy
Start Command: npm start
```

Add environment variables:

```env
NODE_ENV=production
PORT=10000
DATABASE_URL=mysql://DB_USER:DB_PASSWORD@DB_HOST:3306/DB_NAME?connectTimeout=15000
FRONTEND_URL=https://YOUR-FRONTEND-URL.onrender.com,https://darkviolet-stork-314715.hostingersite.com
JWT_ACCESS_SECRET=long-random-secret-min-32-chars
JWT_REFRESH_SECRET=another-long-random-secret-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=150
UPLOAD_DIR=uploads
PUBLIC_API_BASE_URL=https://YOUR-BACKEND-URL.onrender.com
WHATSAPP_API_URL=https://graph.facebook.com/v20.0
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
FCM_SERVER_KEY=
OPENAI_API_KEY=
GROQ_API_KEY=
AI_PROVIDER=openai
```

After deploy, open:

```txt
https://YOUR-BACKEND-URL.onrender.com/health
```

Expected response:

```json
{"success":true}
```

## Seed demo data once

Run this only once if demo login users/data are needed:

```txt
npm run seed
```

Demo users:

```txt
Super Admin: admin@bhawanifitness.com / Admin@12345
Sales: sales@bhawanifitness.com / Sales@12345
Trainer: trainer@bhawanifitness.com / Trainer@12345
Dietician: dietician@bhawanifitness.com / Diet@12345
Support: support@bhawanifitness.com / Support@12345
Client: client@bhawanifitness.com / Client@12345
```

## Frontend on Render

Create a Static Site from the same repository. The `frontend-static` folder contains a prebuilt production frontend connected to:

```txt
https://bhawani-crm-render.onrender.com/api
```

```txt
Root Directory: frontend-static
Build Command: echo "Using prebuilt static frontend"
Publish Directory: .
```

## Important notes

- Render does not provide managed MySQL. Use an external MySQL database such as Hostinger MySQL, PlanetScale, Railway MySQL, or another hosted MySQL server.
- For Railway MySQL public TCP proxy, keep `?connectTimeout=15000` at the end of `DATABASE_URL`. Without this, the MariaDB/Prisma adapter can time out during login/API calls.
- Free Render services can sleep after inactivity, so first request may be slow.
- Local file uploads in `uploads` are not permanent on free Render. Use a Render disk or cloud storage if uploads must be preserved.
