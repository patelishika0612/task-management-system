import axios from "axios";
import { API_URL } from "./config";

const EmployeeAPI = axios.create({
  baseURL: API_URL,
});

EmployeeAPI.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("employeeToken") ||
    localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default EmployeeAPI;