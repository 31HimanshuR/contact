require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ MongoDB connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("Mongo Error:", err));

// ✅ Schema
const ContactSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  message: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Contact = mongoose.model("Contact", ContactSchema);

// ✅ Rate limit (anti-spam)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, error: "Too many requests. Try later." }
});
app.use("/contact", limiter);

// ✅ Resend setup
const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ Root route
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// 🔥 CONTACT ROUTE (FINAL SECURE)
app.post("/contact", async (req, res) => {
  try {
    const { name, email, phone, message, formTime, honeypot } = req.body;

    // 🛑 Honeypot (bot trap)
    if (honeypot) {
      return res.json({ success: false });
    }

    // 🛑 Fast submit check (<3 sec)
    if (!formTime || Date.now() - formTime < 3000) {
      return res.json({ success: false, error: "Slow down" });
    }

    // 🔒 Validation
    if (!name || !email || !message) {
      return res.json({ success: false, error: "Missing fields" });
    }

    if (!email.includes("@")) {
      return res.json({ success: false, error: "Invalid email" });
    }

    // ✅ Save in DB
    await Contact.create({ name, email, phone, message });

    // ✅ Send email
    await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>",
      to: process.env.EMAIL,
      subject: "New Contact Message",
      html: `
        <h3>New Message</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone || "N/A"}</p>
        <p><b>Message:</b> ${message}</p>
      `
    });

    res.json({ success: true });

  } catch (err) {
    console.error("ERROR:", err);
    res.json({ success: false, error: "Server error" });
  }
});

// 📊 ADMIN API (optional)
app.get("/messages", async (req, res) => {
  try {
    const data = await Contact.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.json([]);
  }
});

// 🚀 Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});