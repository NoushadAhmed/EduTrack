require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  require('./models/Faculty');
  const Student = require('./models/Student');
  const Mark = require('./models/Marks');

  // Find students who have PUBLISHED marks
  const pubMarks = await Mark.find({ status: 'PUBLISHED' })
    .populate('student', 'name registrationNumber department year section')
    .populate('subject', 'subjectCode subjectName semester')
    .lean();

  const studentSet = new Map();
  pubMarks.forEach(m => {
    const key = String(m.student?._id);
    if (!studentSet.has(key)) studentSet.set(key, m.student);
  });

  console.log('\nStudents with PUBLISHED marks:');
  studentSet.forEach(s => console.log(' ', s.registrationNumber, s.name, 'dept:', s.department, 'year:', s.year, 'section:', s.section));

  // Simulate getStudentResults for the first student with published marks
  const firstStudent = [...studentSet.values()][0];
  if (!firstStudent) { console.log('No students with published marks'); mongoose.disconnect(); return; }

  console.log('\n--- Simulating getStudentResults for', firstStudent.registrationNumber, '---');
  console.log('Student year:', firstStudent.year, '=> expected semesters:', (firstStudent.year*2-1), 'and', firstStudent.year*2);

  // What the API does: find published marks for this student
  const { ASSESSMENTS } = require('./config/vtu2022Assessment');
  const allPublished = await Mark.find({
    student: firstStudent._id,
    status: 'PUBLISHED',
    assessmentType: { $in: ASSESSMENTS.map(a => a.key) },
  }).populate('subject', 'subjectCode subjectName department semester year credits').lean();

  console.log('Published mark records found:', allPublished.length);
  allPublished.forEach(m => console.log(
    '  subject:', m.subject?.subjectCode, 'sem:', m.semester,
    'assessmentType:', m.assessmentType, 'marks:', m.marks, 'ay:', m.academicYear
  ));

  // Test with semester=2 (where published marks exist)
  const semester = 2;
  const grouped = new Map();
  allPublished.forEach(record => {
    const recordSemester = Number(record.semester || record.subject?.semester);
    if (!recordSemester || recordSemester !== semester || !record.subject) return;
    const key = `${record.subject._id}|${recordSemester}|${record.academicYear || ''}`;
    if (!grouped.has(key)) grouped.set(key, { subject: record.subject, semester: recordSemester, records: [] });
    grouped.get(key).records.push(record);
  });
  console.log('\nGrouped subjects for semester', semester, ':', grouped.size);
  grouped.forEach((v, k) => console.log('  key:', k, 'records:', v.records.length, 'assessmentTypes:', v.records.map(r=>r.assessmentType)));

  // Check pending
  const pending = await Mark.exists({
    student: firstStudent._id,
    status: { $in: ['DRAFT', 'SUBMITTED'] },
    assessmentType: { $in: ASSESSMENTS.map(a => a.key) },
    semester,
  });
  console.log('\npendingPublication for semester', semester, ':', Boolean(pending));

  mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
