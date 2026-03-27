import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ProficiencyLevel, ExerciseData, QuestionType } from "../types";
import { convertRawToWav } from "../utils/wavUtils";

// Initialize Gemini Client
// Note: In a real app, ensure process.env.API_KEY is defined.
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Pools of names to ensure distinct gender identification
const MALE_NAMES = ['Mark', 'David', 'James', 'Michael', 'Robert', 'John', 'Paul', 'Steve'];
const FEMALE_NAMES = ['Sarah', 'Emily', 'Jessica', 'Lisa', 'Emma', 'Anna', 'Laura', 'Julie'];

export const generateExerciseContent = async (
  level: ProficiencyLevel,
  topic: string
): Promise<ExerciseData> => {
  const model = "gemini-2.5-flash";

  // Select one male and one female name for this exercise
  const maleName = MALE_NAMES[Math.floor(Math.random() * MALE_NAMES.length)];
  const femaleName = FEMALE_NAMES[Math.floor(Math.random() * FEMALE_NAMES.length)];

  const schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      level: { type: Type.STRING },
      dialogue: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            speaker: { type: Type.STRING, description: "Name of the speaker" },
            text: { type: Type.STRING, description: "The spoken line" },
          },
          required: ["speaker", "text"],
        },
      },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            type: { type: Type.STRING, enum: [QuestionType.MULTIPLE_CHOICE, QuestionType.FILL_IN_THE_BLANK, QuestionType.MATCHING] },
            text: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
                },
                required: ["id", "text"],
              },
              nullable: true,
            },
            correctAnswer: { type: Type.STRING, description: "The correct answer ID or text. For matching, provide a JSON stringified array of correct pairs 'item:match'." },
            matches: {
               type: Type.ARRAY,
               items: {
                 type: Type.OBJECT,
                 properties: {
                   item: { type: Type.STRING },
                   match: { type: Type.STRING }
                 }
               },
               nullable: true
            },
            explanation: { type: Type.STRING, description: "Explanation for why the answer is correct." },
          },
          required: ["id", "type", "text", "correctAnswer", "explanation"],
        },
      },
    },
    required: ["topic", "level", "dialogue", "questions"],
  };

  const prompt = `
    Create an English listening exercise.
    Level: ${level}
    Topic: ${topic}
    
    1. Generate a natural, engaging dialogue between two people: 
       - A male speaker named '${maleName}'
       - A female speaker named '${femaleName}'
       The dialogue should be about 150-250 words.
    2. Generate 5 distinct questions based on the dialogue.
       - IMPORTANT: The questions MUST be ordered chronologically based on when the relevant information or answer appears in the dialogue. The first question should relate to the beginning of the conversation, and the last question to the end.
       - Include exactly:
         * Two Multiple Choice questions.
         * Two Fill-in-the-blank questions (quote a sentence from the dialogue with a missing word). For numerical answers, provide both the digit and word forms separated by a pipe character (e.g., '5|five').
         * One Matching question (e.g., match words to definitions or speakers to opinions).
    
    Ensure the content is appropriate for the level. 
    For Matching questions, provide the 'matches' array with correct pairs. The UI will shuffle them.
    Return pure JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    if (!response.text) throw new Error("No text returned from Gemini");
    
    return JSON.parse(response.text) as ExerciseData;
  } catch (error) {
    console.error("Content Generation Error:", error);
    throw new Error("Failed to generate exercise content.");
  }
};

export const generateSpeech = async (dialogue: { speaker: string; text: string }[]): Promise<string> => {
  const model = "gemini-2.5-flash-preview-tts";

  // Identify unique speakers to assign voices
  const uniqueSpeakers = Array.from(new Set(dialogue.map(d => d.speaker)));
  
  // Available voices
  // Male: Puck, Fenrir, Charon
  // Female: Kore, Zephyr
  const maleVoices = ['Puck', 'Fenrir', 'Charon'];
  const femaleVoices = ['Kore', 'Zephyr'];
  
  const speakerVoiceConfigs = uniqueSpeakers.map(speaker => {
    // Determine voice based on known name lists
    let voiceName = 'Puck'; // Default

    const isMale = MALE_NAMES.some(m => speaker.includes(m));
    const isFemale = FEMALE_NAMES.some(f => speaker.includes(f));

    if (isMale) {
      voiceName = maleVoices[Math.floor(Math.random() * maleVoices.length)];
    } else if (isFemale) {
      voiceName = femaleVoices[Math.floor(Math.random() * femaleVoices.length)];
    } else {
        // Fallback for unexpected names
        const allVoices = [...maleVoices, ...femaleVoices];
        // Use a simple hash of the name to consistently pick a voice
        let hash = 0;
        for (let i = 0; i < speaker.length; i++) {
            hash = speaker.charCodeAt(i) + ((hash << 5) - hash);
        }
        voiceName = allVoices[Math.abs(hash) % allVoices.length];
    }

    return {
      speaker: speaker,
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName }
      }
    };
  });

  const promptText = `
    TTS the following conversation:
    ${dialogue.map(d => `${d.speaker}: ${d.text}`).join('\n')}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: promptText,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data returned");
    }

    // Convert raw PCM to WAV blob URL for the <audio> player
    const wavBlob = convertRawToWav(base64Audio, 24000);
    return URL.createObjectURL(wavBlob);

  } catch (error) {
    console.error("Speech Generation Error:", error);
    throw new Error("Failed to generate speech.");
  }
};