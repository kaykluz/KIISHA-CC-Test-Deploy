# Deploying KIISHA to Vercel

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MySQL Database**: You'll need a MySQL database. Recommended providers:
   - [PlanetScale](https://planetscale.com) - Best for production
   - [Neon](https://neon.tech) - Good free tier
   - [Railway](https://railway.app) - Easy setup
3. **AWS S3 Bucket**: For document storage
4. **SendGrid Account**: For email notifications (optional)

## Step-by-Step Deployment

### 1. Set Up MySQL Database

Choose one of these providers:

#### Option A: PlanetScale (Recommended)
1. Sign up at [planetscale.com](https://planetscale.com)
2. Create a new database
3. Get your connection string (looks like: `mysql://xxx:pscale_pw_xxx@xxx.connect.psdb.cloud/kiisha?ssl={"rejectUnauthorized":true}`)

#### Option B: Neon
1. Sign up at [neon.tech](https://neon.tech)
2. Create a MySQL database
3. Get your connection string

#### Option C: Railway
1. Sign up at [railway.app](https://railway.app)
2. Deploy MySQL from their template
3. Get your connection string

### 2. Run Database Migrations

```bash
# Install dependencies
pnpm install

# Set DATABASE_URL in .env
echo "DATABASE_URL=your-connection-string" > .env

# Run migrations
pnpm run db:push
```

### 3. Configure AWS S3

1. Create an S3 bucket in AWS Console
2. Set bucket permissions for public read (if needed for documents)
3. Create IAM user with S3 access
4. Get Access Key ID and Secret Access Key

### 4. Deploy to Vercel

#### Using Vercel CLI (Recommended):

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No (first time)
# - What's your project name? kiisha-cc-test-deploy
# - In which directory is your code? ./
# - Want to override settings? No
```

#### Using GitHub Integration:

1. Push your code to GitHub (already done!)
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Configure build settings:
   - Framework Preset: Other
   - Build Command: `pnpm run build:vercel`
   - Output Directory: `dist/public`
   - Install Command: `pnpm install`

### 5. Set Environment Variables

In Vercel Dashboard > Settings > Environment Variables, add:

```env
# Required
DATABASE_URL=your-mysql-connection-string
JWT_SECRET=generate-with-openssl-rand-hex-32
JWT_REFRESH_SECRET=generate-another-secret

# AWS S3 (Required for file uploads)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-bucket

# Forge API (Required for AI features)
BUILT_IN_FORGE_API_URL=https://forge.manus.computer
BUILT_IN_FORGE_API_KEY=your-api-key

# Email (Optional)
SENDGRID_API_KEY=your-key
FROM_EMAIL=noreply@yourdomain.com

# OAuth (Optional)
BUILT_IN_OAUTH_SERVER_URL=https://api.manus.computer
VITE_APP_ID=your-app-id
```

### 6. Deploy

```bash
# Deploy to production
vercel --prod

# Or redeploy after environment variable changes
vercel --prod --force
```

## Post-Deployment

### 1. Test Core Functions

- Visit `https://your-app.vercel.app`
- Check `/api/health` endpoint
- Test login/signup
- Upload a document
- Create a project

### 2. Set Up Custom Domain (Optional)

1. In Vercel Dashboard > Settings > Domains
2. Add your domain
3. Configure DNS as instructed

### 3. Monitor Performance

- Check Vercel Analytics
- Monitor Function logs
- Set up error tracking (Sentry recommended)

## Limitations on Vercel

### What Works:
✅ React frontend
✅ tRPC API endpoints
✅ Database operations
✅ File uploads to S3
✅ Authentication & sessions
✅ Email notifications

### What Doesn't Work:
❌ WebSocket connections (use Pusher/Ably instead)
❌ Long-running background jobs (use external queue)
❌ File system storage (use S3)
❌ Server-side sessions (use JWT)

### Workarounds:

1. **WebSockets**: Replace with:
   - [Pusher](https://pusher.com) - Easy real-time updates
   - [Ably](https://ably.com) - More features
   - Polling (less efficient)

2. **Background Jobs**: Use:
   - [Inngest](https://inngest.com) - Serverless jobs
   - [QStash](https://upstash.com/qstash) - Message queue
   - Vercel Cron Jobs (for scheduled tasks)

3. **File Storage**: Already using S3 ✅

## Troubleshooting

### Build Fails
- Check Node version (should be 18.x or 20.x)
- Run `pnpm install` locally
- Check for TypeScript errors: `pnpm run check`

### Database Connection Issues
- Verify connection string format
- Ensure SSL is enabled: `?ssl={"rejectUnauthorized":true}`
- Check firewall/IP allowlist on database provider

### API Routes Not Working
- Check function logs in Vercel dashboard
- Verify environment variables are set
- Test locally with `vercel dev`

### Performance Issues
- Enable caching headers
- Optimize database queries
- Use Vercel Edge Functions for geo-distributed endpoints

## Local Development with Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Link to your Vercel project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run development server
vercel dev
```

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)
- GitHub Issues: Create issue in your repository

---

## Quick Deploy Checklist

- [ ] MySQL database set up and migrated
- [ ] AWS S3 bucket configured
- [ ] Environment variables added in Vercel
- [ ] Build command set to `pnpm run build:vercel`
- [ ] Output directory set to `dist/public`
- [ ] Deployed with `vercel --prod`
- [ ] Tested core functionality
- [ ] Monitoring set up