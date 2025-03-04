
/**
 * Deepgram service for speech-to-text transcription
 */

export const processDeepgramAudio = async (audioBlob: Blob, apiKey: string): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&filler_words=false', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`
      },
      body: audioBlob
    });

    if (!response.ok) {
      throw new Error(`Deepgram API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Deepgram response:", data);
    
    // Extract the transcription from the Deepgram response
    return data.results?.channels[0]?.alternatives[0]?.transcript || '';
  } catch (error) {
    console.error('Error transcribing audio with Deepgram:', error);
    throw error;
  }
};
