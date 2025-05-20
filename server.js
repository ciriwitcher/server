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
  key: String,
  active: Boolean
});

const Key = mongoose.model("Key", KeySchema);

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));
