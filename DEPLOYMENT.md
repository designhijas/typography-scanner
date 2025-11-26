# Typography Scanner - Deployment Guide

## Deploying to Vercel

### Prerequisites
1. Install Vercel CLI: `npm install -g vercel`
2. Login to Vercel: `vercel login`

### Deployment Steps

#### Option 1: Deploy via Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository: `designhijas/typography-scanner`
4. Vercel will auto-detect the monorepo structure
5. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave as root)
   - **Build Command**: Leave empty (uses vercel.json)
   - **Output Directory**: Leave empty
6. Add Environment Variables (if needed):
   - None required for basic setup
7. Click "Deploy"

#### Option 2: Deploy via CLI
```bash
cd /Users/mohammedhijas/Desktop/Tokki/server
vercel
```

### Post-Deployment

1. **Update Frontend API URL**:
   After deployment, you'll get two URLs:
   - Frontend: `https://typography-scanner-xxx.vercel.app`
   - Backend API: Same URL + `/api`

2. **Update the API endpoint in App.jsx**:
   Replace `http://localhost:4000/api/scan` with your production URL:
   ```javascript
   const API_URL = process.env.VITE_API_URL || 'http://localhost:4000';
   // Use: `${API_URL}/api/scan`
   ```

3. **Redeploy** if you made changes to the API URL

### Important Notes

⚠️ **Puppeteer on Vercel**:
- Vercel serverless functions have a 50MB limit
- Puppeteer with Chrome is ~300MB
- **Solution**: Use `puppeteer-core` with `@sparticuz/chromium` for Vercel

We need to update the server code for Vercel compatibility.

### Troubleshooting
- If deployment fails, check the build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Check that `vercel.json` is in the root directory
