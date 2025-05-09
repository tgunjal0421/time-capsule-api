const mongoose = require("mongoose");

const capsuleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },
  unlock_at: { type: Date, required: true },
  unlock_code: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  is_expired: { type: Boolean, default: false }
});

module.exports = mongoose.model("Capsule", capsuleSchema);
