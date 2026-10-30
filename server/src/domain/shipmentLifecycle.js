export const shipmentStatuses = ['Pending', 'In Transit', 'Out for Delivery', 'Delivered', 'Delayed', 'Cancelled'];

export const allowedTransitions = Object.freeze({
  Pending: ['In Transit', 'Delayed', 'Cancelled'],
  'In Transit': ['Out for Delivery', 'Delayed', 'Delivered', 'Cancelled'],
  'Out for Delivery': ['Delivered', 'Delayed', 'Cancelled'],
  Delayed: ['In Transit', 'Out for Delivery', 'Cancelled'],
  Delivered: [],
  Cancelled: []
});

export function canTransition(from, to) {
  return from === to || Boolean(allowedTransitions[from]?.includes(to));
}

export function progressForStatus(status, current = 0) {
  if (status === 'Pending') return 0;
  if (status === 'Out for Delivery') return Math.max(current, 90);
  if (status === 'Delivered') return 100;
  if (status === 'In Transit') return Math.max(current, 10);
  return Math.min(100, Math.max(0, current));
}
