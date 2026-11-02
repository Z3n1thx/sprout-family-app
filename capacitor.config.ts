import type { CapacitorConfig } from '@capacitor/cli';

/**
 * The native shell.
 *
 * Sprout is a local-first web app with no server, so the shell's only job is to
 * be a window: no plugins, no permissions, no network. Everything the app knows
 * lives in the WebView's localStorage, which Android keeps in the app's private
 * data directory — uninstalling the app is the only way to erase a family, and
 * nothing else on the phone can read it.
 *
 * `androidScheme: 'https'` matters more than it looks. It gives the WebView a
 * secure origin (https://localhost), and localStorage on a secure origin is not
 * treated as third-party data that Android may clear. On an http origin the same
 * jar of coins is a cache entry.
 */
const config: CapacitorConfig = {
  appId: 'app.sprout.family',
  appName: 'Sprout',
  webDir: 'dist',

  /* The paper colour. Without it the WebView flashes white before the first
     paint, which on a child's phone reads as the app breaking and restarting. */
  backgroundColor: '#FFFCF3',

  android: {
    /* Nothing in the app posts to a real host and there is no login, so there is
       nothing a cleartext exception would be for. */
    allowMixedContent: false,
    /* Pinch-zoom left on would let a four-year-old zoom the interface and have no
       idea how to get back. The type is already large by tier, and the beginner
       font is a setting a parent can turn on, which is the reversible version of
       the same thing. */
    zoomEnabled: false,
    webContentsDebuggingEnabled: false,
    loggingBehavior: 'none',
  },
};

export default config;
