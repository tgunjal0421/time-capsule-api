const Capsule = require("../models/Capsule");
const crypto = require("crypto");

exports.createCapsule = async (req, res) => {
  try {
    const { message, unlock_at } = req.body;
    const userId = req.user.id; // from JWT middleware

    const unlock_code = crypto.randomBytes(4).toString("hex");

    const capsule = await Capsule.create({
      user: userId,
      message,
      unlock_at,
      unlock_code
    });

    res.status(201).json({
      id: capsule._id,
      unlock_code
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Capsule creation failed" });
  }
};

exports.getCapsule = async (req, res) => {
  const { id } = req.params;
  const { code } = req.query;

  try {
    const capsule = await Capsule.findById(id);

    if (!capsule) return res.status(404).json({ message: "Capsule not found" });

    // Check if the user is the owner
    if (capsule.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Validate unlock code
    if (!code || code !== capsule.unlock_code) {
      return res.status(401).json({ message: "Invalid unlock code" });
    }

  const now = new Date();
  const unlockAt = new Date(capsule.unlock_at);
  
    // Check if already marked expired by background job
    if (capsule.is_expired) {
      return res.status(410).json({ message: "Capsule expired" });
    }

    // Check if it's still locked (too early to open)
    if (now < unlockAt) {
      return res.status(403).json({ message: "Capsule is still locked" });
    }

    // Success
    return res.json({
      id: capsule._id,
      message: capsule.message,
      unlock_at: capsule.unlock_at
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.listCapsules = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const now = new Date();

    const capsules = await Capsule.find({ user: userId })
      .sort({ unlock_at: 1 })
      .skip(skip)
      .limit(limit);

    const results = capsules.map(capsule => {
      const isLocked = now < new Date(capsule.unlock_at);

      return {
        id: capsule._id,
        unlock_at: capsule.unlock_at,
        created_at: capsule.created_at,
        expired: capsule.is_expired,
        ...(isLocked ? {} : { message: capsule.message }) // Only show if unlocked
      };
    });

    res.json({ page, limit, capsules: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to list capsules" });
  }
};

exports.updateCapsule = async (req, res) => {
  const { id } = req.params;
  const { code } = req.query;
  const { message, unlock_at } = req.body;

  try {
    const capsule = await Capsule.findById(id);

    if (!capsule) return res.status(404).json({ message: "Capsule not found" });

    if (capsule.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!code || code !== capsule.unlock_code) {
      return res.status(401).json({ message: "Invalid unlock code" });
    }

    const now = new Date();
    if (now >= new Date(capsule.unlock_at)) {
      return res.status(403).json({ message: "Capsule already unlocked. Cannot update." });
    }

    capsule.message = message || capsule.message;
    capsule.unlock_at = unlock_at || capsule.unlock_at;

    await capsule.save();

    res.json({ message: "Capsule updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
};

exports.deleteCapsule = async (req, res) => {
  const { id } = req.params;
  const { code } = req.query;

  try {
    const capsule = await Capsule.findById(id);

    if (!capsule) return res.status(404).json({ message: "Capsule not found" });

    if (capsule.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!code || code !== capsule.unlock_code) {
      return res.status(401).json({ message: "Invalid unlock code" });
    }

    const now = new Date();
    if (now >= new Date(capsule.unlock_at)) {
      return res.status(403).json({ message: "Capsule already unlocked. Cannot delete." });
    }

    await Capsule.findByIdAndDelete(id);

    res.json({ message: "Capsule deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
};
