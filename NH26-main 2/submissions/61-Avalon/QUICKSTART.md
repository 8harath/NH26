# Email Triage MVP - Quick Start (5 minutes)

## Step 1: Get Your Groq API Key (2 minutes)

1. Visit https://console.groq.com
2. Sign up (free account)
3. Click "Keys" in the sidebar
4. Click "Create API Key"
5. Copy the key (starts with `gsk_`)

## Step 2: Setup Project (2 minutes)

```bash
# Clone or download the project
cd email-triage

# Install dependencies
pnpm install

# Create environment file
cp .env.example .env.local

# Edit .env.local and paste your API key
# GROQ_API_KEY=gsk_your_key_here
```

## Step 3: Run Locally (1 minute)

```bash
# Start development server
pnpm dev

# Open http://localhost:3000 in browser
```

## Step 4: Try It Out (Immediate)

1. **Select an email** from the left sidebar
2. **Click "Analyze with AI"** button
3. **See the magic**:
   - ✨ AI-generated summary appears (3 bullets)
   - 🎯 Priority level shows (Urgent/Action/FYI)
   - ✅ Suggested actions display:
     - Draft Reply
     - Calendar Event
     - Tasks to extract
4. **Edit** the suggestions if needed
5. **Approve/Discard/Regenerate** actions

## Common Issues & Fixes

### "GROQ_API_KEY is not set"
```bash
# Verify .env.local file exists
cat .env.local

# Should see:
# GROQ_API_KEY=gsk_...

# If missing, add it and restart the server
# Control+C to stop, then: pnpm dev
```

### "Failed to analyze"
- ✓ Check API key is valid: https://console.groq.com
- ✓ Restart dev server after adding .env.local
- ✓ Check console for error message

### "Dependencies missing"
```bash
pnpm install
pnpm dev
```

## What's Included

### Mock Data
- **6 email threads** with realistic scenarios
- **18 emails** in total
- Ready to analyze without real email setup

### Features
- ✅ AI-powered email analysis
- ✅ Auto-generated summaries
- ✅ Draft replies
- ✅ Calendar event extraction
- ✅ Task creation
- ✅ Edit & approve workflow
- ✅ Search functionality

### Technology
- Next.js 16 (React framework)
- Groq API (fast AI inference)
- Tailwind CSS (styling)
- TypeScript (type safety)

## Next Steps

### 1. Deploy to Vercel (Free)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add GROQ_API_KEY in Vercel dashboard
```

### 2. Read Full Documentation
- `README.md` - Full feature list
- `DEPLOYMENT.md` - Deployment guide
- `API_REFERENCE.md` - Developer API docs
- `ACCEPTANCE_CRITERIA.md` - All requirements checked

### 3. Customize
Edit emails in `src/data/emails.ts` to test with your own scenarios.

## File Structure

```
📁 email-triage/
├── 📄 app/page.tsx          ← Main application
├── 📁 components/           ← UI components
│   ├── action-cards.tsx     ← Action suggestions
│   ├── inbox-list.tsx       ← Email list
│   └── thread-detail.tsx    ← Email viewer
├── 📁 src/
│   ├── 📁 lib/
│   │   └── groq.ts          ← AI functions
│   ├── 📁 data/
│   │   └── emails.ts        ← Mock emails
│   └── 📁 types/
│       └── index.ts         ← TypeScript types
├── 📄 .env.example          ← Copy to .env.local
├── 📄 README.md             ← Full docs
└── 📄 package.json          ← Dependencies
```

## API Key Safety

✅ **Safe:** Key stored in `.env.local` (not in git)
✅ **Secure:** Used only for Groq API calls
✅ **Private:** Never exposed in code
✅ **Rotatable:** Create new keys in Groq console

⚠️ **Never** commit `.env.local` to git
⚠️ **Never** paste key in code
⚠️ **Never** expose key in URLs

## Performance

- **First load**: ~2-3 seconds
- **AI analysis**: ~3-5 seconds per thread
- **Response editing**: Instant
- **Approved actions**: Instant feedback

## Browser Support

✅ Chrome/Edge 90+
✅ Firefox 88+
✅ Safari 14+
✅ Mobile browsers (responsive)

## Limits

- **Groq free tier**: ~30 requests/minute
- **No login needed**: Uses mock data
- **No database**: In-memory state only
- **No persistence**: Resets on page refresh

## Support

1. Check `.env.local` has `GROQ_API_KEY`
2. Restart server after env changes
3. Check browser console for errors
4. Visit https://console.groq.com for API status
5. Review README.md for more details

## Ready to Go!

Your AI-powered email triage is ready. Start analyzing emails now! 🚀

```bash
pnpm dev
# Visit http://localhost:3000
```
