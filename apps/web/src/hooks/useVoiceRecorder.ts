'use client';

import { useRef, useCallback } from 'react';
import { useChatContext } from '@/components/chatbot/ChatContext';
import { VOICE_CONFIG } from '@lcau/shared';

// Convert audio blob to WAV format using Web Audio API
async function convertToWav(audioBlob: Blob): Promise<Blob> {
  const audioContext = new AudioContext({ sampleRate: VOICE_CONFIG.SAMPLE_RATE });

  try {
    // Decode the audio data
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Get raw PCM data (mono, first channel)
    const pcmData = audioBuffer.getChannelData(0);

    // Create WAV file
    const wavBuffer = encodeWav(pcmData, audioBuffer.sampleRate);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  } finally {
    await audioContext.close();
  }
}

// Encode PCM data to WAV format
function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;

  // Convert float32 to int16
  const int16Samples = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i] ?? 0;
    const s = Math.max(-1, Math.min(1, sample));
    int16Samples[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  const dataSize = int16Samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write samples
  const offset = 44;
  for (let i = 0; i < int16Samples.length; i++) {
    view.setInt16(offset + i * 2, int16Samples[i], true);
  }

  return buffer;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

// Get supported MIME type for this browser
function getSupportedMimeType(): string {
  const types = [
    'audio/webm',
    'audio/webm;codecs=opus',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return ''; // Let browser choose default
}

export function useVoiceRecorder() {
  const { setIsRecording } = useChatContext();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>('');

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: VOICE_CONFIG.SAMPLE_RATE,
        },
      });

      // Determine best MIME type for this browser
      const mimeType = getSupportedMimeType();
      mimeTypeRef.current = mimeType;

      const options: MediaRecorderOptions = {};
      if (mimeType) {
        options.mimeType = mimeType;
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);

      console.log('Recording started with MIME type:', mimeType || 'browser default');

      // Auto-stop after max duration
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
      }, VOICE_CONFIG.MAX_RECORDING_SECONDS * 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
      throw new Error('Microphone access denied');
    }
  }, [setIsRecording]);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        setIsRecording(false);
        resolve(null);
        return;
      }

      mediaRecorder.onstop = async () => {
        // Use the actual MIME type that was used for recording
        const originalMimeType = mimeTypeRef.current || mediaRecorder.mimeType || 'audio/webm';
        const originalBlob = new Blob(chunksRef.current, { type: originalMimeType });
        chunksRef.current = [];
        setIsRecording(false);

        console.log('Recording stopped, original blob size:', originalBlob.size, 'type:', originalMimeType);

        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());

        // Convert to WAV for better Whisper compatibility
        try {
          console.log('Converting to WAV format...');
          const wavBlob = await convertToWav(originalBlob);
          console.log('WAV conversion successful, size:', wavBlob.size);
          resolve(wavBlob);
        } catch (error) {
          console.error('WAV conversion failed, using original:', error);
          resolve(originalBlob);
        }
      };

      mediaRecorder.stop();
    });
  }, [setIsRecording]);

  return {
    startRecording,
    stopRecording,
  };
}
