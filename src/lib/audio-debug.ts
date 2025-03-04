/**
 * Audio debugging utilities
 */

/**
 * Checks if the browser's autoplay policy might be blocking audio
 * Many browsers require user interaction before allowing autoplay
 */
export const checkAutoplayPolicy = (): { allowed: boolean; reason?: string } => {
  // Define the WebKit AudioContext type
  interface WindowWithWebkitAudio extends Window {
    webkitAudioContext?: typeof AudioContext;
  }
  
  // Check if AudioContext is supported
  if (typeof AudioContext === 'undefined' && typeof (window as WindowWithWebkitAudio).webkitAudioContext === 'undefined') {
    return { 
      allowed: false, 
      reason: 'AudioContext is not supported in this browser' 
    };
  }

  // Create a test audio context to check its state
  const AudioContextClass = window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
  const testContext = new AudioContextClass();
  
  const state = testContext.state;
  console.log(`🔊 AudioContext state: ${state}`);
  
  // Clean up the test context
  if (testContext.close) {
    testContext.close();
  }
  
  // If the context is suspended, it likely means autoplay is restricted
  if (state === 'suspended') {
    return { 
      allowed: false, 
      reason: 'AudioContext is suspended. User interaction may be required before audio can play.' 
    };
  }
  
  return { allowed: true };
};

/**
 * Attempts to resume all audio contexts on the page
 * This should be called in response to a user interaction
 */
export const resumeAllAudioContexts = async (): Promise<boolean> => {
  try {
    // Find all audio elements
    const audioElements = document.querySelectorAll('audio');
    console.log(`Found ${audioElements.length} audio elements`);
    
    // Try to play all audio elements
    const playPromises = Array.from(audioElements).map(audio => {
      if (audio.paused) {
        console.log(`Attempting to play audio: ${audio.id || 'unnamed'}`);
        return audio.play().catch(err => {
          console.warn(`Failed to play audio: ${err.message}`);
          return false;
        });
      }
      return Promise.resolve(true);
    });
    
    // Wait for all play attempts to complete
    const results = await Promise.all(playPromises);
    const allSucceeded = results.every(result => result !== false);
    
    console.log(`Audio resumption ${allSucceeded ? 'succeeded' : 'failed'}`);
    return allSucceeded;
  } catch (error) {
    console.error('Error resuming audio contexts:', error);
    return false;
  }
};

/**
 * Logs detailed information about WebRTC connection
 */
export const logWebRTCStats = async (peerConnection: RTCPeerConnection | null): Promise<void> => {
  if (!peerConnection) {
    console.log('No active WebRTC connection to analyze');
    return;
  }
  
  try {
    console.log('📊 WebRTC Connection Analysis:');
    console.log(`Connection State: ${peerConnection.connectionState}`);
    console.log(`ICE Connection State: ${peerConnection.iceConnectionState}`);
    console.log(`Signaling State: ${peerConnection.signalingState}`);
    
    // Define types for WebRTC stats
    interface RTCStatsValue {
      packetsReceived?: number;
      bytesReceived?: number;
      packetsLost?: number;
      jitter?: number;
      timestamp?: number;
      packetsSent?: number;
      bytesSent?: number;
      roundTripTime?: number;
    }
    
    // Get detailed stats
    const stats = await peerConnection.getStats();
    const statsOutput: Record<string, RTCStatsValue> = {};
    
    stats.forEach(report => {
      if (report.type === 'inbound-rtp' && report.kind === 'audio') {
        statsOutput.inboundAudio = {
          packetsReceived: report.packetsReceived,
          bytesReceived: report.bytesReceived,
          packetsLost: report.packetsLost,
          jitter: report.jitter,
          timestamp: report.timestamp
        };
      } else if (report.type === 'outbound-rtp' && report.kind === 'audio') {
        statsOutput.outboundAudio = {
          packetsSent: report.packetsSent,
          bytesSent: report.bytesSent,
          timestamp: report.timestamp
        };
      } else if (report.type === 'remote-inbound-rtp' && report.kind === 'audio') {
        statsOutput.remoteInboundAudio = {
          packetsLost: report.packetsLost,
          jitter: report.jitter,
          roundTripTime: report.roundTripTime,
          timestamp: report.timestamp
        };
      }
    });
    
    console.log('WebRTC Stats:', statsOutput);
    
    // Check for common issues
    if (peerConnection.iceConnectionState === 'failed' || peerConnection.iceConnectionState === 'disconnected') {
      console.error('❌ ICE connection failed or disconnected. This may indicate network issues or firewall restrictions.');
    }
    
    if (statsOutput.inboundAudio && statsOutput.inboundAudio.packetsReceived === 0) {
      console.error('❌ No audio packets received. The remote peer may not be sending audio.');
    }
    
    if (statsOutput.inboundAudio && statsOutput.inboundAudio.packetsLost > 0) {
      const lossRate = statsOutput.inboundAudio.packetsLost / 
                      (statsOutput.inboundAudio.packetsReceived + statsOutput.inboundAudio.packetsLost);
      
      if (lossRate > 0.1) {
        console.warn(`⚠️ High packet loss rate: ${(lossRate * 100).toFixed(2)}%. This may cause audio quality issues.`);
      }
    }
  } catch (error) {
    console.error('Error analyzing WebRTC connection:', error);
  }
};

/**
 * Tests connectivity to the OpenAI API
 * This helps diagnose if there are network issues with the API connection
 */
export const testOpenAIConnectivity = async (): Promise<{
  success: boolean;
  latency?: number;
  error?: string;
}> => {
  console.log('%c🔍 Testing OpenAI API connectivity...', 'color: #346eeb; font-weight: bold;');
  
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: 'OpenAI API key not found in environment variables'
    };
  }
  
  const startTime = performance.now();
  
  try {
    // Test basic connectivity to the OpenAI API
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const endTime = performance.now();
    const latency = Math.round(endTime - startTime);
    
    if (response.ok) {
      console.log(`%c✅ OpenAI API connection successful (${latency}ms)`, 'color: #00aa00;');
      return {
        success: true,
        latency
      };
    } else {
      const errorText = await response.text();
      console.error(`%c❌ OpenAI API returned error: ${response.status} ${response.statusText}`, 'color: #ff0000; font-weight: bold;');
      console.error(errorText);
      return {
        success: false,
        latency,
        error: `API error: ${response.status} ${response.statusText}`
      };
    }
  } catch (error) {
    console.error('%c❌ Failed to connect to OpenAI API:', 'color: #ff0000; font-weight: bold;');
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Runs a comprehensive audio system diagnostic
 */
export const runAudioDiagnostic = async (): Promise<{
  autoplayAllowed: boolean;
  microphoneAccess: boolean;
  audioElementsPresent: boolean;
  audioContextState: string;
  issues: string[];
}> => {
  const issues: string[] = [];
  const result = {
    autoplayAllowed: false,
    microphoneAccess: false,
    audioElementsPresent: false,
    audioContextState: 'unknown',
    issues
  };
  
  // Check autoplay policy
  const autoplayCheck = checkAutoplayPolicy();
  result.autoplayAllowed = autoplayCheck.allowed;
  if (!autoplayCheck.allowed && autoplayCheck.reason) {
    issues.push(autoplayCheck.reason);
  }
  
  // Check for audio elements
  const audioElements = document.querySelectorAll('audio');
  result.audioElementsPresent = audioElements.length > 0;
  if (!result.audioElementsPresent) {
    issues.push('No audio elements found in the document');
  } else {
    console.log(`Found ${audioElements.length} audio elements:`);
    audioElements.forEach((audio, index) => {
      console.log(`Audio #${index + 1}:`, {
        id: audio.id || 'unnamed',
        src: audio.src || 'stream',
        paused: audio.paused,
        muted: audio.muted,
        volume: audio.volume,
        duration: audio.duration || 'N/A'
      });
    });
  }
  
  // Check microphone access
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    result.microphoneAccess = true;
    // Clean up
    stream.getTracks().forEach(track => track.stop());
  } catch (error) {
    result.microphoneAccess = false;
    issues.push(`Microphone access denied: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Log diagnostic results
  console.log('📋 Audio System Diagnostic Results:', result);
  
  return result;
};
