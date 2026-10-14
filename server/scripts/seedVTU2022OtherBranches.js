const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

const Subject = require("../models/Subject");

const SCHEME = "2022";
const ACADEMIC_YEAR = "2026-2027";

const BRANCH_PREFIX = {
  ECE: "BEC",
  EEE: "BEE",
  ME: "BME",
  CIVIL: "BCV",
  AIML: "BAI",
};

function makeSubject(
  department,
  semester,
  code,
  name,
  type = "PCC",
  electiveGroup = ""
) {
  return {
    department,
    subjectCode: code,
    subjectName: name,
    year: String(Math.ceil(semester / 2)),
    scheme: SCHEME,
    semester: String(semester),
    academicYear: ACADEMIC_YEAR,
    subjectType: type,
    electiveGroup,
  };
}

function branchCode(code, department) {
  if (code.startsWith("BXX")) {
    return code.replace(/^BXX/, BRANCH_PREFIX[department]);
  }

  return code;
}

function s(
  department,
  semester,
  code,
  name,
  type = "PCC",
  group = ""
) {
  return makeSubject(
    department,
    semester,
    branchCode(code, department),
    name,
    type,
    group
  );
}

/*
===========================================================
ECE
===========================================================
*/

const ECE = [

  // SEM 1
  s("ECE", 1, "BMATE101", "Mathematics-I for EEE Stream", "BSC"),
  s("ECE", 1, "BPHYE102", "Applied Physics for EEE Stream", "BSC"),
  s("ECE", 1, "BBEE103", "Basic Electronics for EEE Stream", "ESC"),
  s("ECE", 1, "BESCK104x", "Engineering Science Course-I", "ESC", "BESCK104"),
  s("ECE", 1, "BETCK105x", "Emerging Technology Course-I", "ETC", "BETCK105"),
  s("ECE", 1, "BENGK106", "Communicative English", "AEC"),
  s("ECE", 1, "BICOK107", "Indian Constitution", "HSMS"),
  s("ECE", 1, "BIDTK158", "Innovation and Design Thinking", "AEC"),

  // SEM 2
  s("ECE", 2, "BMATE201", "Mathematics-II for EEE Stream", "BSC"),
  s("ECE", 2, "BCHEE202", "Applied Chemistry for EEE Stream", "BSC"),
  s("ECE", 2, "BCEDK203", "Computer-Aided Engineering Drawing", "ESC"),
  s("ECE", 2, "BESCK204x", "Engineering Science Course-II", "ESC", "BESCK204"),
  s("ECE", 2, "BPLCK205x", "Programming Language Course-II", "PLC", "BPLCK205"),
  s("ECE", 2, "BENGK206", "Communicative English", "AEC"),
  s("ECE", 2, "BICOK207", "Indian Constitution", "HSMS"),
  s("ECE", 2, "BSFHK258", "Scientific Foundations for Health", "HSMS"),

  // SEM 3
  s("ECE", 3, "BEC301", "AV Mathematics-III for EC Engineering", "BSC"),
  s("ECE", 3, "BEC302", "Digital System Design using Verilog", "IPCC"),
  s("ECE", 3, "BEC303", "Electronic Principles and Circuits", "PCC"),
  s("ECE", 3, "BEC304", "Network Analysis", "PCC"),
  s("ECE", 3, "BECL305", "Analog and Digital Systems Design Lab", "PCCL"),
  s("ECE", 3, "BEC306x", "Engineering Science / Emerging Technology / Programming Language Course", "ESC", "BEC306"),

  // SEM 4
  s("ECE", 4, "BEC401", "Signals and Systems", "PCC"),
  s("ECE", 4, "BEC402", "Analog Circuits", "IPCC"),
  s("ECE", 4, "BEC403", "Microcontrollers", "PCC"),
  s("ECE", 4, "BECL404", "Analog Circuits and Microcontrollers Lab", "PCCL"),
  s("ECE", 4, "BEC405x", "Engineering Science / Emerging Technology / Programming Language Course", "ESC", "BEC405"),
  s("ECE", 4, "BEC456x", "Ability Enhancement / Skill Enhancement Course-IV", "AEC", "BEC456"),
  s("ECE", 4, "BBOK407", "Biology for Engineers", "BSC"),
  s("ECE", 4, "BUHK408", "Universal Human Values Course", "UHV"),

  // SEM 5
  s("ECE", 5, "BEC501", "Technological Innovation and Management Entrepreneurship", "HSMS"),
  s("ECE", 5, "BEC502", "Digital Signal Processing", "IPCC"),
  s("ECE", 5, "BEC503", "Digital Communication", "PCC"),
  s("ECE", 5, "BECL504", "Digital Communication Lab", "PCCL"),
  s("ECE", 5, "BEC515x", "Professional Elective Course", "PEC", "BEC515"),
  s("ECE", 5, "BEC586", "Mini Project", "PROJ"),
  s("ECE", 5, "BRMK557", "Research Methodology and IPR", "AEC"),
  s("ECE", 5, "BESK508", "Environmental Studies", "MC"),

  // SEM 6
  s("ECE", 6, "BEC601", "Embedded System Design", "IPCC"),
  s("ECE", 6, "BEC602", "VLSI Design and Testing", "PCC"),
  s("ECE", 6, "BEC613x", "Professional Elective Course", "PEC", "BEC613"),
  s("ECE", 6, "BEC654x", "Open Elective Course", "OEC", "BEC654"),
  s("ECE", 6, "BEC685", "Major Project Phase I", "PROJ"),
  s("ECE", 6, "BECL606", "VLSI Design and Testing Lab", "PCCL"),
  s("ECE", 6, "BEC657x", "Ability Enhancement / Skill Development Course V", "AEC", "BEC657"),
  s("ECE", 6, "BIKS609", "Indian Knowledge System", "IKS"),

  // SEM 7
  s("ECE", 7, "BEC701", "Microwave Engineering and Antenna Theory", "IPCC"),
  s("ECE", 7, "BEC702", "Computer Networks and Protocols", "IPCC"),
  s("ECE", 7, "BEC703", "Wireless Communication Systems", "PCC"),
  s("ECE", 7, "BEC714x", "Professional Elective Course", "PEC", "BEC714"),
  s("ECE", 7, "BEC755x", "Open Elective Course", "OEC", "BEC755"),
  s("ECE", 7, "BEC786", "Major Project Phase-II", "PROJ"),

  // SEM 8
  s("ECE", 8, "BEC801x", "Professional Elective (Online Courses)", "PEC", "BEC801"),
  s("ECE", 8, "BEC802x", "Open Elective (Online Courses)", "OEC", "BEC802"),
  s("ECE", 8, "BEC803", "Internship (Industry/Research)", "INT"),
];

/*
===========================================================
EEE
===========================================================
*/

const EEE = [

  // SEM 1
  s("EEE", 1, "BMATE101", "Mathematics-I for EEE Stream", "BSC"),
  s("EEE", 1, "BPHYE102", "Applied Physics for EEE Stream", "BSC"),
  s("EEE", 1, "BEEE103", "Elements of Electrical Engineering", "ESC"),
  s("EEE", 1, "BESCK104x", "Engineering Science Course-I", "ESC", "BESCK104"),
  s("EEE", 1, "BETCK105x", "Emerging Technology Course-I", "ETC", "BETCK105"),
  s("EEE", 1, "BENGK106", "Communicative English", "AEC"),
  s("EEE", 1, "BICOK107", "Indian Constitution", "HSMS"),
  s("EEE", 1, "BIDTK158", "Innovation and Design Thinking", "AEC"),

  // SEM 2
  s("EEE", 2, "BMATE201", "Mathematics-II for EEE Stream", "BSC"),
  s("EEE", 2, "BCHEE202", "Applied Chemistry for EEE Stream", "BSC"),
  s("EEE", 2, "BCEDK203", "Computer-Aided Engineering Drawing", "ESC"),
  s("EEE", 2, "BESCK204x", "Engineering Science Course-II", "ESC", "BESCK204"),
  s("EEE", 2, "BPLCK205x", "Programming Language Course-II", "PLC", "BPLCK205"),
  s("EEE", 2, "BENGK206", "Communicative English", "AEC"),
  s("EEE", 2, "BICOK207", "Indian Constitution", "HSMS"),
  s("EEE", 2, "BSFHK258", "Scientific Foundations for Health", "HSMS"),

  // SEM 3
  s("EEE", 3, "BEE301", "Engineering Mathematics for EEE", "BSC"),
  s("EEE", 3, "BEE302", "Electric Circuit Analysis", "IPCC"),
  s("EEE", 3, "BEE303", "Analog Electronic Circuits", "PCC"),
  s("EEE", 3, "BEE304", "Transformers and Generators", "PCC"),
  s("EEE", 3, "BEEL305", "Transformers and Generators Lab", "PCCL"),
  s("EEE", 3, "BEE306x", "Engineering Science / Emerging Technology / Programming Language Course", "ESC", "BEE306"),
  s("EEE", 3, "BSCK307", "Social Connect and Responsibility", "UHV"),
  s("EEE", 3, "BEE358x", "Ability Enhancement / Skill Enhancement Course-III", "AEC", "BEE358"),

  // SEM 4
  s("EEE", 4, "BEE401", "Electric Motors", "IPCC"),
  s("EEE", 4, "BEE402", "Transmission and Distribution", "PCC"),
  s("EEE", 4, "BEE403", "Microcontrollers", "PCC"),
  s("EEE", 4, "BEEL404", "Electric Motors Lab", "PCCL"),
  s("EEE", 4, "BEE405x", "Engineering Science / Emerging Technology / Programming Language Course", "ESC", "BEE405"),
  s("EEE", 4, "BEE456x", "Ability Enhancement / Skill Enhancement Course-IV", "AEC", "BEE456"),

  // SEM 5
  s("EEE", 5, "BXX501", "Engineering Management and Entrepreneurship", "HSMS"),
  s("EEE", 5, "BEE502", "Signals and DSP", "IPCC"),
  s("EEE", 5, "BEE503", "Power Electronics", "PCC"),
  s("EEE", 5, "BEEL504", "Power Electronics Lab", "PCCL"),
  s("EEE", 5, "BEE515x", "Professional Elective Course", "PEC", "BEE515"),
  s("EEE", 5, "BEE586", "Mini Project", "PROJ"),
  s("EEE", 5, "BRMK557", "Research Methodology and IPR", "AEC"),
  s("EEE", 5, "BESK508", "Environmental Studies", "MC"),

  // SEM 6
  s("EEE", 6, "BEE601", "Power System Analysis-I", "IPCC"),
  s("EEE", 6, "BEE602", "Control Systems", "PCC"),
  s("EEE", 6, "BEE613x", "Professional Elective Course", "PEC", "BEE613"),
  s("EEE", 6, "BEE654x", "Open Elective Course", "OEC", "BEE654"),
  s("EEE", 6, "BEE685", "Major Project Phase-I", "PROJ"),
  s("EEE", 6, "BEEL606", "Control Systems Lab", "PCCL"),
  s("EEE", 6, "BEE657x", "Ability Enhancement / Skill Development Course-V", "AEC", "BEE657"),
  s("EEE", 6, "BIKS609", "Indian Knowledge System", "IKS"),

  // SEM 7
  s("EEE", 7, "BEE701", "Switchgear and Protection", "IPCC"),
  s("EEE", 7, "BEE702", "Industrial Drives and Applications", "IPCC"),
  s("EEE", 7, "BEE703", "Power System Analysis-II", "PCC"),
  s("EEE", 7, "BEE714x", "Professional Elective Course", "PEC", "BEE714"),
  s("EEE", 7, "BEE755x", "Open Elective Course", "OEC", "BEE755"),
  s("EEE", 7, "BEE786", "Major Project Phase-II", "PROJ"),

  // SEM 8
  s("EEE", 8, "BEE801x", "Professional Elective (Online Courses)", "PEC", "BEE801"),
  s("EEE", 8, "BEE802x", "Open Elective (Online Courses)", "OEC", "BEE802"),
  s("EEE", 8, "BEE803", "Internship (Industry/Research)", "INT"),
];

/*
===========================================================
ME
===========================================================
*/

const ME = [

  // SEM 1
  s("ME", 1, "BMATM101", "Mathematics-I for Mechanical Engineering Stream", "BSC"),
  s("ME", 1, "BPHYM102", "Applied Physics for ME Stream", "BSC"),
  s("ME", 1, "BEMEM103", "Elements of Mechanical Engineering", "ESC"),
  s("ME", 1, "BESCK104x", "Engineering Science Course-I", "ESC", "BESCK104"),
  s("ME", 1, "BETCK105x", "Emerging Technology Course-I", "ETC", "BETCK105"),
  s("ME", 1, "BENGK106", "Communicative English", "AEC"),
  s("ME", 1, "BICOK107", "Indian Constitution", "HSMS"),
  s("ME", 1, "BIDTK158", "Innovation and Design Thinking", "AEC"),

  // SEM 2
  s("ME", 2, "BMATM201", "Mathematics-II for Mechanical Engineering Stream", "BSC"),
  s("ME", 2, "BCHEM202", "Applied Chemistry for Mechanical Engineering Stream", "BSC"),
  s("ME", 2, "BCEDK203", "Computer-Aided Engineering Drawing", "ESC"),
  s("ME", 2, "BESCK204x", "Engineering Science Course-II", "ESC", "BESCK204"),
  s("ME", 2, "BPLCK205x", "Programming Language Course-II", "PLC", "BPLCK205"),
  s("ME", 2, "BENGK206", "Communicative English", "AEC"),
  s("ME", 2, "BICOK207", "Indian Constitution", "HSMS"),
  s("ME", 2, "BSFHK258", "Scientific Foundations for Health", "HSMS"),

  // SEM 3
  s("ME", 3, "BME301", "Mechanics of Materials", "PCC"),
  s("ME", 3, "BME302", "Manufacturing Process", "IPCC"),
  s("ME", 3, "BME303", "Material Science and Engineering", "PCC"),
  s("ME", 3, "BME304", "Basic Thermodynamics", "PCC"),
  s("ME", 3, "BME305", "Introduction to Modelling and Design for Manufacturing", "PCC"),
  s("ME", 3, "BME306x", "Engineering Science / Emerging Technology / Programming Language Course", "ESC", "BME306"),
  s("ME", 3, "BSCK307", "Social Connect and Responsibility", "UHV"),
  s("ME", 3, "BME358x", "Ability Enhancement / Skill Enhancement Course-III", "AEC", "BME358"),

  // SEM 4
  s("ME", 4, "BME401", "Applied Thermodynamics", "PCC"),
  s("ME", 4, "BME402", "Machining Science and Metrology", "IPCC"),
  s("ME", 4, "BME403", "Fluid Mechanics", "PCC"),
  s("ME", 4, "BME404", "Mechanical Measurements and Metrology Lab", "PCCL"),
  s("ME", 4, "BME405x", "Engineering Science / Emerging Technology / Programming Language Course", "ESC", "BME405"),
  s("ME", 4, "BME456x", "Ability Enhancement / Skill Enhancement Course-IV", "AEC", "BME456"),

  // SEM 5
  s("ME", 5, "BME501", "Industrial Management and Entrepreneurship", "HSMS"),
  s("ME", 5, "BME502", "Turbo Machines", "IPCC"),
  s("ME", 5, "BME503", "Theory of Machines", "PCC"),
  s("ME", 5, "BME504L", "CNC Programming and 3-D Printing Lab", "PCCL"),
  s("ME", 5, "BME515x", "Professional Elective-I", "PEC", "BME515"),
  s("ME", 5, "BME586", "Mini Project", "PROJ"),
  s("ME", 5, "BRMK557", "Research Methodology and IPR", "AEC"),
  s("ME", 5, "BESK508", "Environmental Studies", "MC"),

  // SEM 6
  s("ME", 6, "BME601", "Heat Transfer", "IPCC"),
  s("ME", 6, "BME602", "Machine Design", "PCC"),
  s("ME", 6, "BME613x", "Professional Elective-II", "PEC", "BME613"),
  s("ME", 6, "BME654x", "Open Elective-I", "OEC", "BME654"),
  s("ME", 6, "BME685", "Major Project Phase-I", "PROJ"),
  s("ME", 6, "BMEL606L", "Design Lab", "PCCL"),
  s("ME", 6, "BME657x", "Ability Enhancement / Skill Development Course-V", "AEC", "BME657"),
  s("ME", 6, "BIKS609", "Indian Knowledge System", "IKS"),

  // SEM 7
  s("ME", 7, "BME701", "Finite Element Methods", "IPCC"),
  s("ME", 7, "BME702", "Hydraulics and Pneumatics", "IPCC"),
  s("ME", 7, "BME703", "Control Engineering", "PCC"),
  s("ME", 7, "BME714x", "Professional Elective-III", "PEC", "BME714"),
  s("ME", 7, "BME755x", "Open Elective-II", "OEC", "BME755"),
  s("ME", 7, "BME786", "Major Project Phase-II", "PROJ"),

  // SEM 8
  s("ME", 8, "BME801x", "Professional Elective-IV (Online Courses)", "PEC", "BME801"),
  s("ME", 8, "BME802x", "Open Elective-III (Online Courses)", "OEC", "BME802"),
  s("ME", 8, "BME803", "Internship (Industry/Research)", "INT"),
];

/*
===========================================================
CIVIL
===========================================================
*/

const CIVIL = [

  // SEM 1
  s("CIVIL", 1, "BMATC101", "Mathematics-I for Civil Engineering Stream", "BSC"),
  s("CIVIL", 1, "BPHYC102", "Applied Physics for Civil Engineering Stream", "BSC"),
  s("CIVIL", 1, "BCIVC103", "Engineering Mechanics", "ESC"),
  s("CIVIL", 1, "BESCK104x", "Engineering Science Course-I", "ESC", "BESCK104"),
  s("CIVIL", 1, "BETCK105x", "Emerging Technology Course-I", "ETC", "BETCK105"),
  s("CIVIL", 1, "BENGK106", "Communicative English", "AEC"),
  s("CIVIL", 1, "BICOK107", "Indian Constitution", "HSMS"),
  s("CIVIL", 1, "BIDTK158", "Innovation and Design Thinking", "AEC"),

  // SEM 2
  s("CIVIL", 2, "BMATC201", "Mathematics-II for Civil Engineering Stream", "BSC"),
  s("CIVIL", 2, "BCHEC202", "Applied Chemistry for Civil Engineering Stream", "BSC"),
  s("CIVIL", 2, "BCEDK203", "Computer-Aided Engineering Drawing", "ESC"),
  s("CIVIL", 2, "BESCK204x", "Engineering Science Course-II", "ESC", "BESCK204"),
  s("CIVIL", 2, "BPLCK205x", "Programming Language Course-II", "PLC", "BPLCK205"),
  s("CIVIL", 2, "BENGK206", "Communicative English", "AEC"),
  s("CIVIL", 2, "BICOK207", "Indian Constitution", "HSMS"),
  s("CIVIL", 2, "BSFHK258", "Scientific Foundations for Health", "HSMS"),

  // SEM 3
  s("CIVIL", 3, "BCV301", "Engineering Mathematics-III", "BSC"),
  s("CIVIL", 3, "BCV302", "Strength of Materials", "IPCC"),
  s("CIVIL", 3, "BCV303", "Building Materials and Construction", "PCC"),
  s("CIVIL", 3, "BCV304", "Surveying", "IPCC"),
  s("CIVIL", 3, "BCVL305", "Surveying Lab", "PCCL"),
  s("CIVIL", 3, "BCV306x", "Engineering Science / Emerging Technology / Programming Language Course", "ESC", "BCV306"),
  s("CIVIL", 3, "BSCK307", "Social Connect and Responsibility", "UHV"),
  s("CIVIL", 3, "BCV358x", "Ability Enhancement / Skill Enhancement Course-III", "AEC", "BCV358"),

  // SEM 4
  s("CIVIL", 4, "BCV401", "Analysis of Structures", "PCC"),
  s("CIVIL", 4, "BCV402", "Fluid Mechanics and Hydraulics", "IPCC"),
  s("CIVIL", 4, "BCV403", "Transportation Engineering", "IPCC"),
  s("CIVIL", 4, "BCVL404", "Building Materials Testing Lab", "PCCL"),
  s("CIVIL", 4, "BCV405x", "Engineering Science / Emerging Technology / Programming Language Course", "ESC", "BCV405"),
  s("CIVIL", 4, "BCV456x", "Ability Enhancement / Skill Enhancement Course-IV", "AEC", "BCV456"),
  s("CIVIL", 4, "BBOK407", "Biology for Engineers", "BSC"),
  s("CIVIL", 4, "BUHK408", "Universal Human Values Course", "UHV"),

  // SEM 5
  s("CIVIL", 5, "BCV501", "Construction Management and Entrepreneurship", "HSMS"),
  s("CIVIL", 5, "BCV502", "Geotechnical Engineering", "IPCC"),
  s("CIVIL", 5, "BCV503", "Concrete Technology", "IPCC"),
  s("CIVIL", 5, "BCV504", "Environmental Engineering Lab", "PCCL"),
  s("CIVIL", 5, "BCV515x", "Professional Elective Course", "PEC", "BCV515"),
  s("CIVIL", 5, "BCV586", "Mini Project / Extensive Survey Project", "PROJ"),
  s("CIVIL", 5, "BRMK557", "Research Methodology and IPR", "AEC"),
  s("CIVIL", 5, "BESK508", "Environmental Studies", "MC"),

  // SEM 6
  s("CIVIL", 6, "BCV601", "Design of RCC Structures", "IPCC"),
  s("CIVIL", 6, "BCV602", "Irrigation Engineering and Hydraulic Structures", "PCC"),
  s("CIVIL", 6, "BCV613x", "Professional Elective Course", "PEC", "BCV613"),
  s("CIVIL", 6, "BCV654x", "Open Elective Course", "OEC", "BCV654"),
  s("CIVIL", 6, "BCV685", "Major Project Phase-I", "PROJ"),
  s("CIVIL", 6, "BCVL606", "Software Application Lab", "PCCL"),
  s("CIVIL", 6, "BCV657x", "Ability Enhancement / Skill Development Course-V", "AEC", "BCV657"),
  s("CIVIL", 6, "BIKS609", "Indian Knowledge System", "IKS"),

  // SEM 7
  s("CIVIL", 7, "BCV701", "Design of Steel Structures", "IPCC"),
  s("CIVIL", 7, "BCV702", "Estimation and Contract Management", "IPCC"),
  s("CIVIL", 7, "BCV703", "Prestressed Concrete", "PCC"),
  s("CIVIL", 7, "BCV714x", "Professional Elective Course", "PEC", "BCV714"),
  s("CIVIL", 7, "BCV755x", "Open Elective Course", "OEC", "BCV755"),
  s("CIVIL", 7, "BCV786", "Major Project Phase-II", "PROJ"),

  // SEM 8
  s("CIVIL", 8, "BCV801x", "Professional Elective (Online Courses)", "PEC", "BCV801"),
  s("CIVIL", 8, "BCV802x", "Open Elective (Online Courses)", "OEC", "BCV802"),
  s("CIVIL", 8, "BCV803", "Internship (Industry/Research)", "INT"),
];

/*
===========================================================
AIML
===========================================================

For this DEMO:
- Sem 1-2 use the CSE-stream first-year structure.
- Sem 3-8 use the AIML scheme.
- BXX elective slots are converted to BAI for the demo.
===========================================================
*/

const AIML = [

  // SEM 1
  s("AIML", 1, "BMATS101", "Mathematics-I for CSE Stream", "BSC"),
  s("AIML", 1, "BPHYS102", "Applied Physics for CSE Stream", "BSC"),
  s("AIML", 1, "BPOPS103", "Principles of Programming Using C", "PCC"),
  s("AIML", 1, "BESCK104x", "Engineering Science Course-I", "ESC", "BESCK104"),
  s("AIML", 1, "BETCK105x", "Emerging Technology Course-I", "ETC", "BETCK105"),
  s("AIML", 1, "BENGK106", "Communicative English", "AEC"),
  s("AIML", 1, "BICOK107", "Indian Constitution", "HSMS"),
  s("AIML", 1, "BIDTK158", "Innovation and Design Thinking", "AEC"),

  // SEM 2
  s("AIML", 2, "BMATS201", "Mathematics-II for CSE Stream", "BSC"),
  s("AIML", 2, "BCHES202", "Applied Chemistry for CSE Stream", "BSC"),
  s("AIML", 2, "BCEDK203", "Computer-Aided Engineering Drawing", "ESC"),
  s("AIML", 2, "BESCK204x", "Engineering Science Course-II", "ESC", "BESCK204"),
  s("AIML", 2, "BPLCK205x", "Programming Language Course-II", "PLC", "BPLCK205"),
  s("AIML", 2, "BENGK206", "Communicative English", "AEC"),
  s("AIML", 2, "BICOK207", "Indian Constitution", "HSMS"),
  s("AIML", 2, "BSFHK258", "Scientific Foundations for Health", "HSMS"),

  // SEM 3
  s("AIML", 3, "BCS301", "Mathematics for Computer Science", "BSC"),
  s("AIML", 3, "BCS302", "Digital Design & Computer Organization", "IPCC"),
  s("AIML", 3, "BCS303", "Operating Systems", "IPCC"),
  s("AIML", 3, "BCS304", "Data Structures and Applications", "PCC"),
  s("AIML", 3, "BCSL305", "Data Structures Lab", "PCCL"),
  s("AIML", 3, "BAI306x", "Engineering Science / Emerging Technology / Programming Language Course", "ESC", "BAI306"),
  s("AIML", 3, "BSCK307", "Social Connect and Responsibility", "UHV"),
  s("AIML", 3, "BAI358x", "Ability Enhancement / Skill Enhancement Course-III", "AEC", "BAI358"),

  // SEM 4
  s("AIML", 4, "BCS401", "Analysis & Design of Algorithms", "PCC"),
  s("AIML", 4, "BAD402", "Artificial Intelligence", "IPCC"),
  s("AIML", 4, "BCS403", "Database Management Systems", "IPCC"),
  s("AIML", 4, "BCSL404", "Analysis & Design of Algorithms Lab", "PCCL"),
  s("AIML", 4, "BAI405x", "Engineering Science / Emerging Technology / Programming Language Course", "ESC", "BAI405"),
  s("AIML", 4, "BDS456x", "Ability Enhancement / Skill Enhancement Course-IV", "AEC", "BDS456"),
  s("AIML", 4, "BBOK407", "Biology for Engineers", "BSC"),
  s("AIML", 4, "BUHK408", "Universal Human Values Course", "UHV"),

  // SEM 5
  s("AIML", 5, "BCS501", "Software Engineering & Project Management", "PCC"),
  s("AIML", 5, "BCS502", "Computer Networks", "IPCC"),
  s("AIML", 5, "BCS503", "Theory of Computation", "PCC"),
  s("AIML", 5, "BAIL504", "Data Visualization Lab", "PCCL"),
  s("AIML", 5, "BAI515x", "Professional Elective Course", "PEC", "BAI515"),
  s("AIML", 5, "BAI586", "Mini Project", "PROJ"),
  s("AIML", 5, "BRMK557", "Research Methodology and IPR", "AEC"),
  s("AIML", 5, "BCS508", "Environmental Studies and E-waste Management", "HSMS"),

  // SEM 6
  s("AIML", 6, "BAI601", "Natural Language Processing", "IPCC"),
  s("AIML", 6, "BAI602", "Machine Learning-I", "PCC"),
  s("AIML", 6, "BAI613x", "Professional Elective Course", "PEC", "BAI613"),
  s("AIML", 6, "BAI654x", "Open Elective Course", "OEC", "BAI654"),
  s("AIML", 6, "BAI685", "Project Phase-I", "PROJ"),
  s("AIML", 6, "BAIL606", "Machine Learning Lab", "PCCL"),
  s("AIML", 6, "BAI657x", "Ability Enhancement / Skill Development Course-V", "AEC", "BAI657"),
  s("AIML", 6, "BIKS609", "Indian Knowledge System", "IKS"),

  // SEM 7
  s("AIML", 7, "BAI701", "Deep Learning & Reinforcement Learning", "IPCC"),
  s("AIML", 7, "BAI702", "Machine Learning-II", "IPCC"),
  s("AIML", 7, "BAD703", "Data Security & Privacy", "PCC"),
  s("AIML", 7, "BAI714x", "Professional Elective Course", "PEC", "BAI714"),
  s("AIML", 7, "BAI755x", "Open Elective Course", "OEC", "BAI755"),
  s("AIML", 7, "BAI786", "Major Project Phase-II", "PROJ"),

  // SEM 8
  s("AIML", 8, "BAI801x", "Professional Elective (Online Courses)", "PEC", "BAI801"),
  s("AIML", 8, "BAI802x", "Open Elective (Online Courses)", "OEC", "BAI802"),
  s("AIML", 8, "BAI803", "Internship (Industry/Research)", "INT"),
];

/*
===========================================================
COMBINE
===========================================================
*/

const allSubjects = [
  ...ECE,
  ...EEE,
  ...ME,
  ...CIVIL,
  ...AIML,
];

/*
===========================================================
VALIDATION
===========================================================
*/

function validateData() {
  const keys = new Set();

  for (const item of allSubjects) {

    if (
      !item.department ||
      !item.subjectCode ||
      !item.subjectName ||
      !item.year ||
      !item.scheme ||
      !item.semester ||
      !item.academicYear
    ) {
      throw new Error(
        `Incomplete record: ${JSON.stringify(item)}`
      );
    }

    if (item.scheme !== SCHEME) {
      throw new Error(
        `Invalid scheme: ${item.subjectCode}`
      );
    }

    if (item.academicYear !== ACADEMIC_YEAR) {
      throw new Error(
        `Invalid academic year: ${item.subjectCode}`
      );
    }

    const key =
      `${item.department}|${item.semester}|${item.subjectCode}`;

    if (keys.has(key)) {
      throw new Error(`Duplicate subject: ${key}`);
    }

    keys.add(key);
  }

  console.log(
    `Validated ${allSubjects.length} records.`
  );
}

/*
===========================================================
SEED
===========================================================
*/

async function seed() {

  try {

    validateData();

    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is missing in server/.env"
      );
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("\nMongoDB connected.");
    console.log("VTU 2022 OTHER BRANCHES");
    console.log("========================\n");

    let inserted = 0;
    let skipped = 0;

    for (const item of allSubjects) {

      const existing = await Subject.findOne({
        department: item.department,
        subjectCode: item.subjectCode,
        scheme: item.scheme,
        semester: item.semester,
        academicYear: item.academicYear,
      });

      if (existing) {
        skipped++;

        console.log(
          `SKIPPED: ${item.department} | Sem ${item.semester} | ${item.subjectCode}`
        );

        continue;
      }

      await Subject.create(item);

      inserted++;

      console.log(
        `INSERTED: ${item.department} | Sem ${item.semester} | ${item.subjectCode} | ${item.subjectName}`
      );
    }

    console.log("\n====================================");
    console.log("SEED COMPLETE");
    console.log("====================================");

    console.log(`Inserted : ${inserted}`);
    console.log(`Skipped  : ${skipped}`);
    console.log(`Prepared : ${allSubjects.length}`);

    /*
    =======================================================
    FINAL READ-ONLY VERIFICATION
    =======================================================
    */

    console.log("\nFINAL DATABASE COUNTS\n");

    const departments = [
      "CSE",
      "ECE",
      "EEE",
      "ME",
      "CIVIL",
      "AIML",
    ];

    for (const department of departments) {

      const records = await Subject.find({
        department,
        scheme: SCHEME,
        academicYear: ACADEMIC_YEAR,
      })
        .sort({ semester: 1, subjectCode: 1 })
        .lean();

      const semesterCounts = {};

      for (const record of records) {
        semesterCounts[record.semester] =
          (semesterCounts[record.semester] || 0) + 1;
      }

      console.log(
        `${department}: ${records.length} records`,
        semesterCounts
      );

      const badBxx = records.filter(
        (record) =>
          record.subjectCode.startsWith("BXX")
      );

      if (badBxx.length > 0) {

        console.log(
          `WARNING: ${department} still has BXX codes:`
        );

        badBxx.forEach((record) => {
          console.log(
            `  ${record.subjectCode}`
          );
        });
      }

      const xSlots = records.filter(
        (record) =>
          record.subjectCode.endsWith("x")
      );

      if (xSlots.length > 0) {

        console.log(
          `${department} x-slots: ${xSlots
            .map((record) => record.subjectCode)
            .join(", ")}`
        );
      }
    }

    const cseCount = await Subject.countDocuments({
      department: "CSE",
      scheme: SCHEME,
      academicYear: ACADEMIC_YEAR,
    });

    console.log(
      `\nCSE verification: ${cseCount} records`
    );

    console.log(
      "NO CSE RECORDS WERE MODIFIED."
    );

  } catch (error) {

    console.error("\nSEED FAILED:");
    console.error(error.message);

    process.exitCode = 1;

  } finally {

    await mongoose.disconnect();

    console.log("\nMongoDB disconnected.");
  }
}

seed();