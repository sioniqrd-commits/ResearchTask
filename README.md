# ResearchFlow — Google Sheets Task Management

## Quick Setup (5 minutes)

### Step 1: Google Apps Script
1. Open your sheet: https://docs.google.com/spreadsheets/d/15L_ibtQV4eMp9Q4C1raIO-rY1xg0zTcYFH-LXZf_RBk
2. Go to **Extensions → Apps Script**
3. Delete everything in `Code.gs`
4. Paste the contents of `Code.gs` from this repo
5. Click **Save** (Ctrl+S)

### Step 2: Deploy as Web App
1. Click **Deploy → New deployment**
2. ⚙️ → Select **Web app**
3. Execute as: **Me** | Who has access: **Anyone**
4. Click **Deploy** → Authorize when prompted
5. **Copy the Web App URL**

### Step 3: Configure the App
1. Open `index.html`
2. Find this line at the top of `<script>`:
   ```
   const API_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';
   ```
3. Replace with your actual URL from Step 2

### Step 4: Deploy to GitHub Pages
1. Push `index.html` + `README.md` to your GitHub repo
2. Settings → Pages → Source: `main` branch → Save
3. Access at: `https://your-username.github.io/repo-name/`

---

## Login

| User | Username | Password | Access |
|------|----------|----------|--------|
| **Master Admin** | `sioniqadmin` | `sio@123` | Full access (always works) |
| Other users | email prefix (e.g. `arjun`) | set during creation | Based on assigned modules |

Master admin works even with empty Google Sheet.

---

## Features
- **Self-healing sheets**: Tabs auto-created when data is first written
- **No sample data**: Starts completely clean
- **Real-time sync**: Auto-syncs every 60 seconds + manual sync button
- **Offline fallback**: Master admin can always login
- **Role-based access**: 8 module toggles per user
- **Advanced dashboards**: Due today, due in 2 days, overdue, on-time rate
- **Work → Task flow**: Create works first, then assign to create tasks

## Architecture
```
Browser (index.html) ←→ Google Apps Script (API) ←→ Google Sheet (DB)
                                                      ├── users
                                                      ├── works
                                                      ├── tasks
                                                      ├── comments
                                                      ├── history
                                                      └── activity
```

## Re-deploying after code changes
After editing Code.gs in Apps Script:
**Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**
