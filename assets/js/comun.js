const $ = s => document.querySelector(s);
const fmt = n => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ext = n => (n.split('.').pop() || '').slice(0, 4).toUpperCase();
const cod = c => c.slice(0, 4) + '-' + c.slice(4);
const err = async (r, t) => (await r.json().catch(() => ({}))).error || t;
