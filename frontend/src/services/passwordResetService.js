import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const passwordResetService = {
  /**
   * Request OTP for email address
   */
  async forgotPassword(email) {
    const response = await axios.post(`${API_BASE_URL}/forgot-password`, {
      email: email.trim()
    });
    return response.data;
  },

  /**
   * Verify 6-digit OTP code
   */
  async verifyOTP(email, otp) {
    const response = await axios.post(`${API_BASE_URL}/verify-otp`, {
      email: email.trim(),
      otp: otp.trim()
    });
    return response.data;
  },

  /**
   * Reset user password
   */
  async resetPassword(email, password, confirm_password) {
    const response = await axios.post(`${API_BASE_URL}/reset-password`, {
      email: email.trim(),
      password,
      confirm_password
    });
    return response.data;
  }
};

export default passwordResetService;
