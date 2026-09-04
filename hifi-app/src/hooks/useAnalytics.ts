import { useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useAnalytics() {
  const trackEvent = useCallback(async (eventType: string, metadata: Record<string, unknown> = {}) => {
    try {
      const page_url = window.location.pathname;
      const session_id = typeof window !== 'undefined' ? sessionStorage.getItem('hifi_session') || '' : '';

      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: eventType,
          page_url,
          session_id,
          product_id: metadata.productId,
          metadata
        })
      });
    } catch (e) {
      // Fail silently to not disrupt UX
      console.error("Failed to track event:", e);
    }
  }, []);

  return { trackEvent };
}

export function usePageView() {
  const pathname = usePathname();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    // Generate simple session ID if none exists
    if (typeof window !== 'undefined' && !sessionStorage.getItem('hifi_session')) {
      sessionStorage.setItem('hifi_session', Math.random().toString(36).substring(2, 15));
    }
    trackEvent('page_view');
  }, [pathname, trackEvent]); // Runs on route change
}
