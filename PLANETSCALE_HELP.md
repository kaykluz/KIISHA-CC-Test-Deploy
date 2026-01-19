# PlanetScale Connection Help

## Where to Find Your Connection String

1. Go to your PlanetScale Dashboard: https://app.planetscale.com/
2. Click on your database name
3. Click the **"Connect"** button
4. You should see your existing password or create a new one
5. **IMPORTANT**: Select **"Node.js"** from the "Connect with" dropdown
6. Copy the ENTIRE connection string that appears

## What the Connection String Should Look Like

```
mysql://[long-username]:[long-password]@aws.connect.psdb.cloud/[database-name]?ssl={"rejectUnauthorized":true}
```

Example:
```
mysql://abcdef123456:pscale_pw_xxxxxxxxxxxx@aws.connect.psdb.cloud/kiisha?ssl={"rejectUnauthorized":true}
```

## Common Issues

### Wrong Format
- ❌ If you see `postgresql://` at the start, you selected the wrong option
- ✅ It should start with `mysql://`

### Database Name
- Check what you named your database in PlanetScale
- It might be `kiisha`, `kiisha-cc`, or something else
- The database name appears at the end of the connection string before the `?ssl`

### Connection Issues
If you get connection errors:
1. Make sure your PlanetScale database is "Awake" (not sleeping)
2. Verify you copied the ENTIRE connection string
3. Check that the password hasn't expired
4. Ensure you're connecting to the correct branch (usually `main`)

## Need a New Password?

If you need to create a new password:
1. Go to your database in PlanetScale
2. Click "Settings" → "Passwords"
3. Click "New password"
4. Select branch: `main`
5. Give it a name like "production"
6. Copy the new connection string

## Test Your Connection

After updating your `.env` file with the correct connection string:

```bash
node setup-database.js
```

This will verify your connection is working before we proceed with migrations.