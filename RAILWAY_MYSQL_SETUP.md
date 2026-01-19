# Quick MySQL Setup with Railway

## Why Railway?
- Instant MySQL deployment (literally 2 clicks)
- Free tier available ($5/month credit)
- No credit card required to start
- Perfect for KIISHA's MySQL requirements

## Steps:

### 1. Sign Up
- Go to: https://railway.app/
- Click "Login" (top right)
- Sign in with GitHub (easiest)

### 2. Create MySQL Database
- Click **"New Project"** button
- Select **"Deploy MySQL"** from the list
- Railway will instantly create your database

### 3. Get Connection String
- Click on the MySQL box in your project
- Go to **"Connect"** tab
- You'll see connection details:
  - MYSQL_URL (this is what we need!)
  - Individual details (host, port, username, password, database)

### 4. Copy MySQL URL
The connection string will look like:
```
mysql://root:[password]@[host]:[port]/railway
```

### 5. Update Your .env File
Replace the DATABASE_URL in your .env with the Railway MySQL URL:
```
DATABASE_URL=mysql://root:[password]@[host]:[port]/railway
```

### 6. Test Connection
Run this command to test:
```bash
node setup-database.js
```

## Railway Limits (Free Tier)
- $5/month free credit
- 500 MB database storage
- Perfect for development and small production apps
- Upgrade anytime if needed

## Alternative: Using the PostgreSQL You Already Have

If you want to keep your existing PlanetScale PostgreSQL, I can help convert the KIISHA app to use PostgreSQL instead of MySQL. This would require:
- Updating the database connection
- Modifying some SQL queries
- Changing the ORM configuration

Let me know which option you prefer!