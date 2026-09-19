import axios from "axios";
import authToken from "../utils/authToken";
import jwt_decode from "jwt-decode";
import { SET_ADMIN, SET_ERRORS, GET_SUBJECTS } from "../actionTypes";

const setAdmin = (data) => ({ type: SET_ADMIN, payload: data });
const adminAddFacultyFlag = (data) => ({ type: "ADMIN_ADD_FACULTY_FLAG", payload: data });
const adminAddStudentFlag = (data) => ({ type: "ADMIN_ADD_STUDENT_FLAG", payload: data });
const adminAddSubjectFlag = (data) => ({ type: "ADMIN_ADD_SUBJECT_FLAG", payload: data });
const adminAddAdminFlag = (data) => ({ type: "ADMIN_ADD_ADMIN_FLAG", payload: data });
const getSubjectsHelper = (data) => ({ type: GET_SUBJECTS, payload: data });
const adminGetAllFacultyHelper = (data) => ({ type: "GET_ALL_FACULTY", payload: data });
const adminGetAllStudentHelper = (data) => ({ type: "GET_ALL_STUDENT", payload: data });
const adminGetAllSubjectHelper = (data) => ({ type: "GET_ALL_SUBJECT", payload: data });

export const adminLogin = (credentials) => async (dispatch) => {
  try {
    const { data } = await axios.post("/api/admin/login", credentials);
    const { token } = data;
    localStorage.setItem("adminToken", token);
    authToken(token);
    const decoded = jwt_decode(token);
    dispatch(setAdmin(decoded));
  } catch (err) {
    dispatch({ type: SET_ERRORS, payload: err.response.data });
  }
};

export const adminGetAllSubjects = () => async (dispatch) => {
  try {
    const { data } = await axios.post("/api/admin/getAllSubject");
    dispatch(getSubjectsHelper(data));
  } catch (err) {
    dispatch({ type: SET_ERRORS, payload: err.response?.data });
  }
};

export const adminAddFaculty = (facultyCredential) => async (dispatch) => {
  try {
    const { data } = await axios.post("/api/admin/addFaculty", facultyCredential);
    dispatch(adminAddFacultyFlag(true));
  } catch (err) {
    dispatch({ type: SET_ERRORS, payload: err.response.data });
  }
};

// FIX: was incorrectly calling /api/admin/addAdmin — corrected to /api/admin/addStudent
export const adminAddStudent = (studentCredential) => async (dispatch) => {
  try {
    const { data } = await axios.post("/api/admin/addStudent", studentCredential);
    dispatch(adminAddStudentFlag(true));
  } catch (err) {
    dispatch({ type: SET_ERRORS, payload: err.response.data });
  }
};

export const adminAddSubject = (subjectCredential) => async (dispatch) => {
  try {
    const { data } = await axios.post("/api/admin/addSubject", subjectCredential);
    dispatch(adminAddSubjectFlag(true));
  } catch (err) {
    dispatch({ type: SET_ERRORS, payload: err.response.data });
  }
};

// Registers a new Admin account — calls /api/admin/addAdmin
export const adminAddAdmin = (adminCredentials) => async (dispatch) => {
  try {
    const { data } = await axios.post("/api/admin/addAdmin", adminCredentials);
    dispatch(adminAddAdminFlag(true));
  } catch (err) {
    dispatch({ type: SET_ERRORS, payload: err.response.data });
  }
};

export const adminGetAllFaculty = (department) => async (dispatch) => {
  try {
    const { data } = await axios.post("/api/admin/getFaculties", department);
    dispatch(adminGetAllFacultyHelper(data.result));
  } catch (err) {
    dispatch({ type: SET_ERRORS, payload: err.response.data });
  }
};

export const adminGetAllStudent = (credentials) => async (dispatch) => {
  try {
    const { data } = await axios.post("/api/admin/getStudents", credentials);
    dispatch(adminGetAllStudentHelper(data.result));
  } catch (err) {
    dispatch({ type: SET_ERRORS, payload: err.response.data });
  }
};

export const adminGetAllSubject = (credentials) => async (dispatch) => {
  try {
    const { data } = await axios.post("/api/admin/getSubjects", credentials);
    dispatch(adminGetAllSubjectHelper(data.result));
  } catch (err) {
    dispatch({ type: SET_ERRORS, payload: err.response.data });
  }
};

export const setAdminUser = (data) => ({ type: SET_ADMIN, payload: data });

export const adminLogout = () => (dispatch) => {
  localStorage.removeItem("adminToken");
  authToken(false);
  dispatch(setAdmin({}));
};
