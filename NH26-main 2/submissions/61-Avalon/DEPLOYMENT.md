# Email Triage - Deployment Guide

## Quick Start

### Local Development

1. **Install dependencies**
```bash
pnpm install
```

2. **Set up environment**
```bash
cp .env.example .env.local
# Edit .env.local and add your Groq API key
```

3. **Run development server**
```bash
pnpm dev
```

Open http://localhost:3000

### Get Groq API Key

1. Visit https://console.groq.com
2. Sign up for a free account
3. Go to "Keys" section
4. Create a new API key
5. Copy the key to `.env.local`:
```
GROQ_API_KEY=gsk_your_api_key_here
```

## Vercel Deployment (Recommended)

### Option 1: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts to connect GitHub repo
```

### Option 2: Using GitHub + Vercel Dashboard

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit: Email Triage MVP"
git branch -M main
git remote add origin https://github.com/yourusername/email-triage.git
git push -u origin main
```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Environment**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add: `GROQ_API_KEY` = your API key
   - Click Deploy

### Expected Build Output

```
✓ Built successfully
✓ Analyzed 42 packages
✓ Environment variables configured
✓ Deployed to vercel.com
```

## Environment Variables

### Required
- `GROQ_API_KEY` - Your Groq API key (from https://console.groq.com)

Add to:
- **Local**: `.env.local` file
- **Vercel**: Settings → Environment Variables
- **Other platforms**: Their env var configuration

## Testing the Deployment

After deployment:

1. Open the deployed URL
2. Select an email from the inbox
3. Click "Analyze with AI"
4. Verify:
   - ✓ Summary with 3 bullets appears
   - ✓ Priority badge shows (Urgent/Action/FYI)
   - ✓ Action cards display (Reply, Calendar, Task)
   - ✓ Can edit and approve actions

## Troubleshooting

### "GROQ_API_KEY is not set" Error

**Local:**
- Check `.env.local` exists in project root
- Verify file contains `GROQ_API_KEY=your_key`
- Restart dev server after changes

**Vercel:**
- Go to Project Settings → Environment Variables
- Confirm `GROQ_API_KEY` is set
- Redeploy project (Settings → Deployments → Redeploy)

### "Failed to fetch from Groq" Error

- Verify API key is valid at https://console.groq.com
- Check API key has usage quota remaining
- Test API key locally first:
```bash
curl https://api.groq.com/v1/models \
  -H "Authorization: Bearer YOUR_KEY"
```

### Build Failures

```bash
# Clear cache and rebuild
rm -rf .next
pnpm install
pnpm build
```

### Slow AI Responses

- Groq cold starts: First request in a while may be slow
- Rate limits: Groq free tier has limits (~30 requests/min)
- Network: Check your internet connection

## Performance Notes

- **Model**: llama-3.3-70b-versatile (fast inference)
- **Response time**: 2-5 seconds per analysis
- **Concurrency**: API handles concurrent requests

## Cost Considerations

### Groq
- **Free tier**: Sufficient for this MVP (~100 requests/month)
- **Pricing**: Check https://console.groq.com/pricing
- **Monitoring**: Use Groq dashboard to track usage

### Vercel
- **Free tier**: Includes deployments and up to 10 projects
- **Hobby plan**: $20/month for priority support

## Production Considerations

Before going to production with real data:

1. **Security**
   - Never commit `.env.local` to git
   - Use `.env.local` in `.gitignore` (already done)
   - Rotate API keys regularly

2. **Data Privacy**
   - Email content is sent to Groq for analysis
   - Review Groq's data policy at https://groq.com/privacy
   - Consider GDPR/privacy implications

3. **Scalability**
   - Current design is stateless (good for serverless)
   - Add database for action persistence
   - Implement rate limiting for production

4. **Monitoring**
   - Set up error tracking (Sentry, Rollbar, etc.)
   - Monitor Groq API usage
   - Log AI analysis results for debugging

## Next Steps

### Add Features
- [ ] Database integration (Supabase, Neon, etc.)
- [ ] User authentication
- [ ] Persist approved actions
- [ ] Email provider integration (Gmail, Outlook)
- [ ] Action execution (send emails, create events)
- [ ] Advanced analytics

### Improve UX
- [ ] Dark mode toggle
- [ ] Email template library
- [ ] Favorite/save templates
- [ ] Batch analysis
- [ ] Custom AI instructions

### Scale
- [ ] API route for secure key handling
- [ ] Webhook support for incoming emails
- [ ] Multi-tenancy support
- [ ] Advanced billing/metering

## Support

For issues or questions:
- Check the README.md for feature documentation
- Review Groq docs at https://console.groq.com/docs
- Check Next.js docs at https://nextjs.org/docs
