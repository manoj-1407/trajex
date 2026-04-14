export function shortId(uuid = '') {
  return uuid.slice(-8).toUpperCase();
}

export function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr));
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateStr));
}

export const formatTimeAgo = formatRelativeTime;

export function formatRelativeTime(dateStr) {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60)  return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

export function formatPhone(e164) {
  if (!e164) return '—';
  const digits = e164.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return e164;
}

export function statusLabel(status) {
  const map = {
    pending: 'Pending', confirmed: 'Confirmed', assigned: 'Assigned',
    picked_up: 'Picked Up', in_transit: 'In Transit', delivered: 'Delivered',
    cancelled: 'Cancelled', failed: 'Failed',
    available: 'Available', busy: 'Busy', offline: 'Offline',
  };
  return map[status] || status;
}

export function priorityLabel(p) {
  return { low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent' }[p] || p;
}

export function initials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}
