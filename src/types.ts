export interface VoiceConfig {
  voice: string;
  pitch: string;
  rate: string;
}

export type Voices = Record<string, VoiceConfig>;
