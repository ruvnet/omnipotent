// Console initialization utilities

/**
 * Logs the settings store configuration to the console
 * This helps verify that the settings are properly loaded
 */
export const logSettingsStore = () => {
  try {
    // Dynamically import the settings store to avoid circular dependencies
    import('../stores/settingsStore').then(({ useSettings }) => {
      // Get the current settings
      const settings = useSettings.getState();
      
      console.log('%c⚙️ Settings Store Configuration:', 'color: #9c27b0; font-weight: bold;');
      console.log({
        'Voice': settings.voice,
        'Model': settings.model,
        'Prompt Preset': settings.promptPreset,
        'Character Name': settings.character.name
      });
      
      // Check if settings match environment defaults
      const envModel = import.meta.env.VITE_OPENAI_MODEL;
      const envTtsModel = import.meta.env.VITE_OPENAI_TTS_MODEL;
      
      if (envTtsModel && settings.model !== envTtsModel) {
        console.warn(
          `%c⚠️ TTS Model mismatch: Environment (${envTtsModel}) ≠ Settings (${settings.model})`,
          'color: #ff9800; font-weight: bold;'
        );
      }
      
      console.log('%c✅ Settings store loaded successfully', 'color: #00aa00;');
    }).catch(error => {
      console.error('%c❌ Failed to load settings store', 'color: #ff0000; font-weight: bold;');
      console.error(error);
    });
  } catch (error) {
    console.error('%c❌ Error in settings store initialization', 'color: #ff0000; font-weight: bold;');
    console.error(error);
  }
};

/**
 * Checks browser compatibility for required features
 */
export const checkBrowserCompatibility = () => {
  console.log('%c🔍 Checking browser compatibility...', 'color: #346eeb; font-weight: bold;');
  
  // Add type declaration for webkitAudioContext
  const windowWithWebkit = window as Window & {
    webkitAudioContext?: typeof AudioContext;
  };
  
  const compatibility = {
    webRTC: !!window.RTCPeerConnection,
    mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    audioContext: !!window.AudioContext || !!windowWithWebkit.webkitAudioContext,
    localStorage: !!window.localStorage
  };
  
  console.log('%c📊 Browser Compatibility:', 'color: #346eeb; font-weight: bold;');
  console.log(compatibility);
  
  const allCompatible = Object.values(compatibility).every(Boolean);
  
  if (allCompatible) {
    console.log('%c✅ Browser is fully compatible', 'color: #00aa00;');
  } else {
    console.warn(
      '%c⚠️ Some features may not work correctly in this browser',
      'color: #ff9800; font-weight: bold;'
    );
    
    // Log specific warnings for missing features
    if (!compatibility.webRTC) {
      console.warn('%c⚠️ WebRTC is not supported - Voice features will not work', 'color: #ff9800;');
    }
    if (!compatibility.mediaDevices) {
      console.warn('%c⚠️ Media Devices API is not supported - Microphone access will not work', 'color: #ff9800;');
    }
  }
};

/**
 * Run audio diagnostics from the console
 * This can be called manually to diagnose audio issues
 */
export const runAudioDiagnostics = async () => {
  console.log('%c🔍 Running audio diagnostics...', 'color: #346eeb; font-weight: bold;');
  
  try {
    // Dynamically import audio-debug to avoid circular dependencies
    const { runAudioDiagnostic, logWebRTCStats, testOpenAIConnectivity } = await import('./audio-debug');
    
    // Test OpenAI API connectivity first
    console.log('%c1️⃣ Testing API connectivity...', 'color: #346eeb;');
    const apiConnectivity = await testOpenAIConnectivity();
    
    if (!apiConnectivity.success) {
      console.error('%c❌ OpenAI API connectivity issue detected:', 'color: #ff0000; font-weight: bold;');
      console.error(`  ${apiConnectivity.error}`);
      console.error('This may prevent the WebRTC connection from being established.');
      console.error('Please check your internet connection and API key.');
      
      return { 
        apiConnectivity,
        error: apiConnectivity.error,
        suggestion: 'API connectivity issue detected. Check your internet connection and API key.'
      };
    }
    
    // Run the audio diagnostic
    console.log('%c2️⃣ Checking audio system...', 'color: #346eeb;');
    const results = await runAudioDiagnostic();
    
    if (results.issues.length > 0) {
      console.warn('%c⚠️ Audio diagnostic issues detected:', 'color: #ff9800; font-weight: bold;');
      results.issues.forEach(issue => console.warn(`- ${issue}`));
    } else {
      console.log('%c✅ No audio issues detected', 'color: #00aa00;');
    }
    
    // Find any active WebRTC connections
    const audioElement = document.getElementById('openai-voice-audio') as HTMLAudioElement;
    if (audioElement) {
      console.log('%c🔊 Found audio element:', 'color: #346eeb; font-weight: bold;');
      console.log({
        id: audioElement.id,
        paused: audioElement.paused,
        muted: audioElement.muted,
        volume: audioElement.volume,
        currentTime: audioElement.currentTime,
        duration: audioElement.duration || 'N/A'
      });
    } else {
      console.warn('%c⚠️ No audio element found with id "openai-voice-audio"', 'color: #ff9800;');
    }
    
    // Provide suggestions based on diagnostics
    const suggestions = [];
    
    if (apiConnectivity.latency && apiConnectivity.latency > 500) {
      suggestions.push(`High API latency (${apiConnectivity.latency}ms) may affect performance. Check your internet connection.`);
    }
    
    if (!results.autoplayAllowed) {
      suggestions.push('Browser autoplay policy may be blocking audio. Try interacting with the page first.');
    }
    
    if (!results.microphoneAccess) {
      suggestions.push('Microphone access is required for WebRTC. Check browser permissions.');
    }
    
    if (suggestions.length > 0) {
      console.log('%c💡 Suggestions:', 'color: #346eeb; font-weight: bold;');
      suggestions.forEach(suggestion => console.log(`- ${suggestion}`));
    }
    
    console.log('%c📋 Audio diagnostic complete', 'color: #346eeb; font-weight: bold;');
    return {
      apiConnectivity,
      audioSystem: results,
      suggestions
    };
  } catch (error) {
    console.error('%c❌ Error running audio diagnostics:', 'color: #ff0000; font-weight: bold;');
    console.error(error);
    return { error };
  }
};

/**
 * Test network connectivity to key services
 */
export const testNetworkConnectivity = async () => {
  console.log('%c🔍 Testing network connectivity...', 'color: #346eeb; font-weight: bold;');
  
  const results = {
    openai: false,
    stun: false
  };
  
  try {
    // Test OpenAI API
    const { testOpenAIConnectivity } = await import('./audio-debug');
    const openaiResult = await testOpenAIConnectivity();
    results.openai = openaiResult.success;
    
    // Test STUN server (for WebRTC)
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      let stunResolved = false;
      
      pc.onicecandidate = (e) => {
        if (e.candidate && !stunResolved) {
          // If we get any ICE candidate, STUN is working
          console.log('%c✅ STUN server connection successful', 'color: #00aa00;');
          results.stun = true;
          stunResolved = true;
          pc.close();
        }
      };
      
      // Create data channel to trigger ICE gathering
      pc.createDataChannel('test');
      await pc.createOffer().then(offer => pc.setLocalDescription(offer));
      
      // Set a timeout for STUN test
      setTimeout(() => {
        if (!stunResolved) {
          console.error('%c❌ STUN server connection timed out', 'color: #ff0000; font-weight: bold;');
          pc.close();
        }
      }, 5000);
    } catch (error) {
      console.error('%c❌ STUN server test failed:', 'color: #ff0000; font-weight: bold;');
      console.error(error);
    }
    
    return results;
  } catch (error) {
    console.error('%c❌ Error testing network connectivity:', 'color: #ff0000; font-weight: bold;');
    console.error(error);
    return { error };
  }
};

/**
 * Initialize all console diagnostics
 */
export const initializeConsole = () => {
  console.log('%c🔍 Initializing application...', 'color: #346eeb; font-weight: bold; font-size: 14px;');
  
  // Check OpenAI API key
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    console.error('%c❌ OpenAI API Key is missing!', 'color: #ff0000; font-weight: bold;');
  } else {
    console.log('%c✅ OpenAI API Key is configured', 'color: #00aa00;');
  }
  
  // Log OpenAI model configuration
  console.log('%c📋 OpenAI Model Configuration:', 'color: #346eeb; font-weight: bold;');
  console.log({
    'Main Model': import.meta.env.VITE_OPENAI_MODEL || 'Not configured',
    'TTS Model': import.meta.env.VITE_OPENAI_TTS_MODEL || 'Not configured',
    'STT Model': import.meta.env.VITE_OPENAI_STT_MODEL || 'Not configured',
    'API URL': import.meta.env.VITE_OPENAI_API_URL || 'Not configured'
  });
  
  // Log feature flags
  console.log('%c🚩 Feature Flags:', 'color: #346eeb; font-weight: bold;');
  console.log({
    'Voice Features': import.meta.env.VITE_ENABLE_VOICE_FEATURES === 'true' ? 'Enabled' : 'Disabled',
    'Debug Mode': import.meta.env.VITE_ENABLE_DEBUG_MODE === 'true' ? 'Enabled' : 'Disabled'
  });
  
  // Check browser compatibility
  checkBrowserCompatibility();
  
  // Log settings store (async)
  logSettingsStore();
  
  console.log('%c🚀 Application initialized successfully!', 'color: #00aa00; font-weight: bold; font-size: 14px;');
};
