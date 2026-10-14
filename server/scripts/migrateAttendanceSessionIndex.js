require("dotenv").config({ path: require("path").resolve(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const AttendanceSession = require("../models/AttendanceSession");

const OLD_KEY = { subject: 1, department: 1, year: 1, section: 1, sessionDate: 1 };
const NEW_KEY = { faculty: 1, subject: 1, department: 1, semester: 1, year: 1, section: 1, sessionDate: 1 };

const sameKey = (left, right) => JSON.stringify(left) === JSON.stringify(right);

async function migrateAttendanceSessionIndex() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing from server/.env");
  await mongoose.connect(process.env.MONGO_URI);
  const collection = AttendanceSession.collection;
  const indexes = await collection.indexes();
  const newIndex = indexes.find((index) => sameKey(index.key, NEW_KEY));
  if (newIndex?.unique && newIndex.partialFilterExpression?.completed === true) {
    console.log(`Attendance session index is already current: ${newIndex.name}`);
    return;
  }

  const duplicateGroups = await collection.aggregate([
    { $match: { completed: true } },
    { $group: { _id: { faculty: "$faculty", subject: "$subject", department: "$department", semester: "$semester", year: "$year", section: "$section", sessionDate: "$sessionDate" }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $limit: 5 },
  ]).toArray();
  if (duplicateGroups.length) {
    throw new Error("Found duplicate completed attendance sessions. No indexes were changed; review those records before migrating.");
  }

  const legacyUnique = indexes.find((index) => sameKey(index.key, OLD_KEY) && index.unique);
  if (legacyUnique) {
    await collection.dropIndex(legacyUnique.name);
    console.log(`Removed obsolete duplicate key index ${legacyUnique.name}; attendance records were preserved.`);
  }
  // A prior schema version may have created the replacement key with a
  // non-partial unique definition. Replace that index only after the completed
  // record collision check above; documents are never updated or deleted.
  if (newIndex) {
    await collection.dropIndex(newIndex.name);
    console.log(`Removed obsolete attendance index ${newIndex.name}.`);
  }
  await collection.createIndex(NEW_KEY, {
    name: "faculty_subject_class_date_completed_unique",
    unique: true,
    partialFilterExpression: { completed: true },
  });
  console.log("Created the completed faculty/class/subject/date attendance index.");
}

migrateAttendanceSessionIndex()
  .catch((error) => {
    console.error("Attendance session index migration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => mongoose.connection.readyState && mongoose.disconnect());
