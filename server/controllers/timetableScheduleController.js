const mongoose = require("mongoose");
const Timetable = require("../models/Timetable");
const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const Subject = require("../models/Subject");
const { DEPARTMENTS, SECTIONS } = require("../config/adminOptions");

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Saturday (2nd)", "Saturday (4th)"];
const SIGNATORY_ROLES = ["Time Table Coordinator", "HOD", "Dean Academics", "IQAC Coordinator", "Principal"];
const ENTRY_TYPES = ["THEORY", "LAB", "ELECTIVE", "OEC", "PEC", "PROJECT", "ACTIVITY"];
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const semesterToYear = (semester) => String(Math.ceil(Number(semester) / 2));
const classKey = (item) => [item.department, item.semester, item.section, item.academicYear].join("|");
const overlaps = (a, b) => a.startTime < b.endTime && a.endTime > b.startTime;
const entryTimeRange = (entry, periodSlots) => {
  const startIndex = periodSlots.findIndex((slot) => slot.key === entry.periodKey);
  const span = Math.max(1, Number(entry.spanPeriods || 1));
  const covered = startIndex < 0 ? [] : periodSlots.slice(startIndex, startIndex + span);
  return { startIndex, covered, startTime: covered[0]?.startTime, endTime: covered[covered.length - 1]?.endTime };
};

const populateSchedule = (query) => query
  .populate("classTeacher", "name registrationNumber designation department")
  .populate("entries.subject", "subjectCode subjectName department semester year subjectType credits")
  .populate("entries.faculty", "name registrationNumber designation department")
  .lean();

const compressUsns = (students = []) => {
  const usns = students.map((student) => student.registrationNumber).filter(Boolean).sort();
  if (!usns.length) return [];
  const parsed = usns.map((usn) => {
    const match = usn.match(/^(.*?)(\d+)$/);
    return match ? { usn, prefix: match[1], number: Number(match[2]), width: match[2].length } : { usn, prefix: usn, number: null, width: 0 };
  });
  const ranges = [];
  let start = parsed[0];
  let prior = parsed[0];
  const flush = () => ranges.push(start.usn === prior.usn ? start.usn : `${start.usn}–${prior.usn}`);
  for (const current of parsed.slice(1)) {
    if (current.number !== null && prior.number !== null && current.prefix === prior.prefix && current.number === prior.number + 1) {
      prior = current;
    } else {
      flush(); start = current; prior = current;
    }
  }
  flush();
  return ranges;
};

const getRoster = async ({ department, semester, section }) => {
  const year = semesterToYear(semester);
  const students = await Student.find({ department, year: Number(year), section })
    .select("_id name registrationNumber department year section")
    .sort({ registrationNumber: 1 })
    .lean();
  return { students, year, classStrength: students.length, usnRanges: compressUsns(students) };
};

const decorateSchedule = async (schedule) => {
  const roster = await getRoster(schedule);
  return { ...schedule, year: schedule.year || roster.year, classStrength: roster.classStrength, usnRanges: roster.usnRanges, studentUsns: roster.students.map((student) => student.registrationNumber) };
};

const overlapSlots = (slots) => {
  for (let i = 0; i < slots.length; i += 1) {
    for (let j = i + 1; j < slots.length; j += 1) {
      if (overlaps(slots[i], slots[j])) return `${slots[i].label} overlaps ${slots[j].label}`;
    }
  }
  return "";
};

const normalizeAndValidate = async (body, currentId = null) => {
  const semester = Number(body.semester);
  if (!DEPARTMENTS.includes(body.department)) throw Object.assign(new Error("Select a valid department"), { status: 400 });
  if (!Number.isInteger(semester) || semester < 1 || semester > 8) throw Object.assign(new Error("Select a semester from 1 to 8"), { status: 400 });
  if (!SECTIONS.includes(body.section)) throw Object.assign(new Error("Select a valid section"), { status: 400 });
  if (!/^\d{4}-\d{2}$/.test(body.academicYear || "")) throw Object.assign(new Error("Enter an academic year such as 2026-27"), { status: 400 });
  if (typeof body.collegeName !== "string" || !body.collegeName.trim()) throw Object.assign(new Error("College name is required for the official timetable header"), { status: 400 });
  if (!body.classRoom?.trim()) throw Object.assign(new Error("Class room is required"), { status: 400 });
  if (!body.effectiveFrom || Number.isNaN(new Date(body.effectiveFrom).getTime())) throw Object.assign(new Error("Select a valid effective-from date"), { status: 400 });
  const slots = Array.isArray(body.periodSlots) ? body.periodSlots : [];
  const entries = Array.isArray(body.entries) ? body.entries : [];
  if (!slots.length) throw Object.assign(new Error("Configure at least one time slot"), { status: 400 });
  if (!entries.length) throw Object.assign(new Error("Add at least one timetable entry"), { status: 400 });
  const slotKeys = new Set();
  for (const slot of slots) {
    if (!slot.key || slotKeys.has(slot.key) || !slot.label?.trim() || !timePattern.test(slot.startTime || "") || !timePattern.test(slot.endTime || "") || slot.startTime >= slot.endTime || !["CLASS", "BREAK", "LUNCH"].includes(slot.kind)) {
      throw Object.assign(new Error("Each period needs a unique key, label and valid time range"), { status: 400 });
    }
    slotKeys.add(slot.key);
  }
  if (slots.some((slot, index) => index > 0 && slot.startTime < slots[index - 1].startTime)) {
    throw Object.assign(new Error("Configure time slots in chronological order"), { status: 400 });
  }
  const slotOverlap = overlapSlots(slots);
  if (slotOverlap) throw Object.assign(new Error(`Configured time slots overlap: ${slotOverlap}`), { status: 409 });
  const slotByKey = new Map(slots.map((slot) => [slot.key, slot]));
  const normalizedEntries = [];
  for (const raw of entries) {
    if (!DAYS.includes(raw.day) || !slotByKey.has(raw.periodKey)) throw Object.assign(new Error("Every class entry needs a valid day and configured period"), { status: 400 });
    if (!ENTRY_TYPES.includes(raw.type)) throw Object.assign(new Error("Select a valid class activity type"), { status: 400 });
    const slot = slotByKey.get(raw.periodKey);
    if (slot.kind !== "CLASS") throw Object.assign(new Error("Classes cannot be assigned to a break or lunch period"), { status: 400 });
    const entry = {
      day: raw.day,
      periodKey: raw.periodKey,
      spanPeriods: Math.max(1, Number(raw.spanPeriods || 1)),
      type: raw.type,
      activity: String(raw.activity || "").trim(),
      room: String(raw.room || "").trim(),
      batch: String(raw.batch || "").trim(),
      rollStart: String(raw.rollStart || "").trim(),
      rollEnd: String(raw.rollEnd || "").trim(),
      credits: raw.credits === "" || raw.credits === undefined || raw.credits === null ? null : Number(raw.credits),
      lectureHours: Number(raw.lectureHours || 0),
      tutorialHours: Number(raw.tutorialHours || 0),
      practicalHours: Number(raw.practicalHours || 0),
      notes: String(raw.notes || "").trim(),
    };
    const range = entryTimeRange(entry, slots);
    if (!Number.isInteger(entry.spanPeriods) || entry.spanPeriods > 6 || range.covered.length !== entry.spanPeriods || range.covered.some((item, index) => item.kind !== "CLASS" || (index > 0 && item.startTime !== range.covered[index - 1].endTime))) {
      throw Object.assign(new Error("A merged class must span consecutive class periods without crossing a break or lunch"), { status: 400 });
    }
    if (entry.credits !== null && (!Number.isFinite(entry.credits) || entry.credits < 0 || entry.credits > 20)) throw Object.assign(new Error("Credits must be between 0 and 20"), { status: 400 });
    if ([entry.lectureHours, entry.tutorialHours, entry.practicalHours].some((hours) => !Number.isFinite(hours) || hours < 0 || hours > 20)) throw Object.assign(new Error("Weekly lecture, tutorial and practical hours must be from 0 to 20"), { status: 400 });
    if (raw.subjectId) {
      if (!mongoose.isValidObjectId(raw.subjectId) || !mongoose.isValidObjectId(raw.facultyId) || !raw.facultyAssignmentId) throw Object.assign(new Error("Choose an assigned subject and its faculty member"), { status: 400 });
      const [subject, faculty] = await Promise.all([
        Subject.findById(raw.subjectId).select("_id subjectCode subjectName department semester year").lean(),
        Faculty.findById(raw.facultyId).select("_id name registrationNumber department assignedSubjects").lean(),
      ]);
      if (!subject || subject.department !== body.department || (subject.semester && Number(subject.semester) !== semester) || String(subject.year) !== semesterToYear(semester)) {
        throw Object.assign(new Error("Selected subject does not belong to this department and semester"), { status: 400 });
      }
      if (!faculty || faculty.department !== body.department) throw Object.assign(new Error("Selected faculty member does not belong to this department"), { status: 400 });
      const assignment = (faculty.assignedSubjects || []).find((item) => String(item._id) === String(raw.facultyAssignmentId));
      if (!assignment || assignment.isActive === false || String(assignment.subject) !== String(subject._id) || Number(assignment.semester) !== semester || (assignment.department && assignment.department !== body.department) || (assignment.faculty && String(assignment.faculty) !== String(faculty._id)) || (assignment.section || "A") !== body.section || (assignment.academicYear && assignment.academicYear !== body.academicYear)) {
        throw Object.assign(new Error(`${faculty.registrationNumber || "Faculty"} is not assigned to ${subject.subjectCode} for this semester, section and academic year`), { status: 403 });
      }
      entry.subject = subject._id;
      entry.faculty = faculty._id;
      entry.facultyAssignmentId = String(assignment._id);
    } else if (!entry.activity) {
      throw Object.assign(new Error("Select an existing subject or provide an activity/project title"), { status: 400 });
    }
    normalizedEntries.push(entry);
  }

  const classTeacher = body.classTeacherId && mongoose.isValidObjectId(body.classTeacherId)
    ? await Faculty.findById(body.classTeacherId).select("_id department").lean()
    : null;
  if (!classTeacher || classTeacher.department !== body.department) throw Object.assign(new Error("Select a valid class teacher from this department"), { status: 400 });
  const signatories = SIGNATORY_ROLES.map((role) => {
    const supplied = (body.signatories || []).find((item) => item.role === role) || {};
    const signatureData = String(supplied.signatureData || "");
    if (signatureData && (!/^data:image\/(png|jpeg|webp);base64,/.test(signatureData) || signatureData.length > 1400000)) {
      throw Object.assign(new Error(`Signature for ${role} must be a PNG, JPEG or WebP image under 1 MB`), { status: 400 });
    }
    return { role, name: String(supplied.name || "").trim(), signatureData };
  });
  const validateHeaderImage = (data, label) => {
    const image = String(data || "");
    if (image && (!/^data:image\/(png|jpeg|webp);base64,/.test(image) || image.length > 700000)) throw Object.assign(new Error(`${label} must be a PNG, JPEG or WebP image under 500 KB`), { status: 400 });
    return image;
  };

  const roster = await getRoster({ department: body.department, semester, section: body.section });
  const usnSet = new Set(roster.students.map((student) => student.registrationNumber));
  for (const entry of normalizedEntries) {
    if ((entry.rollStart && !usnSet.has(entry.rollStart)) || (entry.rollEnd && !usnSet.has(entry.rollEnd))) throw Object.assign(new Error("Batch roll range must use USNs from the selected class roster"), { status: 400 });
    if (entry.rollStart && entry.rollEnd && entry.rollStart > entry.rollEnd) throw Object.assign(new Error("Roll range start must come before its end"), { status: 400 });
  }

  const sameScheduleConflicts = [];
  for (let i = 0; i < normalizedEntries.length; i += 1) {
    const leftRange = entryTimeRange(normalizedEntries[i], slots);
    const left = { ...normalizedEntries[i], startTime: leftRange.startTime, endTime: leftRange.endTime };
    for (let j = i + 1; j < normalizedEntries.length; j += 1) {
      const rightRange = entryTimeRange(normalizedEntries[j], slots);
      const right = { ...normalizedEntries[j], startTime: rightRange.startTime, endTime: rightRange.endTime };
      if (left.day !== right.day || !overlaps(left, right)) continue;
      const separateBatches = left.batch && right.batch && left.batch !== right.batch && left.rollEnd && right.rollStart && (left.rollEnd < right.rollStart || right.rollEnd < left.rollStart);
      if (left.faculty && right.faculty && String(left.faculty) === String(right.faculty)) sameScheduleConflicts.push(`Faculty conflict on ${left.day} at ${left.startTime}.`);
      if (!separateBatches && (left.room || body.classRoom).toLowerCase() === (right.room || body.classRoom).toLowerCase()) sameScheduleConflicts.push(`Room ${left.room || body.classRoom} is allocated twice on ${left.day} at ${left.startTime}.`);
      if (!separateBatches) sameScheduleConflicts.push("This section has overlapping entries for the same students on the same day.");
    }
  }
  if (sameScheduleConflicts.length) throw Object.assign(new Error(sameScheduleConflicts[0]), { status: 409 });

  const classTeacherFaculty = classTeacher;
  const versionQuery = { recordType: "CLASS_SCHEDULE", department: body.department, semester, section: body.section, academicYear: body.academicYear };
  if (currentId) versionQuery._id = { $ne: currentId };
  const latest = await Timetable.findOne(versionQuery).sort({ version: -1 }).select("version").lean();
  const explicitVersion = Number(body.version);
  const version = currentId ? Number(body.version) : (Number.isInteger(explicitVersion) && explicitVersion > 0 ? explicitVersion : Number(latest?.version || 0) + 1);
  if (!Number.isInteger(version) || version < 1) throw Object.assign(new Error("Version must be a positive whole number"), { status: 400 });
  if (!currentId && await Timetable.exists({ ...versionQuery, version })) throw Object.assign(new Error(`Version ${version} already exists for this class`), { status: 409 });

  return {
    recordType: "CLASS_SCHEDULE",
    title: String(body.title || "").trim(),
    collegeName: body.collegeName.trim(),
    collegeAddress: String(body.collegeAddress || "").trim(),
    regionalHeader: String(body.regionalHeader || "").trim(),
    collegeLogoData: validateHeaderImage(body.collegeLogoData, "College logo"),
    accreditationLogoData: validateHeaderImage(body.accreditationLogoData, "Accreditation logo"),
    department: body.department,
    semester,
    year: semesterToYear(semester),
    section: body.section,
    academicYear: body.academicYear,
    classTeacher: classTeacherFaculty._id,
    classRoom: String(body.classRoom).trim(),
    effectiveFrom: new Date(body.effectiveFrom),
    version,
    periodSlots: slots.map((slot) => ({ key: slot.key, label: slot.label.trim(), startTime: slot.startTime, endTime: slot.endTime, kind: slot.kind })),
    entries: normalizedEntries,
    notes: String(body.notes || "").trim(),
    signatories,
    status: "DRAFT",
    isPublished: false,
  };
};

const checkExternalConflicts = async (schedule) => {
  const [otherSchedules, legacy] = await Promise.all([
    Timetable.find({ recordType: "CLASS_SCHEDULE", isPublished: true, academicYear: schedule.academicYear, _id: { $ne: schedule._id } }).lean(),
    Timetable.find({ recordType: { $ne: "CLASS_SCHEDULE" }, academicYear: schedule.academicYear }).lean(),
  ]);
  const candidates = [];
  for (const other of otherSchedules) {
    if (classKey(other) === classKey(schedule)) continue;
    const periodByKey = new Map((other.periodSlots || []).map((slot) => [slot.key, slot]));
    for (const entry of other.entries || []) {
      const slot = periodByKey.get(entry.periodKey);
      if (slot) {
        const range = entryTimeRange(entry, other.periodSlots || []);
        candidates.push({ ...entry, ...slot, startTime: range.startTime, endTime: range.endTime, room: entry.room || other.classRoom, department: other.department, semester: other.semester, year: other.year, section: other.section, academicYear: other.academicYear });
      }
    }
  }
  for (const other of legacy) candidates.push({ ...other, startTime: other.startTime, endTime: other.endTime });
  for (const entry of schedule.entries || []) {
    const slot = (schedule.periodSlots || []).find((item) => item.key === entry.periodKey);
    if (!slot) continue;
    const range = entryTimeRange(entry, schedule.periodSlots || []);
    const current = { ...entry, ...slot, startTime: range.startTime, endTime: range.endTime, room: entry.room || schedule.classRoom, department: schedule.department, semester: schedule.semester, year: schedule.year, section: schedule.section, academicYear: schedule.academicYear };
    for (const other of candidates) {
      if (other.day !== current.day || !other.startTime || !other.endTime || !overlaps(current, other)) continue;
      if (current.faculty && String(current.faculty) === String(other.faculty)) return `Faculty conflict on ${current.day} at ${current.startTime}.`;
      if (current.room && other.room && current.room.toLowerCase() === other.room.toLowerCase()) return `Room ${current.room} is already allocated on ${current.day} at ${current.startTime}.`;
      if (current.department === other.department && String(current.year) === String(other.year) && current.semester === other.semester && current.section === other.section) return `Section ${current.section} already has a class on ${current.day} at ${current.startTime}.`;
    }
  }
  return "";
};

exports.getTimetableRoster = async (req, res) => {
  try {
    const semester = Number(req.query.semester);
    if (!DEPARTMENTS.includes(req.query.department) || !Number.isInteger(semester) || semester < 1 || semester > 8 || !SECTIONS.includes(req.query.section)) return res.status(400).json({ success: false, message: "Select a valid department, semester and section" });
    const roster = await getRoster({ department: req.query.department, semester, section: req.query.section });
    return res.status(200).json({ success: true, year: roster.year, classStrength: roster.classStrength, usns: roster.students.map((student) => student.registrationNumber), usnRanges: roster.usnRanges });
  } catch (err) {
    console.error("Timetable roster error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.validateTimetableSchedule = async (req, res) => {
  try {
    const scheduleData = await normalizeAndValidate(req.body, req.body?.timetableId || null);
    const conflict = await checkExternalConflicts(scheduleData);
    if (conflict) return res.status(409).json({ success: false, message: conflict });
    return res.status(200).json({ success: true, message: "No schedule conflicts found", classYear: scheduleData.year, entryCount: scheduleData.entries.length });
  } catch (err) {
    console.error("Validate timetable error:", err);
    return res.status(err.status || 500).json({ success: false, message: err.message || "Unable to validate timetable" });
  }
};

exports.getAdminTimetableSchedules = async (req, res) => {
  try {
    const query = { recordType: "CLASS_SCHEDULE" };
    for (const field of ["department", "section", "academicYear", "status"]) if (req.query[field]) query[field] = req.query[field];
    if (req.query.semester) query.semester = Number(req.query.semester);
    const schedules = await populateSchedule(Timetable.find(query).sort({ department: 1, semester: 1, section: 1, academicYear: 1, version: -1 }));
    return res.status(200).json({ success: true, result: await Promise.all(schedules.map(decorateSchedule)) });
  } catch (err) {
    console.error("Admin timetable list error:", err);
    return res.status(500).json({ success: false, message: err.message || "Unable to load timetables" });
  }
};

exports.createTimetableSchedule = async (req, res) => {
  try {
    const scheduleData = await normalizeAndValidate(req.body);
    const conflict = await checkExternalConflicts(scheduleData);
    if (conflict) return res.status(409).json({ success: false, message: conflict });
    const schedule = await Timetable.create({ ...scheduleData, createdBy: req.user?._id });
    const populated = await populateSchedule(Timetable.findById(schedule._id));
    return res.status(201).json({ success: true, message: "Timetable saved as draft", result: await decorateSchedule(populated) });
  } catch (err) {
    console.error("Create timetable error:", err);
    return res.status(err.status || 500).json({ success: false, message: err.message || "Unable to create timetable" });
  }
};

exports.updateTimetableSchedule = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.timetableId)) return res.status(404).json({ success: false, message: "Timetable version not found" });
    const existing = await Timetable.findOne({ _id: req.params.timetableId, recordType: "CLASS_SCHEDULE" });
    if (!existing) return res.status(404).json({ success: false, message: "Timetable version not found" });
    if (existing.status !== "DRAFT") return res.status(409).json({ success: false, message: "Only draft timetables can be edited" });
    const scheduleData = await normalizeAndValidate({ ...req.body, version: existing.version }, existing._id);
    const conflict = await checkExternalConflicts({ ...scheduleData, _id: existing._id });
    if (conflict) return res.status(409).json({ success: false, message: conflict });
    Object.assign(existing, scheduleData, { updatedBy: req.user?._id });
    await existing.save();
    const populated = await populateSchedule(Timetable.findById(existing._id));
    return res.status(200).json({ success: true, message: "Draft timetable updated", result: await decorateSchedule(populated) });
  } catch (err) {
    console.error("Update timetable error:", err);
    return res.status(err.status || 500).json({ success: false, message: err.message || "Unable to update timetable" });
  }
};

exports.publishTimetableSchedule = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    if (!mongoose.isValidObjectId(req.params.timetableId)) return res.status(404).json({ success: false, message: "Timetable version not found" });
    const schedule = await Timetable.findOne({ _id: req.params.timetableId, recordType: "CLASS_SCHEDULE" });
    if (!schedule) return res.status(404).json({ success: false, message: "Timetable version not found" });
    if (schedule.status !== "DRAFT") return res.status(409).json({ success: false, message: "Only draft timetables can be published" });
    const conflict = await checkExternalConflicts(schedule.toObject());
    if (conflict) return res.status(409).json({ success: false, message: conflict });
    await session.withTransaction(async () => {
      if (schedule.effectiveFrom <= new Date()) await Timetable.updateMany({
        recordType: "CLASS_SCHEDULE",
        department: schedule.department,
        semester: schedule.semester,
        section: schedule.section,
        academicYear: schedule.academicYear,
        isPublished: true,
        _id: { $ne: schedule._id },
      }, { $set: { isPublished: false, status: "SUPERSEDED" } }, { session });
      schedule.status = "PUBLISHED";
      schedule.isPublished = true;
      schedule.publishedAt = new Date();
      schedule.publishedBy = req.user?._id;
      await schedule.save({ session });
    });
    const populated = await populateSchedule(Timetable.findById(schedule._id));
    return res.status(200).json({ success: true, message: `Version ${schedule.version} published`, result: await decorateSchedule(populated) });
  } catch (err) {
    console.error("Publish timetable error:", err);
    return res.status(err.status || 500).json({ success: false, message: err.message || "Unable to publish timetable" });
  } finally {
    await session.endSession();
  }
};

exports.getTimetableSchedule = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.timetableId)) return res.status(404).json({ success: false, message: "Timetable version not found" });
    const schedule = await populateSchedule(Timetable.findOne({ _id: req.params.timetableId, recordType: "CLASS_SCHEDULE" }));
    if (!schedule) return res.status(404).json({ success: false, message: "Timetable version not found" });
    return res.status(200).json({ success: true, result: await decorateSchedule(schedule) });
  } catch (err) {
    console.error("Timetable detail error:", err);
    return res.status(500).json({ success: false, message: err.message || "Unable to load timetable" });
  }
};

const getCurrentAcademicPeriod = (year) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const academicStart = month >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const isOddSemester = month >= 8 || month === 1;
  const semester = Math.min(8, (Number(year) * 2) - (isOddSemester ? 1 : 0));
  return { semester, academicYear: `${academicStart}-${String((academicStart + 1) % 100).padStart(2, "0")}` };
};

const toPortalEntries = (schedules) => schedules.flatMap((schedule) => (schedule.entries || []).map((entry) => {
  const slot = (schedule.periodSlots || []).find((item) => item.key === entry.periodKey) || {};
  return {
    ...entry,
    scheduleId: schedule._id,
    scheduleVersion: schedule.version,
    collegeName: schedule.collegeName,
    department: schedule.department,
    semester: schedule.semester,
    year: schedule.year,
    section: schedule.section,
    academicYear: schedule.academicYear,
    startTime: slot.startTime,
    endTime: entryTimeRange(entry, schedule.periodSlots || []).endTime || slot.endTime,
    spanPeriods: entry.spanPeriods || 1,
    periodLabel: slot.label,
    classRoom: schedule.classRoom,
    room: entry.room || schedule.classRoom,
  };
}));

const collectPeriodSlots = (schedules) => {
  const unique = new Map();
  schedules.forEach((schedule) => (schedule.periodSlots || []).forEach((slot) => {
    const key = `${slot.startTime}-${slot.endTime}`;
    if (!unique.has(key)) unique.set(key, slot);
  }));
  return [...unique.values()].sort((a, b) => a.startTime.localeCompare(b.startTime));
};

const getLegacyPortalEntries = async (query) => Timetable.find({ recordType: { $ne: "CLASS_SCHEDULE" }, isPublished: true, ...query })
  .populate("subject", "subjectCode subjectName department year semester subjectType")
  .populate("faculty", "name registrationNumber designation department")
  .lean();

const sortPortalEntries = (entries) => entries.sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || String(a.startTime).localeCompare(String(b.startTime)));

exports.getFacultyPublishedTimetable = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.user?._id).select("_id department").lean();
    if (!faculty) return res.status(403).json({ success: false, message: "Faculty access required" });
    const schedules = await populateSchedule(Timetable.find({ recordType: "CLASS_SCHEDULE", isPublished: true, effectiveFrom: { $lte: new Date() }, "entries.faculty": faculty._id, ...(req.query.academicYear ? { academicYear: req.query.academicYear } : {}) }).sort({ effectiveFrom: -1, version: -1 }));
    const activeByClass = new Map();
    schedules.forEach((schedule) => { if (!activeByClass.has(classKey(schedule))) activeByClass.set(classKey(schedule), schedule); });
    const activeSchedules = [...activeByClass.values()];
    const entries = toPortalEntries(activeSchedules);
    const legacy = await getLegacyPortalEntries({ faculty: faculty._id, ...(req.query.academicYear ? { academicYear: req.query.academicYear } : {}) });
    return res.status(200).json({ success: true, periodSlots: collectPeriodSlots(activeSchedules), result: sortPortalEntries([...entries, ...legacy]) });
  } catch (err) {
    console.error("Faculty timetable error:", err);
    return res.status(500).json({ success: false, message: err.message || "Unable to load timetable" });
  }
};

exports.getStudentPublishedTimetable = async (req, res) => {
  try {
    const student = await Student.findById(req.user?._id).select("department year section").lean();
    if (!student) return res.status(403).json({ success: false, message: "Student access required" });
    const { semester, academicYear } = getCurrentAcademicPeriod(student.year);
    const currentYear = req.query.academicYear || academicYear;
    // Student records store class year, not semester. Derive the current semester
    // from that year and academic calendar rather than guessing from whichever
    // timetable version happens to be most recently published for the section.
    const currentSemester = semester;
    const query = { department: student.department, year: String(student.year), semester: currentSemester, section: student.section, academicYear: currentYear };
    const schedules = await populateSchedule(Timetable.find({ recordType: "CLASS_SCHEDULE", isPublished: true, effectiveFrom: { $lte: new Date() }, ...query }).sort({ effectiveFrom: -1, version: -1 }));
    const activeSchedule = schedules[0] ? [schedules[0]] : [];
    const entries = toPortalEntries(activeSchedule);
    const legacy = await getLegacyPortalEntries(query);
    return res.status(200).json({ success: true, semester: currentSemester, academicYear: query.academicYear, periodSlots: collectPeriodSlots(activeSchedule), result: sortPortalEntries([...entries, ...legacy]) });
  } catch (err) {
    console.error("Student timetable error:", err);
    return res.status(500).json({ success: false, message: err.message || "Unable to load timetable" });
  }
};
