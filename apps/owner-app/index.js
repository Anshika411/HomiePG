import { registerRootComponent } from 'expo';

// Intercept global fetch to automatically inject tunnel bypass headers
const originalFetch = global.fetch;
global.fetch = function (uri, options) {
  const urlStr = typeof uri === 'string' ? uri : (uri && uri.url) ? uri.url : '';
  if (urlStr.includes('loca.lt') || urlStr.includes('ngrok') || urlStr.includes('trycloudflare.com')) {
    options = options || {};
    options.headers = options.headers || {};
    if (options.headers instanceof Headers) {
      options.headers.set('bypass-tunnel-reminder', 'true');
      options.headers.set('ngrok-skip-browser-warning', 'true');
    } else if (Array.isArray(options.headers)) {
      options.headers.push(['bypass-tunnel-reminder', 'true']);
      options.headers.push(['ngrok-skip-browser-warning', 'true']);
    } else {
      options.headers['bypass-tunnel-reminder'] = 'true';
      options.headers['ngrok-skip-browser-warning'] = 'true';
    }
  }
  return originalFetch(uri, options);
};

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
