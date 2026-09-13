/**
 * =========================================================================================
 *  COPYRIGHT & INTELLECTUAL PROPERTY NOTICE
 * =========================================================================================
 *  © 2026 Shiva Singh. All Rights Reserved.
 *  Developer & Architect: Shiva Singh (AI Developer)
 *  Project: AI LMS - Next-Generation AI Intelligence Platform
 *  Module: api.js (Axios API Client Configuration)
 * 
 *  Unauthorized copying, reproduction, or distribution of this code without express written
 *  permission from Shiva Singh is strictly prohibited.
 * =========================================================================================
 */

import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://ai-lms-project-jxuq.onrender.com";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;
