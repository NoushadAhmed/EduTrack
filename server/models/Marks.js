const mongoose = require("mongoose");
const { Schema } = mongoose;

const markSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: "student",
  },
  subject: {
    type: Schema.Types.ObjectId,
    ref: "subject",
  },
  faculty: {
    type: Schema.Types.ObjectId,
    ref: "faculty",
  },
  assessmentType: {
    type: String,
    enum: ["CIE1", "CIE2", "CIE3", "SEE"],
  },
  academicYear: {
    type: String,
  },
  year: {
    type: Number,
    min: 1,
    max: 4,
  },
  status: {
    type: String,
    enum: ["DRAFT", "SUBMITTED", "PUBLISHED"],
  },
  resultStatus: {
    type: String,
    enum: ["AB", "DX", "IC"],
  },
  draftedAt: Date,
  submittedAt: Date,
  publishedAt: Date,
  reopenedAt: Date,
  exam: {
    type: String,
    required: true,
  },
  department: {
    type: String,
  },
  semester: {
    type: Number,
  },
  section: {
    type: String,
  },
  marks: {
    type: Number,
    default: 0,
  },
  totalMarks: {
    type: Number,
    default: 100,
  },
}, { timestamps: true });

markSchema.index(
  { student: 1, subject: 1, assessmentType: 1, academicYear: 1 },
  {
    unique: true,
    partialFilterExpression: {
      assessmentType: { $type: "string" },
      academicYear: { $type: "string" },
    },
  }
);

module.exports = mongoose.models.mark || mongoose.model("mark", markSchema);
