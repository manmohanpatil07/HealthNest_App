import api from './api';

export const healthRecordService = {
  getRecords: async () => [],
  addRecord: async (recordData) => ({ success: true }),
  deleteRecord: async (id) => ({ success: true }),
};

export default healthRecordService;
