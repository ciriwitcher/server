const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect("mongodb+srv://Zirox:Elemenobi1234@keyauth.cru6v0x.mongodb.net/keyauth?retryWrites=true&w=majority&appName=keyauth", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ Connected to MongoDB Atlas");
}).catch(err => {
  console.error("❌ Error connecting to MongoDB:", err);
});

// Define key schema
const KeySchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  active: { type: Boolean, default: true }
});

const Key = mongoose.model("Key", KeySchema);

// Middleware prostego zabezpieczenia do endpointu admina
const ADMIN_TOKEN = "tajny_token_admin"; // zmień na swoje hasło / token

function adminAuth(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (token !== ADMIN_TOKEN) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  next();
}

// Endpoint for adding new key (protected)
app.post("/add-key", adminAuth, async (req, res) => {
  const { key } = req.body;

  if (!key) return res.status(400).json({ success: false, message: "No key provided" });

  try {
    const existing = await Key.findOne({ key });
    if (existing) return res.status(409).json({ success: false, message: "Key already exists" });

    const newKey = new Key({ key, active: true });
    await newKey.save();
    res.json({ success: true, message: "Key added successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// Endpoint for key verification
app.post("/verify", async (req, res) => {
  const { key } = req.body;

  if (!key) return res.status(400).json({ success: false, message: "No key provided" });

  try {
    const found = await Key.findOne({ key, active: true });

    if (found) {
      res.json({ success: true, message: "✅ Key is valid" });
    } else {
      res.status(401).json({ success: false, message: "❌ Invalid or inactive key" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));
