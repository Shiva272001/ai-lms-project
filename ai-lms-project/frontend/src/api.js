import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://ai-lms-backend.onrender.com";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;
