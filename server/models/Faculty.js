const mongoose = require("mongoose");
const { Schema } = mongoose;

const facultySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  password: {
    type: String,
  },
  registrationNumber: {
    type: String,
  },
  designation: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    required: true,
  },
  facultyMobileNumber: {
    type: Number,
  },
  joiningYear: {
    type: Number,
    required: true,
  },
  subjectsCanTeach: [
    {
      type: String,
    },
  ],
  assignedSubjects: [
    {
      faculty: {
        type: Schema.Types.ObjectId,
        ref: "faculty",
      },
      subject: {
        type: Schema.Types.ObjectId,
        ref: "subject",
        required: true,
      },
      subjectCode: { type: String, required: true },
      subjectName: { type: String, required: true },
      subjectType: { type: String, default: "" },
      department: { type: String },
      semester: { type: Number, min: 1, max: 8, required: true },
      year: { type: Number, min: 1, max: 4 },
      section: { type: String },
      academicYear: { type: String, required: true },
    },
  ],
  otp: {
    type: String,
  },
  otpExpiresAt: {
    type: Date,
  },
});

module.exports =
  mongoose.models.faculty || mongoose.model("faculty", facultySchema);
