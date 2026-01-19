# Setting Up Multiple Authentication Methods

## Overview
Your KIISHA app can support multiple authentication methods simultaneously:
- Email/Password (Local)
- Google OAuth
- GitHub OAuth
- Microsoft OAuth
- Any OAuth 2.0 provider

## 🚀 Quick Setup Guide

### 1. Email/Password Authentication (Simplest)
Already implemented! Just needs to be connected to the router.

### 2. Google OAuth Setup

#### Step 1: Create Google OAuth App
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth Client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `https://kiisha-cc-test-deploy.vercel.app/api/auth/google/callback`
   - `http://localhost:3000/api/auth/google/callback` (for local dev)
7. Copy your Client ID and Client Secret

#### Step 2: Add to Vercel Environment Variables
```
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://kiisha-cc-test-deploy.vercel.app/api/auth/google/callback
```

### 3. GitHub OAuth Setup

#### Step 1: Create GitHub OAuth App
1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - Application name: KIISHA
   - Homepage URL: https://kiisha-cc-test-deploy.vercel.app
   - Authorization callback URL: https://kiisha-cc-test-deploy.vercel.app/api/auth/github/callback
4. Copy your Client ID and Client Secret

#### Step 2: Add to Vercel Environment Variables
```
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=https://kiisha-cc-test-deploy.vercel.app/api/auth/github/callback
```

### 4. Microsoft/Azure OAuth Setup

#### Step 1: Create Azure App Registration
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Fill in:
   - Name: KIISHA
   - Supported account types: Choose based on your needs
   - Redirect URI: https://kiisha-cc-test-deploy.vercel.app/api/auth/microsoft/callback
5. Copy Application (client) ID
6. Go to "Certificates & secrets" → "New client secret"
7. Copy the secret value

#### Step 2: Add to Vercel Environment Variables
```
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_REDIRECT_URI=https://kiisha-cc-test-deploy.vercel.app/api/auth/microsoft/callback
MICROSOFT_TENANT_ID=common  # or your specific tenant ID
```

## 🔧 Implementation Files

### Frontend Components:
- `/client/src/pages/MultiAuthLogin.tsx` - Multi-auth login page
- `/client/src/pages/Login.tsx` - Original login (can be replaced)

### Backend Routes:
- `/server/routers/localAuth.ts` - Email/password authentication
- `/server/routers/auth.ts` - Original auth (modify for OAuth)
- `/api/auth/[provider]/index.ts` - OAuth handler (create for each provider)
- `/api/auth/[provider]/callback.ts` - OAuth callback handler

## 📝 Environment Variables Summary

Add these to Vercel at:
https://vercel.com/solomons-projects-4efa50d3/kiisha-cc-test-deploy/settings/environment-variables

### Required for All Auth:
```
JWT_SECRET=(already set)
JWT_REFRESH_SECRET=(already set)
DATABASE_URL=(already set)
```

### For Google OAuth:
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
```

### For GitHub OAuth:
```
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_REDIRECT_URI=
```

### For Microsoft OAuth:
```
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_REDIRECT_URI=
MICROSOFT_TENANT_ID=
```

### For Email/Password:
```
SMTP_HOST=smtp.sendgrid.net  # or your SMTP server
SMTP_PORT=587
SMTP_USER=apikey  # for SendGrid
SMTP_PASS=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com
```

## 🎨 Customizing the Login Page

The multi-auth login page (`MultiAuthLogin.tsx`) includes:
- OAuth provider buttons (Google, GitHub, Microsoft)
- Email/password tabs (Sign In / Sign Up)
- Password reset flow
- Error handling
- Loading states

You can customize:
- Add/remove OAuth providers
- Change button order/styling
- Add company branding
- Customize error messages
- Add terms/privacy links

## 🔒 Security Best Practices

1. **Password Requirements**:
   - Minimum 8 characters (configured)
   - Add complexity requirements if needed
   - Implement password strength meter

2. **Rate Limiting**:
   - Limit login attempts (5 per minute)
   - Implement CAPTCHA after failures
   - Block IPs after repeated failures

3. **Email Verification**:
   - Send verification email on signup
   - Require verification before access
   - Add resend verification option

4. **OAuth Security**:
   - Always use HTTPS in production
   - Validate state parameter
   - Use PKCE for public clients
   - Rotate client secrets regularly

## 🚦 Testing Authentication

### Local Testing:
1. Set environment variables in `.env`
2. Run `npm run dev`
3. Visit http://localhost:3000/login

### Production Testing:
1. Add all environment variables to Vercel
2. Deploy with `vercel --prod`
3. Test each auth method:
   - Email signup/login
   - Google OAuth
   - GitHub OAuth
   - Microsoft OAuth

## 📊 Monitoring & Analytics

Track authentication metrics:
- Signup conversion rates
- Auth method preferences
- Failed login attempts
- Password reset requests
- OAuth provider usage

## 🆘 Troubleshooting

### OAuth Issues:
- **Redirect mismatch**: Ensure callback URLs match exactly
- **Invalid client**: Check client ID/secret
- **Scope errors**: Verify requested permissions

### Email/Password Issues:
- **Email not sending**: Check SMTP configuration
- **Password reset fails**: Verify token expiration
- **Login fails**: Check password hashing

### Database Issues:
- **User creation fails**: Check unique constraints
- **Token storage**: Ensure table migrations ran

## 📚 Next Steps

1. Choose which auth methods to implement
2. Set up OAuth apps with providers
3. Add environment variables to Vercel
4. Update the login route in your app
5. Test all authentication flows
6. Monitor usage and adjust

Need help with a specific provider? Let me know which one you want to set up first!