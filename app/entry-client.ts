// entry-client.ts
import { setup } from './app';

// Execute setup targeting <div id="app"></div>
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setup('app'));
} else {
  setup('app');
}