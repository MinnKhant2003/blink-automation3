export interface VoiceConfig {
  voice: string;
  pitch: string;
  rate: string;
  description?: string;
}

export type Voices = Record<string, VoiceConfig>;
