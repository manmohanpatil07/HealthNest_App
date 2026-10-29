/**
 * Health Summary Calculation Service
 *
 * Transparently calculates a record-based summary from the authenticated user's actual data.
 * Does NOT diagnose diseases or make unsupported medical claims of being healthy ("All Good").
 *
 * States & Precedence:
 * 1. attention_needed: One or more recorded vaccination next-due dates are strictly before today.
 * 2. upcoming_reminder: No overdue vaccinations, but one or more are due today or within 30 days.
 * 3. no_pending_reminders: Vaccination records exist, but none are overdue or due within 30 days.
 * 4. add_health_info: No vaccination records and no health records exist for this user.
 */

/**
 * Format a Date object to YYYY-MM-DD in local time
 */
function toLocalDateString(date) {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate difference in whole calendar days (date2 - date1)
 */
function diffDays(targetDateStr, todayStr) {
  const [y1, m1, d1] = targetDateStr.split('-').map(Number);
  const [y2, m2, d2] = todayStr.split('-').map(Number);

  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);

  return Math.round((utc1 - utc2) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate Health Summary
 * @param {Object} params
 * @param {Array} params.vaccinations - Array of vaccination records for the user
 * @param {Array} params.healthRecords - Array of health records for the user
 * @param {Object} params.user - User profile
 * @param {Date} [params.currentDate] - Optional override for testing
 */
function calculateHealthSummary({
  vaccinations = [],
  healthRecords = [],
  user = {},
  currentDate = new Date()
}) {
  const todayStr = toLocalDateString(currentDate);

  const totalVaccinations = vaccinations.length;
  const totalHealthRecords = healthRecords.length;

  // Filter vaccinations that have a valid next_due_date
  const datedVaccines = vaccinations
    .filter(v => v.next_due_date)
    .map(v => {
      const dueStr = toLocalDateString(v.next_due_date);
      const daysUntilDue = diffDays(dueStr, todayStr);
      return {
        vaccination_id: v.vaccination_id,
        vaccine_name: v.vaccine_name,
        due_date: dueStr,
        daysUntilDue
      };
    });

  // Overdue vaccinations: next_due_date < today (daysUntilDue < 0)
  const overdueVaccines = datedVaccines.filter(v => v.daysUntilDue < 0);

  // Upcoming reminders: 0 <= daysUntilDue <= 30 (due today or within next 30 days)
  const upcomingVaccines = datedVaccines
    .filter(v => v.daysUntilDue >= 0 && v.daysUntilDue <= 30)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  // Future vaccinations (due beyond 30 days)
  const futureVaccines = datedVaccines
    .filter(v => v.daysUntilDue > 30)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  let state = 'add_health_info';
  let title = 'Add your health information';
  let reason = 'No health or vaccination records found yet.';
  let severity = 'neutral'; // 'error' | 'warning' | 'info' | 'neutral'
  let indicatorEmoji = '📋';

  // Rule 4: Clear Precedence Rules
  if (overdueVaccines.length > 0) {
    // 1. Attention needed
    state = 'attention_needed';
    title = 'Attention needed';
    const count = overdueVaccines.length;
    reason = count === 1
      ? `1 vaccination is overdue (${overdueVaccines[0].vaccine_name})`
      : `${count} vaccinations are overdue`;
    severity = 'error';
    indicatorEmoji = '⚠️';
  } else if (upcomingVaccines.length > 0) {
    // 2. Upcoming reminder
    state = 'upcoming_reminder';
    title = 'Upcoming reminder';
    const next = upcomingVaccines[0];
    if (next.daysUntilDue === 0) {
      reason = `${next.vaccine_name} is due today`;
    } else if (next.daysUntilDue === 1) {
      reason = `${next.vaccine_name} is due tomorrow`;
    } else {
      reason = `${next.vaccine_name} is due in ${next.daysUntilDue} days`;
    }
    severity = 'warning';
    indicatorEmoji = '⏰';
  } else if (totalVaccinations > 0) {
    // 3. No pending vaccination reminders
    state = 'no_pending_reminders';
    title = 'No pending vaccination reminders';
    if (futureVaccines.length > 0) {
      const next = futureVaccines[0];
      reason = `Next dose (${next.vaccine_name}) scheduled on ${next.due_date}`;
    } else {
      reason = `${totalVaccinations} vaccination ${totalVaccinations === 1 ? 'record' : 'records'} logged; no due dates pending`;
    }
    severity = 'info';
    indicatorEmoji = '✓';
  } else if (totalHealthRecords > 0) {
    // Has health records but no vaccinations
    state = 'no_pending_reminders';
    title = 'No pending vaccination reminders';
    reason = `${totalHealthRecords} health ${totalHealthRecords === 1 ? 'record' : 'records'} logged; no vaccination due dates`;
    severity = 'info';
    indicatorEmoji = 'ℹ️';
  } else {
    // 4. Add your health information
    state = 'add_health_info';
    title = 'Add your health information';
    reason = 'No health or vaccination records available';
    severity = 'neutral';
    indicatorEmoji = '📋';
  }

  return {
    state,
    title,
    reason,
    severity,
    indicatorEmoji,
    lastCalculated: todayStr,
    bloodGroup: user.blood_group || 'Not set',
    metrics: {
      totalVaccinations,
      totalHealthRecords,
      overdueCount: overdueVaccines.length,
      upcomingCount: upcomingVaccines.length,
      nearestDueDate: upcomingVaccines[0]?.due_date || futureVaccines[0]?.due_date || null
    }
  };
}

module.exports = {
  calculateHealthSummary,
  toLocalDateString,
  diffDays
};

