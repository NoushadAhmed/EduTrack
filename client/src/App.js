import React from "react";
import { useSelector } from "react-redux";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import jwt_decode from "jwt-decode";
import authToken from "./redux/utils/authToken";
import store from "./redux/store";
import Register from './pages/Register'
import StudentRegister from "./pages/StudentRegister";
import FacultyRegister from "./pages/FacultyRegister";

import { setFacultyUser, facultyLogout } from "./redux/actions/facultyAction";
import {
  setAdminUser,
  adminLogout,
} from "./redux/actions/adminAction";
import { setStudentUser, studentLogout } from "./redux/actions/studentAction";

import {
  FacultyStudentLogin,
  AdminLogin,
  AdminDashboard,
  AdminProfile,
  AdminAcademic,
  AdminGetFaculty,
  AdminFacultyDirectory,
  AdminFacultyProfile,
  AdminGetStudents,
  AdminStudentProfile,
  AdminGetSubjects,
  AdminSubjectProfile,
  AdminAttendance,
  AdminResults,
  AdminTimetable,
  AdminFees,
  AdminReports,
  AdminAddFaculty,
  AdminAddStudent,
  AdminAddSubject,
  FacultyDashboard,
  FacultyUploadMarks,
  FacultyAttendance,
  FacultySubjects,
  FacultyStudents,
  StudentDashboard,
  StudentFees,
  StudentSubjectList,
  StudentPerformance,
  StudentAttendance,
  StudentUpdateProfile,
  StudentUpdatePassword,
  StudentSearch,
  StudentDetails,
  FacultyUpdateProfile,
  FacultyUpdatePassword,
  ForgotPassword,
  Chat,
  StudentChats,
  StudentTimetable,
  FacultyTimetable,
} from "./pages";

const authTokens = [
  {
    key: "facultyToken",
    role: "faculty",
    loginPath: "/",
    setUser: setFacultyUser,
    logout: facultyLogout,
  },
  {
    key: "studentToken",
    role: "student",
    loginPath: "/",
    setUser: setStudentUser,
    logout: studentLogout,
  },
  {
    key: "adminToken",
    role: "admin",
    loginPath: "/admin/login",
    setUser: setAdminUser,
    logout: adminLogout,
  },
];

const storedAuth = authTokens.find(({ key }) => window.localStorage.getItem(key));
if (storedAuth) {
  const token = window.localStorage.getItem(storedAuth.key);
  try {
    const decoded = jwt_decode(token.replace(/^Bearer\s+/i, ""));
    if (!decoded.exp || decoded.exp <= Date.now() / 1000) {
      throw new Error("Expired authentication token");
    }
    authToken(token);
    store.dispatch(storedAuth.setUser({ ...decoded, role: storedAuth.role }));
    authTokens
      .filter(({ key }) => key !== storedAuth.key)
      .forEach(({ key }) => window.localStorage.removeItem(key));
  } catch (err) {
    authTokens.forEach(({ key }) => window.localStorage.removeItem(key));
    authToken(false);
    store.dispatch(storedAuth.logout());
    window.location.replace(storedAuth.loginPath);
  }
}

const RequireRole = ({ role, children }) => {
  const isAuthenticated = useSelector(
    (state) => state[role]?.isAuthenticated
  );
  if (isAuthenticated) return children;
  return (
    <Navigate
      to={role === "admin" ? "/admin/login" : "/"}
      replace
    />
  );
};

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route exact path="/" element={<FacultyStudentLogin />} />
          <Route exact path="/register" element={<Register />} />
          <Route
            exact
            path="/register/student"
            element={<StudentRegister />}
          />
          <Route
            exact
            path="/register/faculty"
            element={<FacultyRegister />}
          />
          <Route exact path="/admin/login" element={<AdminLogin />} />
          <Route exact path="/faculty" element={<RequireRole role="faculty"><FacultyDashboard /></RequireRole>} />
          <Route exact path="/faculty/profile" element={<RequireRole role="faculty"><FacultyDashboard /></RequireRole>} />
          <Route exact path="/faculty/subjects" element={<RequireRole role="faculty"><FacultySubjects /></RequireRole>} />
          <Route exact path="/faculty/students" element={<RequireRole role="faculty"><FacultyStudents /></RequireRole>} />
          <Route exact path="/home" element={<RequireRole role="student"><StudentDashboard /></RequireRole>} />
          <Route exact path="/admin" element={<RequireRole role="admin"><AdminDashboard /></RequireRole>} />
          <Route exact path="/admin/profile" element={<RequireRole role="admin"><AdminProfile /></RequireRole>} />
          <Route exact path="/admin/academic" element={<RequireRole role="admin"><AdminAcademic /></RequireRole>} />
          <Route exact path="/admin/faculties" element={<RequireRole role="admin"><AdminGetFaculty /></RequireRole>} />
          <Route exact path="/admin/faculty" element={<RequireRole role="admin"><AdminFacultyDirectory /></RequireRole>} />
          <Route exact path="/admin/faculty/:registrationNumber" element={<RequireRole role="admin"><AdminFacultyProfile /></RequireRole>} />
          <Route exact path="/admin/students" element={<RequireRole role="admin"><AdminGetStudents /></RequireRole>} />
          <Route exact path="/admin/students/:registrationNumber" element={<RequireRole role="admin"><AdminStudentProfile /></RequireRole>} />
          <Route exact path="/admin/subjects" element={<RequireRole role="admin"><AdminGetSubjects /></RequireRole>} />
          <Route exact path="/admin/subjects/:subjectCode" element={<RequireRole role="admin"><AdminSubjectProfile /></RequireRole>} />
          <Route exact path="/admin/attendance" element={<RequireRole role="admin"><AdminAttendance /></RequireRole>} />
          <Route exact path="/admin/results" element={<RequireRole role="admin"><AdminResults /></RequireRole>} />
          <Route exact path="/admin/timetable" element={<RequireRole role="admin"><AdminTimetable /></RequireRole>} />
          <Route exact path="/admin/fees" element={<RequireRole role="admin"><AdminFees /></RequireRole>} />
          <Route exact path="/admin/fees/student/:registrationNumber" element={<RequireRole role="admin"><AdminFees /></RequireRole>} />
          <Route exact path="/admin/reports" element={<RequireRole role="admin"><AdminReports /></RequireRole>} />
          <Route exact path="/admin/results/student/:registrationNumber" element={<RequireRole role="admin"><AdminResults /></RequireRole>} />
          <Route exact path="/admin/results/subject/:subjectCode" element={<RequireRole role="admin"><AdminResults /></RequireRole>} />
          <Route
            exact
            path="/admin/add/faculties"
            element={<RequireRole role="admin"><AdminAddFaculty /></RequireRole>}
          />
          <Route
            exact
            path="/admin/add/students"
            element={<RequireRole role="admin"><AdminAddStudent /></RequireRole>}
          />
          <Route
            exact
            path="/admin/add/subjects"
            element={<RequireRole role="admin"><AdminAddSubject /></RequireRole>}
          />
          <Route
            exact
            path="/student/subjects"
            element={<RequireRole role="student"><StudentSubjectList /></RequireRole>}
          />
          <Route
            exact
            path="/student/performance"
            element={<RequireRole role="student"><StudentPerformance /></RequireRole>}
          />
          <Route exact path="/student/timetable" element={<RequireRole role="student"><StudentTimetable /></RequireRole>} />
          <Route exact path="/student/fees" element={<RequireRole role="student"><StudentFees /></RequireRole>} />
          <Route
            exact
            path="/student/attendance"
            element={<RequireRole role="student"><StudentAttendance /></RequireRole>}
          />
          <Route exact path="/student/search" element={<RequireRole role="student"><StudentSearch /></RequireRole>} />
          <Route exact path="/student/chatList" element={<RequireRole role="student"><StudentChats /></RequireRole>} />
          <Route
            exact
            path="/profile/:registrationNumber"
            element={<RequireRole role="student"><StudentDetails /></RequireRole>}
          />
          <Route
            exact
            path="/student/update"
            element={<RequireRole role="student"><StudentUpdateProfile /></RequireRole>}
          />
          <Route
            exact
            path="/faculty/update"
            element={<RequireRole role="faculty"><FacultyUpdateProfile /></RequireRole>}
          />
          <Route exact path="/faculty/marks" element={<RequireRole role="faculty"><FacultyUploadMarks /></RequireRole>} />
          <Route exact path="/faculty/timetable" element={<RequireRole role="faculty"><FacultyTimetable /></RequireRole>} />
          <Route
            exact
            path="/faculty/attendance"
            element={<RequireRole role="faculty"><FacultyAttendance /></RequireRole>}
          />
          <Route
            exact
            path="/student/updatePassword"
            element={<RequireRole role="student"><StudentUpdatePassword /></RequireRole>}
          />
          <Route
            exact
            path="/faculty/updatePassword"
            element={<RequireRole role="faculty"><FacultyUpdatePassword /></RequireRole>}
          />
          <Route
            exact
            path="/forgotPassword/:user"
            element={<ForgotPassword />}
          />
          <Route exact path="/chat/:room" element={<RequireRole role="student"><Chat /></RequireRole>} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
