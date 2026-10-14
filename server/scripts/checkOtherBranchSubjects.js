require("dotenv").config({
  path: require("path").resolve(__dirname, "..", ".env"),
});

const mongoose = require("mongoose");
const Subject = require("../models/Subject");

const branches = ["ECE", "EEE", "ME", "CIVIL", "AIML"];

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("\nVTU 2022 OTHER BRANCH DATABASE CHECK");
    console.log("====================================\n");

    for (const branch of branches) {
      const records = await Subject.find({
        department: branch,
        scheme: "2022",
      })
        .select("department semester subjectCode subjectName")
        .sort({ semester: 1, subjectCode: 1 })
        .lean();

      console.log(`\n${branch}: ${records.length} records`);

      const counts = {};

      for (const record of records) {
        counts[record.semester] =
          (counts[record.semester] || 0) + 1;
      }

      console.log("Semester counts:", counts);
    }

    console.log("\n====================================");
    console.log("READ-ONLY CHECK COMPLETE");
    console.log("No database changes were made.");
  } catch (error) {
    console.error("\nCHECK FAILED:");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

check();