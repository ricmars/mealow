# MealMind Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Database**: Set up a PostgreSQL database (recommended: Neon, Supabase, or Railway)
3. **Environment Variables**: Prepare your environment variables

## Required Environment Variables

You'll need to configure these environment variables in your Vercel project:

### Database
- `DATABASE_URL`: Your PostgreSQL connection string

### AI Services (Optional - for recipe generation)
- `AZURE_TENANT_ID`: Azure tenant ID (if using Azure OpenAI)
- `AZURE_CLIENT_ID`: Azure client ID
- `AZURE_CLIENT_SECRET`: Azure client secret
- `AZURE_OPENAI_ENDPOINT`: Azure OpenAI endpoint
- `AZURE_OPENAI_DEPLOYMENT`: Azure OpenAI deployment name
- `GEMINI_API_KEY`: Google Gemini API key (alternative to Azure OpenAI)

## Deployment Steps

### 1. Prepare Your Repository

Make sure your code is pushed to a Git repository (GitHub, GitLab, or Bitbucket).

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your Git repository
4. Select the repository containing your MealMind project

### 3. Configure Build Settings

Vercel should automatically detect your project structure, but verify these settings:

- **Framework Preset**: Other
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `dist/public`
- **Install Command**: `npm install`

### 4. Set Environment Variables

In your Vercel project dashboard:

1. Go to Settings → Environment Variables
2. Add each required environment variable:
   - `DATABASE_URL` (required)
   - `AZURE_TENANT_ID` (optional)
   - `AZURE_CLIENT_ID` (optional)
   - `AZURE_CLIENT_SECRET` (optional)
   - `AZURE_OPENAI_ENDPOINT` (optional)
   - `AZURE_OPENAI_DEPLOYMENT` (optional)
   - `GEMINI_API_KEY` (optional)

### 5. Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be available at the provided Vercel URL

## Database Setup

### Option 1: Neon (Recommended)
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Set as `DATABASE_URL` in Vercel

### Option 2: Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string
5. Set as `DATABASE_URL` in Vercel

### Option 3: Railway
1. Go to [railway.app](https://railway.app)
2. Create a new PostgreSQL service
3. Copy the connection string
4. Set as `DATABASE_URL` in Vercel

## Post-Deployment

### 1. Run Database Migrations

After deployment, you may need to run database migrations:

```bash
# Locally with your production DATABASE_URL
npm run db:push
```

### 2. Test Your Application

1. Visit your Vercel URL
2. Test the main functionality:
   - Adding ingredients
   - Generating recipes
   - Managing inventory

### 3. Custom Domain (Optional)

1. Go to your Vercel project dashboard
2. Navigate to Settings → Domains
3. Add your custom domain
4. Configure DNS settings as instructed

## Troubleshooting

### Common Issues

1. **Build Failures**: Check that all dependencies are in `package.json`
2. **Database Connection**: Verify `DATABASE_URL` is correct and accessible
3. **Environment Variables**: Ensure all required variables are set in Vercel
4. **API Routes**: Check that `/api/*` routes are working correctly

### Debugging

1. Check Vercel build logs for errors
2. Verify environment variables are set correctly
3. Test database connectivity
4. Check browser console for client-side errors

## File Structure for Vercel

Your project should have this structure for Vercel deployment:

```
MealMind/
├── client/           # React frontend
├── server/           # Express backend
├── shared/           # Shared schemas
├── vercel.json       # Vercel configuration
├── .vercelignore     # Files to ignore
├── package.json      # Main package.json
└── vite.config.ts    # Vite configuration
```

## Support

If you encounter issues:

1. Check the Vercel documentation
2. Review build logs in your Vercel dashboard
3. Verify all environment variables are set correctly
4. Test your application locally with production environment variables 