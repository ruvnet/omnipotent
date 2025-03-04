
/**
 * Groq service for AI text generation
 */

import { Message } from '@/types/api';

interface GroqMessage {
  role: string;
  content: string;
}

interface GroqResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export const sendMessageToGroq = async (
  messages: Message[],
  apiKey: string
): Promise<string> => {
  try {
    const groqMessages: GroqMessage[] = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Add a system message at the beginning
    groqMessages.unshift({
      role: 'system',
      content: 'You are Echo, a helpful voice assistant. Provide concise, clear, and useful responses. Keep your answers brief but informative. If you don\'t know something, just say so. Use a friendly, conversational tone.'
    });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data: GroqResponse = await response.json();
    return data.choices[0]?.message.content || '';
  } catch (error) {
    console.error('Error generating response with Groq:', error);
    throw error;
  }
};
