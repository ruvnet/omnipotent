/**
 * Localhost WebRTC workarounds
 * 
 * This file contains utilities to help diagnose and work around issues
 * with WebRTC connections when running on localhost.
 */

/**
 * Checks if the application is running on localhost
 */
export const isRunningOnLocalhost = (): boolean => {
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1'
  );
};

/**
 * Gets information about the current origin
 */
export const getOriginInfo = (): {
  hostname: string;
  protocol: string;
  port: string;
  isLocalhost: boolean;
  isSecure: boolean;
} => {
  const { hostname, protocol, port } = window.location;
  const isLocalhost = isRunningOnLocalhost();
  const isSecure = protocol === 'https:';
  
  return {
    hostname,
    protocol,
    port,
    isLocalhost,
    isSecure
  };
};

/**
 * Checks if the current environment might have WebRTC restrictions
 */
export const checkWebRTCEnvironment = (): {
  hasRestrictions: boolean;
  restrictions: string[];
} => {
  const restrictions: string[] = [];
  const originInfo = getOriginInfo();
  
  // Check if running on localhost
  if (originInfo.isLocalhost) {
    restrictions.push(
      'Running on localhost: WebRTC on localhost may have connectivity issues with external services.'
    );
  }
  
  // Check if using HTTP instead of HTTPS
  if (!originInfo.isSecure && !originInfo.isLocalhost) {
    restrictions.push(
      'Running on non-secure origin: WebRTC requires HTTPS except on localhost.'
    );
  }
  
  // Check if running in an iframe
  if (window !== window.top) {
    restrictions.push(
      'Running in an iframe: WebRTC in iframes may have additional restrictions.'
    );
  }
  
  // Define types for non-standard browser APIs
  interface WindowWithFileSystem extends Window {
    RequestFileSystem?: (type: number, size: number, successCallback: () => void, errorCallback: () => void) => void;
    webkitRequestFileSystem?: (type: number, size: number, successCallback: () => void, errorCallback: () => void) => void;
    TEMPORARY?: number;
  }
  
  // Check if running in incognito/private mode (not 100% reliable)
  try {
    const windowWithFS = window as WindowWithFileSystem;
    const fs = windowWithFS.RequestFileSystem || windowWithFS.webkitRequestFileSystem;
    if (fs) {
      fs(windowWithFS.TEMPORARY || 0, 100, 
        () => {}, // Not in incognito
        () => {
          restrictions.push(
            'Possibly running in incognito/private mode: WebRTC might have additional restrictions.'
          );
        }
      );
    }
  } catch (e) {
    // Ignore errors
  }
  
  return {
    hasRestrictions: restrictions.length > 0,
    restrictions
  };
};

/**
 * Provides suggestions for working around localhost WebRTC issues
 */
export const getLocalhostWorkaroundSuggestions = (): string[] => {
  const suggestions = [
    'Try using a local development HTTPS server instead of HTTP',
    'Use a tool like ngrok (https://ngrok.com) to create a secure tunnel to your localhost',
    'Deploy to a staging environment with a proper domain and HTTPS',
    'Check if your browser has any privacy extensions that might block WebRTC',
    'Try a different browser to see if the issue is browser-specific',
    'Ensure your firewall allows WebRTC connections (UDP ports)',
    'If on a corporate network, check if WebRTC traffic is allowed'
  ];
  
  return suggestions;
};

/**
 * Runs a comprehensive check for localhost-related WebRTC issues
 */
export const diagnoseLocalhostIssues = (): {
  isLocalhost: boolean;
  environment: ReturnType<typeof checkWebRTCEnvironment>;
  suggestions: string[];
} => {
  console.log('%c🔍 Checking for localhost-related WebRTC issues...', 'color: #346eeb; font-weight: bold;');
  
  const isLocalhost = isRunningOnLocalhost();
  const originInfo = getOriginInfo();
  const environment = checkWebRTCEnvironment();
  
  console.log('%c📋 Origin Information:', 'color: #346eeb; font-weight: bold;');
  console.log(originInfo);
  
  if (environment.hasRestrictions) {
    console.warn('%c⚠️ Potential WebRTC restrictions detected:', 'color: #ff9800; font-weight: bold;');
    environment.restrictions.forEach(restriction => {
      console.warn(`- ${restriction}`);
    });
    
    const suggestions = getLocalhostWorkaroundSuggestions();
    console.log('%c💡 Suggestions:', 'color: #346eeb; font-weight: bold;');
    suggestions.forEach(suggestion => {
      console.log(`- ${suggestion}`);
    });
    
    if (isLocalhost) {
      console.log('%c🔧 Localhost Workaround:', 'color: #346eeb; font-weight: bold;');
      console.log('Consider using a service like ngrok to create a secure tunnel:');
      console.log('1. Install ngrok: https://ngrok.com/download');
      console.log('2. Run: ngrok http [your-local-port]');
      console.log('3. Use the ngrok URL instead of localhost');
    }
  } else {
    console.log('%c✅ No WebRTC environment restrictions detected', 'color: #00aa00;');
  }
  
  return {
    isLocalhost,
    environment,
    suggestions: environment.hasRestrictions ? getLocalhostWorkaroundSuggestions() : []
  };
};
