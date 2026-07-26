import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini client if API key is provided
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

export interface FeedbackAnalysis {
  isVague: boolean;
  elementsToImprove: string[];
  suggestedStyle: string;
  questions: string[];
  summary: string;
}

export interface VoiceNoteAnalysis {
  transcription: string;
  summary: string;
  tasks: string[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * Analyzes raw client feedback and generates structured follow-up questions.
 */
export async function analyzeFeedback(rawFeedback: string): Promise<FeedbackAnalysis> {
  const client = getGeminiClient();
  
  // If no API key is provided, return a fallback mock analysis
  if (!client) {
    return {
      isVague: rawFeedback.length < 15,
      elementsToImprove: ['Layout', 'Colours'],
      suggestedStyle: 'Modern',
      questions: [
        'What specific changes do you want to see for the colors?',
        'Do you have any design examples or references you prefer?',
      ],
      summary: rawFeedback || 'Client requested revisions.',
    };
  }

  try {
    const model = client.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const systemPrompt = `
      You are the Vesa OS AI Feedback Assistant. Your job is to read raw creative feedback from a client, analyze what elements they want to improve, guess their preferred style if possible, summarize the request, and ask 2-3 structured follow-up questions.
      
      Choose elements from: "Colours", "Typography", "Layout", "Icons", "Images", "Animation", "Branding", "Other".
      Choose style direction from: "Luxury", "Corporate", "Minimal", "Apple", "Modern", "Creative", "Technology", "Bold", "Elegant".

      If the feedback is vague (e.g., "I don't like this", "change it", "fix it"), set isVague to true and ask broad questions to clarify. Otherwise, ask specific details based on their complaints.

      Respond ONLY with a JSON object matching this schema:
      {
        "isVague": boolean,
        "elementsToImprove": string[],
        "suggestedStyle": string,
        "questions": string[],
        "summary": string
      }
    `;

    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }, { text: `Client feedback: "${rawFeedback}"` }] }
      ]
    });

    const text = result.response.text();
    return JSON.parse(text) as FeedbackAnalysis;
  } catch (error) {
    console.error('Error analyzing feedback with Gemini:', error);
    return {
      isVague: true,
      elementsToImprove: ['Other'],
      suggestedStyle: 'Modern',
      questions: ['Could you describe in more detail what adjustments you would like to make?'],
      summary: rawFeedback,
    };
  }
}

/**
 * Transcribes audio files directly using Gemini's native audio capabilities.
 */
export async function transcribeVoiceNote(
  audioBase64: string,
  mimeType: string
): Promise<VoiceNoteAnalysis> {
  const client = getGeminiClient();

  if (!client) {
    return {
      transcription: 'Voice note uploaded. (Gemini API Key is not configured for transcription)',
      summary: 'A voice note was uploaded but could not be processed because the GEMINI_API_KEY environment variable is missing.',
      tasks: ['Configure GEMINI_API_KEY in the project settings.'],
      priority: 'MEDIUM',
    };
  }

  try {
    const model = client.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `
      You are an AI assistant processing a client voice note for a design agency (Vesa Studios).
      Analyze the attached audio file. 
      1. Transcribe the audio verbatim.
      2. Summarize the user's requests into a paragraph.
      3. Extract a list of action items / tasks for the design team.
      4. Determine the priority of the request (LOW, MEDIUM, or HIGH) based on the urgency and tone.

      Respond ONLY with a JSON object matching this schema:
      {
        "transcription": string,
        "summary": string,
        "tasks": string[],
        "priority": "LOW" | "MEDIUM" | "HIGH"
      }
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          data: audioBase64,
          mimeType: mimeType,
        },
      },
      { text: prompt },
    ]);

    const text = result.response.text();
    return JSON.parse(text) as VoiceNoteAnalysis;
  } catch (error) {
    console.error('Error transcribing audio with Gemini:', error);
    return {
      transcription: 'Failed to transcribe audio note.',
      summary: 'An error occurred during voice note processing.',
      tasks: ['Review the voice note manually.'],
      priority: 'MEDIUM',
    };
  }
}
