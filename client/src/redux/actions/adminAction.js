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
    return data;
  } catch (err) {
    dispatch({ type: SET_ERRORS, payload: err.response?.data || { message: err.message } });
    throw err;
  }
};

export const adminAddSubject = (subjectCredential) => async (dispatch) => {
  try {
    const { data } = await axios.post("/api/admin/addSubject", subjectCredential);
    dispatch(adminAddSubjectFlag(true));
    return data;
  } catch (err) {
    dispatch({
      type: SET_ERRORS,
      payload: err.response?.data || { message: err.message },
    });
    throw err;
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

export const adminFetchFacultyDirectory = () => async (dispatch) => {
  try {
    const { data } = await axios.post("/api/admin/getAllFaculty");
    const faculties = Array.isArray(data?.result) ? data.result : [];
    dispatch(adminGetAllFacultyHelper(faculties));
    return faculties;
  } catch (err) {
    if (err.response?.status === 404) {
      dispatch(adminGetAllFacultyHelper([]));
      return [];
    }
    dispatch({
      type: SET_ERRORS,
      payload: err.response?.data || { message: err.message },
    });
    throw err;
  }
};

export const adminFetchFacultyAssignments = (registrationNumber) => async () => {
  const { data } = await axios.get(
    `/api/admin/faculty/${encodeURIComponent(registrationNumber)}/assignments`
  );
  return data;
};

export const adminFetchAvailableFacultySubjects = (registrationNumber, semester) => async () => {
  const { data } = await axios.get(
    `/api/admin/faculty/${encodeURIComponent(registrationNumber)}/subjects`,
    { params: { semester } }
  );
  return data;
};

export const adminSaveFacultyAssignments = (registrationNumber, semester, subjectIds) => async () => {
  const { data } = await axios.put(
    `/api/admin/faculty/${encodeURIComponent(registrationNumber)}/assignments`,
    { semester, subjectIds }
  );
  return data;
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

export const adminFetchSubjectDirectory = () => async (dispatch) => {
  try {
    const { data } = await axios.post("/api/admin/getAllSubject");
    const subjects = Array.isArray(data)
      ? data
      : Array.isArray(data?.result)
        ? data.result
        : [];
    dispatch(adminGetAllSubjectHelper(subjects));
    return subjects;
  } catch (err) {
    if (err.response?.status === 404) {
      dispatch(adminGetAllSubjectHelper([]));
      return [];
    }
    dispatch({
      type: SET_ERRORS,
      payload: err.response?.data || { message: err.message },
    });
    throw err;
  }
};

export const adminFetchResults = (filters = {}) => async (dispatch) => {
  dispatch({ type: "ADMIN_RESULTS_REQUEST" });
  try {
    const { data } = await axios.get("/api/admin/results", { params: filters });
    dispatch({ type: "ADMIN_RESULTS_SUCCESS", payload: data });
    return data;
  } catch (err) {
    const message =
      err.response?.data?.message || "Unable to load results";
    dispatch({ type: "ADMIN_RESULTS_FAILURE", payload: message });
    throw err;
  }
};

export const adminFetchStudentResults = (registrationNumber) => async (dispatch) => {
  dispatch({ type: "ADMIN_RESULTS_REQUEST" });
  try {
    const { data } = await axios.get(
      `/api/admin/results/student/${encodeURIComponent(registrationNumber)}`
    );
    dispatch({ type: "ADMIN_RESULTS_SUCCESS", payload: data });
    return data;
  } catch (err) {
    const message =
      err.response?.data?.message || "Unable to load results";
    dispatch({ type: "ADMIN_RESULTS_FAILURE", payload: message });
    throw err;
  }
};

export const adminFetchSubjectResults = (subjectCode) => async (dispatch) => {
  dispatch({ type: "ADMIN_RESULTS_REQUEST" });
  try {
    const { data } = await axios.get(
      `/api/admin/results/subject/${encodeURIComponent(subjectCode)}`
    );
    dispatch({ type: "ADMIN_RESULTS_SUCCESS", payload: data });
    return data;
  } catch (err) {
    const message =
      err.response?.data?.message || "Unable to load results";
    dispatch({ type: "ADMIN_RESULTS_FAILURE", payload: message });
    throw err;
  }
};

export const adminFetchTimetable = (filters = {}) => async (dispatch) => {
  dispatch({ type: "ADMIN_TIMETABLE_REQUEST" });
  try {
    const { data } = await axios.get("/api/admin/timetable", { params: filters });
    dispatch({
      type: "ADMIN_TIMETABLE_SUCCESS",
      payload: Array.isArray(data?.result) ? data.result : [],
    });
    return data.result;
  } catch (err) {
    const message =
      err.response?.data?.message || "Unable to load timetable";
    dispatch({ type: "ADMIN_TIMETABLE_FAILURE", payload: message });
    throw err;
  }
};

export const adminCreateTimetableEntry = (entry) => async (dispatch) => {
  try {
    const { data } = await axios.post("/api/admin/timetable", entry);
    return data.result;
  } catch (err) {
    throw new Error(
      err.response?.data?.message || "Unable to create timetable entry"
    );
  }
};

export const adminFetchStudentsForFees = () => async (dispatch) => {
  try {
    const { data } = await axios.post("/api/admin/getAllStudent");
    const students = Array.isArray(data?.result) ? data.result : [];
    dispatch(adminGetAllStudentHelper(students));
    return students;
  } catch (err) {
    if (err.response?.status === 404) {
      dispatch(adminGetAllStudentHelper([]));
      return [];
    }
    throw err;
  }
};

export const adminFetchFees = (filters = {}) => async (dispatch) => {
  dispatch({ type: "ADMIN_FEES_REQUEST" });
  try {
    const { data } = await axios.get("/api/admin/fees", { params: filters });
    dispatch({ type: "ADMIN_FEES_SUCCESS", payload: data });
    return data;
  } catch (err) {
    const status = err.response?.status;
    const message = `GET /api/admin/fees${status ? ` failed (${status})` : ' failed'}: ${err.response?.data?.message || err.response?.data?.error?.message || err.message || "Unable to load fee records"}`;
    dispatch({ type: "ADMIN_FEES_FAILURE", payload: message });
    throw err;
  }
};

export const adminFetchStudentFees = (registrationNumber) => async (dispatch) => {
  dispatch({ type: "ADMIN_FEES_REQUEST" });
  try {
    const { data } = await axios.get(
      `/api/admin/fees/student/${encodeURIComponent(registrationNumber)}`
    );
    dispatch({ type: "ADMIN_FEES_SUCCESS", payload: data });
    return data;
  } catch (err) {
    const status = err.response?.status;
    const path = `/api/admin/fees/student/${encodeURIComponent(registrationNumber)}`;
    const message = `GET ${path}${status ? ` failed (${status})` : ' failed'}: ${err.response?.data?.message || err.response?.data?.error?.message || err.message || "Unable to load fee records"}`;
    dispatch({ type: "ADMIN_FEES_FAILURE", payload: message });
    throw err;
  }
};

export const adminCreateFeeRecord = (feeRecord) => async () => {
  try {
    const { data } = await axios.post("/api/admin/fees", feeRecord);
    return data.result;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Unable to create fee record");
  }
};

export const adminRecordPayment = (feeRecordId, payment) => async () => {
  try {
    const { data } = await axios.post(
      `/api/admin/fees/${encodeURIComponent(feeRecordId)}/payments`,
      payment
    );
    return data.result;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Unable to record payment");
  }
};

export const adminFetchFeeStructures = async () => {
  const { data } = await axios.get('/api/admin/fees/structures');
  if (!Array.isArray(data?.result)) throw new Error('GET /api/admin/fees/structures returned an invalid response; expected { result: [] }.');
  return data.result;
};
export const adminSaveFeeStructure = async (structure) => {
  const { data } = await axios.post('/api/admin/fees/structures', structure);
  if (!data?.result) throw new Error('POST /api/admin/fees/structures returned an invalid response; expected { result: structure }.');
  return data.result;
};
export const adminUpdateFeeStructure = async (id, structure) => {
  const { data } = await axios.put(`/api/admin/fees/structures/${encodeURIComponent(id)}`, structure);
  if (!data?.result) throw new Error(`PUT /api/admin/fees/structures/${encodeURIComponent(id)} returned an invalid response; expected { result: structure }.`);
  return data.result;
};
export const adminDeleteFeeStructure = async (id) => axios.delete(`/api/admin/fees/structures/${encodeURIComponent(id)}`);
export const adminGenerateAssessments = async (selection) => (await axios.post('/api/admin/fees/assessments/generate', selection)).data;
export const adminFetchFeeStudents = async (department, search = '') => (await axios.get('/api/admin/fees/students', { params: { department, search } })).data.result;
export const adminUpdateFeeAssessment = async (id, assessment) => (await axios.put(`/api/admin/fees/${encodeURIComponent(id)}`, assessment)).data.result;

export const adminFetchReports = (filters = {}) => async (dispatch) => {
  dispatch({ type: "ADMIN_REPORTS_REQUEST" });
  try {
    const { data } = await axios.get("/api/admin/reports", { params: filters });
    dispatch({ type: "ADMIN_REPORTS_SUCCESS", payload: data });
    return data;
  } catch (err) {
    const message = err.response?.data?.message || "Unable to load report data";
    dispatch({ type: "ADMIN_REPORTS_FAILURE", payload: message });
    throw err;
  }
};

export const adminUpdateProfile = (profile) => async (dispatch, getState) => {
  const { data } = await axios.put("/api/admin/profile", profile);
  const currentAdmin = { ...(getState().admin?.admin || {}) };
  delete currentAdmin.department;
  dispatch(setAdmin({ ...currentAdmin, ...data.admin }));
  return data.admin;
};

export const setAdminUser = (data) => ({ type: SET_ADMIN, payload: data });

export const adminLogout = () => (dispatch) => {
  localStorage.removeItem("adminToken");
  authToken(false);
  dispatch(setAdmin({}));
};
