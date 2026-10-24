import api from './api';

export const userService = {
  /**
   * Get user profile
   */
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (profileData) => {
    const response = await api.put('/user/profile', profileData);
    return response.data;
  },

  /**
   * Get user dashboard data
   */
  getDashboard: async () => {
    const response = await api.get('/user/dashboard');
    return response.data;
  },

  // ──────────────────────── Health Records ────────────────────────

  /**
   * List all health records for authenticated user
   */
  getHealthRecords: async () => {
    const response = await api.get('/health-records');
    return response.data;
  },

  /**
   * Create a new health record
   * @param {{ record_type: string, title: string, description?: string, record_date: string }} data
   */
  createHealthRecord: async (data) => {
    const response = await api.post('/health-records', data);
    return response.data;
  },

  /**
   * Delete a health record by id (ownership enforced on backend)
   * @param {number} recordId
   */
  deleteHealthRecord: async (recordId) => {
    const response = await api.delete(`/health-records/${recordId}`);
    return response.data;
  },

  // ──────────────────────── Documents ────────────────────────

  /**
   * List all documents for authenticated user
   */
  getDocuments: async () => {
    const response = await api.get('/documents');
    return response.data;
  },

  /**
   * Upload a document file (multipart/form-data)
   * @param {FormData} formData
   * @param {(progress: number) => void} onProgress
   */
  uploadDocument: async (formData, onProgress) => {
    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  /**
   * Delete a document by id
   * @param {number} documentId
   */
  deleteDocument: async (documentId) => {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  },

  // ──────────────────────── Vaccinations ────────────────────────

  /**
   * List all vaccination records for authenticated user
   */
  getVaccinations: async () => {
    const response = await api.get('/vaccinations');
    return response.data;
  },

  /**
   * Add a new vaccination record
   * @param {{ vaccine_name: string, vaccination_date: string, next_due_date?: string, notes?: string }} data
   */
  createVaccination: async (data) => {
    const response = await api.post('/vaccinations', data);
    return response.data;
  },

  /**
   * Delete a vaccination record by id
   * @param {number} vaccinationId
   */
  deleteVaccination: async (vaccinationId) => {
    const response = await api.delete(`/vaccinations/${vaccinationId}`);
    return response.data;
  },

  // ──────────────────────── QR Health Card ────────────────────────

  /**
   * Get active QR access token and card data
   */
  getQRCode: async () => {
    const response = await api.get('/qr');
    return response.data;
  },

  /**
   * Regenerate QR code (invalidates previous token)
   */
  regenerateQR: async () => {
    const response = await api.post('/qr/regenerate');
    return response.data;
  },

  /**
   * Update permissions for active QR
   * @param {string} permission (e.g. 'view', 'full', or comma-delimited options)
   */
  updateQRPermissions: async (permission) => {
    const response = await api.put('/qr/permissions', { permission });
    return response.data;
  }
};

export default userService;

