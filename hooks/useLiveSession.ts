
import { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../utils/audioUtils';
import { getApiKey } from '../utils/envUtils';
import { Message } from '../types';

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
// Increased buffer size back to 4096 for better audio stability and completeness
// This helps avoid "glitching" which causes the AI to miss words
const BUFFER_SIZE = 4096; 

interface UseLiveSessionProps {
  modelId: string;
  systemInstruction: string;
  initialImageBase64?: string | null; // For scenario mode
  onClose: () => void;
}

export const useLiveSession = ({ modelId, systemInstruction, initialImageBase64, onClose }: UseLiveSessionProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  // New state for real-time streaming text
  const [streamingContent, setStreamingContent] = useState<{ user: string, ai: string }>({ user: '', ai: '' });
  const [error, setError] = useState<string | null>(null);

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const messagesRef = useRef<Message[]>([]); // Sync ref for history
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  const nextStartTimeRef = useRef<number>(0);
  const audioQueueRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const currentInputRef = useRef<string>('');
  const currentOutputRef = useRef<string>('');

  const stopSession = useCallback(() => {
    // Stop recording
    if (processorRef.current && inputContextRef.current) {
      try {
        processorRef.current.disconnect();
        gainNodeRef.current?.disconnect(); // Disconnect gain
        sourceRef.current?.disconnect();
      } catch (e) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (inputContextRef.current?.state !== 'closed') {
      inputContextRef.current?.close();
    }

    // Stop playback
    audioQueueRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    audioQueueRef.current.clear();
    if (audioContextRef.current?.state !== 'closed') {
      audioContextRef.current?.close();
    }

    // Close session
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => {
          session.close();
      }).catch(() => {}); 
    }

    // Flush pending transcripts to history
    const finalMessages = [...messagesRef.current];
    if (currentInputRef.current.trim()) {
        finalMessages.push({ role: 'user', text: currentInputRef.current, timestamp: Date.now() });
    }
    // Only flush AI text if it has content (it might be cut off, but better than nothing)
    if (currentOutputRef.current.trim()) {
        finalMessages.push({ role: 'ai', text: currentOutputRef.current, timestamp: Date.now() });
    }
    
    setIsConnected(false);
    onClose();

    return finalMessages;
  }, [onClose]);

  const startSession = useCallback(async () => {
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error("API Key not found. Please configure it in settings.");
      }
      const ai = new GoogleGenAI({ apiKey });

      // Audio Setup
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false // We will handle gain manually
        } 
      });
      streamRef.current = stream;
      
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
      
      nextStartTimeRef.current = audioContextRef.current.currentTime;

      // Connect to Gemini Live
      sessionPromiseRef.current = ai.live.connect({
        model: modelId,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: systemInstruction,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
          },
          inputAudioTranscription: {}, 
          outputAudioTranscription: {}, 
        },
        callbacks: {
          onopen: async () => {
            setIsConnected(true);
            
            // Setup Audio Input Processing with GAIN BOOST
            const ctx = inputContextRef.current!;
            sourceRef.current = ctx.createMediaStreamSource(stream);
            
            // Create Gain Node to boost microphone volume
            // This helps significantly with VAD (Voice Activity Detection)
            gainNodeRef.current = ctx.createGain();
            gainNodeRef.current.gain.value = 3.0; // Boost volume by 3x

            processorRef.current = ctx.createScriptProcessor(BUFFER_SIZE, 1, 1);
            
            processorRef.current.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const blob = createPcmBlob(inputData, INPUT_SAMPLE_RATE);
              
              sessionPromiseRef.current?.then(session => {
                session.sendRealtimeInput({ media: blob });
              });
            };

            // Source -> Gain -> Processor -> Destination
            sourceRef.current.connect(gainNodeRef.current);
            gainNodeRef.current.connect(processorRef.current);
            processorRef.current.connect(ctx.destination);

            // Send Initial Image if available to trigger the scenario description immediately
            if (initialImageBase64) {
                sessionPromiseRef.current?.then(session => {
                     session.sendRealtimeInput({
                        media: {
                            mimeType: 'image/jpeg',
                            data: initialImageBase64.split(',')[1]
                        }
                     });
                });
            }
          },
          onmessage: async (msg: LiveServerMessage) => {
            // 1. Handle Transcription (Streaming updates)
            const inTrans = msg.serverContent?.inputTranscription;
            if (inTrans) {
                currentInputRef.current += inTrans.text;
                setStreamingContent(prev => ({ ...prev, user: currentInputRef.current }));
            }
            
            const outTrans = msg.serverContent?.outputTranscription;
            if (outTrans) {
                currentOutputRef.current += outTrans.text;
                setStreamingContent(prev => ({ ...prev, ai: currentOutputRef.current }));
            }

            if (msg.serverContent?.turnComplete) {
                // Commit completed messages to history
                if (currentInputRef.current.trim()) {
                    const newMsg: Message = { role: 'user', text: currentInputRef.current, timestamp: Date.now() };
                    messagesRef.current.push(newMsg);
                    setMessages([...messagesRef.current]);
                    currentInputRef.current = '';
                    setStreamingContent(prev => ({ ...prev, user: '' }));
                }
                if (currentOutputRef.current.trim()) {
                    const newMsg: Message = { role: 'ai', text: currentOutputRef.current, timestamp: Date.now() };
                    messagesRef.current.push(newMsg);
                    setMessages([...messagesRef.current]);
                    currentOutputRef.current = '';
                    setStreamingContent(prev => ({ ...prev, ai: '' }));
                }
            }

            // 2. Handle Audio Output
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
                const ctx = audioContextRef.current;
                const rawBytes = base64ToUint8Array(audioData);
                const audioBuffer = await decodeAudioData(rawBytes, ctx, OUTPUT_SAMPLE_RATE);
                
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                
                const startTime = Math.max(ctx.currentTime, nextStartTimeRef.current);
                source.start(startTime);
                nextStartTimeRef.current = startTime + audioBuffer.duration;
                
                audioQueueRef.current.add(source);
                source.onended = () => {
                    audioQueueRef.current.delete(source);
                };
            }

            // 3. Handle Interruption
            if (msg.serverContent?.interrupted) {
                audioQueueRef.current.forEach(s => s.stop());
                audioQueueRef.current.clear();
                nextStartTimeRef.current = audioContextRef.current?.currentTime || 0;
                
                // Clear current AI output as it was interrupted
                currentOutputRef.current = ''; 
                setStreamingContent(prev => ({ ...prev, ai: '' }));
            }
          },
          onclose: () => {
            setIsConnected(false);
          },
          onerror: (e) => {
            console.error("Live API Error", e);
            setError("Ocorreu um erro na conexão. Tente novamente.");
            setIsConnected(false);
          }
        }
      });

    } catch (err: any) {
      console.error("Session start error:", err);
      setError(err.message || "Failed to start session");
      setIsConnected(false);
    }
  }, [modelId, systemInstruction, initialImageBase64]);

  useEffect(() => {
    return () => {
        // Just cleanup, don't trigger callbacks here to avoid side effects during unmount
        if (sessionPromiseRef.current) {
             sessionPromiseRef.current.then(s => s.close()).catch(()=>{});
        }
        audioContextRef.current?.close();
        inputContextRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    startSession,
    stopSession,
    isConnected,
    messages,
    streamingContent,
    error
  };
};
