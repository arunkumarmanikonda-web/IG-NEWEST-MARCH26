export const mobileStaffEntryError = "We couldn't start a fresh staff sign-in. The workspace has not been opened. Check your connection and retry.";

// One reset per entry, including React's effect replay. A failed attempt can be
// retried explicitly; a pending or successful attempt cannot start a second POST.
export function createMobileStaffEntry(fetcher = globalThis.fetch) {
  let pending, failed = false;
  function start() {
    if (pending) return pending;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    pending = (async () => {
      try {
        const response = await fetcher('/api/portal/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          cache: 'no-store',
          redirect: 'error',
          signal: controller.signal,
          body: JSON.stringify({ action: 'signout_local' }),
        });
        if (!response.ok || response.redirected || (await response.json())?.ok !== true)
          throw new Error(mobileStaffEntryError);
        // The normal sign-in flow still owns all role and verification decisions.
        // Neither the request URL nor an API response can select another target.
        return '/login';
      } catch {
        failed = true;
        throw new Error(mobileStaffEntryError);
      } finally {
        clearTimeout(timer);
      }
    })();
    return pending;
  }
  return {
    start,
    retry() {
      if (failed) { pending = undefined; failed = false; }
      return start();
    },
  };
}
