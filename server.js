require("dotenv").config();
const express = require("express");
const connectDB = require("./src/config/db.js");
const authRoutes = require("./src/routes/auth.js");
const capsuleRoutes = require("./src/routes/capsule.js");
const runExpirationJob = require("./src/utils/expireCapsules.js");

const app = express();


app.use(express.json());

app.post("/test", (req, res) => {
  console.log("Received test:", req.body);
  res.json({ body: req.body });
});

connectDB();
app.use("/auth", authRoutes);
app.use("/capsules", capsuleRoutes);
runExpirationJob();

const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
