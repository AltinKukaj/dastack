# OAuth Setup (Discord, Google, GitHub)

Step-by-step: get client IDs and secrets, and set the **redirect URL** so you don’t get “redirect_uri mismatch”. OAuth is optional - if you don’t set the env vars, the button won’t show.

---

## Before you start

1. **Set `BETTER_AUTH_URL`** in `.env`  
   - Dev: `http://localhost:3000`  
   - Prod: `https://create.dagrate.xyz`

2. **Callback URL** is always:

   ```
   {BETTER_AUTH_URL}/api/auth/callback/{provider}
   ```

   Example (Discord on localhost):  
   **`http://localhost:3000/api/auth/callback/discord`**

---

## Discord

### 1. Create an application

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application**
3. Name it -> **Create**

### 2. Get Client ID and Client Secret

1. Left sidebar -> **OAuth2**
2. Copy **CLIENT ID**
3. Copy **CLIENT SECRET** (or **Reset Secret** if you don’t have one)

Add to `.env`:

```env
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
```

### 3. Add the redirect URI (most common mistake)

1. Under **OAuth2**, scroll to **Redirects**
2. Click **Add Redirect**
3. Paste exactly:

   ```
   http://localhost:3000/api/auth/callback/discord
   ```

4. For production, add another redirect:

   ```
   https://create.dagrate.xyz/api/auth/callback/discord
   ```

### 4. Restart and test

```bash
bun dev
```

Visit **`/auth`** - you should see the Discord button.

---

## Google

1. Go to [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
2. **Create Credentials** -> **OAuth client ID**
3. Application type: **Web application**
4. Under **Authorized redirect URIs**, add:

   ```
   http://localhost:3000/api/auth/callback/google
   ```

5. Add to `.env`:

   ```env
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

---

## GitHub

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. **OAuth Apps** -> **New OAuth App**
3. **Homepage URL:** `http://localhost:3000`
4. **Authorization callback URL:**

   ```
   http://localhost:3000/api/auth/callback/github
   ```

5. Add to `.env`:

   ```env
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   ```

---

## Troubleshooting

### “redirect_uri mismatch”

- The redirect URI in your provider’s dashboard **must match exactly**: same `http`/`https`, no trailing slash, same port.
- Check **`BETTER_AUTH_URL`** and the pattern: `{BETTER_AUTH_URL}/api/auth/callback/{provider}`.

### The OAuth button doesn’t show

- This template only shows a provider if **both** its env vars are set (e.g. `DISCORD_CLIENT_ID` **and** `DISCORD_CLIENT_SECRET`).
- Open **`/api/features`** in your browser. If `providers.discord` (or google/github) is `false`, the UI hides the button.
