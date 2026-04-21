const qrcode = require("qrcode-terminal");
const QRCode = require("qrcode");
const { Client, LocalAuth } = require("whatsapp-web.js");
const fs = require("fs");
const path = require("path");

let waClient = null;
let qrPrintedInTerminal = false;

const waStatus = {
  enabled: true,
  initialized: false,
  ready: false,
  qrGenerated: false,
  qrCodeDataUrl: null,
  qrUpdatedAt: null,
  lastError: null,
  lastSentAt: null
};

const isWhatsAppEnabled = () =>
  String(process.env.WHATSAPP_ENABLED || "true").toLowerCase() === "true";

const normalizeWhatsAppNumber = (rawNumber) => {
  const digits = String(rawNumber || "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (digits.startsWith("00")) {
    return digits.slice(2);
  }

  return digits;
};

const isValidWhatsAppNumber = (phoneNumber) => /^\d{10,15}$/.test(phoneNumber);

const initializeWhatsAppClient = () => {
  waStatus.enabled = isWhatsAppEnabled();

  if (!waStatus.enabled) {
    console.log("WhatsApp automation is disabled (WHATSAPP_ENABLED=false).");
    return;
  }

  if (waClient) {
    return;
  }

  waClient = new Client({
    authStrategy: new LocalAuth({
      clientId: process.env.WHATSAPP_CLIENT_ID || "gurukul-academy"
    }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    }
  });

  waClient.on("qr", async (qr) => {
    waStatus.qrGenerated = true;
    waStatus.ready = false;
    waStatus.lastError = null;

    try {
      waStatus.qrCodeDataUrl = await QRCode.toDataURL(qr, {
        errorCorrectionLevel: "M",
        margin: 2,
        scale: 6
      });
      waStatus.qrUpdatedAt = new Date().toISOString();
    } catch (error) {
      waStatus.qrCodeDataUrl = null;
      waStatus.qrUpdatedAt = null;
      waStatus.lastError = error.message || "Failed to generate QR image";
    }

    if (!qrPrintedInTerminal) {
      console.log("Scan the WhatsApp QR code from Linked Devices to activate automation:");
      qrcode.generate(qr, { small: true });
      qrPrintedInTerminal = true;
    }
  });

  waClient.on("ready", () => {
    waStatus.initialized = true;
    waStatus.ready = true;
    waStatus.qrGenerated = false;
    waStatus.qrCodeDataUrl = null;
    waStatus.qrUpdatedAt = null;
    waStatus.lastError = null;
    console.log("WhatsApp client is ready.");
  });

  waClient.on("auth_failure", (message) => {
    waStatus.ready = false;
    waStatus.lastError = `Authentication failed: ${message}`;
    console.error("WhatsApp authentication failed:", message);
  });

  waClient.on("disconnected", (reason) => {
    waStatus.ready = false;
    waStatus.lastError = `Disconnected: ${reason}`;
    console.warn("WhatsApp client disconnected:", reason);
  });

  waClient.initialize().catch((error) => {
    waStatus.ready = false;
    waStatus.initialized = false;
    waStatus.lastError = error.message || "Unknown WhatsApp initialization error";
    console.error("Failed to initialize WhatsApp client:", error.message || error);
  });
};

const sendWhatsAppText = async (phoneNumber, message) => {
  const normalizedNumber = normalizeWhatsAppNumber(phoneNumber);

  if (!waStatus.enabled) {
    return {
      sent: false,
      number: normalizedNumber,
      message: "WhatsApp automation is disabled."
    };
  }

  if (!normalizedNumber || !isValidWhatsAppNumber(normalizedNumber)) {
    return {
      sent: false,
      number: normalizedNumber,
      message: "Invalid phone number format."
    };
  }

  if (!waClient) {
    return {
      sent: false,
      number: normalizedNumber,
      message: "WhatsApp client is not initialized yet."
    };
  }

  if (!waStatus.ready) {
    return {
      sent: false,
      number: normalizedNumber,
      message: "WhatsApp client is not ready. Scan QR code first."
    };
  }

  try {
    await waClient.sendMessage(`${normalizedNumber}@c.us`, message);
    waStatus.lastSentAt = new Date().toISOString();

    return {
      sent: true,
      number: normalizedNumber,
      message: "WhatsApp message sent successfully."
    };
  } catch (error) {
    return {
      sent: false,
      number: normalizedNumber,
      message: error.message || "Failed to send WhatsApp message."
    };
  }
};

const getWhatsAppStatus = () => ({ ...waStatus });

const resetWhatsAppClient = async () => {
  console.log("Resetting WhatsApp client...");
  
  if (waClient) {
    try {
      await waClient.destroy();
    } catch (e) {
      console.warn("Error destroying WhatsApp client:", e.message);
    }
    waClient = null;
  }

  waStatus.initialized = false;
  waStatus.ready = false;
  waStatus.qrGenerated = false;
  waStatus.qrCodeDataUrl = null;
  waStatus.qrUpdatedAt = null;
  waStatus.lastError = null;
  qrPrintedInTerminal = false;

  const authPath = path.join(process.cwd(), ".wwebjs_auth");
  if (fs.existsSync(authPath)) {
    try {
      fs.rmSync(authPath, { recursive: true, force: true });
      console.log("Cleared .wwebjs_auth directory.");
    } catch (e) {
      console.warn("Failed to clear .wwebjs_auth:", e.message);
    }
  }

  initializeWhatsAppClient();
  return waStatus;
};

module.exports = {
  initializeWhatsAppClient,
  sendWhatsAppText,
  normalizeWhatsAppNumber,
  isValidWhatsAppNumber,
  getWhatsAppStatus,
  resetWhatsAppClient
};
