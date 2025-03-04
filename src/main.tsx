
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeConsole, runAudioDiagnostics, testNetworkConnectivity } from './lib/init-console'
import { diagnoseLocalhostIssues } from './lib/localhost-workaround'

// Initialize console logging to verify environment setup
initializeConsole();

// Expose diagnostic functions to the global window object for debugging
declare global {
  interface Window {
    diagnostics: {
      runAudioDiagnostics: typeof runAudioDiagnostics;
      testNetworkConnectivity: typeof testNetworkConnectivity;
      diagnoseLocalhostIssues: typeof diagnoseLocalhostIssues;
    };
  }
}

// Add diagnostics to window for console access
window.diagnostics = {
  runAudioDiagnostics,
  testNetworkConnectivity,
  diagnoseLocalhostIssues
};

// Log available diagnostic commands
console.log('%c🛠️ Diagnostic commands available:', 'color: #346eeb; font-weight: bold;');
console.log('%c  window.diagnostics.runAudioDiagnostics()', 'color: #346eeb;');
console.log('%c  window.diagnostics.testNetworkConnectivity()', 'color: #346eeb;');
console.log('%c  window.diagnostics.diagnoseLocalhostIssues()', 'color: #346eeb;');

createRoot(document.getElementById("root")!).render(<App />);
