import { register } from 'register-service-worker';

import { isElectron } from './utils/isElectron';

if (import.meta.env.PROD && !isElectron()) {
  register(`${import.meta.env.BASE_URL}sw.js`, {
    ready() {
      console.log(
        'App is being served from cache by a service worker.\n' +
          'For more details, visit https://goo.gl/AFskqB',
      );
    },
    registered() {
      console.log('Service worker has been registered.');
    },
    cached() {
      console.log('Content has been cached for offline use.');
    },
    updatefound() {
      console.log('New content is downloading.');
    },
    updated(registration: ServiceWorkerRegistration) {
      console.log('New content is available; please refresh.');
      document.dispatchEvent(
        new CustomEvent('swUpdated', { detail: registration }),
      );
    },
    offline() {
      console.log(
        'No internet connection found. App is running in offline mode.',
      );
    },
    error(error: Error) {
      console.error('Error during service worker registration:', error);
    },
  });
}
