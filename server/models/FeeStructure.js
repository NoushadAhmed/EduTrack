const mongoose = require("mongoose");
const { Schema } = mongoose;

const componentSchema = new Schema({
  category: { type: String, required: true, trim: true, maxlength: 100 },
  amount: { type: Number, required: true, min: 0 },
}, { _id: true });

const feeStructureSchema = new Schema({
  academicYear: { type: String, required: true },
  department: { type: String, required: true },
  semester: { type: Number, required: true, min: 1, max: 8 },
  components: { type: [componentSchema], default: [] },
  totalFee: { type: Number, required: true, min: 0 },
}, { timestamps: true });

feeStructureSchema.index({ academicYear: 1, department: 1, semester: 1 }, { unique: true });
module.exports = mongoose.models.feeStructure || mongoose.model("feeStructure", feeStructureSchema);
