import React, { useState } from 'react';
import { Upload, Link as LinkIcon, Loader2 } from 'lucide-react';
import { KlingOptions } from '../services/gemini';

interface KlingInputPanelProps {
  onSubmit: (
    videoData: { mimeType: string; data: string } | null,
    options: KlingOptions
  ) => void;
  isLoading: boolean;
}

export default function KlingInputPanel({ onSubmit, isLoading }: KlingInputPanelProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [options, setOptions] = useState<KlingOptions>({
    videoUrl: '',
    videoGoal: 'Nhà đẹp',
    visualStyle: 'Tối giản',
    quality: '1080p',
    duration: '5 giây',
    ratio: '16:9',
    cameraStyle: 'Auto từ video tham khảo',
    manualCameraStyle: 'Slow push',
    klingMode: 'Single Prompt',
    detailLevel: 'Cân bằng',
    creativeDistance: 'Giữ tinh thần, đổi bối cảnh',
    negativePrompt: '',
    customShotCount: 'AI tự chia shot',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFile: (file: File | null) => void) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const getBase64 = (file: File): Promise<{ mimeType: string; data: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const base64String = base64data.split(',')[1];
        resolve({ mimeType: file.type, data: base64String });
      };
    });
  };

  const handleSubmit = async () => {
    const videoData = videoFile ? await getBase64(videoFile) : null;

    onSubmit(videoData, { ...options, videoUrl });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 flex flex-col gap-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-zinc-900">Thông tin đầu vào</h2>
        <p className="text-sm text-zinc-500">Dùng video tham khảo để AI phân tích nhịp hình, ánh sáng, cách chuyển cảnh và mood tổng thể</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-700">Link video tham khảo</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LinkIcon className="h-5 w-5 text-zinc-400" />
            </div>
            <input
              type="url"
              className="block w-full pl-10 pr-3 py-2 border border-zinc-300 rounded-xl focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
              placeholder="Dán link video tham khảo vào đây"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </div>

          <label className="block text-sm font-medium text-zinc-700 mt-4">Hoặc tải video lên</label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-300 border-dashed rounded-xl cursor-pointer bg-zinc-50 hover:bg-zinc-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-3 text-zinc-400" />
                <p className="mb-2 text-sm text-zinc-500">
                  <span className="font-semibold">Nhấn để tải lên</span> hoặc kéo thả file
                </p>
                <p className="text-xs text-zinc-500">MP4, WebM (Tối đa 50MB)</p>
              </div>
              <input type="file" className="hidden" accept="video/*" onChange={(e) => handleFileChange(e, setVideoFile)} />
            </label>
          </div>
          {videoFile && (
            <p className="text-sm text-emerald-600 font-medium">Đã chọn: {videoFile.name}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">Chế độ tạo video Kling</label>
          <select
            className="block w-full pl-3 pr-10 py-2 border border-zinc-300 rounded-xl focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
            value={options.klingMode}
            onChange={(e) => setOptions({ ...options, klingMode: e.target.value })}
          >
            <option value="Single Prompt">Single Prompt</option>
            <option value="Multi-Shot">Multi-Shot</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">Mục tiêu video</label>
          <select
            className="block w-full pl-3 pr-10 py-2 border border-zinc-300 rounded-xl focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
            value={options.videoGoal}
            onChange={(e) => setOptions({ ...options, videoGoal: e.target.value })}
          >
            <option value="Nhà đẹp">Nhà đẹp</option>
            <option value="Tour nhà">Tour nhà</option>
            <option value="Không gian sống">Không gian sống</option>
            <option value="Nội thất">Nội thất</option>
            <option value="Lifestyle trong nhà">Lifestyle trong nhà</option>
            <option value="Kiến trúc điện ảnh">Kiến trúc điện ảnh</option>
            <option value="Góc sống tối giản">Góc sống tối giản</option>
            <option value="Cảm hứng nhà ở">Cảm hứng nhà ở</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">Phong cách hình ảnh</label>
          <select
            className="block w-full pl-3 pr-10 py-2 border border-zinc-300 rounded-xl focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
            value={options.visualStyle}
            onChange={(e) => setOptions({ ...options, visualStyle: e.target.value })}
          >
            <option value="Tối giản">Tối giản</option>
            <option value="Sang hiện đại">Sang hiện đại</option>
            <option value="Ấm cúng">Ấm cúng</option>
            <option value="Ánh sáng tự nhiên">Ánh sáng tự nhiên</option>
            <option value="Cinematic">Cinematic</option>
            <option value="Luxury tối giản">Luxury tối giản</option>
            <option value="Scandinavian nhẹ">Scandinavian nhẹ</option>
            <option value="Contemporary lifestyle">Contemporary lifestyle</option>
            <option value="Mood film">Mood film</option>
            <option value="Editorial home">Editorial home</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">Chất lượng video</label>
          <select
            className="block w-full pl-3 pr-10 py-2 border border-zinc-300 rounded-xl focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
            value={options.quality}
            onChange={(e) => setOptions({ ...options, quality: e.target.value })}
          >
            <option value="720p">720p</option>
            <option value="1080p">1080p</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">Thời lượng video</label>
          <select
            className="block w-full pl-3 pr-10 py-2 border border-zinc-300 rounded-xl focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
            value={options.duration}
            onChange={(e) => setOptions({ ...options, duration: e.target.value })}
          >
            <option value="3 giây">3 giây</option>
            <option value="5 giây">5 giây</option>
            <option value="10 giây">10 giây</option>
            <option value="15 giây">15 giây</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">Tỉ lệ khung hình</label>
          <select
            className="block w-full pl-3 pr-10 py-2 border border-zinc-300 rounded-xl focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
            value={options.ratio}
            onChange={(e) => setOptions({ ...options, ratio: e.target.value })}
          >
            <option value="16:9">16:9</option>
            <option value="1:1">1:1</option>
            <option value="9:16">9:16</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">Kiểu chuyển động camera</label>
          <select
            className="block w-full pl-3 pr-10 py-2 border border-zinc-300 rounded-xl focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
            value={options.cameraStyle}
            onChange={(e) => setOptions({ ...options, cameraStyle: e.target.value })}
          >
            <option value="Auto từ video tham khảo">Auto từ video tham khảo</option>
            <option value="Chọn thủ công">Chọn thủ công</option>
          </select>
        </div>

        {options.cameraStyle === 'Chọn thủ công' && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-zinc-700">Camera thủ công</label>
            <select
              className="block w-full pl-3 pr-10 py-2 border border-zinc-300 rounded-xl focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
              value={options.manualCameraStyle}
              onChange={(e) => setOptions({ ...options, manualCameraStyle: e.target.value })}
            >
              <option value="Slow push">Slow push</option>
              <option value="Pan nhẹ">Pan nhẹ</option>
              <option value="Tracking shot">Tracking shot</option>
              <option value="Dolly in">Dolly in</option>
              <option value="Dolly out">Dolly out</option>
              <option value="Handheld nhẹ">Handheld nhẹ</option>
              <option value="Static cinematic">Static cinematic</option>
              <option value="Floating camera">Floating camera</option>
              <option value="Mixed gentle motion">Mixed gentle motion</option>
            </select>
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">Mức độ chi tiết</label>
          <select
            className="block w-full pl-3 pr-10 py-2 border border-zinc-300 rounded-xl focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
            value={options.detailLevel}
            onChange={(e) => setOptions({ ...options, detailLevel: e.target.value })}
          >
            <option value="Nhanh gọn">Nhanh gọn</option>
            <option value="Cân bằng">Cân bằng</option>
            <option value="Rất chi tiết">Rất chi tiết</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-zinc-700">Mức độ khác với video tham khảo</label>
          <select
            className="block w-full pl-3 pr-10 py-2 border border-zinc-300 rounded-xl focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
            value={options.creativeDistance}
            onChange={(e) => setOptions({ ...options, creativeDistance: e.target.value })}
          >
            <option value="Giữ tinh thần, đổi bối cảnh">Giữ tinh thần, đổi bối cảnh</option>
            <option value="Giữ nhịp, đổi không gian">Giữ nhịp, đổi không gian</option>
            <option value="Chỉ lấy cảm hứng rất rộng">Chỉ lấy cảm hứng rất rộng</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-700">Yếu tố cần tránh</label>
        <textarea
          rows={2}
          className="block w-full p-3 border border-zinc-300 rounded-xl focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm resize-none"
          placeholder="Ví dụ: quá tối, quá chật, màu quá vàng, camera rung mạnh, cảm giác rẻ tiền"
          value={options.negativePrompt}
          onChange={(e) => setOptions({ ...options, negativePrompt: e.target.value })}
        />
      </div>

      {options.klingMode === 'Multi-Shot' && (
        <div className="space-y-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
          <h3 className="text-sm font-semibold text-zinc-900">Tuỳ chọn Multi-Shot</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-zinc-700">Cách chia shot</label>
              <select
                className="block w-full pl-3 pr-10 py-2 border border-zinc-300 rounded-xl focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
                value={options.customShotCount === 'AI tự chia shot' ? 'AI tự chia shot' : 'Custom Multi-Shot'}
                onChange={(e) => setOptions({ ...options, customShotCount: e.target.value === 'AI tự chia shot' ? 'AI tự chia shot' : '1' })}
              >
                <option value="AI tự chia shot">AI tự chia shot</option>
                <option value="Custom Multi-Shot">Custom Multi-Shot</option>
              </select>
            </div>
            {options.customShotCount !== 'AI tự chia shot' && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-zinc-700">Số shot mong muốn</label>
                <select
                  className="block w-full pl-3 pr-10 py-2 border border-zinc-300 rounded-xl focus:ring-zinc-500 focus:border-zinc-500 sm:text-sm"
                  value={options.customShotCount}
                  onChange={(e) => setOptions({ ...options, customShotCount: e.target.value })}
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isLoading || (!videoUrl && !videoFile)}
        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
            Đang tạo gói prompt cho Kling...
          </>
        ) : (
          'Phân tích và tạo prompt Kling'
        )}
      </button>
    </div>
  );
}
