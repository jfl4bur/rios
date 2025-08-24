export function isLocalHost() {
  try {
    if (typeof window === 'undefined') return false;
    const host = window.location && window.location.hostname ? window.location.hostname : '';
    if (!host) return false;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local');
  } catch (e) {
    return false;
  }
}

export default { isLocalHost };
