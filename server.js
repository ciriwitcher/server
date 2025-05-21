const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb+srv://Zirox:Elemenobi1234@keyauth.cru6v0x.mongodb.net/keyauth?retryWrites=true&w=majority&appName=keyauth", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ Connected to MongoDB Atlas");
}).catch(err => {
  console.error("❌ Error connecting to MongoDB:", err);
});

const KeySchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  active: { type: Boolean, default: true },
  activationDate: { type: Date, default: Date.now }, // domyślna data to teraz
  validityDays: { type: Number, default: 30 },
});

const Key = mongoose.model("Key", KeySchema);

const ADMIN_TOKEN = "tajny_token_admin";

function adminAuth(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (token !== ADMIN_TOKEN) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  next();
}

app.post("/add-key", adminAuth, async (req, res) => {
  const { key, validityDays } = req.body;
  if (!key) return res.status(400).json({ success: false, message: "No key provided" });

  try {
    const existing = await Key.findOne({ key });
    if (existing) return res.status(409).json({ success: false, message: "Key already exists" });

    const newKey = new Key({
      key,
      active: true,
      validityDays: validityDays || 30,
      // activationDate: nie trzeba ustawiać, bo default jest
    });
    await newKey.save();
    res.json({ success: true, message: "Key added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

app.post("/verify", async (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ success: false, message: "No key provided" });

  try {
    const found = await Key.findOne({ key, active: true });
    if (!found) {
      return res.status(401).json({ success: false, message: "❌ Invalid or inactive key" });
    }

    const now = new Date();
    const activationDate = new Date(found.activationDate);
    const diffDays = Math.floor((now - activationDate) / (1000 * 60 * 60 * 24));
    if (diffDays >= found.validityDays) {
      return res.status(401).json({ success: false, message: "❌ Key expired" });
    }

    const daysLeft = found.validityDays - diffDays;
    const expiryDate = new Date(activationDate);
    expiryDate.setDate(expiryDate.getDate() + found.validityDays);

    res.json({
      success: true,
      message: "✅ Key is valid",
      daysLeft,
      expiryDate: expiryDate.toISOString().split('T')[0], // yyyy-mm-dd format
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));
