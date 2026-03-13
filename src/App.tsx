import React, { useState } from 'react';
import { Sparkles, Home, Video, Wand2, FileText } from 'lucide-react';
import InputPanel from './components/InputPanel';
import ResultsPanel from './components/ResultsPanel';
import KlingInputPanel from './components/KlingInputPanel';
import KlingResultsPanel from './components/KlingResultsPanel';
import Chatbot from './components/Chatbot';
import { generateScript, generateKlingPrompt, ScriptResult, ScriptOptions, KlingResult, KlingOptions } from './services/gemini';

export default function App() {
  const [activeTab, setActiveTab] = useState<'script' | 'kling'>('script');
  
  // Script State
  const [isScriptLoading, setIsScriptLoading] = useState(false);
  const [scriptResult, setScriptResult] = useState<ScriptResult | null>(null);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [lastScriptParams, setLastScriptParams] = useState<{
    videoData: { mimeType: string; data: string } | null;
    videoUrl: string;
    options: ScriptOptions;
    extraInstructions: string;
  } | null>(null);

  // Kling State
  const [isKlingLoading, setIsKlingLoading] = useState(false);
  const [klingResult, setKlingResult] = useState<KlingResult | null>(null);
  const [klingError, setKlingError] = useState<string | null>(null);
  const [lastKlingParams, setLastKlingParams] = useState<{
    videoData: { mimeType: string; data: string } | null;
    options: KlingOptions;
  } | null>(null);

  const handleGenerateScript = async (
    videoData: { mimeType: string; data: string } | null,
    videoUrl: string,
    options: ScriptOptions,
    extraInstructions: string
  ) => {
    setIsScriptLoading(true);
    setScriptError(null);
    setLastScriptParams({ videoData, videoUrl, options, extraInstructions });

    try {
      const generatedResult = await generateScript(videoData, videoUrl, options, extraInstructions);
      setScriptResult(generatedResult);
    } catch (err: any) {
      console.error('Generation error:', err);
      let errorMessage = 'Đã xảy ra lỗi khi tạo kịch bản. Vui lòng thử lại.';
      
      try {
        const errObj = typeof err.message === 'string' ? JSON.parse(err.message) : err;
        if (errObj?.error?.code === 429 || errObj?.error?.status === 'RESOURCE_EXHAUSTED') {
          errorMessage = 'Bạn đã hết hạn mức sử dụng (Quota exceeded). Vui lòng đợi một lát hoặc kiểm tra lại tài khoản Gemini API của bạn.';
        }
      } catch (e) {
        if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
          errorMessage = 'Bạn đã hết hạn mức sử dụng (Quota exceeded). Vui lòng đợi một lát hoặc kiểm tra lại tài khoản Gemini API của bạn.';
        }
      }
      
      setScriptError(errorMessage);
    } finally {
      setIsScriptLoading(false);
    }
  };

  const handleRegenerateScript = () => {
    if (lastScriptParams) {
      handleGenerateScript(
        lastScriptParams.videoData,
        lastScriptParams.videoUrl,
        lastScriptParams.options,
        lastScriptParams.extraInstructions
      );
    }
  };

  const handleGenerateKling = async (
    videoData: { mimeType: string; data: string } | null,
    options: KlingOptions
  ) => {
    setIsKlingLoading(true);
    setKlingError(null);
    setLastKlingParams({ videoData, options });

    try {
      const generatedResult = await generateKlingPrompt(videoData, options);
      setKlingResult(generatedResult);
    } catch (err: any) {
      console.error('Kling generation error:', err);
      let errorMessage = 'Đã xảy ra lỗi khi tạo prompt Kling. Vui lòng thử lại.';

      try {
        const errObj = typeof err.message === 'string' ? JSON.parse(err.message) : err;
        if (errObj?.error?.code === 429 || errObj?.error?.status === 'RESOURCE_EXHAUSTED') {
          errorMessage = 'Bạn đã hết hạn mức sử dụng (Quota exceeded). Vui lòng đợi một lát hoặc kiểm tra lại tài khoản Gemini API của bạn.';
        }
      } catch (e) {
        if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
          errorMessage = 'Bạn đã hết hạn mức sử dụng (Quota exceeded). Vui lòng đợi một lát hoặc kiểm tra lại tài khoản Gemini API của bạn.';
        }
      }

      setKlingError(errorMessage);
    } finally {
      setIsKlingLoading(false);
    }
  };

  const handleRegenerateKling = () => {
    if (lastKlingParams) {
      handleGenerateKling(
        lastKlingParams.videoData,
        lastKlingParams.options
      );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 selection:bg-zinc-200">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-zinc-900 p-2 rounded-xl">
                <Home className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-zinc-900">NhaDatVerse</h1>
                <p className="text-xs text-zinc-500 font-medium">Công cụ sáng tạo nội dung nhà đẹp</p>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl border border-zinc-200">
              <button
                onClick={() => setActiveTab('script')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === 'script' 
                    ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' 
                    : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50'
                }`}
              >
                <FileText className="w-4 h-4" />
                AI Script Studio
              </button>
              <button
                onClick={() => setActiveTab('kling')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeTab === 'kling' 
                    ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' 
                    : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50'
                }`}
              >
                <Wand2 className="w-4 h-4" />
                Tạo prompt cho Kling
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'script' && (
          <>
            {scriptError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
                <div className="mt-0.5">⚠️</div>
                <div>
                  <h4 className="font-semibold">Lỗi tạo kịch bản</h4>
                  <p>{scriptError}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Inputs */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <InputPanel onSubmit={handleGenerateScript} isLoading={isScriptLoading} />
                
                <div className="bg-zinc-100/50 rounded-2xl p-5 border border-zinc-200/50">
                  <h4 className="text-sm font-semibold text-zinc-900 mb-2 flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Mẹo sử dụng
                  </h4>
                  <ul className="text-xs text-zinc-600 space-y-2 list-disc pl-4">
                    <li>Tải lên video trực tiếp sẽ giúp AI phân tích hình ảnh chính xác hơn.</li>
                    <li>Dùng tính năng ghi âm để nói nhanh ý tưởng của bạn thay vì gõ phím.</li>
                    <li>Chọn tone "Có gu" hoặc "Tối giản" để tránh các từ ngữ sáo rỗng.</li>
                  </ul>
                </div>
              </div>

              {/* Right Column: Results */}
              <div className="lg:col-span-7">
                <ResultsPanel 
                  result={scriptResult} 
                  onRegenerate={handleRegenerateScript} 
                  isLoading={isScriptLoading} 
                />
              </div>
            </div>
          </>
        )}

        {activeTab === 'kling' && (
          <>
            {klingError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
                <div className="mt-0.5">⚠️</div>
                <div>
                  <h4 className="font-semibold">Lỗi tạo prompt Kling</h4>
                  <p>{klingError}</p>
                </div>
              </div>
            )}

            <div className="mb-6 bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
              <h2 className="text-xl font-bold text-zinc-900 mb-2 flex items-center gap-2">
                <Wand2 className="w-6 h-6 text-indigo-600" />
                Tạo prompt video cho Kling
              </h2>
              <p className="text-zinc-600 mb-1">Phân tích video tham khảo và chuyển thành prompt hình ảnh gốc để tạo video mới</p>
              <p className="text-sm text-zinc-500">Bám sát workflow của Kling VIDEO 3.0: prompt, multi-shot, custom multi-shot, start/end frame và native audio</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Inputs */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                <KlingInputPanel onSubmit={handleGenerateKling} isLoading={isKlingLoading} />
              </div>

              {/* Right Column: Results */}
              <div className="lg:col-span-7">
                <KlingResultsPanel 
                  result={klingResult} 
                  onRegenerate={handleRegenerateKling} 
                  isLoading={isKlingLoading} 
                />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Floating Chatbot */}
      <Chatbot />
    </div>
  );
}
