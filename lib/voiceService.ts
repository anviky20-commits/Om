/**
 * Voice Service: Text-to-Speech (Audio Reading)
 */

export type VoiceLanguage = 'hi-IN' | 'en-IN' | 'en-US' | 'auto';
import { VoicePersona, SpeechUnit, splitIntoSpeechUnits } from './nativeVoiceEngine';

export interface TextReaderOptions {
  lang?: VoiceLanguage;
  rate?: number; // 0.6 to 1.6
  pitch?: number; // 0.5 to 1.6
  pauseWeight?: number; // 0.5 to 1.8
  volume?: number; // 0.1 to 1.0
  persona?: VoicePersona;
  preferGender?: 'female' | 'male' | 'any';
  voiceName?: string;
  onStateChange?: (state: {
    isSpeaking: boolean;
    isPaused: boolean;
    currentSentence?: string;
    progress?: number;
    activeVoiceName?: string;
  }) => void;
}

export const isSpeechSynthesisSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window;
};

export class TextReaderController {
  private isSpeaking: boolean = false;
  private isPaused: boolean = false;
  private currentUnits: SpeechUnit[] = [];
  private currentUnitIndex: number = 0;
  private keepAliveInterval: any = null;
  private pauseTimer: any = null;
  private onStateChange?: TextReaderOptions['onStateChange'];
  private currentOptions: TextReaderOptions = {};
  private activeVoice: SpeechSynthesisVoice | null = null;

  public speak(htmlOrPlainText: string, options: TextReaderOptions = {}) {
    if (!isSpeechSynthesisSupported()) {
      console.warn('Text-to-speech audio reader is not supported by your browser.');
      return;
    }

    this.stop(); // Stop any current speech cleanly
    this.currentOptions = options;
    if (options.onStateChange) this.onStateChange = options.onStateChange;

    const targetLang = options.lang || 'auto';
    const { cleanText, isHindi } = prepareNativePhonetics(htmlOrPlainText, targetLang);

    if (!cleanText) return;

    // Split text into natural conversational speech units with trailing pause timings
    this.currentUnits = splitIntoSpeechUnits(cleanText, options.pauseWeight || 1.0);
    if (this.currentUnits.length === 0) return;

    this.currentUnitIndex = 0;
    this.isSpeaking = true;
    this.isPaused = false;

    // Resolve optimal voice (Indian English, Hindi Devanagari, Natural Neural)
    const effectiveLang = isHindi ? 'hi-IN' : (targetLang === 'auto' ? 'en-IN' : targetLang);
    const voices = window.speechSynthesis.getVoices();
    
    if (options.voiceName) {
      this.activeVoice = voices.find(v => v.name === options.voiceName) || null;
    }
    if (!this.activeVoice) {
      this.activeVoice = pickOptimalVoice(voices, effectiveLang, options.preferGender || 'any');
    }

    // Start keep-alive ping for browser speech synthesis
    this.startKeepAlive();

    // Begin speaking first unit
    this.speakCurrentUnit();
  }

  public previewVoice(options: TextReaderOptions, sampleText?: string) {
    const isHindi = options.lang === 'hi-IN';
    const defaultText = isHindi
      ? 'नमस्ते! यह आपकी चुनी हुई और मिलाई गई आवाज़ है। यह सुर और गति बिलकुल सटीक है।'
      : 'Hello! This is your custom matched voice. The pitch and cadence have been tuned.';
    this.speak(sampleText || defaultText, options);
  }

  private startKeepAlive() {
    this.stopKeepAlive();
    this.keepAliveInterval = setInterval(() => {
      if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
        if (!this.isPaused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }
    }, 8000);
  }

  private stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  private speakCurrentUnit() {
    if (!this.isSpeaking || this.currentUnitIndex >= this.currentUnits.length) {
      this.finishSpeaking();
      return;
    }

    const unit = this.currentUnits[this.currentUnitIndex];
    if (!unit || !unit.text) {
      this.currentUnitIndex++;
      this.speakCurrentUnit();
      return;
    }

    // Refresh voice if needed
    if (!this.activeVoice) {
      const voices = window.speechSynthesis.getVoices();
      const containsHindi = /[\u0900-\u097F]/.test(unit.text);
      this.activeVoice = pickOptimalVoice(
        voices,
        containsHindi ? 'hi-IN' : (this.currentOptions.lang || 'en-IN'),
        this.currentOptions.preferGender || 'any'
      );
    }

    const utterance = new SpeechSynthesisUtterance(unit.text);
    
    // Assign voice & language
    if (this.activeVoice) {
      utterance.voice = this.activeVoice;
      utterance.lang = this.activeVoice.lang;
    } else {
      const containsHindi = /[\u0900-\u097F]/.test(unit.text);
      utterance.lang = containsHindi ? 'hi-IN' : (this.currentOptions.lang === 'hi-IN' ? 'hi-IN' : 'en-IN');
    }

    // Natural pacing & pitch inflection
    const baseRate = this.currentOptions.rate !== undefined ? this.currentOptions.rate : 0.96;
    const basePitch = (this.currentOptions.pitch !== undefined ? this.currentOptions.pitch : 1.0) + unit.pitchOffset;
    const baseVolume = this.currentOptions.volume !== undefined ? this.currentOptions.volume : 1.0;

    utterance.rate = Math.max(0.5, Math.min(1.8, baseRate));
    utterance.pitch = Math.max(0.5, Math.min(1.6, basePitch));
    utterance.volume = Math.max(0.1, Math.min(1.0, baseVolume));

    utterance.onstart = () => {
      this.onStateChange?.({
        isSpeaking: true,
        isPaused: false,
        currentSentence: unit.text,
        progress: Math.round(((this.currentUnitIndex + 1) / this.currentUnits.length) * 100),
        activeVoiceName: this.activeVoice ? `${this.activeVoice.name} (${this.activeVoice.lang})` : 'Natural Native Voice'
      });
    };

    utterance.onend = () => {
      this.currentUnitIndex++;
      if (this.currentUnitIndex < this.currentUnits.length && this.isSpeaking) {
        // Natural breath pause between clauses/sentences
        clearTimeout(this.pauseTimer);
        this.pauseTimer = setTimeout(() => {
          if (this.isSpeaking && !this.isPaused) {
            this.speakCurrentUnit();
          }
        }, unit.trailingPauseMs);
      } else {
        this.finishSpeaking();
      }
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis unit error:', e);
      this.currentUnitIndex++;
      if (this.currentUnitIndex < this.currentUnits.length && this.isSpeaking) {
        setTimeout(() => this.speakCurrentUnit(), 100);
      } else {
        this.finishSpeaking();
      }
    };

    window.speechSynthesis.speak(utterance);
  }

  private finishSpeaking() {
    this.isSpeaking = false;
    this.isPaused = false;
    this.stopKeepAlive();
    clearTimeout(this.pauseTimer);
    this.onStateChange?.({
      isSpeaking: false,
      isPaused: false,
      currentSentence: undefined,
      progress: 100,
      activeVoiceName: undefined
    });
  }

  public pause() {
    if (isSpeechSynthesisSupported() && this.isSpeaking) {
      window.speechSynthesis.pause();
      clearTimeout(this.pauseTimer);
      this.isPaused = true;
      this.onStateChange?.({ isSpeaking: true, isPaused: true });
    }
  }

  public resume() {
    if (isSpeechSynthesisSupported() && this.isPaused) {
      window.speechSynthesis.resume();
      this.isPaused = false;
      this.onStateChange?.({ isSpeaking: true, isPaused: false });
    }
  }

  public stop() {
    this.stopKeepAlive();
    clearTimeout(this.pauseTimer);
    if (isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.isPaused = false;
      this.activeVoice = null;
      this.onStateChange?.({ isSpeaking: false, isPaused: false, currentSentence: undefined });
    }
  }

  public getState() {
    return {
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
      progress: this.currentUnits.length
        ? Math.round((this.currentUnitIndex / this.currentUnits.length) * 100)
        : 0
    };
  }
}

// Global Singleton Instances
export const globalTextReader = new TextReaderController();
