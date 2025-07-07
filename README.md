# Zervia E-commerce Platform

Zervia is a multi-vendor e-commerce platform built with Next.js, Prisma, PostgreSQL, and Paystack. It features a modern, responsive UI and supports multiple user roles including customers, vendors, and administrators.

## Features

- User authentication and role-based access control
- Customer and vendor profile management
- Product catalog with categories and search
- Shopping cart and order management
- Secure payment processing with Paystack
- Vendor dashboard for managing products and orders
- Admin dashboard for platform management
- Responsive design for mobile and desktop

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API Routes, Server Actions
- **Database**: PostgreSQL (hosted on Supabase)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Payment Processing**: Paystack
- **Image Storage**: Cloudinary
- **Deployment**: Vercel

## Deployment on Vercel

### Prerequisites

Before deploying, make sure you have:

1. A Vercel account linked to your GitHub repository
2. A PostgreSQL database (e.g., on Supabase)
3. Cloudinary account for image storage
4. Paystack account for payment processing

### Deployment Steps

1. **Fork or Clone the Repository**
   ```
   git clone https://github.com/your-username/almari.git
   cd almari
   ```

2. **Push to Your GitHub Repository**
   ```
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

3. **Import the Project in Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" > "Project"
   - Select your GitHub repository
   - Configure the project settings

4. **Environment Variables**
   Add the following environment variables in the Vercel dashboard:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_SECRET`: A random string for session encryption
   - `NEXTAUTH_URL`: Your production URL (e.g., https://almari.vercel.app)
   - `CLOUDINARY_CLOUD_NAME`: Your Cloudinary cloud name
   - `CLOUDINARY_API_KEY`: Your Cloudinary API key
   - `CLOUDINARY_API_SECRET`: Your Cloudinary API secret
   - `PAYSTACK_PUBLIC_KEY`: Your Paystack public key
   - `PAYSTACK_SECRET_KEY`: Your Paystack secret key
   - `PAYSTACK_WEBHOOK_SECRET`: Your Paystack webhook secret

5. **Deploy**
   - Click "Deploy" and wait for the build to complete
   - Once deployed, your site will be available at the assigned URL

6. **Set Up Webhook**
   - Configure your Paystack webhook to point to `https://your-domain.vercel.app/api/webhooks/paystack`

7. **Custom Domain** (Optional)
   - Add your custom domain in the Vercel dashboard
   - Update the `NEXTAUTH_URL` environment variable to match your custom domain

## Local Development

1. **Clone the Repository**
   ```
   git clone https://github.com/your-username/almari.git
   cd almari
   ```

2. **Install Dependencies**
   ```
   npm install
   ```

3. **Set Up Environment Variables**
   Create a `.env` file in the root directory with the required variables.

4. **Run Database Migrations**
   ```
   npx prisma migrate dev
   ```

5. **Start the Development Server**
   ```
   npm run dev
   ```

6. **Open Your Browser**
   The app will be available at [http://localhost:3000](http://localhost:3000)

## License

[MIT](LICENSE) 