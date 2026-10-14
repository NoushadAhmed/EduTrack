const mongoose = require("mongoose");
const { Schema } = mongoose;

const subjectSchema = new Schema({
  department: {
    type: String,
    required: true,
  },
  subjectCode: {
    type: String,
    required: true,
  },
  subjectName: {
    type: String,
    required: true,
    trim: true,
  },
  totalLectures: {
    type: Number,
    default: 30,
  },
  year: {
    type: String,
    required: true,
  },
  scheme: {
    type: String,
    trim: true,
  },
  semester: {
    type: Number,
    min: 1,
    max: 8,
  },
  academicYear: {
    type: String,
    trim: true,
  },
  subjectType: {
    type: String,
    trim: true,
  },
  electiveGroup: {
    type: String,
    trim: true,
  },
  attendance: {
    type: Schema.Types.ObjectId,
    ref: "attendance",
  },
});

module.exports =
  mongoose.models.subject || mongoose.model("subject", subjectSchema);
