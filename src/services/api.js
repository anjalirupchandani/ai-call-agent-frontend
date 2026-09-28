// services/api.js
// API service abstraction.
//
// Every page calls functions from this file — none of them talk to Retell
// directly. These call the Express backend in /server which uses the
// Retell AI REST API with credentials kept server-side only.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const TOKEN_KEY = "ai_call_agent_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) setToken(null); // stale/expired token — clear it
    throw new Error(data?.message || `Request to ${path} failed (${res.status})`);
  }
  return data;
}

// Separate helper for file uploads (multipart/form-data).
// Don't set Content-Type manually — the browser sets it (with the
// correct multipart boundary) automatically when the body is FormData.
async function uploadRequest(path, formData, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) setToken(null);
    throw new Error(data?.message || `Request to ${path} failed (${res.status})`);
  }
  return data;
}

// ---- Auth -------------------------------------------------------------

export async function signup({ name, email, password }) {
  return request("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function login({ email, password }) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe() {
  return request("/auth/me");
}

// ---- Notifications ------------------------------------------------

export async function getNotifications() {
  return request("/notifications");
}

export async function markNotificationAsRead(id) {
  return request(`/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsAsRead() {
  return request("/notifications/read-all", { method: "PATCH" });
}

// ---- User Profile Management --------------------------------------

/**
 * Update user profile information
 * @param {Object} userData - User profile data
 * @param {string} userData.name - Full name
 * @param {string} userData.email - Email address
 * @param {string} userData.phone - Phone number (optional)
 * @param {string} userData.bio - User bio (optional)
 * @param {string} userData.timezone - Timezone (optional)
 * @param {string} userData.language - Language preference (optional)
 * @param {Object} userData.notifications - Notification preferences (optional)
 * @param {boolean} userData.twoFactor - Two-factor authentication status (optional)
 * @returns {Promise<Object>} Updated user data
 */
export async function updateUser(userData) {
  return request("/users/update", {
    method: "PUT",
    body: JSON.stringify(userData),
  });
}

/**
 * Change user password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password (min 8 characters)
 * @returns {Promise<Object>} Success message
 */
export async function changePassword(currentPassword, newPassword) {
  return request("/users/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

/**
 * Update user preferences
 * @param {Object} preferences - User preferences
 * @param {string} preferences.timezone - Timezone
 * @param {string} preferences.language - Language
 * @param {Object} preferences.notifications - Notification preferences
 * @returns {Promise<Object>} Updated preferences
 */
export async function updatePreferences(preferences) {
  return request("/users/preferences", {
    method: "PUT",
    body: JSON.stringify(preferences),
  });
}

/**
 * Delete user account (optional)
 * @returns {Promise<Object>} Success message
 */
export async function deleteAccount() {
  return request("/users/delete", {
    method: "DELETE",
  });
}

// ---- Dashboard & Calls ------------------------------------------------

export async function getDashboardStats(period = "7d") {
  return request(`/dashboard/stats?period=${encodeURIComponent(period)}`);
}

export async function getCalls() {
  return request("/calls");
}

export async function getCallById(callId) {
  return request(`/calls/${callId}`);
}

export async function getContacts() {
  return request("/contacts");
}

export async function createContact(payload) {
  return request("/contacts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function startCall(payload) {
  return request("/call/start", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Start ONE real outbound call through Edesy (via our own backend — the Edesy
 * API key never reaches the browser).
 * @param {Object} payload
 * @param {string} payload.phoneNumber   E.164 number, e.g. +919876543210
 * @param {string} payload.customerName  Customer's name (sent to the agent as customer_name)
 * @param {string} [payload.purpose]     Short label to find the call later
 * @param {Object} [payload.variables]   Extra { name: value } variables for the agent prompt
 * @returns {Promise<{success: boolean, conversationId: string, status: string, callId: string, dbId: string}>}
 */
export async function startEdesyCall({ phoneNumber, customerName, purpose, variables }) {
  return request("/calls", {
    method: "POST",
    body: JSON.stringify({ phoneNumber, customerName, purpose, variables }),
  });
}

export async function endCall(callId) {
  return request(`/call/${callId}/end`, { method: "POST" });
}

// ---- Campaigns ---------------------------------------------------------

export async function getCampaigns() {
  return request("/campaigns");
}

export async function getCampaignById(id) {
  return request(`/campaigns/${id}`);
}

export async function createCampaign(data) {
  return request("/campaigns", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function startCampaign(id) {
  return request(`/campaigns/${id}/start`, { method: "POST" });
}

export async function pauseCampaign(id) {
  return request(`/campaigns/${id}/pause`, { method: "POST" });
}

export async function deleteCampaign(id) {
  return request(`/campaigns/${id}`, { method: "DELETE" });
}

export async function retryFailedCampaignCalls(id) {
  return request(`/campaigns/${id}/retry`, { method: "POST" });
}


// ---- Scheduled Calls ----------------------------------------------------

export async function getScheduledCalls() {
  return request("/scheduled-calls");
}

export async function createScheduledCall(data) {
  // data: { contactId, phoneNumber, name, scheduledAt, agentId, notes }
  return request("/scheduled-calls", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateScheduledCall(id, data) {
  return request(`/scheduled-calls/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function cancelScheduledCall(id) {
  return request(`/scheduled-calls/${id}/cancel`, {
    method: "POST",
  });
}

export async function deleteScheduledCall(id) {
  return request(`/scheduled-calls/${id}`, {
    method: "DELETE",
  });
}

// ---- Templates ----------------------------------------------------

export async function getTemplates() {
  return request("/templates");
}

export async function getTemplateById(id) {
  return request(`/templates/${id}`);
}

export async function createTemplate(data) {
  return request("/templates", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTemplate(id, data) {
  return request(`/templates/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteTemplate(id) {
  return request(`/templates/${id}`, {
    method: "DELETE",
  });
}

export async function duplicateTemplate(id) {
  return request(`/templates/${id}/duplicate`, {
    method: "POST",
  });
}

// ---- Pathways -----------------------------------------------------------

export async function getPathways() {
  return request("/pathways");
}

export async function getPathwayById(id) {
  return request(`/pathways/${id}`);
}

export async function createPathway({ name, nodes, edges, cognidomAgentId }) {
  return request("/pathways", {
    method: "POST",
    body: JSON.stringify({ name, nodes, edges, cognidomAgentId }),
  });
}

export async function updatePathway(id, { name, nodes, edges, cognidomAgentId }) {
  return request(`/pathways/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name, nodes, edges, cognidomAgentId }),
  });
}

export async function deletePathway(id) {
  return request(`/pathways/${id}`, {
    method: "DELETE",
  });
}

// ---- Knowledge Base ----------------------------------------------------

export async function getKnowledgeArticles() {
  return request("/knowledge");
}

/**
 * Upload a knowledge base document.
 * @param {FormData} formData - Must contain: title, category, file
 * @returns {Promise<Object>} Created knowledge article
 */
export async function uploadKnowledgeDocument(formData) {
  return uploadRequest("/knowledge", formData);
}

export async function createWebsiteKnowledgeSource({ title, url }) {
  return request("/knowledge/website", {
    method: "POST",
    body: JSON.stringify({ title, url }),
  });
}

export async function deleteKnowledgeArticle(id) {
  return request(`/knowledge/${id}`, {
    method: "DELETE",
  });
}

export const _config = { BASE_URL };