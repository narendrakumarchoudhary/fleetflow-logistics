export const maintenanceStatuses = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];

const transitions = Object.freeze({
  Scheduled: ['In Progress', 'Completed', 'Cancelled'],
  'In Progress': ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: []
});

export function canUpdateMaintenance(from, to) {
  return from === to || Boolean(transitions[from]?.includes(to));
}
