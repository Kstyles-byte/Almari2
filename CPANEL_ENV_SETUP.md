# cPanel Environment Variables Setup Guide

## 🔧 Required Environment Variables for Your Node.js App

After setting up your Node.js application in cPanel, you **MUST** configure these environment variables for your app to work properly.

### 📍 Where to Set Environment Variables in cPanel

1. Go to **cPanel Dashboard**
2. Find **"Setup Node.js App"** in the Software section
3. Click on your **Almari2** application
4. Scroll down to **"Environment variables"** section
5. Click **"Add Variable"** for each one below

---

## ✅ Essential Variables Checklist

### 🌍 Node.js Environment
```
NODE_ENV=production
```

### 🔗 Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 🔐 NextAuth Configuration
```
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_nextauth_secret_key
```

### ☁️ Cloudinary (if using image uploads)
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 💳 Payment Integration (if applicable)
```
PAYSTACK_SECRET_KEY=your_paystack_secret_key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

### 🏗️ Build Optimization Variables
```
CPANEL_BUILD=true
DISABLE_MINIFICATION=true
NEXT_TELEMETRY_DISABLED=1
NODE_OPTIONS=--max-old-space-size=1024
```

---

## 🔍 How to Find Your Values

### Supabase Values:
1. Go to [supabase.com](https://supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **URL** and **anon public** key
5. Copy the **service_role** key (keep this secret!)

### NextAuth Secret:
Generate a random secret key:
```bash
# You can use this command locally to generate one:
openssl rand -base64 32
```

### Cloudinary Values:
1. Go to [cloudinary.com](https://cloudinary.com)
2. Dashboard will show your Cloud Name, API Key, and API Secret

---

## ⚠️ Important Security Notes

1. **NEVER** commit `.env` files with real values to GitHub
2. **ONLY** set production values in cPanel, not in your code
3. Keep `SERVICE_ROLE_KEY` and `SECRET` values safe
4. Double-check all URLs (no trailing slashes for most)

---

## 🧪 Testing Your Setup

After setting all environment variables:

1. **Restart your Node.js app** in cPanel
2. **Test your live site** functionality:
   - ✅ User registration/login
   - ✅ Database operations
   - ✅ Image uploads (if applicable)
   - ✅ Payment processing (if applicable)

---

## 🔄 If Something Doesn't Work

1. **Check cPanel logs**:
   - Go to Node.js app → "Open Logs"
   - Look for error messages

2. **Verify environment variables**:
   - Make sure all required variables are set
   - Check for typos in variable names
   - Ensure no trailing spaces in values

3. **Restart the application**:
   - Always restart after changing environment variables

4. **Test locally first**:
   - Make sure everything works in your local development environment
   - Use `.env.local` file for local testing (don't commit this!)

---

## 📝 Environment Variables Template

Copy this template and fill in your actual values:

```env
# Node.js Environment
NODE_ENV=production

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-generated-secret-key

# Cloudinary (if using)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-api-secret

# Paystack (if using)
PAYSTACK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_...

# Build Optimization
CPANEL_BUILD=true
DISABLE_MINIFICATION=true
NEXT_TELEMETRY_DISABLED=1
NODE_OPTIONS=--max-old-space-size=1024
```

---

## ✅ Setup Complete!

Once all environment variables are set and your app is restarted, your automated deployment workflow should work perfectly:

**Push to GitHub** → **Automatic build & deploy** → **App updates live** 🚀