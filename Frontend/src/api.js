import axios from "axios";
import { API_URL } from "./config";

const API = axios.create({
    baseURL: API_URL,
});

// REQUEST INTERCEPTOR
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("adminToken");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// RESPONSE INTERCEPTOR
API.interceptors.response.use(
    (response) => {
        return response;
    },

    (error) => {
        const status = error.response?.status;
        const code = error.response?.data?.code;

        if (
            status === 401 &&
            (
                code === "ADMIN_ACCOUNT_DELETED" ||
                code === "ADMIN_SESSION_INVALID" ||
                code === "ADMIN_SESSION_EXPIRED"
            )
        ) {
            // Admin login information remove
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminData");
            localStorage.removeItem("adminEmail");

            // IMPORTANT:
            // Tamaro actual route /admin-login che
            window.location.href = "/admin-login";
        }

        return Promise.reject(error);
    }
);

export default API;