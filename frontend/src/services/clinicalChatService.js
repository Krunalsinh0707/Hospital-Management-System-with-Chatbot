import api from './api';

export const clinicalChatService = {
  // ── Patient Operations ──
  createConversation: async (data = {}) => {
    const res = await api.post('/clinical-chat/conversations', data);
    return res.data;
  },

  getMyConversations: async () => {
    const res = await api.get('/clinical-chat/conversations/my');
    return res.data;
  },

  getConversation: async (id) => {
    const res = await api.get(`/clinical-chat/conversations/${id}`);
    return res.data;
  },

  getConversationMessages: async (id) => {
    const res = await api.get(`/clinical-chat/conversations/${id}/messages`);
    return res.data;
  },

  sendMessage: async (id, message) => {
    const res = await api.post(`/clinical-chat/conversations/${id}/messages`, { message });
    return res.data;
  },

  deleteConversation: async (id) => {
    const res = await api.delete(`/clinical-chat/conversations/${id}`);
    return res.data;
  },

  getDoctorAvailability: async (doctorId, date) => {
    const res = await api.get(`/clinical-chat/doctors/${doctorId}/availability`, {
      params: date ? { date } : {}
    });
    return res.data;
  },

  // ── Doctor Clinical Console Operations ──
  getDoctorInbox: async (params = {}) => {
    const res = await api.get('/clinical-chat/doctor/inbox', { params });
    return res.data;
  },

  acknowledgeAlert: async (id, notes = '') => {
    const res = await api.post(`/clinical-chat/conversations/${id}/acknowledge`, { notes });
    return res.data;
  },

  assignConversation: async (id, { doctorId, departmentId, reason }) => {
    const res = await api.post(`/clinical-chat/conversations/${id}/assign`, {
      doctor_id: doctorId,
      department_id: departmentId,
      reason
    });
    return res.data;
  },

  escalateConversation: async (id, { urgency, reason, departmentId }) => {
    const res = await api.post(`/clinical-chat/conversations/${id}/escalate`, {
      urgency,
      reason,
      department_id: departmentId
    });
    return res.data;
  },

  resolveConversation: async (id, { resolutionNotes } = {}) => {
    const res = await api.post(`/clinical-chat/conversations/${id}/resolve`, {
      resolution_notes: resolutionNotes
    });
    return res.data;
  },

  getConversationEvents: async (id) => {
    const res = await api.get(`/clinical-chat/conversations/${id}/events`);
    return res.data;
  },

  getConversationAIAnalysis: async (id) => {
    const res = await api.get(`/clinical-chat/conversations/${id}/ai-analysis`);
    return res.data;
  },

  // ── Routing & Department Configurations ──
  getRoutingRules: async () => {
    const res = await api.get('/clinical-chat/routing-rules');
    return res.data;
  },

  createRoutingRule: async (data) => {
    const res = await api.post('/clinical-chat/routing-rules', data);
    return res.data;
  },

  updateRoutingRule: async (id, data) => {
    const res = await api.put(`/clinical-chat/routing-rules/${id}`, data);
    return res.data;
  },

  getDoctorMemberships: async (departmentId = null) => {
    const res = await api.get('/clinical-chat/doctor-memberships', {
      params: departmentId ? { department_id: departmentId } : {}
    });
    return res.data;
  }
};

export default clinicalChatService;
