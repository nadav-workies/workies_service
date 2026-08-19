// Shared security helpers for backend functions

// Escape a value for safe interpolation into HTML email bodies
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Validate a user-supplied file URL before fetching it server-side (SSRF guard).
// Allows only public https URLs — rejects private IPs, localhost, IP literals and internal hostnames.
export function assertSafeFileUrl(fileUrl) {
  let url;
  try {
    url = new URL(String(fileUrl));
  } catch (_e) {
    throw new Error('file_url is not a valid URL');
  }
  if (url.protocol !== 'https:') {
    throw new Error('file_url must use https');
  }
  if (url.username || url.password) {
    throw new Error('file_url must not contain credentials');
  }
  const host = url.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host === 'metadata.google.internal'
  ) {
    throw new Error('file_url host is not allowed');
  }
  // Reject IPv4 / IPv6 literals (blocks 169.254.169.254, 10.x, 127.x, etc.)
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':') || host.startsWith('[')) {
    throw new Error('file_url must not point to an IP address');
  }
  return url.toString();
}