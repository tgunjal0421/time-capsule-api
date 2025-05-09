const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware.js");
const { createCapsule, getCapsule, listCapsules, updateCapsule, deleteCapsule } = require("../controllers/capsuleController.js");

router.post("/", auth, createCapsule);
router.get("/:id", auth, getCapsule);
router.get("/", auth, listCapsules);
router.put("/:id", auth, updateCapsule);
router.delete("/:id", auth, deleteCapsule);

module.exports = router;
