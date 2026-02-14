---
description: Deploy the Applywizz CRM to Vercel
---

# Deployment Workflow

Follow these steps to deploy your application to Vercel:

### 1. Push your code to GitHub
If you haven't already, initialize a git repository and push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com) and click **"Add New"** -> **"Project"**.
2. Import your GitHub repository.
3. In the **"Build & Development Settings"**:
   - Vercel should automatically detect the `buildCommand` as `npm run build` from your `package.json`.
   - The `outputDirectory` should be set to `./` (as configured in `vercel.json`).

### 3. Set Environment Variables
In the **"Environment Variables"** section of the Vercel project setup, add the following:
- `SUPABASE_URL`: Your Supabase Project URL.
- `SUPABASE_KEY`: Your Supabase Anon/Public Key.

### 4. Deploy
Click **"Deploy"**. Vercel will:
1. Install dependencies (`node-fetch`).
2. Run `npm run build` (which executes `build.js` to inject your Supabase keys into the HTML files).
3. Set up the serverless function in `/api/send-email.js`.
4. Provide you with a production URL where the Azure CORS error will be fixed!

### 5. Verification
Once deployed:
1. Go to your Vercel URL.
2. Use the **Second Form** to generate an end-user link.
3. Test a submission. The email will now be sent via the backend API, bypassing browser CORS restrictions.
