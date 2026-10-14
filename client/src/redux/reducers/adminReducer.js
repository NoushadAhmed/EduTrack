import { SET_ADMIN, GET_SUBJECTS } from "../actionTypes";
import isEmpty from "../validation/is-empty";

const initialState = {
  isAuthenticated: false,
  admin: {},
  adminAddFacultyFlag: false,
  adminAddStudentFlag: false,
  adminAddAdminFlag: false,
  adminAddSubjectFlag: false,
  subjects: {},
  allFaculty: [],
  allStudent: [],
  allSubject: [],
  results: {
    records: [],
    summary: null,
    exams: [],
    student: null,
    subject: null,
    loading: false,
    error: null,
  },
  timetable: {
    entries: [],
    loading: false,
    error: null,
  },
  fees: {
    records: [],
    summary: null,
    student: null,
    loading: false,
    error: null,
  },
  reports: {
    data: null,
    loading: false,
    error: null,
  },
};

const adminReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_ADMIN:
      return {
        ...state,
        isAuthenticated: !isEmpty(action.payload),
        admin: action.payload,
      };
    case GET_SUBJECTS: {
      return {
        ...state,
        subjects: action.payload,
      };
    }
    case "ADMIN_ADD_FACULTY_FLAG": {
      return {
        ...state,
        adminAddFacultyFlag: action.payload,
      };
    }
    case "ADMIN_ADD_STUDENT_FLAG": {
      return {
        ...state,
        adminAddStudentFlag: action.payload,
      };
    }
    case "ADMIN_ADD_SUBJECT_FLAG": {
      return {
        ...state,
        adminAddSubjectFlag: action.payload,
      };
    }
    case "ADMIN_ADD_ADMIN_FLAG": {
      return {
        ...state,
        adminAddAdminFlag: action.payload,
      };
    }
    case "GET_ALL_FACULTY": {
      return {
        ...state,
        allFaculty: action.payload,
      };
    }
    case "GET_ALL_STUDENT": {
      return {
        ...state,
        allStudent: action.payload,
      };
    }
    case "GET_ALL_SUBJECT": {
      return {
        ...state,
        allSubject: action.payload,
      };
    }
    case "ADMIN_RESULTS_REQUEST":
      return {
        ...state,
        results: { ...state.results, loading: true, error: null },
      };
    case "ADMIN_RESULTS_SUCCESS":
      return {
        ...state,
        results: {
          records: Array.isArray(action.payload?.results)
            ? action.payload.results
            : [],
          summary: action.payload?.summary || null,
          exams: Array.isArray(action.payload?.exams) ? action.payload.exams : [],
          student: action.payload?.student || null,
          subject: action.payload?.subject || null,
          loading: false,
          error: null,
        },
      };
    case "ADMIN_RESULTS_FAILURE":
      return {
        ...state,
        results: { ...state.results, loading: false, error: action.payload },
      };
    case "ADMIN_TIMETABLE_REQUEST":
      return {
        ...state,
        timetable: { ...state.timetable, loading: true, error: null },
      };
    case "ADMIN_TIMETABLE_SUCCESS":
      return {
        ...state,
        timetable: {
          entries: Array.isArray(action.payload) ? action.payload : [],
          loading: false,
          error: null,
        },
      };
    case "ADMIN_TIMETABLE_FAILURE":
      return {
        ...state,
        timetable: { ...state.timetable, loading: false, error: action.payload },
      };
    case "ADMIN_FEES_REQUEST":
      return {
        ...state,
        fees: { ...state.fees, loading: true, error: null },
      };
    case "ADMIN_FEES_SUCCESS":
      return {
        ...state,
        fees: {
          records: Array.isArray(action.payload?.result) ? action.payload.result : [],
          summary: action.payload?.summary || null,
          student: action.payload?.student || null,
          loading: false,
          error: null,
        },
      };
    case "ADMIN_FEES_FAILURE":
      return {
        ...state,
        fees: { ...state.fees, loading: false, error: action.payload },
      };
    case "ADMIN_REPORTS_REQUEST":
      return {
        ...state,
        reports: { ...state.reports, loading: true, error: null },
      };
    case "ADMIN_REPORTS_SUCCESS":
      return {
        ...state,
        reports: { data: action.payload, loading: false, error: null },
      };
    case "ADMIN_REPORTS_FAILURE":
      return {
        ...state,
        reports: { ...state.reports, loading: false, error: action.payload },
      };
    default:
      return state;
  }
};

export default adminReducer;
