// service/mailer.js
/*const axios = require("axios");

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const ALERT_EMAIL_TO = process.env.ALERT_EMAIL_TO;   // your email
const ALERT_EMAIL_FROM = process.env.ALERT_EMAIL_FROM; // verified sender in Brevo

// Prevent spamming your inbox every 10 min while something stays down.
// Only re-alert after this cooldown passes since the last alert.
const ALERT_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
let lastAlertSentAt = 0;

async function sendHealthAlert(result) {
  const now = Date.now();
  if (now - lastAlertSentAt < ALERT_COOLDOWN_MS) {
    console.log("[Health Alert] Skipped — within cooldown window.");
    return;
  }

  if (!BREVO_API_KEY || !ALERT_EMAIL_TO || !ALERT_EMAIL_FROM) {
    console.warn("[Health Alert] Missing Brevo env vars — cannot send email.");
    return;
  }

  const failedParts = [];
  if (result.database !== "connected") failedParts.push(`Database: ${result.database}`);
  if (result.redis !== "connected" && result.redis !== "disabled") failedParts.push(`Redis: ${result.redis}`);

  const subject = `🚨 Health Check Alert — ${result.status.toUpperCase()}`;
  const htmlContent = `
    <h2>North Industrial Area GIS Locator — Health Check Alert</h2>
    <p><strong>Status:</strong> ${result.status}</p>
    <p><strong>Time:</strong> ${result.timestamp}</p>
    <ul>
      ${failedParts.map((p) => `<li>${p}</li>`).join("")}
    </ul>
    <p>Check your Render dashboard/logs for more details.</p>
  `;

  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { email: ALERT_EMAIL_FROM, name: "Wholesale Locator Monitor" },
        to: [{ email: ALERT_EMAIL_TO }],
        subject,
        htmlContent,
      },
      {
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    lastAlertSentAt = now;
    console.log("[Health Alert] Email sent successfully.");
  } catch (err) {
    console.error("[Health Alert] Brevo send failed:", err.response?.data || err.message);
  }
}

module.exports = { sendHealthAlert }; */
// service/mailer.js
const nodemailer = require("nodemailer");

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const ALERT_EMAIL_TO = process.env.ALERT_EMAIL_TO;

const ALERT_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
let lastAlertSentAt = 0;

let transporter = null;
if (GMAIL_USER && GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });
} else {
  console.warn("[Health Alert] GMAIL_USER or GMAIL_APP_PASSWORD not set — email alerts disabled.");
}

async function sendHealthAlert(result) {
  const now = Date.now();
  if (now - lastAlertSentAt < ALERT_COOLDOWN_MS) {
    console.log("[Health Alert] Skipped — within cooldown window.");
    return;
  }

  if (!transporter || !ALERT_EMAIL_TO) {
    console.warn("[Health Alert] Mailer not configured — cannot send email.");
    return;
  }

  const failedParts = [];
  if (result.database !== "connected") {
    failedParts.push({
      label: "Database",
      status: result.database,
      error: result.errors?.database || "No error message captured",
    });
  }
  if (result.redis !== "connected" && result.redis !== "disabled") {
    failedParts.push({
      label: "Redis",
      status: result.redis,
      error: result.errors?.redis || "No error message captured",
    });
  }

  const subject = `🚨 Health Check Alert — ${result.status.toUpperCase()}`;
  const html = `
    <h2>North Industrial Area GIS Locator — Health Check Alert</h2>
    <p><strong>Status:</strong> ${result.status}</p>
    <p><strong>Time:</strong> ${result.timestamp}</p>
    <hr />
    ${failedParts
      .map(
        (p) => `
      <div style="margin-bottom: 12px;">
        <p><strong>${p.label}:</strong> ${p.status}</p>
        <p style="background:#f5f5f5; padding:8px; border-left:3px solid #d33; font-family:monospace; font-size:13px;">
          ${p.error}
        </p>
      </div>
    `
      )
      .join("")}
    <p>Check your Render dashboard/logs for more details.</p>
  `;

  try {
    await transporter.sendMail({
      from: `"Wholesale Locator Monitor" <${GMAIL_USER}>`,
      to: ALERT_EMAIL_TO,
      subject,
      html,
    });

    lastAlertSentAt = now;
    console.log("[Health Alert] Email sent successfully.");
  } catch (err) {
    console.error("[Health Alert] Gmail send failed:", err.message);
  }
}

module.exports = { sendHealthAlert };