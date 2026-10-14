const mongoose = require("mongoose");
const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    amount: { type: Number, required: true, min: 0.01 },
    paymentDate: { type: Date, required: true },
    paymentMode: { type: String, trim: true, default: "" },
    transactionId: { type: String, trim: true, default: "" },
    receiptNumber: { type: String, trim: true, default: "" },
    remarks: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

const feeRecordSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "student",
      required: true,
    },
    academicYear: { type: String, required: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    year: { type: String, required: true },
    totalFee: { type: Number, required: true, min: 0 },
    components: { type: [{ category: { type: String, required: true }, amount: { type: Number, required: true, min: 0 } }], default: [] },
    dueDate: { type: Date },
    remarks: { type: String, trim: true, default: "", maxlength: 1000 },
    payments: { type: [paymentSchema], default: [] },
  },
  { timestamps: true, optimisticConcurrency: true }
);

feeRecordSchema.index(
  { student: 1, academicYear: 1, semester: 1 },
  { unique: true }
);
feeRecordSchema.index({ "payments.transactionId": 1 }, { unique: true, partialFilterExpression: { "payments.transactionId": { $type: "string", $gt: "" } } });
feeRecordSchema.index({ "payments.receiptNumber": 1 }, { unique: true, partialFilterExpression: { "payments.receiptNumber": { $type: "string", $gt: "" } } });

module.exports =
  mongoose.models.feeRecord || mongoose.model("feeRecord", feeRecordSchema);
