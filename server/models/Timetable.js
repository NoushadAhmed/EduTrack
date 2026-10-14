const mongoose = require("mongoose");
const { Schema } = mongoose;

const periodSlotSchema = new Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  kind: { type: String, enum: ["CLASS", "BREAK", "LUNCH"], default: "CLASS" },
}, { _id: false });

const timetableEntrySchema = new Schema({
  day: { type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Saturday (2nd)", "Saturday (4th)"], required: true },
  periodKey: { type: String, required: true },
  spanPeriods: { type: Number, min: 1, max: 6, default: 1 },
  subject: { type: Schema.Types.ObjectId, ref: "subject" },
  faculty: { type: Schema.Types.ObjectId, ref: "faculty" },
  facultyAssignmentId: { type: String, default: "" },
  type: { type: String, enum: ["THEORY", "LAB", "ELECTIVE", "OEC", "PEC", "PROJECT", "ACTIVITY"], default: "THEORY" },
  activity: { type: String, trim: true, default: "" },
  room: { type: String, trim: true, default: "" },
  batch: { type: String, trim: true, default: "" },
  rollStart: { type: String, trim: true, default: "" },
  rollEnd: { type: String, trim: true, default: "" },
  credits: { type: Number, min: 0, max: 20, default: null },
  lectureHours: { type: Number, min: 0, max: 20, default: 0 },
  tutorialHours: { type: Number, min: 0, max: 20, default: 0 },
  practicalHours: { type: Number, min: 0, max: 20, default: 0 },
  notes: { type: String, trim: true, default: "" },
}, { _id: true });

const signatorySchema = new Schema({
  role: { type: String, enum: ["Time Table Coordinator", "HOD", "Dean Academics", "IQAC Coordinator", "Principal"], required: true },
  name: { type: String, trim: true, default: "" },
  signatureData: { type: String, default: "" },
}, { _id: false });

const timetableSchema = new Schema(
  {
    // CLASS_SCHEDULE documents represent one published/draft timetable version.
    // The original flat fields below remain for backward compatibility.
    recordType: { type: String, enum: ["CLASS_SCHEDULE"], default: undefined },
    title: { type: String, trim: true, default: "" },
    collegeName: { type: String, trim: true, default: "" },
    collegeAddress: { type: String, trim: true, default: "" },
    regionalHeader: { type: String, trim: true, default: "" },
    collegeLogoData: { type: String, default: "" },
    accreditationLogoData: { type: String, default: "" },
    department: { type: String, required: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    year: { type: String, required: true },
    section: { type: String, required: true },
    academicYear: { type: String, required: true },
    classTeacher: { type: Schema.Types.ObjectId, ref: "faculty", default: null },
    classRoom: { type: String, trim: true, default: "" },
    effectiveFrom: { type: Date, default: null },
    version: { type: Number, min: 1, default: 1 },
    periodSlots: { type: [periodSlotSchema], default: undefined },
    entries: { type: [timetableEntrySchema], default: undefined },
    notes: { type: String, trim: true, default: "" },
    signatories: { type: [signatorySchema], default: undefined },
    status: { type: String, enum: ["DRAFT", "PUBLISHED", "SUPERSEDED"], default: undefined },
    isPublished: { type: Boolean, default: undefined },
    publishedAt: { type: Date, default: null },
    publishedBy: { type: Schema.Types.ObjectId, ref: "admin", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "admin", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "admin", default: null },

    // Legacy one-document-per-period fields.
    day: { type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] },
    startTime: { type: String },
    endTime: { type: String },
    subject: { type: Schema.Types.ObjectId, ref: "subject" },
    faculty: { type: Schema.Types.ObjectId, ref: "faculty" },
    room: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

timetableSchema.index({ department: 1, year: 1, semester: 1, section: 1, academicYear: 1, version: 1 });
timetableSchema.index({ "entries.faculty": 1, academicYear: 1, isPublished: 1 });
timetableSchema.index({ faculty: 1, day: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.models.timetable || mongoose.model("timetable", timetableSchema);
