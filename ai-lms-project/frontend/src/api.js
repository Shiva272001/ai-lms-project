import axios from "axios";

// Change this if your backend runs on a different URL (e.g. after deploying to Render)
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;
