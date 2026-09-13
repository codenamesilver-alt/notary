const nodemailer = require("nodemailer");

const SERVICE_LABELS = {
  "mobile-notary": "Mobile Notary",
  ron: "Remote Online Notarization (RON)",
  "loan-signing": "Loan Signing Services",
  "real-estate": "Real Estate & Title Documents",
  "wedding-officiant": "Wedding Officiant Notary",
  "affidavits-poa": "Affidavits & Power of Attorney",
  general: "General / Not sure yet"
};

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ success: false, message: "Invalid request method." });
    return;
  }

  const get = function (key) {
    var v = req.body ? req.body[key] : "";
    return typeof v === "string" ? v.trim() : "";
  };

  const name = get("name");
  const phone = get("phone");
  const email = get("email");
  const service = get("service");
  const preferred = get("preferred_date_time");
  const message = get("message");

  if (!name || !phone || !email || !service) {
    res.status(400).json({
      success: false,
      message: "Please fill in your name, phone, email, and the service needed."
    });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ success: false, message: "That email address does not look valid." });
    return;
  }

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const leadEmail = process.env.LEAD_EMAIL;

  if (!smtpUser || !smtpPass || !leadEmail) {
    console.error("Lead mail failed: SMTP env not configured");
    res.status(500).json({
      success: false,
      message: "Message could not be sent right now. Please call (646) 973-6472."
    });
    return;
  }

  const serviceLabel = SERVICE_LABELS[service] || service;

  const body = [
    "New lead via notaryman website",
    "--------------------------------",
    "",
    "Name:            " + name,
    "Phone:           " + phone,
    "Email:           " + email,
    "Service needed:  " + serviceLabel,
    "Preferred date:  " + (preferred || "Not specified"),
    "",
    "Message:",
    message || "(none)",
    ""
  ].join("\n");

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: smtpUser, pass: smtpPass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });

  try {
    await transporter.sendMail({
      from: '"Notaryman" <' + smtpUser + ">",
      to: leadEmail,
      replyTo: name + " <" + email + ">",
      subject: "New Lead from Website",
      text: body
    });
    res.status(200).json({
      success: true,
      message: "Request received - the notary will call you back shortly to confirm."
    });
  } catch (err) {
    console.error("Lead mail failed:", err.message);
    res.status(500).json({
      success: false,
      message: "Message could not be sent right now. Please call (646) 973-6472."
    });
  }
};