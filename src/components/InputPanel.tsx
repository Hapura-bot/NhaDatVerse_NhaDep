import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Mic, Square, Play, Loader2 } from 'lucide-react';
import { ScriptOptions } from '../services/gemini';

interface InputPanelProps {
  onSubmit: (videoData: { mimeType: string; data: string } | null, videoUrl: string, options: ScriptOptions, extraInstructions: string) => void;
  isLoading: boolean;
}

export default function InputPanel({ onSubmit, isLoading }: InputPanelProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [extraInstructions, setExtraInstructions] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [options, setOptions] = useState<ScriptOptions>({
    outputType: 'Narration',
    tone: 'Có gu',
    duration: '30s',
    audience: 'Người thích nhà đẹp',
    cta: true,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          const base64String = base64data.split(',')[1];
          // Transcribe audio
          try {
            const { transcribeAudio } = await import('../services/gemini');
            const transcribedText = await transcribeAudio({ mimeType: 'audio/webm', data: base64String });
            setExtraInstructions((prev) => prev + (prev ? ' ' : '') + transcribedText);
          } catch (error) {
            console.error('Transcription failed', error);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone', error);
      alert('Không thể truy cập microphone. Vui lòng kiểm tra quyền.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async () => {
    let videoData = null;
    if (videoFile) {
      const reader = new FileReader();
      reader.readAsDataURL(videoFile);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const base64String = base64data.split(',')[1];
        videoData = { mimeType: videoFile.type, data: base64String };
        onSubmit(videoData, videoUrl, options, extraInstructions);
      };
    } else {
      onSubmit(null, videoUrl, options, extraInstructions);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 flex flex-col gap-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900">Nguồn video tham khảo</h2>
        
        <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LinkIcon className="h-5 w-5 text-zinc-400" />
            </div>
            <input
              type="url"
              className="block w-full pl-10 pr-3 py-2 border border-zinc-300 rounded-xl focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
              placeholder="Dán link video tham khảo (YouTube, TikTok...)"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-300 border-dashed rounded-xl cursor-pointer bg-zinc-50 hover:bg-zinc-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-3 text-zinc-400" />
                <p className="mb-2 text-sm text-zinc-500">
                  <span className="font-semibold">Nhấn để tải lên</span> hoặc kéo thả file
                </p>
                <p className="text-xs text-zinc-500">MP4, WebM (Tối đa 50MB)</p>
              </div>
              <input type="file" className="hidden" accept="video/*" onChange={handleFileChange} />
            </label>
          </div>
          {videoFile && (
            <p className="text-sm text-emerald-600 font-medium">Đã chọn: {videoFile.name}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">Loại output</label>
          <select
            className="block w-full pl-3 pr-10 py-2 border border-zinc-300 rounded-xl focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
            value={options.outputType}
            onChange={(e) => setOptions({ ...options, outputType: e.target.value })}
          >
            <option value="Narration">Narration (Lồng tiếng)</option>
            <option value="Direct dialogue">Direct dialogue (Nói trực tiếp)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">Tone giọng</label>
          <select
            className="block w-full pl-3 pr-10 py-2 border border-zinc-300 rounded-xl focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
            value={options.tone}
            onChange={(e) => setOptions({ ...options, tone: e.target.value })}
          >
            <option value="Có gu">Có gu</option>
            <option value="Gần gũi">Gần gũi</option>
            <option value="Chuyên gia">Chuyên gia</option>
            <option value="Cảm xúc">Cảm xúc</option>
            <option value="Tối giản">Tối giản</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">Thời lượng</label>
          <select
            className="block w-full pl-3 pr-10 py-2 border border-zinc-300 rounded-xl focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
            value={options.duration}
            onChange={(e) => setOptions({ ...options, duration: e.target.value })}
          >
            <option value="15s">15s</option>
            <option value="30s">30s</option>
            <option value="45s">45s</option>
            <option value="60s">60s</option>
            <option value="90s">1 phút 30s</option>
            <option value="2 phút">2 phút</option>
            <option value="3 phút">3 phút</option>
            <option value="4 phút">4 phút</option>
            <option value="5 phút">5 phút</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">Tệp người xem</label>
          <select
            className="block w-full pl-3 pr-10 py-2 border border-zinc-300 rounded-xl focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
            value={options.audience}
            onChange={(e) => setOptions({ ...options, audience: e.target.value })}
          >
            <option value="Người thích nhà đẹp">Người thích nhà đẹp</option>
            <option value="Người mua ở thực">Người mua ở thực</option>
            <option value="Người mê không gian sống">Người mê không gian sống</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700">Kêu gọi hành động (CTA)</span>
        <button
          type="button"
          className={`${
            options.cta ? 'bg-zinc-900' : 'bg-zinc-200'
          } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
          onClick={() => setOptions({ ...options, cta: !options.cta })}
        >
          <span
            aria-hidden="true"
            className={`${
              options.cta ? 'translate-x-5' : 'translate-x-0'
            } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
          />
        </button>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700">Ghi chú thêm (Tùy chọn)</label>
        <div className="relative">
          <textarea
            rows={3}
            className="block w-full p-3 border border-zinc-300 rounded-xl focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm resize-none"
            placeholder="Ví dụ: Tập trung vào ánh sáng phòng khách..."
            value={extraInstructions}
            onChange={(e) => setExtraInstructions(e.target.value)}
          />
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors ${
              isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
            title={isRecording ? 'Dừng ghi âm' : 'Ghi âm ghi chú'}
          >
            {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading || (!videoUrl && !videoFile)}
        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
            Đang phân tích...
          </>
        ) : (
          'Phân tích và tạo script'
        )}
      </button>
    </div>
  );
}
