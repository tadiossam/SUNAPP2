# ⚡ Windows Quick Start Guide

## 🎯 The Problem You Had:

Error: `'NODE_ENV' is not recognized as an internal or external command`

**Cause:** The app uses Linux/Mac commands that don't work on Windows.

**Solution:** I've created Windows-specific scripts for you!

---

## ✅ **3-Step Quick Start**

### **Step 1: Install Node.js** (if not installed)

1. Download: https://nodejs.org/
2. Install **LTS version** (20.x)
3. Restart your computer

---

### **Step 2: Download & Extract**

1. In Replit, click **☰ menu** → **"Download as zip"**
2. Extract to: `C:\GelanTerminal\`
3. You should see files like:
   - ✅ `setup-windows.bat`
   - ✅ `run-windows.bat`
   - ✅ `run-app.bat`
   - ✅ `fix-bcrypt-windows.cjs`

---

### **Step 3: Run Setup**

Open `C:\GelanTerminal\` and **double-click:**

```
setup-windows.bat
```

This will:
1. ✅ Check Node.js
2. ✅ Install all dependencies
3. ✅ Fix Windows compatibility issues
4. ✅ Create `.env` file
5. ✅ Open `.env` for editing

---

## 🔧 **Configure Database**

When `.env` file opens, update it:

### **Option A: Use Replit Database (Easiest)** ⭐

```env
DATABASE_URL=postgresql://your-replit-url-here
SESSION_SECRET=change-this-secret-12345
PORT=6000
NODE_ENV=development
```

**Get DATABASE_URL from Replit:**
1. Go to Replit
2. Click **Tools** → **Secrets**
3. Copy the `DATABASE_URL` value
4. Paste it into your `.env` file

### **Option B: Use Local PostgreSQL**

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/gelan_terminal
SESSION_SECRET=change-this-secret-12345
PORT=6000
NODE_ENV=development
```

Save and close `.env`

---

## 🚀 **Run the App**

**Method 1:** Double-click `run-app.bat`

**Method 2:** Open Command Prompt:
```cmd
cd C:\GelanTerminal
run-windows.bat
```

**Method 3:** Use the Windows-compatible command:
```cmd
npx tsx server/index.ts
```

---

## 🌐 **Access the App**

Open browser: **http://localhost:6000**

**Login:**
- Username: `ceo` | Password: `ceo123`
- Username: `admin` | Password: `admin123`

---

## ❌ **Troubleshooting**

### **Problem 1: "npm install" fails**

**Solution:**
```cmd
npm install --legacy-peer-deps --no-optional
```

Or run `setup-windows.bat` again.

---

### **Problem 2: "bcrypt" errors**

**Solution:** Already fixed by `setup-windows.bat`!

If you still get errors:
```cmd
npm uninstall bcrypt
npm install bcryptjs
node fix-bcrypt-windows.cjs
```

---

### **Problem 3: "Port 6000 already in use"**

**Solution:** Edit `.env` and change:
```env
PORT=3000
```

Then run again.

---

### **Problem 4: Can't connect to database**

**Check:**
1. Is `DATABASE_URL` correct in `.env`?
2. If using Replit database, is your internet connected?
3. If using local PostgreSQL, is it running?

**Test connection:**
```cmd
psql -d "your-database-url-here"
```

---

## 📋 **Windows-Specific Files**

I've created these for you:

1. **`setup-windows.bat`** - One-time setup
2. **`run-windows.bat`** - Start server (Windows-compatible)
3. **`run-app.bat`** - Easy launcher (calls run-windows.bat)
4. **`dev-windows.bat`** - Alternative launcher
5. **`fix-bcrypt-windows.cjs`** - Fix bcrypt issues

---

## 🎯 **Why the Error Happened**

The original command in `package.json`:
```json
"dev": "NODE_ENV=development tsx server/index.ts"
```

This is **Linux/Mac syntax**. Windows doesn't understand `NODE_ENV=development`.

**Windows needs:**
```batch
set NODE_ENV=development
tsx server/index.ts
```

Or use `cross-env` (now installed):
```
npx cross-env NODE_ENV=development tsx server/index.ts
```

---

## ✅ **Summary**

```
1. Download from Replit → Extract to C:\GelanTerminal
2. Double-click: setup-windows.bat
3. Edit .env (add DATABASE_URL from Replit)
4. Double-click: run-app.bat
5. Open: http://localhost:6000
6. Login: ceo / ceo123
```

**Total time:** 5-10 minutes!

---

## 💡 **Pro Tip: Use WSL2 (Optional)**

For better compatibility, use Windows Subsystem for Linux:

```cmd
wsl --install
```

Then run the app in Linux mode (no Windows compatibility issues).

---

## 🆘 **Still Having Issues?**

Send me:
1. The exact error message
2. Your Node.js version: `node --version`
3. Your Windows version: `winver`

I'll help you fix it! 😊
