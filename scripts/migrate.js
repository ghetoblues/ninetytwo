require("dotenv").config();
const { initDb } = require("../db");

initDb()
  .then(() => {
    console.log("Database migration complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Database migration failed:", err);
    process.exit(1);
  });
