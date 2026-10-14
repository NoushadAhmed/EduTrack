import axios from "axios";

const authToken = (token) => {
  if (token) {
    axios.defaults.headers.common["Authorization"] = token;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }
};

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const adminSession = window.localStorage.getItem("adminToken");
      ["adminToken", "facultyToken", "studentToken"].forEach((key) =>
        window.localStorage.removeItem(key)
      );
      authToken(false);
      window.location.replace(adminSession ? "/admin/login" : "/");
    }
    return Promise.reject(error);
  }
);

export default authToken;
