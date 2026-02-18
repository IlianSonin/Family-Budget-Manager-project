import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
});

api.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  // Log auth requests
  if (req.url.includes("/auth/login") || req.url.includes("/auth/me")) {
    console.log(`🔐 API Request: ${req.method?.toUpperCase()} ${req.url}`, {
      hasToken: !!token,
      token: token ? `${token.substring(0, 20)}...` : "none",
    });
  }

  return req;
});

api.interceptors.response.use(
  (response) => {
    // Log auth responses
    if (
      response.config.url.includes("/auth/login") ||
      response.config.url.includes("/auth/me")
    ) {
      console.log(
        `✅ API Response: ${response.status} ${response.config.url}`,
        {
          data: response.data,
        },
      );
    }
    return response;
  },
  (error) => {
    // Log auth errors
    if (
      error.config?.url.includes("/auth/login") ||
      error.config?.url.includes("/auth/me")
    ) {
      console.log(
        `❌ API Error: ${error.response?.status || "NETWORK"} ${error.config.url}`,
        {
          message: error.response?.data?.message || error.message,
          status: error.response?.status,
        },
      );
    }

    if (error.response && error.response.status === 401) {
      console.log("🚨 401 Error - Clearing token and redirecting to login");
      localStorage.removeItem("token");
      window.location.href = "/login"; // Redirect to login
    }
    return Promise.reject(error);
  },
);

// Settings API
export const settingsAPI = {
  getSettings: () => api.get("/settings"),
  updateSettings: (settings) => api.put("/settings", settings),
  resetSettings: () => api.post("/settings/reset"),
};

// Family Admin API
export const familyAdminAPI = {
  removeMember: (memberId) => api.delete(`/family/members/${memberId}`),
  transferAdmin: (newAdminId) =>
    api.post("/family/transfer-admin", { newAdminId }),
  deleteFamily: () => api.delete("/family"),
  getFamilyStats: (month) => api.get("/family/stats", { params: { month } }),
};

// Reminders API
export const remindersAPI = {
  createReminder: (reminderData) => api.post("/reminders", reminderData),
  getReminders: (month) => api.get("/reminders", { params: { month } }),
  completeReminder: (id) => api.patch(`/reminders/${id}/complete`),
  deleteReminder: (id) => api.delete(`/reminders/${id}`),
};

export default api;
