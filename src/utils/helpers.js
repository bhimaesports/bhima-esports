/* ============================================================
   BHIMA ESPORTS — Helper Functions
   ============================================================ */

export const DEPARTMENTS = ['AIML', 'BME', 'CSE', 'CIVIL', 'ECE', 'EEE', 'MECH', 'MIN'];
export const YEARS = ['1st', '2nd', '3rd', '4th'];

// ── Date / Time ──────────────────────────────────────────
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = Date.now();
  const past = new Date(dateStr).getTime();
  const seconds = Math.floor((now - past) / 1000);

  if (seconds < 60)   return 'Just now';
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDate(dateStr);
}

export function getCountdown(targetDate) {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

// ── Number Formatting ────────────────────────────────────
export function formatNumber(num) {
  if (num == null) return '0';
  return Number(num).toLocaleString('en-IN');
}

export function formatCompact(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num);
}

// ── ID Generators ────────────────────────────────────────
export function generateTeamId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = 'BE-';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export function generateRegistrationNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `REG-${timestamp}-${rand}`;
}

// ── Status Colors ────────────────────────────────────────
export function getStatusColor(status) {
  const map = {
    active:    'var(--success)',
    approved:  'var(--success)',
    completed: 'var(--text-secondary)',
    pending:   'var(--warning)',
    rejected:  'var(--error)',
    banned:    'var(--error)',
    live:      '#FF6666',
    upcoming:  'var(--info)',
    cancelled: 'var(--text-muted)',
  };
  return map[status?.toLowerCase()] || 'var(--text-secondary)';
}

export function getStatusBadgeClass(status) {
  const map = {
    active:    'badge-active',
    approved:  'badge-approved',
    completed: 'badge-completed',
    pending:   'badge-pending',
    rejected:  'badge-rejected',
    banned:    'badge-banned',
    live:      'badge-live',
    upcoming:  'badge-upcoming',
    cancelled: 'badge-completed',
  };
  return map[status?.toLowerCase()] || 'badge-completed';
}

const DEPT_COLORS = {
  AIML:  '#8B5CF6',
  BME:   '#EC4899',
  CSE:   '#3B82F6',
  CIVIL: '#F97316',
  ECE:   '#10B981',
  EEE:   '#FBBF24',
  MECH:  '#EF4444',
  MIN:   '#6366F1',
};

export function getDepartmentColor(dept) {
  return DEPT_COLORS[dept?.toUpperCase()] || '#A1A1AA';
}

// ── Debounce & Throttle ──────────────────────────────────
export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function throttle(fn, ms = 300) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
}

// ── Misc ─────────────────────────────────────────────────
export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function truncate(str, len = 50) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '…' : str;
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
