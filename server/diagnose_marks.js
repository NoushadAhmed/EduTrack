require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  require('./models/Student');
  require('./models/Subject');
  require('./models/Faculty');
  const Mark = require('./models/Marks');

  const total = await Mark.countDocuments();
  console.log('\nTotal Mark records:', total);

  const byStatus = await Mark.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  console.log('\nBy status:', JSON.stringify(byStatus));

  const byExam = await Mark.aggregate([
    { $group: { _id: { exam: '$exam', assessmentType: '$assessmentType', status: '$status' }, count: { $sum: 1 } } },
    { $sort: { '_id.exam': 1 } }
  ]);
  console.log('\nBy exam/assessmentType/status:');
  byExam.forEach(r => console.log(' ', JSON.stringify(r._id), ':', r.count));

  // Sample 3 published marks
  const published = await Mark.find({ status: 'PUBLISHED' }).limit(3)
    .populate('student', 'name registrationNumber department year')
    .populate('subject', 'subjectCode subjectName semester')
    .lean();
  console.log('\nSample PUBLISHED marks:');
  published.forEach(m => console.log(
    ' ', m.student?.registrationNumber, m.subject?.subjectCode,
    'assessmentType:', m.assessmentType, 'exam:', m.exam,
    'marks:', m.marks, 'semester:', m.semester, 'ay:', m.academicYear
  ));

  // Sample 3 submitted marks
  const submitted = await Mark.find({ status: 'SUBMITTED' }).limit(3)
    .populate('student', 'name registrationNumber department year')
    .populate('subject', 'subjectCode subjectName semester')
    .lean();
  console.log('\nSample SUBMITTED marks:');
  submitted.forEach(m => console.log(
    ' ', m.student?.registrationNumber, m.subject?.subjectCode,
    'assessmentType:', m.assessmentType, 'exam:', m.exam,
    'marks:', m.marks, 'semester:', m.semester, 'ay:', m.academicYear
  ));

  // Check semester field on marks vs subject
  const withSem = await Mark.find({ status: 'PUBLISHED' }).limit(5)
    .populate('subject', 'subjectCode semester').lean();
  console.log('\nPublished marks - mark.semester vs subject.semester:');
  withSem.forEach(m => console.log(
    '  mark.semester:', m.semester, '| subject.semester:', m.subject?.semester,
    '| assessmentType:', m.assessmentType
  ));

  mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
