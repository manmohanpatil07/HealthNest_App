import api from './api';

export const qrService = {
  generateToken: async () => ({ token: 'mock_qr_token' }),
  validateToken: async (token) => ({ valid: true }),
};

export default qrService;
