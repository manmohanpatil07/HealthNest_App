/**
 * HealthNest Mobile Utilities
 * Date formatters, validation helpers, storage helpers
 */

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

export default {
  formatDate,
};
