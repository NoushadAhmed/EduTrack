const FeeRecord = require("../models/FeeRecord");
const FeeStructure = require("../models/FeeStructure");
const Student = require("../models/Student");
const { DEPARTMENTS, SECTIONS } = require("../config/adminOptions");

const semesterToYear = (semester) => String(Math.ceil(Number(semester) / 2));

const paidAmount = (record) =>
  (Array.isArray(record.payments) ? record.payments : []).reduce(
    (total, payment) => total + (Number(payment.amount) || 0),
    0
  );

const feeStatus = (record) => {
  const paid = paidAmount(record);
  if (paid >= Number(record.totalFee)) return "Paid";
  if (paid > 0) return "Partially Paid";
  return "Pending";
};

const toFeeResponse = (record) => {
  const amountPaid = paidAmount(record);
  return {
    ...record,
    amountPaid,
    balance: Math.max(0, Number(record.totalFee) - amountPaid),
    paymentStatus: feeStatus(record),
  };
};

const populateFeeRecords = (query) =>
  query
    .populate("student", "name registrationNumber department year section email")
    .lean();

const validSemester = (value) => {
  const semester = Number(value);
  return Number.isInteger(semester) && semester >= 1 && semester <= 8;
};

const validAcademicYear = (value) => /^\d{4}-\d{2}$/.test(value || "");

const normalizeComponents = (components) => {
  if (!Array.isArray(components) || !components.length) throw Object.assign(new Error("Add at least one fee component"), { status: 400 });
  const normalized = components.map(({ category, amount }) => {
    const cleanCategory = typeof category === "string" ? category.trim() : "";
    const value = Number(amount);
    if (!cleanCategory || cleanCategory.length > 100 || !Number.isFinite(value) || value < 0 || Math.abs(value * 100 - Math.round(value * 100)) > 1e-8) {
      throw Object.assign(new Error("Each component needs a category and a valid non-negative amount"), { status: 400 });
    }
    return { category: cleanCategory, amount: value };
  });
  if (new Set(normalized.map((item) => item.category.toLowerCase())).size !== normalized.length) {
    throw Object.assign(new Error("Fee component categories must be unique"), { status: 400 });
  }
  const totalFee = normalized.reduce((sum, item) => sum + item.amount, 0);
  if (!(totalFee > 0)) throw Object.assign(new Error("Fee structure total must be greater than zero"), { status: 400 });
  return { components: normalized, totalFee };
};

exports.getFeeStructures = async (req, res) => {
  try {
    const query = {};
    if (req.query.academicYear) query.academicYear = req.query.academicYear;
    if (req.query.department) query.department = req.query.department;
    if (req.query.semester) query.semester = Number(req.query.semester);
    const result = await FeeStructure.find(query).sort({ academicYear: -1, department: 1, semester: 1 }).lean();
    return res.json({ result });
  } catch (err) { return res.status(500).json({ message: "Unable to load fee structures" }); }
};

exports.saveFeeStructure = async (req, res) => {
  try {
    const { academicYear, department, semester } = req.body;
    if (!validAcademicYear(academicYear) || !DEPARTMENTS.includes(department) || !validSemester(semester)) {
      return res.status(400).json({ message: "Choose a valid academic year, department, and semester" });
    }
    const { components, totalFee } = normalizeComponents(req.body.components);
    const key = { academicYear, department, semester: Number(semester) };
    let structure;
    if (req.params.structureId) {
      structure = await FeeStructure.findById(req.params.structureId);
      if (!structure) return res.status(404).json({ message: "Fee structure not found" });
      const duplicate = await FeeStructure.findOne({ ...key, _id: { $ne: structure._id } });
      if (duplicate) return res.status(409).json({ message: "A fee structure already exists for this year, department, and semester" });
      Object.assign(structure, key, { components, totalFee });
      await structure.save();
    } else {
      try { structure = await FeeStructure.create({ ...key, components, totalFee }); }
      catch (err) { if (err.code === 11000) return res.status(409).json({ message: "A fee structure already exists for this year, department, and semester" }); throw err; }
    }
    return res.status(req.params.structureId ? 200 : 201).json({ result: structure });
  } catch (err) { return res.status(err.status || 500).json({ message: err.status ? err.message : "Unable to save fee structure" }); }
};

exports.deleteFeeStructure = async (req, res) => {
  try {
    const structure = await FeeStructure.findById(req.params.structureId);
    if (!structure) return res.status(404).json({ message: "Fee structure not found" });
    const assessed = await FeeRecord.exists({ academicYear: structure.academicYear, semester: structure.semester, "student": { $in: await Student.find({ department: structure.department }).distinct("_id") } });
    if (assessed) return res.status(409).json({ message: "This structure has assessments and cannot be removed" });
    await structure.deleteOne();
    return res.json({ success: true });
  } catch (err) { return res.status(500).json({ message: "Unable to remove fee structure" }); }
};

exports.generateAssessments = async (req, res) => {
  try {
    const { academicYear, department, semester } = req.body;
    if (!validAcademicYear(academicYear) || !DEPARTMENTS.includes(department) || !validSemester(semester)) return res.status(400).json({ message: "Choose a valid academic year, department, and semester" });
    const structure = await FeeStructure.findOne({ academicYear, department, semester: Number(semester) }).lean();
    if (!structure) return res.status(404).json({ message: "No fee structure exists for this selection. Configure one first." });
    const eligible = await Student.find({ department, year: Number(semesterToYear(semester)) }).select("_id").lean();
    const existing = await FeeRecord.find({ student: { $in: eligible.map((item) => item._id) }, academicYear, semester: Number(semester) }).select("student").lean();
    const seen = new Set(existing.map((record) => String(record.student)));
    const missing = eligible.filter((item) => !seen.has(String(item._id)));
    if (missing.length) {
      try { await FeeRecord.insertMany(missing.map(({ _id }) => ({ student: _id, academicYear, semester: Number(semester), year: semesterToYear(semester), totalFee: structure.totalFee, components: structure.components.map(({ category, amount }) => ({ category, amount })) })), { ordered: false }); }
      catch (err) { if (err.code !== 11000 && !err.writeErrors) throw err; }
    }
    const message = missing.length ? `Created ${missing.length} fee assessment${missing.length === 1 ? "" : "s"}.` : eligible.length ? "All eligible students already have an assessment." : "No eligible students were found for this department and semester.";
    return res.status(201).json({ created: missing.length, alreadyAssessed: existing.length, eligible: eligible.length, message });
  } catch (err) { return res.status(500).json({ message: "Unable to generate assessments" }); }
};

exports.getOwnFeeRecords = async (req, res) => {
  try {
    const student = await Student.findById(req.user?._id || req.user?.id)
      .select("_id name registrationNumber department year section")
      .lean();
    if (!student) return res.status(403).json({ message: "Student access required" });

    const records = await populateFeeRecords(FeeRecord.find({ student: student._id }).sort({ academicYear: -1, semester: 1, updatedAt: -1 }));
    // The FeeRecord index is unique by student/academic-year/semester. Keep a
    // defensive key here so old duplicate documents cannot inflate course totals.
    const uniqueRecords = new Map();
    records.forEach((record) => {
      const key = `${record.academicYear}|${record.semester}`;
      const prior = uniqueRecords.get(key);
      if (!prior || new Date(record.updatedAt || 0) > new Date(prior.updatedAt || 0)) uniqueRecords.set(key, record);
    });
    const result = [...uniqueRecords.values()].map(toFeeResponse)
      .sort((left, right) => left.academicYear.localeCompare(right.academicYear) || left.semester - right.semester);

    const now = new Date();
    const month = now.getUTCMonth() + 1;
    const academicStartYear = month >= 8 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
    const currentAcademicYear = `${academicStartYear}-${String((academicStartYear + 1) % 100).padStart(2, "0")}`;
    const currentSemester = (Number(student.year) - 1) * 2 + (month >= 8 || month === 1 ? 1 : 2);
    const sumFees = (items) => items.reduce((total, record) => total + (Number(record.totalFee) || 0), 0);
    const sumPaid = (items) => items.reduce((total, record) => total + (Number(record.amountPaid) || 0), 0);
    const currentYearRecords = result.filter((record) => record.academicYear === currentAcademicYear);
    const assessedYears = new Map();
    result.forEach((record) => {
      const year = Number(record.year) || Math.ceil(Number(record.semester) / 2);
      if (!assessedYears.has(year)) assessedYears.set(year, []);
      assessedYears.get(year).push(record);
    });

    const yearBreakdown = [1, 2, 3, 4].map((year) => {
      const yearRecords = assessedYears.get(year) || [];
      const totalFee = sumFees(yearRecords);
      const amountPaid = sumPaid(yearRecords);
      return {
        year,
        academicYears: [...new Set(yearRecords.map((record) => record.academicYear))].sort(),
        totalFee: yearRecords.length ? totalFee : null,
        amountPaid: yearRecords.length ? amountPaid : null,
        outstandingAmount: yearRecords.length ? Math.max(0, totalFee - amountPaid) : null,
        paymentStatus: yearRecords.length ? (amountPaid >= totalFee ? "Paid" : amountPaid > 0 ? "Partially Paid" : "Pending") : "Not assessed",
        assessed: yearRecords.length > 0,
        lastUpdatedAt: yearRecords.reduce((latest, record) => !latest || new Date(record.updatedAt || 0) > new Date(latest) ? record.updatedAt : latest, null),
      };
    });

    const academicYearClassYears = new Map();
    result.forEach((record) => {
      if (!academicYearClassYears.has(record.academicYear)) academicYearClassYears.set(record.academicYear, new Set());
      academicYearClassYears.get(record.academicYear).add(Number(record.year) || Math.ceil(Number(record.semester) / 2));
    });
    if (!academicYearClassYears.has(currentAcademicYear)) academicYearClassYears.set(currentAcademicYear, new Set());
    academicYearClassYears.get(currentAcademicYear).add(Number(student.year));
    const relevantAcademicYears = [...academicYearClassYears.keys()];
    const structures = relevantAcademicYears.length
      ? await FeeStructure.find({ department: student.department, academicYear: { $in: relevantAcademicYears } }).sort({ academicYear: -1, semester: 1 }).lean()
      : [];
    const configuredYears = new Map();
    const configuredYearTotals = new Map();
    structures.forEach((structure) => {
      const year = Math.ceil(Number(structure.semester) / 2);
      if (!academicYearClassYears.get(structure.academicYear)?.has(year)) return;
      if (!configuredYears.has(year)) configuredYears.set(year, new Set());
      configuredYears.get(year).add(structure.academicYear);
      configuredYearTotals.set(year, (configuredYearTotals.get(year) || 0) + Number(structure.totalFee || 0));
    });
    yearBreakdown.forEach((item) => {
      if (item.assessed) return;
      const academicYears = [...(configuredYears.get(item.year) || [])].sort();
      item.academicYears = academicYears;
      item.paymentStatus = academicYears.length ? "Not assessed" : "Not configured";
      item.totalFee = configuredYearTotals.has(item.year) ? configuredYearTotals.get(item.year) : null;
    });
    const termRows = new Map();
    result.forEach((record) => termRows.set(`${record.academicYear}|${record.semester}`, {
      academicYear: record.academicYear,
      semester: record.semester,
      year: Number(record.year) || Math.ceil(Number(record.semester) / 2),
      assessed: true,
      totalFee: Number(record.totalFee),
      amountPaid: Number(record.amountPaid),
      outstandingAmount: Number(record.balance),
      paymentStatus: record.paymentStatus,
      components: record.components || [],
      updatedAt: record.updatedAt || null,
      feeRecordId: record._id,
    }));
    structures.forEach((structure) => {
      const year = Math.ceil(Number(structure.semester) / 2);
      if (!academicYearClassYears.get(structure.academicYear)?.has(year)) return;
      const key = `${structure.academicYear}|${structure.semester}`;
      if (termRows.has(key)) return;
      termRows.set(key, {
        academicYear: structure.academicYear,
        semester: structure.semester,
        year,
        assessed: false,
        totalFee: Number(structure.totalFee),
        amountPaid: 0,
        outstandingAmount: null,
        paymentStatus: "Not assessed",
        components: structure.components || [],
        updatedAt: null,
        feeRecordId: null,
      });
    });
    const semesterDetails = [...termRows.values()].sort((left, right) =>
      right.academicYear.localeCompare(left.academicYear) || left.semester - right.semester
    ).map((term) => ({
      ...term,
      tuitionFee: term.components.filter((item) => /tuition/i.test(item.category)).reduce((sum, item) => sum + Number(item.amount || 0), 0),
    }));
    const lastUpdatedAt = result.reduce((latest, record) => !latest || new Date(record.updatedAt || 0) > new Date(latest) ? record.updatedAt : latest, null);
    const summary = {
      totalFees: sumFees(result),
      feesPaid: sumPaid(result),
      pendingFees: result.reduce((sum, record) => sum + Number(record.balance || 0), 0),
      currentAcademicYearPendingFees: currentYearRecords.length
        ? currentYearRecords.reduce((sum, record) => sum + Number(record.balance || 0), 0)
        : null,
      assessedTerms: result.length,
      assessedYears: assessedYears.size,
    };

    return res.json({
      student: {
        id: student._id,
        name: student.name,
        registrationNumber: student.registrationNumber || "",
        department: student.department,
        year: Number(student.year),
        section: student.section,
      },
      currentAcademic: { academicYear: currentAcademicYear, semester: currentSemester, year: Number(student.year) },
      lastUpdatedAt,
      result,
      summary,
      yearBreakdown,
      semesterDetails,
    });
  } catch (err) {
    console.error("Student fee summary error:", err);
    return res.status(500).json({ message: "Unable to load fee records" });
  }
};

const buildSummary = (records) => {
  if (!records.length) return null;
  const students = new Set();
  let totalFees = 0;
  let feesCollected = 0;
  let pendingFees = 0;
  let partiallyPaid = 0;

  records.forEach((record) => {
    if (record.student?._id) students.add(String(record.student._id));
    const paid = paidAmount(record);
    const fee = Number(record.totalFee) || 0;
    totalFees += fee;
    feesCollected += paid;
    pendingFees += Math.max(0, fee - paid);
    if (paid > 0 && paid < fee) partiallyPaid += 1;
  });

  return {
    totalStudents: students.size,
    totalFees,
    feesCollected,
    pendingFees,
    partiallyPaid,
    collectionPercentage:
      totalFees > 0 ? Number(((feesCollected / totalFees) * 100).toFixed(2)) : null,
  };
};

exports.getFeeRecords = async (req, res) => {
  try {
    const {
      department,
      semester,
      section,
      academicYear,
      status,
      search,
    } = req.query;
    const studentQuery = {};
    const feeQuery = {};

    if (department) {
      if (!DEPARTMENTS.includes(department)) {
        return res.status(400).json({ message: "Invalid department" });
      }
      studentQuery.department = department;
    }
    if (section) {
      if (!SECTIONS.includes(section)) {
        return res.status(400).json({ message: "Invalid section" });
      }
      studentQuery.section = section;
    }
    if (semester) {
      if (!validSemester(semester)) {
        return res.status(400).json({ message: "Semester must be between 1 and 8" });
      }
      feeQuery.semester = Number(semester);
      feeQuery.year = semesterToYear(semester);
    }
    if (academicYear) {
      if (!validAcademicYear(academicYear)) {
        return res.status(400).json({ message: "Invalid academic year" });
      }
      feeQuery.academicYear = academicYear;
    }
    if (status && !["Paid", "Partially Paid", "Pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid fee status" });
    }

    const searchTerm = typeof search === "string" ? search.trim() : "";
    let scopedStudentIds;
    if (Object.keys(studentQuery).length) {
      const students = await Student.find(studentQuery).select("_id").lean();
      scopedStudentIds = students.map(({ _id }) => _id);
    }

    if (!searchTerm && scopedStudentIds) {
      feeQuery.student = { $in: scopedStudentIds };
    }

    if (searchTerm) {
      const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matchingStudentQuery = {
        ...studentQuery,
        $or: [
          { registrationNumber: { $regex: escaped, $options: "i" } },
          { name: { $regex: escaped, $options: "i" } },
          { email: { $regex: escaped, $options: "i" } },
        ],
      };
      const matchingStudents = await Student.find(matchingStudentQuery)
        .select("_id")
        .lean();
      const searchMatches = [
        ...(matchingStudents.length
          ? [{ student: { $in: matchingStudents.map(({ _id }) => _id) } }]
          : []),
        { "payments.receiptNumber": { $regex: escaped, $options: "i" } },
        { "payments.transactionId": { $regex: escaped, $options: "i" } },
      ];
      feeQuery.$and = [
        ...(scopedStudentIds ? [{ student: { $in: scopedStudentIds } }] : []),
        { $or: searchMatches },
      ];
    }

    let records = await populateFeeRecords(FeeRecord.find(feeQuery).sort({ academicYear: -1, semester: 1 }));

    const serialized = records.map(toFeeResponse);
    const filtered = status
      ? serialized.filter((record) => record.paymentStatus === status)
      : serialized;
    const paymentStatuses = [...new Set(serialized.map((record) => record.paymentStatus))];

    return res.status(200).json({
      result: filtered,
      summary: buildSummary(filtered),
      paymentStatuses,
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to load fee records" });
  }
};

exports.getStudentFeeRecords = async (req, res) => {
  try {
    const student = await Student.findOne({
      registrationNumber: req.params.registrationNumber,
    })
      .select("-password -otp")
      .lean();
    if (!student) return res.status(404).json({ message: "Student not found" });

    const records = await populateFeeRecords(
      FeeRecord.find({ student: student._id }).sort({ academicYear: -1, semester: 1 })
    );
    const result = records.map(toFeeResponse);
    return res.status(200).json({
      student,
      result,
      summary: buildSummary(result),
    });
  } catch (err) {
    return res.status(500).json({ message: "Unable to load fee records" });
  }
};

exports.getFeeStudents = async (req, res) => {
  try {
    const { department, search = "" } = req.query;
    if (!DEPARTMENTS.includes(department)) return res.status(400).json({ message: "Choose a valid department" });
    const query = { department };
    const term = String(search).trim();
    if (term) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { registrationNumber: { $regex: escaped, $options: "i" } },
      ];
    }
    const result = await Student.find(query).select("name registrationNumber department year section").sort({ name: 1 }).lean();
    return res.json({ result });
  } catch (err) { return res.status(500).json({ message: "Unable to load department students" }); }
};

exports.createFeeRecord = async (req, res) => {
  try {
    const { registrationNumber, academicYear, semester, dueDate, remarks } =
      req.body;

    if (!registrationNumber || !validAcademicYear(academicYear) || !validSemester(semester)) {
      return res.status(400).json({
        message: "Student, academic year, and semester are required",
      });
    }
    let parsedDueDate;
    if (dueDate) {
      parsedDueDate = new Date(dueDate);
      if (Number.isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({ message: "Enter a valid due date" });
      }
    }

    const student = await Student.findOne({ registrationNumber }).select("_id year department");
    if (!student) return res.status(404).json({ message: "Student not found" });
    if (Number(semesterToYear(semester)) > Number(student.year)) {
      return res.status(400).json({
        message: "Selected semester is beyond the student's current year",
      });
    }
    const structure = await FeeStructure.findOne({ academicYear, department: student.department, semester: Number(semester) }).lean();
    let components;
    let totalFee;
    if (req.body.components !== undefined) {
      ({ components, totalFee } = normalizeComponents(req.body.components));
    } else if (structure) {
      components = structure.components.map(({ category, amount: componentAmount }) => ({ category, amount: componentAmount }));
      totalFee = structure.totalFee;
    } else return res.status(400).json({ message: "Enter assessment components or configure a fee structure first" });
    if (typeof remarks === "string" && remarks.length > 1000) return res.status(400).json({ message: "Remarks must be under 1000 characters" });

    try {
      const record = await FeeRecord.create({
        student: student._id,
        academicYear,
        semester: Number(semester),
        year: semesterToYear(semester),
        totalFee,
        components,
        remarks: typeof remarks === "string" ? remarks.trim() : "",
        ...(parsedDueDate && { dueDate: parsedDueDate }),
      });
      const [populated] = await populateFeeRecords(
        FeeRecord.find({ _id: record._id })
      );
      return res.status(201).json({ result: toFeeResponse(populated) });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({
          message: "A fee record already exists for this student, semester, and academic year",
        });
      }
      throw err;
    }
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.status ? err.message : "Unable to create fee record" });
  }
};

exports.updateFeeAssessment = async (req, res) => {
  try {
    const record = await FeeRecord.findById(req.params.feeRecordId);
    if (!record) return res.status(404).json({ message: "Fee record not found" });
    const { components, totalFee } = normalizeComponents(req.body.components);
    if (totalFee < paidAmount(record)) return res.status(400).json({ message: "Assessment total cannot be less than payments already recorded" });
    if (req.body.dueDate) {
      const dueDate = new Date(req.body.dueDate);
      if (Number.isNaN(dueDate.getTime())) return res.status(400).json({ message: "Enter a valid due date" });
      record.dueDate = dueDate;
    } else if (req.body.dueDate === "") record.dueDate = undefined;
    if (req.body.remarks !== undefined) {
      if (typeof req.body.remarks !== "string" || req.body.remarks.length > 1000) return res.status(400).json({ message: "Remarks must be under 1000 characters" });
      record.remarks = req.body.remarks.trim();
    }
    record.components = components;
    record.totalFee = totalFee;
    await record.save();
    const [populated] = await populateFeeRecords(FeeRecord.find({ _id: record._id }));
    return res.json({ result: toFeeResponse(populated) });
  } catch (err) { return res.status(err.status || 500).json({ message: err.status ? err.message : "Unable to update fee assessment" }); }
};

exports.recordPayment = async (req, res) => {
  try {
    const { amount, paymentDate, paymentMode, transactionId, receiptNumber, remarks } =
      req.body;
    const paymentAmount = Number(amount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ message: "Payment amount must be greater than zero" });
    }
    if (Math.abs(paymentAmount * 100 - Math.round(paymentAmount * 100)) > 1e-8) return res.status(400).json({ message: "Payment amount can have at most two decimal places" });

    let parsedPaymentDate = new Date();
    if (paymentDate) {
      parsedPaymentDate = new Date(paymentDate);
      if (Number.isNaN(parsedPaymentDate.getTime())) {
        return res.status(400).json({ message: "Enter a valid payment date" });
      }
    }

    for (const [key, value] of Object.entries({
      paymentMode,
      transactionId,
      receiptNumber,
      remarks,
    })) {
      if (value !== undefined && (typeof value !== "string" || value.length > 300)) {
        return res.status(400).json({ message: `${key} must be text under 300 characters` });
      }
    }
    if (typeof paymentMode !== "string" || !paymentMode.trim()) return res.status(400).json({ message: "Payment method is required" });

    const feeRecord = await FeeRecord.findById(req.params.feeRecordId);
    if (!feeRecord) return res.status(404).json({ message: "Fee record not found" });

    const remaining = Number(feeRecord.totalFee) - paidAmount(feeRecord);
    if (paymentAmount > remaining) {
      return res.status(400).json({ message: "Payment exceeds the remaining balance" });
    }
    if (transactionId?.trim() && await FeeRecord.exists({ "payments.transactionId": transactionId.trim() })) {
      return res.status(409).json({ message: "This transaction ID is already recorded" });
    }
    const finalReceiptNumber = receiptNumber?.trim() || `ET-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    if (await FeeRecord.exists({ "payments.receiptNumber": finalReceiptNumber })) {
      return res.status(409).json({ message: "This receipt number is already recorded" });
    }

    feeRecord.payments.push({
      amount: paymentAmount,
      paymentDate: parsedPaymentDate,
      paymentMode: paymentMode?.trim() || "",
      transactionId: transactionId?.trim() || "",
      receiptNumber: finalReceiptNumber,
      remarks: remarks?.trim() || "",
    });

    try {
      await feeRecord.save();
    } catch (err) {
      if (err.name === "VersionError") {
        return res.status(409).json({
          message: "This fee record changed while recording payment. Refresh and try again.",
        });
      }
      throw err;
    }

    const [populated] = await populateFeeRecords(
      FeeRecord.find({ _id: feeRecord._id })
    );
    return res.status(201).json({ result: toFeeResponse(populated) });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "This transaction or receipt number is already recorded" });
    return res.status(500).json({ message: "Unable to record payment" });
  }
};
