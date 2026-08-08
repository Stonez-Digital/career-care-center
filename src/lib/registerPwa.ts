import { registerSW } from 'virtual:pwa-register';

const UPDATE_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Keep long-lived browser tabs and installed PWAs on the current deployment.
 * This is especially important because the Supabase project configuration is
 * compiled into the JavaScript bundle.
 */
export function registerPwa() {
  if (!('serviceWorker' in navigator)) return;

  let registration: ServiceWorkerRegistration | undefined;

  const checkForUpdate = () => {
    if (document.visibilityState === 'visible') {
      void registration?.update();
    }
  };

  registerSW({
    immediate: true,
    onRegisteredSW: (_serviceWorkerUrl, currentRegistration) => {
      registration = currentRegistration;
      checkForUpdate();
      window.addEventListener('focus', checkForUpdate);
      document.addEventListener('visibilitychange', checkForUpdate);
      window.setInterval(checkForUpdate, UPDATE_INTERVAL_MS);
    },
    onRegisterError: (error) => {
      console.error('[CCC] Service worker registration failed:', error);
    },
  });
}
