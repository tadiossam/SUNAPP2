# 🔧 Windows Troubleshooting Guide

## 🚨 **Problem: Batch Files Close Immediately**

This means there's an error, but the window closes too fast to see it.

### **Solution: Use Debug Mode**

**Run this instead:**
```
debug-windows.bat
```

This will:
- ✅ Show you detailed error messages
- ✅ Stay open so you can read the errors
- ✅ Help you diagnose the problem

---

## 📋 **Step-by-Step Fix**

### **Step 1: Run Debug Script**

1. Go to your folder: `C:\Users\Solmix\Downloads\New folder\New Port\SUNAPP2-main\`
2. Double-click: **`debug-windows.bat`**
3. **Don't close it!** Leave it open and read the messages

### **Step 2: Look for Specific Errors**

The debug script will check:
1. ✅ Is Node.js installed?
2. ✅ Does `.env` file exist?
3. ✅ Are dependencies (`node_modules`) installed?
4. ✅ Can the server start?

**Copy ALL the text** from the window and send it to me.

---

## 🎯 **Common Errors and Solutions**

### **Error 1: "Node.js not found"**

```
node is not recognized as an internal or external command
```

**Solution:**
1. Install Node.js: https://nodejs.org/
2. Download **LTS version** (20.x)
3. Restart computer
4. Try again

---

### **Error 2: "node_modules NOT found"**

```
❌ node_modules NOT found!
Run setup-windows.bat first!
```

**Solution:**
```cmd
Double-click: setup-windows.bat
```

Wait 3-5 minutes for installation to complete.

---

### **Error 3: "Cannot find module 'cross-env'"**

```
Error: Cannot find module 'cross-env'
```

**Solution:**
```cmd
npm install cross-env
```

Then run `debug-windows.bat` again.

---

### **Error 4: "Cannot find module 'tsx'"**

```
Error: Cannot find module 'tsx'
```

**Solution:**
```cmd
npm install tsx
```

Then run `debug-windows.bat` again.

---

### **Error 5: Database Connection Error**

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**This means PostgreSQL is not running or not installed.**

**Solution A: Use Replit's Database (Easiest)** ⭐

1. Go to Replit
2. Click **Tools** → **Secrets**
3. Copy the `DATABASE_URL` value
4. Open `.env` file on Windows
5. Paste it:
```env
DATABASE_URL=paste-database-url-here
SESSION_SECRET=secret123
PORT=6000
NODE_ENV=development
```
6. Save and try again

**Solution B: Install PostgreSQL on Windows**

1. Download: https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set!
4. Update `.env`:
```env
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/gelan_terminal
```

5. Create database:
```cmd
psql -U postgres
CREATE DATABASE gelan_terminal;
\q
```

---

### **Error 6: "Port 6000 already in use"**

```
Error: listen EADDRINUSE: address already in use :::6000
```

**Solution A: Change Port**

Edit `.env`:
```env
PORT=3000
```

**Solution B: Kill Process Using Port**

```cmd
netstat -ano | findstr :6000
taskkill /PID [number] /F
```

---

### **Error 7: "bcrypt" errors**

```
Error: Cannot find module 'bcrypt'
```

**Solution:**
```cmd
npm uninstall bcrypt
npm install bcryptjs
node fix-bcrypt-windows.cjs
```

---

## 🧪 **Manual Testing**

If `debug-windows.bat` still doesn't work, try running commands one by one:

### **Open Command Prompt:**
1. Press `Windows + R`
2. Type: `cmd`
3. Press Enter

### **Navigate to folder:**
```cmd
cd C:\Users\Solmix\Downloads\New folder\New Port\SUNAPP2-main
```

### **Test 1: Check Node.js**
```cmd
node --version
```
Should show: `v22.21.0` or similar

### **Test 2: Check if dependencies installed**
```cmd
dir node_modules
```
Should list many folders

### **Test 3: Check .env file**
```cmd
type .env
```
Should show your configuration

### **Test 4: Try running server manually**
```cmd
npx tsx server/index.ts
```

**What happens? Copy the entire output!**

---

## 📸 **What To Send Me**

Run `debug-windows.bat` and send me:

1. **Screenshot** of the entire window
   OR
2. **Copy ALL the text** from the window (select all, right-click, copy)

Include:
- ✅ All error messages (red text)
- ✅ All output from the script
- ✅ What Node.js version it shows

Then I can give you the exact fix! 😊

---

## 💡 **Quick Fix Checklist**

Before asking for help, make sure you've done:

- [ ] ✅ Installed Node.js 20.x or higher
- [ ] ✅ Restarted computer after installing Node.js
- [ ] ✅ Downloaded fresh files from Replit (not old version)
- [ ] ✅ Extracted to simple path: `C:\GelanTerminal\` (not "New folder\New Port")
- [ ] ✅ Ran `setup-windows.bat` successfully
- [ ] ✅ Created/edited `.env` file with valid DATABASE_URL
- [ ] ✅ Tried running `debug-windows.bat`

---

## 🎯 **Expected Working Output**

When it works, you should see:

```
============================================================
   GELAN TERMINAL - DEBUG MODE
============================================================

[1] Checking Node.js...
v22.21.0

[2] Checking current directory...
C:\GelanTerminal

[3] Checking if .env exists...
✅ .env file found

.env contents:
DATABASE_URL=postgresql://...
SESSION_SECRET=secret123
PORT=6000
NODE_ENV=development

[4] Checking if node_modules exists...
✅ node_modules found

[5] Starting server...

Server will be at: http://localhost:6000

============================================================

[Server] Database connected
[Server] Server listening on port 6000
```

Then open browser: `http://localhost:6000`

---

## 🔄 **Complete Reset (Last Resort)**

If nothing works:

1. **Delete everything**
2. **Create new folder:** `C:\GelanTerminal\`
3. **Download fresh from Replit**
4. **Extract to C:\GelanTerminal\**
5. **Run:** `setup-windows.bat`
6. **Edit:** `.env` file (use Replit database URL)
7. **Run:** `debug-windows.bat`
8. **Send me the output**

---

**Run `debug-windows.bat` now and send me what you see!** 🔍
