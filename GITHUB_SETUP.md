# GitHub Setup Instructions

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `kosher-app-store` (or your preferred name)
3. Description: `Secure proxy app store for AOSP Android devices`
4. Choose: **Private** (recommended) or Public
5. **DO NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

## Step 2: Push to GitHub

After creating the repository, run these commands:

```powershell
# Add remote (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/kosher-app-store.git

# Verify remote
git remote -v

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Verify

Go to your repository on GitHub and verify all files are there:
- backend/
- web-admin/
- android-client/
- database/
- Documentation files

## Important: Environment Variables

⚠️ **Your `.env` files are NOT in the repository** (they're gitignored for security).

You'll need to set environment variables in:
- **Vercel** (for backend and web-admin deployment)
- **Local development** (create `.env` files manually)

See `DEPLOYMENT_CONFIG.md` for all the values.

## Next: Deploy to Vercel

Once pushed to GitHub:

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "New Project"
4. Import your `kosher-app-store` repository
5. Deploy backend (see DEPLOYMENT_CONFIG.md)
6. Deploy web-admin (see DEPLOYMENT_CONFIG.md)

