const cron = require("node-cron");
const Capsule = require("../models/Capsule");

const runExpirationJob = () => {
  // Run every hour (adjust as needed)
  cron.schedule("0 * * * *", async () => {
    console.log("Running capsule expiration job...");

    const now = new Date();
    const expirationThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    try {
      const result = await Capsule.updateMany(
        {
          unlock_at: { $lt: expirationThreshold },
          is_expired: false
        },
        { is_expired: true }
      );

      console.log(`Expired ${result.modifiedCount} capsules.`);
    } catch (error) {
      console.error("Expiration job failed:", error);
    }
  });
};

module.exports = runExpirationJob;
