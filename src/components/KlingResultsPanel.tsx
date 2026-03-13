import React, { useState } from 'react';
import { Copy, Check, RefreshCw, Sparkles, Settings, Camera, Film, Image as ImageIcon } from 'lucide-react';
import { KlingResult } from '../services/gemini';

interface KlingResultsPanelProps {
  result: KlingResult | null;
  onRegenerate: () => void;
  isLoading: boolean;
}

export default function KlingResultsPanel({ result, onRegenerate, isLoading }: KlingResultsPanelProps) {
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates({ ...copiedStates, [key]: true });
      setTimeout(() => {
        setCopiedStates({ ...copiedStates, [key]: false });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const copyAll = () => {
    if (!result) return;
    const allText = `
--- PROMPT CHÍNH ---
${result.main_kling_prompt}

--- BIẾN THỂ 1 ---
${result.variant_1}

--- BIẾN THỂ 2 ---
${result.variant_2}

--- NEGATIVE PROMPT ---
${result.negative_prompt}

--- DIRECTOR's CUT ---
${result.directors_cut_prompt}

--- CAMERA PLAN ---
${result.camera_plan.join('\n')}

${result.multi_shot_plan?.summary_prompt ? `--- MULTI-SHOT PLAN ---\n${result.multi_shot_plan.summary_prompt}\n` : ''}
${result.custom_multi_shot_plan && result.custom_multi_shot_plan.length > 0 ? `--- CUSTOM MULTI-SHOT PLAN ---\n${result.custom_multi_shot_plan.map(s => `Shot: ${s.shot}\nDuration: ${s.duration_seconds}s\nPurpose: ${s.purpose}\nPrompt: ${s.prompt}`).join('\n\n')}\n` : ''}
    `.trim();
    copyToClipboard(allText, 'all');
  };

  if (isLoading) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 text-center">
        <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
          <Sparkles className="w-8 h-8 text-zinc-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-2">Đang phân tích nhịp hình và ánh sáng...</h3>
        <p className="text-zinc-500 max-w-sm">Vui lòng đợi trong giây lát, AI đang bóc cấu trúc cảnh và camera để tạo gói prompt cho Kling...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 text-center border-dashed">
        <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mb-6">
          <Sparkles className="w-8 h-8 text-zinc-300" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-2">Chưa có dữ liệu</h3>
        <p className="text-zinc-500 max-w-sm">Dán link video tham khảo hoặc tải video lên để bắt đầu. Prompt Kling sẽ xuất hiện ở đây sau khi phân tích.</p>
      </div>
    );
  }

  const CopyButton = ({ text, id, label }: { text: string; id: string; label?: string }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
    >
      {copiedStates[id] ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
      {copiedStates[id] ? 'Đã copy' : label || 'Copy'}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-zinc-900">Kết quả phân tích & Prompt</h2>
        <div className="flex gap-2">
          <button
            onClick={copyAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors"
          >
            {copiedStates['all'] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            Copy tất cả
          </button>
          <button
            onClick={onRegenerate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Tạo lại
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phân tích hình ảnh tham khảo */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
          <h3 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            Phân tích hình ảnh tham khảo
          </h3>
          <div className="space-y-3 text-sm">
            <p><span className="font-medium text-zinc-700">Chủ đề video:</span> {result.reference_analysis.video_theme}</p>
            <p><span className="font-medium text-zinc-700">Loại không gian:</span> {result.reference_analysis.location_type}</p>
            <p><span className="font-medium text-zinc-700">Nhịp cảnh:</span> {result.reference_analysis.pacing_style}</p>
            <p><span className="font-medium text-zinc-700">Camera tham khảo phát hiện được:</span> {result.reference_analysis.detected_camera_for_reference}</p>
            <p><span className="font-medium text-zinc-700">Camera dùng cho prompt Kling:</span> {result.reference_analysis.final_camera_for_prompt}</p>
            <p><span className="font-medium text-zinc-700">Ánh sáng:</span> {result.reference_analysis.lighting_style}</p>
            <p><span className="font-medium text-zinc-700">Mood:</span> {result.reference_analysis.emotional_tone}</p>
            <p><span className="font-medium text-zinc-700">Chất liệu:</span> {result.reference_analysis.material_texture_language.join(', ')}</p>
            <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="font-medium text-emerald-800 mb-1">Định hướng gốc đề xuất:</p>
              <p className="text-emerald-700">{result.reference_analysis.recommended_original_direction}</p>
            </div>
          </div>
        </div>

        {/* Thiết lập Kling đề xuất */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
          <h3 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Thiết lập Kling đề xuất
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <p className="text-zinc-500 mb-1">Chất lượng</p>
              <p className="font-semibold text-zinc-900">{result.kling_settings_summary.quality}</p>
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <p className="text-zinc-500 mb-1">Thời lượng</p>
              <p className="font-semibold text-zinc-900">{result.kling_settings_summary.duration}</p>
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <p className="text-zinc-500 mb-1">Tỉ lệ</p>
              <p className="font-semibold text-zinc-900">{result.kling_settings_summary.ratio}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-blue-600 mb-1">Mode đề xuất</p>
              <p className="font-semibold text-blue-800">{result.kling_settings_summary.recommended_mode}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mood & hướng hình ảnh */}
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
        <h3 className="text-lg font-semibold text-zinc-900 mb-3">Mood & hướng hình ảnh</h3>
        <p className="text-zinc-700 leading-relaxed">{result.visual_direction}</p>
      </div>

      {/* Prompts */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-zinc-900">Prompt Kling chính</h3>
            <CopyButton text={result.main_kling_prompt} id="main" label="Copy prompt chính" />
          </div>
          <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap font-mono text-sm bg-zinc-50 p-4 rounded-xl border border-zinc-100">{result.main_kling_prompt}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold text-zinc-900">Biến thể prompt 1</h3>
              <CopyButton text={result.variant_1} id="var1" label="Copy biến thể 1" />
            </div>
            <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap font-mono text-sm bg-zinc-50 p-4 rounded-xl border border-zinc-100">{result.variant_1}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold text-zinc-900">Biến thể prompt 2</h3>
              <CopyButton text={result.variant_2} id="var2" label="Copy biến thể 2" />
            </div>
            <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap font-mono text-sm bg-zinc-50 p-4 rounded-xl border border-zinc-100">{result.variant_2}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold text-zinc-900">Negative prompt</h3>
              <CopyButton text={result.negative_prompt} id="negative" label="Copy negative prompt" />
            </div>
            <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap font-mono text-sm bg-red-50 p-4 rounded-xl border border-red-100">{result.negative_prompt}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold text-zinc-900">Director's cut prompt</h3>
              <CopyButton text={result.directors_cut_prompt} id="director" label="Copy director's cut" />
            </div>
            <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap font-mono text-sm bg-zinc-50 p-4 rounded-xl border border-zinc-100">{result.directors_cut_prompt}</p>
          </div>
        </div>
      </div>

      {/* Camera Plan */}
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
        <h3 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-zinc-600" />
          Camera plan
        </h3>
        <ul className="space-y-2">
          {result.camera_plan.map((plan, index) => (
            <li key={index} className="flex gap-3 text-zinc-700">
              <span className="text-zinc-400 font-mono mt-0.5">{index + 1}.</span>
              <span>{plan}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Multi-Shot Plans */}
      {result.multi_shot_plan?.summary_prompt && (
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
              <Film className="w-5 h-5 text-purple-600" />
              Multi-Shot plan
            </h3>
            <CopyButton text={result.multi_shot_plan.summary_prompt} id="multishot" label="Copy multi-shot plan" />
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-zinc-500 mb-2">Shot Flow</h4>
              <ul className="space-y-2">
                {result.multi_shot_plan.shot_flow.map((flow, index) => (
                  <li key={index} className="flex gap-3 text-zinc-700 text-sm">
                    <span className="text-zinc-400 font-mono mt-0.5">{index + 1}.</span>
                    <span>{flow}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-zinc-500 mb-2">Summary Prompt</h4>
              <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap font-mono text-sm bg-purple-50 p-4 rounded-xl border border-purple-100">{result.multi_shot_plan.summary_prompt}</p>
            </div>
          </div>
        </div>
      )}

      {result.custom_multi_shot_plan && result.custom_multi_shot_plan.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
              <Film className="w-5 h-5 text-indigo-600" />
              Custom Multi-Shot plan
            </h3>
            <CopyButton 
              text={result.custom_multi_shot_plan.map(s => `Shot: ${s.shot}\nDuration: ${s.duration_seconds}s\nPurpose: ${s.purpose}\nPrompt: ${s.prompt}`).join('\n\n')} 
              id="custom_multishot" 
              label="Copy custom multi-shot" 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.custom_multi_shot_plan.map((shot, index) => (
              <div key={index} className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-indigo-900">{shot.shot}</h4>
                  <span className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg">{shot.duration_seconds}s</span>
                </div>
                <p className="text-sm text-indigo-800/80"><span className="font-medium">Mục đích:</span> {shot.purpose}</p>
                <div className="relative">
                  <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap font-mono text-sm bg-white p-3 rounded-lg border border-indigo-100/50">{shot.prompt}</p>
                  <div className="absolute top-2 right-2">
                    <CopyButton text={shot.prompt} id={`shot_${index}`} label="" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
