const Student = require("../models/Student");
const Faculty = require("../models/Faculty");
const Subject = require("../models/Subject");
const Attendance = require("../models/Attendance");
const Mark = require("../models/Marks");
const FeeRecord = require("../models/FeeRecord");
const Timetable = require("../models/Timetable");
const { DEPARTMENTS, SECTIONS } = require("../config/adminOptions");

const semesterToYear = (semester) => String(Math.ceil(Number(semester) / 2));
const academicYearPattern = /^\d{4}-\d{2}$/;

const studentMatchFromQuery = (query) => {
  const match = {};
  if (query.department) match.department = query.department;
  if (query.section) match.section = query.section;
  if (query.semester) match.year = Number(semesterToYear(query.semester));
  return match;
};

const joinStudent = (from) => [
  {
    $lookup: {
      from,
      localField: "student",
      foreignField: "_id",
      as: "studentDoc",
    },
  },
  { $unwind: "$studentDoc" },
];

exports.getReports = async (req, res) => {
  try {
    const { department, semester, section, academicYear, type = "overview" } =
      req.query;
    const supportedTypes = [
      "overview",
      "students",
      "attendance",
      "results",
      "fees",
      "faculty",
      "academic",
    ];
    if (!supportedTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid report type" });
    }

    if (department && !DEPARTMENTS.includes(department)) {
      return res.status(400).json({ message: "Invalid department" });
    }
    if (section && !SECTIONS.includes(section)) {
      return res.status(400).json({ message: "Invalid section" });
    }
    if (
      semester &&
      (!Number.isInteger(Number(semester)) ||
        Number(semester) < 1 ||
        Number(semester) > 8)
    ) {
      return res.status(400).json({ message: "Semester must be between 1 and 8" });
    }
    if (academicYear && !academicYearPattern.test(academicYear)) {
      return res.status(400).json({ message: "Invalid academic year" });
    }

    const studentMatch = studentMatchFromQuery(req.query);
    const joinedStudentMatch = Object.fromEntries(
      Object.entries(studentMatch).map(([key, value]) => [`studentDoc.${key}`, value])
    );
    const year = semester ? semesterToYear(semester) : null;

    const studentPipeline = [
      { $match: studentMatch },
      {
        $facet: {
          total: [{ $count: "count" }],
          departments: [
            { $group: { _id: "$department", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
          years: [
            { $group: { _id: "$year", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
          sections: [
            { $group: { _id: "$section", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ];

    const facultyMatch = department ? { department } : {};
    const facultyPipeline = [
      { $match: facultyMatch },
      {
        $facet: {
          total: [{ $count: "count" }],
          departments: [
            { $group: { _id: "$department", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
          designations: [
            {
              $group: {
                _id: "$designation",
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ];

    const subjectMatch = {};
    if (department) subjectMatch.department = department;
    if (year) subjectMatch.year = year;
    const subjectPipeline = [
      { $match: subjectMatch },
      {
        $facet: {
          total: [{ $count: "count" }],
          departments: [
            { $group: { _id: "$department", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ];

    const attendancePipeline = [
      ...joinStudent(Student.collection.name),
      { $match: joinedStudentMatch },
      {
        $addFields: {
          attended: { $ifNull: ["$lecturesAttended", 0] },
          total: { $ifNull: ["$totalLectures", 0] },
        },
      },
      { $match: { total: { $gt: 0 } } },
      {
        $lookup: {
          from: Subject.collection.name,
          localField: "subject",
          foreignField: "_id",
          as: "subjectDoc",
        },
      },
      { $unwind: { path: "$subjectDoc", preserveNullAndEmptyArrays: true } },
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                attended: { $sum: "$attended" },
                total: { $sum: "$total" },
                records: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                averageAttendance: {
                  $cond: [
                    { $gt: ["$total", 0] },
                    { $multiply: [{ $divide: ["$attended", "$total"] }, 100] },
                    null,
                  ],
                },
                records: 1,
              },
            },
          ],
          departments: [
            {
              $group: {
                _id: "$studentDoc.department",
                attended: { $sum: "$attended" },
                total: { $sum: "$total" },
              },
            },
            {
              $project: {
                percentage: {
                  $cond: [
                    { $gt: ["$total", 0] },
                    { $multiply: [{ $divide: ["$attended", "$total"] }, 100] },
                    null,
                  ],
                },
              },
            },
            { $sort: { _id: 1 } },
          ],
          years: [
            {
              $group: {
                _id: "$studentDoc.year",
                attended: { $sum: "$attended" },
                total: { $sum: "$total" },
              },
            },
            {
              $project: {
                percentage: {
                  $cond: [
                    { $gt: ["$total", 0] },
                    { $multiply: [{ $divide: ["$attended", "$total"] }, 100] },
                    null,
                  ],
                },
              },
            },
            { $sort: { _id: 1 } },
          ],
          subjects: [
            {
              $group: {
                _id: "$subject",
                subjectCode: { $first: "$subjectDoc.subjectCode" },
                subjectName: { $first: "$subjectDoc.subjectName" },
                department: { $first: "$subjectDoc.department" },
                year: { $first: "$subjectDoc.year" },
                attended: { $sum: "$attended" },
                total: { $sum: "$total" },
              },
            },
            {
              $project: {
                subjectCode: 1,
                subjectName: 1,
                department: 1,
                year: 1,
                percentage: {
                  $cond: [
                    { $gt: ["$total", 0] },
                    { $multiply: [{ $divide: ["$attended", "$total"] }, 100] },
                    null,
                  ],
                },
              },
            },
            { $sort: { percentage: 1 } },
            { $limit: 15 },
          ],
          students: [
            {
              $group: {
                _id: "$student",
                name: { $first: "$studentDoc.name" },
                registrationNumber: { $first: "$studentDoc.registrationNumber" },
                department: { $first: "$studentDoc.department" },
                year: { $first: "$studentDoc.year" },
                section: { $first: "$studentDoc.section" },
                attended: { $sum: "$attended" },
                total: { $sum: "$total" },
              },
            },
            {
              $project: {
                name: 1,
                registrationNumber: 1,
                department: 1,
                year: 1,
                section: 1,
                percentage: {
                  $cond: [
                    { $gt: ["$total", 0] },
                    { $multiply: [{ $divide: ["$attended", "$total"] }, 100] },
                    null,
                  ],
                },
              },
            },
            { $sort: { percentage: 1 } },
            { $limit: 10 },
          ],
        },
      },
    ];

    const markPipeline = [
      ...joinStudent(Student.collection.name),
      { $match: joinedStudentMatch },
      {
        $addFields: {
          score: { $ifNull: ["$marks", null] },
          maximum: { $ifNull: ["$totalMarks", null] },
        },
      },
      { $match: { score: { $ne: null }, maximum: { $gt: 0 } } },
      {
        $lookup: {
          from: Subject.collection.name,
          localField: "subject",
          foreignField: "_id",
          as: "subjectDoc",
        },
      },
      { $unwind: { path: "$subjectDoc", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          scorePercentage: {
            $multiply: [{ $divide: ["$score", "$maximum"] }, 100],
          },
        },
      },
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                averageMarks: { $avg: "$score" },
                averagePercentage: { $avg: "$scorePercentage" },
                records: { $sum: 1 },
              },
            },
          ],
          departments: [
            {
              $group: {
                _id: "$studentDoc.department",
                averagePercentage: { $avg: "$scorePercentage" },
                records: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
          years: [
            {
              $group: {
                _id: "$studentDoc.year",
                averagePercentage: { $avg: "$scorePercentage" },
                records: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
          subjects: [
            {
              $group: {
                _id: "$subject",
                subjectCode: { $first: "$subjectDoc.subjectCode" },
                subjectName: { $first: "$subjectDoc.subjectName" },
                department: { $first: "$studentDoc.department" },
                year: { $first: "$studentDoc.year" },
                averageMarks: { $avg: "$score" },
                averagePercentage: { $avg: "$scorePercentage" },
                records: { $sum: 1 },
              },
            },
            { $sort: { averagePercentage: 1 } },
            { $limit: 15 },
          ],
          students: [
            {
              $group: {
                _id: "$student",
                name: { $first: "$studentDoc.name" },
                registrationNumber: { $first: "$studentDoc.registrationNumber" },
                department: { $first: "$studentDoc.department" },
                year: { $first: "$studentDoc.year" },
                section: { $first: "$studentDoc.section" },
                averagePercentage: { $avg: "$scorePercentage" },
                records: { $sum: 1 },
              },
            },
            { $sort: { averagePercentage: -1 } },
            { $limit: 10 },
          ],
        },
      },
    ];

    const feeMatch = {
      ...(academicYear ? { academicYear } : {}),
      ...(semester ? { semester: Number(semester), year } : {}),
    };
    const feePipeline = [
      ...joinStudent(Student.collection.name),
      { $match: { ...joinedStudentMatch, ...feeMatch } },
      {
        $addFields: {
          paidAmount: {
            $sum: { $ifNull: ["$payments.amount", []] },
          },
        },
      },
      {
        $addFields: {
          balance: { $max: [0, { $subtract: ["$totalFee", "$paidAmount"] }] },
          status: {
            $switch: {
              branches: [
                { case: { $gte: ["$paidAmount", "$totalFee"] }, then: "Paid" },
                { case: { $gt: ["$paidAmount", 0] }, then: "Partially Paid" },
              ],
              default: "Pending",
            },
          },
        },
      },
      {
        $facet: {
          overall: [
            {
              $group: {
                _id: null,
                records: { $sum: 1 },
                students: { $addToSet: "$student" },
                totalFees: { $sum: "$totalFee" },
                feesCollected: { $sum: "$paidAmount" },
                pendingFees: { $sum: "$balance" },
                partiallyPaid: {
                  $sum: { $cond: [{ $eq: ["$status", "Partially Paid"] }, 1, 0] },
                },
              },
            },
            {
              $project: {
                _id: 0,
                records: 1,
                totalStudents: { $size: "$students" },
                totalFees: 1,
                feesCollected: 1,
                pendingFees: 1,
                partiallyPaid: 1,
                collectionPercentage: {
                  $cond: [
                    { $gt: ["$totalFees", 0] },
                    { $multiply: [{ $divide: ["$feesCollected", "$totalFees"] }, 100] },
                    null,
                  ],
                },
              },
            },
          ],
          departments: [
            {
              $group: {
                _id: "$studentDoc.department",
                totalFees: { $sum: "$totalFee" },
                feesCollected: { $sum: "$paidAmount" },
                pendingFees: { $sum: "$balance" },
                records: { $sum: 1 },
              },
            },
            {
              $project: {
                totalFees: 1,
                feesCollected: 1,
                pendingFees: 1,
                records: 1,
                collectionPercentage: {
                  $cond: [
                    { $gt: ["$totalFees", 0] },
                    { $multiply: [{ $divide: ["$feesCollected", "$totalFees"] }, 100] },
                    null,
                  ],
                },
              },
            },
            { $sort: { _id: 1 } },
          ],
          statuses: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ];

    const timetableMatch = {
      ...(department ? { department } : {}),
      ...(semester ? { semester: Number(semester), year } : {}),
      ...(section ? { section } : {}),
      ...(academicYear ? { academicYear } : {}),
    };
    const timetablePipeline = [
      { $match: timetableMatch },
      {
        $facet: {
          total: [{ $count: "count" }],
          departments: [
            { $group: { _id: "$department", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ];

    const queryFactories = {
      students: () => Student.aggregate(studentPipeline),
      faculty: () => Faculty.aggregate(facultyPipeline),
      subjects: () => Subject.aggregate(subjectPipeline),
      attendance: () => Attendance.aggregate(attendancePipeline),
      results: () => Mark.aggregate(markPipeline),
      fees: () => FeeRecord.aggregate(feePipeline),
      timetable: () => Timetable.aggregate(timetablePipeline),
    };
    const queryNamesByType = {
      overview: ["students", "faculty", "subjects", "attendance", "results", "fees", "timetable"],
      students: ["students"],
      attendance: ["attendance"],
      results: ["results"],
      fees: ["fees"],
      faculty: ["faculty"],
      academic: ["attendance", "results"],
    };
    const queryNames = queryNamesByType[type];
    const queryResults = await Promise.allSettled(
      queryNames.map((name) => queryFactories[name]())
    );
    const unavailableSections = queryResults.reduce((missing, result, index) => {
      if (result.status === "rejected") missing.push(queryNames[index]);
      return missing;
    }, []);
    const aggregateValue = (index) =>
      queryResults[index].status === "fulfilled"
        ? queryResults[index].value[0]
        : null;
    const aggregateData = Object.fromEntries(
      queryNames.map((name, index) => [name, aggregateValue(index)])
    );
    const studentData = aggregateData.students;
    const facultyData = aggregateData.faculty;
    const subjectData = aggregateData.subjects;
    const attendanceData = aggregateData.attendance;
    const marksData = aggregateData.results;
    const feesData = aggregateData.fees;
    const timetableData = aggregateData.timetable;

    return res.status(200).json({
      summary: {
        ...(studentData?.total?.[0]?.count !== undefined && {
          totalStudents: studentData.total[0].count,
        }),
        ...(facultyData?.total?.[0]?.count !== undefined && {
          totalFaculty: facultyData.total[0].count,
        }),
        ...(subjectData?.total?.[0]?.count !== undefined && {
          totalSubjects: subjectData.total[0].count,
        }),
        ...(attendanceData?.overall?.[0]?.averageAttendance !== undefined && {
          averageAttendance: Number(
            attendanceData.overall[0].averageAttendance.toFixed(2)
          ),
        }),
        ...(marksData?.overall?.[0]?.averageMarks !== undefined && {
          averageMarks: Number(marksData.overall[0].averageMarks.toFixed(2)),
          averageMarksPercentage: Number(
            marksData.overall[0].averagePercentage.toFixed(2)
          ),
        }),
        ...(feesData?.overall?.[0] && {
          totalFees: feesData.overall[0].totalFees,
          feesCollected: feesData.overall[0].feesCollected,
          pendingFees: feesData.overall[0].pendingFees,
          partiallyPaid: feesData.overall[0].partiallyPaid,
          collectionPercentage:
            feesData.overall[0].collectionPercentage === null
              ? null
              : Number(feesData.overall[0].collectionPercentage.toFixed(2)),
        }),
        ...(timetableData?.total?.[0]?.count !== undefined && {
          timetableEntries: timetableData.total[0].count,
        }),
      },
      students: {
        total: studentData?.total?.[0]?.count ?? null,
        byDepartment: studentData?.departments || [],
        byYear: studentData?.years || [],
        bySection: studentData?.sections || [],
      },
      faculty: {
        total: facultyData?.total?.[0]?.count ?? null,
        byDepartment: facultyData?.departments || [],
        byDesignation: facultyData?.designations || [],
        workloadAvailable: false,
      },
      subjects: {
        total: subjectData?.total?.[0]?.count ?? null,
        byDepartment: subjectData?.departments || [],
      },
      attendance: {
        overall: attendanceData?.overall?.[0] || null,
        byDepartment: attendanceData?.departments || [],
        byYear: attendanceData?.years || [],
        bySubject: attendanceData?.subjects || [],
        lowestStudents: attendanceData?.students || [],
      },
      results: {
        overall: marksData?.overall?.[0] || null,
        byDepartment: marksData?.departments || [],
        byYear: marksData?.years || [],
        bySubject: marksData?.subjects || [],
        topStudents: marksData?.students || [],
        passRatesAvailable: false,
      },
      fees: {
        overall: feesData?.overall?.[0] || null,
        byDepartment: feesData?.departments || [],
        statuses: feesData?.statuses || [],
        available: (feesData?.overall?.[0]?.records || 0) > 0,
      },
      timetable: {
        total: timetableData?.total?.[0]?.count ?? null,
        byDepartment: timetableData?.departments || [],
      },
      unavailableSections,
      filters: {
        department: department || null,
        semester: semester ? Number(semester) : null,
        year,
        section: section || null,
        academicYear: academicYear || null,
      },
    });

  } catch (err) {
    return res.status(500).json({ message: "Unable to load report data" });
  }
};
