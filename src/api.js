import axios from 'axios';


const api = axios.create({
  baseURL: "https://matrimony-website-otp-backend.onrender.com/api",
});
// ─── Auth & OTP ───────────────────────────────────────────────────────────────
export const sendOtp = (phone) => api.post('/otp/send', { phone });
export const verifyOtp = (phone, otp) => api.post('/otp/verify', { phone, otp });
export const registerUser = (data) => api.post('/register', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// ─── User ─────────────────────────────────────────────────────────────────────
export const getMe = (userId) => api.get(`/user/me?userId=${userId}`);
export const changePlan = (userId, tier) => api.post('/user/plan', { userId, tier });
export const resetLimits = (userId) => api.post('/user/reset-limits', { userId });

// ─── Profiles ─────────────────────────────────────────────────────────────────
export const getProfiles = (userId, filters = {}) => {
  const params = new URLSearchParams({ userId, ...filters }).toString();
  return api.get(`/profiles?${params}`);
};
export const getProfile = (profileId, userId) => api.get(`/profiles/${profileId}?userId=${userId}`);

// ─── Interests ────────────────────────────────────────────────────────────────
export const sendInterest = (senderId, receiverId) => api.post('/interests/send', { senderId, receiverId });
export const getInterests = (userId) => api.get(`/interests?userId=${userId}`);
export const respondInterest = (interestId, status) => api.post('/interests/respond', { interestId, status });

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const getChats = (userId) => api.get(`/chats?userId=${userId}`);
export const getChatHistory = (userId, receiverId) => api.get(`/chats/${receiverId}?userId=${userId}`);
export const sendMessage = (senderId, receiverId, text) => api.post('/chats/send', { senderId, receiverId, text });

// ─── Admin ────────────────────────────────────────────────────────────────────
export const getAdminStats = () => api.get('/admin/stats');
export const getAdminUsers = () => api.get('/admin/users');
export const setUserStatus = (id, status) => api.post(`/admin/users/${id}/status`, { status });
export const getHoroscopes = () => api.get('/admin/horoscopes');
export const verifyHoroscope = (id, status) => api.post(`/admin/horoscopes/${id}/verify`, { status });
export const getReports = () => api.get('/admin/reports');

// ─── Ping ─────────────────────────────────────────────────────────────────────
export const pingServer = () => api.get('/ping');

export default api;