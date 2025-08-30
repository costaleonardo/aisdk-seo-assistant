# Environment Variables Setup for Vercel

Your app is now deployed at: https://aisdk-seo-assistant-kzl84qftm.vercel.app

## Next Steps: Add Environment Variables

To make the app fully functional, you need to add the following environment variables in Vercel:

### Option 1: Via Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/leonardodacostaconcentrixcs-projects/aisdk-seo-assistant/settings/environment-variables

2. Add these variables:
   - **OPENAI_API_KEY**: Your OpenAI API key (get it from https://platform.openai.com/api-keys)
   - **DATABASE_URL**: Your Neon PostgreSQL connection string (get it from https://console.neon.tech)

3. For each variable:
   - Enter the variable name
   - Enter the value
   - Select all environments (Production, Preview, Development)
   - Click "Save"

4. After adding both variables, redeploy:
   ```bash
   vercel --prod --yes
   ```

### Option 2: Via Vercel CLI

```bash
# Add OpenAI API Key
vercel env add OPENAI_API_KEY production
# Paste your key when prompted

# Add Database URL
vercel env add DATABASE_URL production
# Paste your Neon PostgreSQL connection string when prompted

# Redeploy with the new environment variables
vercel --prod --yes
```

## Getting Your Credentials

### OpenAI API Key
1. Go to: https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)

### Neon PostgreSQL Database
1. Go to: https://console.neon.tech
2. Create a new project (if you don't have one)
3. Copy the connection string from the dashboard
4. Make sure to enable the pgvector extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

## After Setting Environment Variables

Once you've added the environment variables and redeployed:

1. Your app will be fully functional at: https://aisdk-seo-assistant-kzl84qftm.vercel.app
2. Test the scraper functionality by adding a URL
3. Use the chat interface to interact with the AI
4. Try the SEO analysis tools

## Troubleshooting

If you encounter issues:
- Check the Function logs in Vercel dashboard
- Ensure your DATABASE_URL includes `?sslmode=require`
- Verify your OpenAI API key is active and has credits
- Run the database migration scripts if needed

## Current Deployment Status
✅ App deployed successfully
✅ Build passing
⏳ Waiting for environment variables to be configured