# 📱 WhatsApp Automation Planner (Option A)

This is your master checklist and technical guide for integrating the free `whatsapp-web.js` client into the Gurukul Academy backend.

## 📋 The Strategy Overview
We will use the unofficial WhatsApp Web proxy library. The server will launch a hidden Chrome browser, print a QR code to your terminal, and you will scan it using the "Linked Devices" feature on your official coaching center WhatsApp phone. Once linked, the server can text parents directly!

---

## 🛠️ Step 1: Install Dependencies
Inside your `server/` directory, you need to install the libraries:
```bash
npm install whatsapp-web.js qrcode-terminal
```

### ⚠️ IMPORTANT: WSL / Linux Prerequisites
Because `whatsapp-web.js` relies on running a hidden Chromium browser to work, Linux (and WSL) requires some extra graphical system dependencies, even without a GUI.
Run this inside your WSL Ubuntu terminal before trying to start the server:
```bash
sudo apt-get update
sudo apt-get install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2
```

---

## 🏗️ Step 2: Code Modifications Required

### 1. Update the Student Data
Before we can message a student or their parent, we have to know their number. 
* We will update `server.js` so that `POST /students` requires a `phoneNumber` (like `"919876543210"`).
* *Note: Numbers must include the country code without the `+` sign for the WhatsApp API.*

### 2. Create the WhatsApp Client
We will create a new file `server/whatsappClient.js`:
* It initializes `const client = new Client();`
* It listens for the `'qr'` event and uses `qrcode-terminal` to print it to your console.
* It listens for `'ready'` to let the server know WhatsApp is connected.

### 3. Wire up the Automation Hooks
Inside `server.js`, we will hook the `client.sendMessage(number + "@c.us", message)` function to your existing routes:
* **Attendance:** When an admin submits attendance and `present: false`, automatically message the parent: *"Alert: [StudentName] was absent from Gurukul Academy today."*
* **Notices:** When a notice is placed on the board, loop through all student phone numbers and broadcast the notice directly to them.
* **Fee Reminders (New Route):** Add a specific button on the Admin Dashboard that hits a new API endpoint to text parents their exact pending fee balance.

---

## 🚀 Step 3: Initialization & Testing
1. When you run `npm run dev` or `pm2 start server.js`, carefully watch the terminal output.
2. A large QR Code will generate in the text terminal.
3. Open WhatsApp on your phone -> Settings -> Linked Devices -> Link a Device.
4. Point your camera at the computer screen.
5. Once the terminal prints "WhatsApp Client is Ready!", automation is officially online!
