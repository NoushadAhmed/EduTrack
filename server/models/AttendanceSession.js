const mongoose = require("mongoose");
const { Schema } = mongoose;

// Idempotency record for one class session. Attendance totals remain in Attendance.
const attendanceSessionSchema = new Schema({
  subject: { type: Schema.Types.ObjectId, ref: "subject", required: true },
  faculty: { type: Schema.Types.ObjectId, ref: "faculty", required: true },
  subjectCode: { type: String, required: true },
  subjectName: { type: String, required: true },
  department: { type: String, required: true },
  semester: { type: Number, min: 1, max: 8, required: true },
  year: { type: Number, required: true },
  section: { type: String, required: true },
  // Only completed sessions participate in duplicate protection. Older
  // incomplete documents remain readable but cannot block a valid submission.
  completed: { type: Boolean, default: false },
  sessionDate: { type: String, required: true },
  attendanceRecords: [{
    student: { type: Schema.Types.ObjectId, ref: "student", required: true },
    status: { type: String, enum: ["Present", "Absent"], required: true },
  }],
}, { timestamps: true });

attendanceSessionSchema.index(
  { faculty: 1, subject: 1, department: 1, semester: 1, year: 1, section: 1, sessionDate: 1 },
  { unique: true, partialFilterExpression: { completed: true } }
);

module.exports = mongoose.models.attendancesession ||
  mongoose.model("attendancesession", attendanceSessionSchema);
