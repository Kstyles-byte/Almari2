# GitHub Actions Automated Deployment Setup

## 🚀 The TRULY Seamless Solution

Since your shared hosting can't handle Next.js builds due to memory constraints, we'll use **GitHub Actions** to build your app in the cloud and automatically deploy it to cPanel.

## 📋 One-Time Setup (5 minutes)

### Step 1: Get Your FTP Credentials from TrueHost

1. **Login to your cPanel**
2. **Go to "FTP Accounts"** or "File Manager"
3. **Note down**:
   - FTP Server: Usually `ftp.yourdomain.com` or your server IP
   - FTP Username: Usually your cPanel username
   - FTP Password: Your cPanel password or create a new FTP account

### Step 2: Add Secrets to GitHub

1. **Go to your GitHub repository**
2. **Click "Settings"** tab
3. **Click "Secrets and variables" → "Actions"**
4. **Add these secrets**:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `FTP_SERVER` | Your FTP server | `ftp.almari2.com` |
| `FTP_USERNAME` | Your FTP username | `imsfrkmv` |
| `FTP_PASSWORD` | Your FTP password | `your_password` |

### Step 3: That's It! 🎉

Now every time you push to GitHub:

1. **GitHub builds your app** (with unlimited memory)
2. **Creates deployment package** (includes pre-built .next folder)
3. **Uploads everything to your cPanel** via FTP
4. **You just restart the Node.js app** (one click)

## 🔄 Your New Workflow

```bash
# Make changes locally
git add .
git commit -m "Updated feature X"
git push

# GitHub automatically:
# ✅ Builds the app
# ✅ Uploads to cPanel
# ✅ Notifies you when done

# You just:
# 🔄 Restart Node.js app in cPanel (one click)
```

## 🛠️ Advanced: Alternative Deployment Methods

If FTP doesn't work, you can also use:

### Option A: SSH Deployment
Replace the FTP step with SSH deployment (if your host supports it):

```yaml
- name: Deploy via SSH
  uses: appleboy/ssh-action@v0.1.5
  with:
    host: ${{ secrets.SSH_HOST }}
    username: ${{ secrets.SSH_USERNAME }}
    key: ${{ secrets.SSH_KEY }}
    script: |
      cd /home/imsfrkmv/Almari2
      # Upload and extract files
```

### Option B: Manual Download
GitHub Actions can create a downloadable ZIP file:
1. Build completes → Creates `deployment.zip`
2. You download from GitHub Actions page
3. Upload to cPanel File Manager
4. Extract and restart app

## 🎯 Benefits of This Approach

| ✅ Pro | ❌ Previous Issues |
|--------|-------------------|
| **Unlimited build memory** | Memory crashes |
| **Automatic deployment** | Manual uploads |
| **Version control** | File sync issues |
| **Build logs in GitHub** | Hard to debug |
| **Works with any hosting** | Host-specific problems |

## 🔍 Testing the Setup

1. **Commit and push** these new files
2. **Go to GitHub → Actions tab**
3. **Watch the build process**
4. **Check if files appear in your cPanel**
5. **Restart your Node.js app**

If there are any issues, the GitHub Actions logs will show exactly what went wrong!

## 💡 Pro Tips

- **Use different branches** for testing vs production
- **Set up staging environment** for testing deployments
- **Monitor build times** - typically 2-5 minutes
- **Keep FTP credentials secure** - never put them in code

This is how professional developers deploy apps! 🚀