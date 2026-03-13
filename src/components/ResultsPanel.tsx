import React, { useState, useRef } from 'react';
import { Copy, RefreshCw, Check, Play, Loader2, Download, Pause } from 'lucide-react';
import { ScriptResult, generateSpeech } from '../services/gemini';

const createWavBlob = (base64Audio: string, sampleRate = 24000): Blob => {
  const binaryString = atob(base64Audio);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const int16Array = new Int16Array(bytes.buffer);
  const buffer = new ArrayBuffer(44 + int16Array.length * 2);
  const view = new DataView(buffer);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + int16Array.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, int16Array.length * 2, true);

  for (let i = 0; i < int16Array.length; i++) {
    view.setInt16(44 + i * 2, int16Array[i], true);
  }

  return new Blob([view], { type: 'audio/wav' });
};

interface ResultsPanelProps {
  result: ScriptResult | null;
  onRegenerate: () => void;
  isLoading: boolean;
}

export default function ResultsPanel({ result, onRegenerate, isLoading }: ResultsPanelProps) {
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  const [playingStates, setPlayingStates] = useState<{ [key: string]: boolean }>({});
  const [downloadingStates, setDownloadingStates] = useState<{ [key: string]: boolean }>({});
  const [selectedVoice, setSelectedVoice] = useState('Zephyr');

  const activeAudioRefs = useRef<{ [key: string]: AudioBufferSourceNode }>({});
  const audioCtxRefs = useRef<{ [key: string]: AudioContext }>({});
  const fetchIds = useRef<{ [key: string]: number }>({});

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates({ ...copiedStates, [key]: true });
    setTimeout(() => {
      setCopiedStates({ ...copiedStates, [key]: false });
    }, 2000);
  };

  const handleCopyAll = () => {
    if (!result) return;
    const allText = `
Phân tích nhanh:
${result.quick_analysis}

Góc triển khai đề xuất:
${result.recommended_angle}

3 hook mở đầu:
${result.hooks.join('\n')}

Bản script chính:
${result.main_script}

Biến thể 1:
${result.variant_1}

Biến thể 2:
${result.variant_2}
    `.trim();
    handleCopy(allText, 'all');
  };

  const playAudio = async (text: string, key: string) => {
    if (playingStates[key]) {
      // Stop playing
      fetchIds.current[key] = 0; // Invalidate any ongoing fetch
      if (activeAudioRefs.current[key]) {
        try { activeAudioRefs.current[key].stop(); } catch (e) {}
        delete activeAudioRefs.current[key];
      }
      if (audioCtxRefs.current[key]) {
        try { audioCtxRefs.current[key].close(); } catch (e) {}
        delete audioCtxRefs.current[key];
      }
      setPlayingStates(prev => ({ ...prev, [key]: false }));
      return;
    }
    
    setPlayingStates(prev => ({ ...prev, [key]: true }));
    const currentFetchId = Date.now();
    fetchIds.current[key] = currentFetchId;

    try {
      const base64Audio = await generateSpeech(text, selectedVoice);
      
      // Check if user clicked stop while fetching
      if (fetchIds.current[key] !== currentFetchId) return;

      if (base64Audio) {
        // Gemini TTS returns raw 16-bit PCM audio at 24000Hz
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
          float32Array[i] = int16Array[i] / 32768.0;
        }

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioCtxRefs.current[key] = audioCtx;

        const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
        audioBuffer.getChannelData(0).set(float32Array);

        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        activeAudioRefs.current[key] = source;
        
        source.onended = () => {
          setPlayingStates(prev => ({ ...prev, [key]: false }));
          delete activeAudioRefs.current[key];
          try { audioCtx.close(); } catch (e) {}
          delete audioCtxRefs.current[key];
        };
        
        // Final check before playing
        if (fetchIds.current[key] !== currentFetchId) {
          audioCtx.close();
          return;
        }

        source.start();
      } else {
        setPlayingStates(prev => ({ ...prev, [key]: false }));
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setPlayingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleDownloadAudio = async (text: string, key: string, filename: string) => {
    if (downloadingStates[key]) return;
    
    setDownloadingStates(prev => ({ ...prev, [key]: true }));
    try {
      const base64Audio = await generateSpeech(text, selectedVoice);
      if (base64Audio) {
        const blob = createWavBlob(base64Audio);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${filename}.wav`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error downloading audio:", error);
    } finally {
      setDownloadingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-zinc-50 rounded-2xl border border-zinc-200 border-dashed p-8 text-center">
        <Loader2 className="w-10 h-10 text-zinc-400 animate-spin mb-4" />
        <h3 className="text-lg font-medium text-zinc-900 mb-2">Đang phân tích video...</h3>
        <p className="text-sm text-zinc-500 max-w-sm">
          AI đang xem xét cấu trúc, góc quay và nhịp điệu để tạo ra kịch bản phù hợp nhất.
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-zinc-50 rounded-2xl border border-zinc-200 border-dashed p-8 text-center">
        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">✨</span>
        </div>
        <h3 className="text-lg font-medium text-zinc-900 mb-2">Kết quả phân tích và script sẽ hiện ở đây</h3>
        <p className="text-sm text-zinc-500 max-w-sm">
          Dán link video tham khảo hoặc tải file video lên để bắt đầu tạo kịch bản TikTok chuyên nghiệp.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-zinc-700">Giọng đọc AI:</span>
          <select
            className="block w-48 pl-3 pr-10 py-1.5 text-sm border border-zinc-300 rounded-lg focus:ring-zinc-500 focus:border-zinc-500"
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
          >
            <option value="Zephyr">Zephyr (Nữ, Trầm ấm)</option>
            <option value="Kore">Kore (Nữ, Trong trẻo)</option>
            <option value="Puck">Puck (Nam, Năng động)</option>
            <option value="Charon">Charon (Nam, Trầm ấm)</option>
            <option value="Fenrir">Fenrir (Nam, Mạnh mẽ)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-3">Phân tích nhanh</h3>
          <p className="text-sm text-zinc-700 leading-relaxed">{result.quick_analysis}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-3">Góc triển khai đề xuất</h3>
          <p className="text-sm text-zinc-700 leading-relaxed">{result.recommended_angle}</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm">
        <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-4">3 Hook mở đầu</h3>
        <ul className="space-y-3">
          {result.hooks.map((hook, index) => (
            <li key={index} className="flex items-start gap-3 text-sm text-zinc-700 bg-zinc-50 p-3 rounded-xl">
              <span className="font-mono text-xs font-bold text-zinc-400 mt-0.5">0{index + 1}</span>
              <span>{hook}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-zinc-900 text-white p-6 rounded-2xl shadow-md relative group">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">Bản script chính</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => playAudio(result.main_script, 'main')}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-300 hover:text-white"
              title={playingStates['main'] ? "Dừng đọc" : "Nghe thử"}
            >
              {playingStates['main'] ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleDownloadAudio(result.main_script, 'main', 'script-chinh')}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-300 hover:text-white"
              title="Tải âm thanh"
            >
              {downloadingStates['main'] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleCopy(result.main_script, 'main')}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-300 hover:text-white flex items-center gap-2 text-xs font-medium"
            >
              {copiedStates['main'] ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copiedStates['main'] ? 'Đã copy' : 'Copy script chính'}
            </button>
          </div>
        </div>
        <p className="text-base leading-relaxed whitespace-pre-wrap font-medium">{result.main_script}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm relative group">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">Biến thể 1</h3>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => playAudio(result.variant_1, 'v1')} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md" title={playingStates['v1'] ? "Dừng đọc" : "Nghe thử"}>
                {playingStates['v1'] ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => handleDownloadAudio(result.variant_1, 'v1', 'bien-the-1')} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md" title="Tải âm thanh">
                {downloadingStates['v1'] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => handleCopy(result.variant_1, 'v1')} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md" title="Copy">
                {copiedStates['v1'] ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{result.variant_1}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm relative group">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">Biến thể 2</h3>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => playAudio(result.variant_2, 'v2')} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md" title={playingStates['v2'] ? "Dừng đọc" : "Nghe thử"}>
                {playingStates['v2'] ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => handleDownloadAudio(result.variant_2, 'v2', 'bien-the-2')} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md" title="Tải âm thanh">
                {downloadingStates['v2'] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => handleCopy(result.variant_2, 'v2')} className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md" title="Copy">
                {copiedStates['v2'] ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{result.variant_2}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-200">
        <button
          onClick={handleCopyAll}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-300 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          {copiedStates['all'] ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          {copiedStates['all'] ? 'Đã copy tất cả' : 'Copy tất cả'}
        </button>
        <button
          onClick={onRegenerate}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-300 rounded-xl text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Tạo lại phiên bản khác
        </button>
      </div>
    </div>
  );
}
