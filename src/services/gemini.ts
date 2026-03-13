import { GoogleGenAI, Type, ThinkingLevel, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function withRetry<T>(fn: () => Promise<T>, maxRetries: number = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const isRateLimit = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED');
      if (isRateLimit && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export interface ScriptOptions {
  outputType: string;
  tone: string;
  duration: string;
  audience: string;
  cta: boolean;
}

export interface ScriptResult {
  quick_analysis: string;
  recommended_angle: string;
  hooks: string[];
  main_script: string;
  variant_1: string;
  variant_2: string;
}

export async function generateScript(
  videoData: { mimeType: string; data: string } | null,
  videoUrl: string,
  options: ScriptOptions,
  extraInstructions: string
): Promise<ScriptResult> {
  const systemInstruction = `Bạn là biên tập viên nội dung TikTok cho kênh Nhà đẹp. Nhiệm vụ của bạn là phân tích video tham khảo về nhà ở, nhà đẹp, nội thất hoặc không gian sống, sau đó viết ra lời thoại tiếng Việt mới, tự nhiên, ngắn gọn, giàu hình ảnh, đúng nhịp TikTok. Không dịch sát. Không dùng ngôn ngữ quảng cáo rẻ tiền. Không dùng các từ sáo rỗng như đẳng cấp, hoàn hảo, siêu đẹp, ai nhìn cũng mê. Ưu tiên cảm giác sống, công năng, ánh sáng, bố cục và cảm xúc thật khi ở trong không gian.`;

  const prompt = `Phân tích video tham khảo này và tạo output theo cấu trúc JSON sau:
- quick_analysis
- recommended_angle
- hooks (3)
- main_script
- variant_1
- variant_2

Thông tin thêm:
- Loại output: ${options.outputType}
- Tone: ${options.tone}
- Thời lượng: ${options.duration}
- Tệp người xem: ${options.audience}
- CTA: ${options.cta ? 'Có' : 'Không'}
${videoUrl ? `- Link video tham khảo: ${videoUrl}` : ''}
${extraInstructions ? `- Ghi chú thêm từ người dùng: ${extraInstructions}` : ''}`;

  const parts: any[] = [];
  if (videoData) {
    parts.push({ inlineData: videoData });
  }
  parts.push({ text: prompt });

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: { parts },
    config: {
      systemInstruction,
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          quick_analysis: { type: Type.STRING },
          recommended_angle: { type: Type.STRING },
          hooks: { type: Type.ARRAY, items: { type: Type.STRING } },
          main_script: { type: Type.STRING },
          variant_1: { type: Type.STRING },
          variant_2: { type: Type.STRING },
        },
        required: ["quick_analysis", "recommended_angle", "hooks", "main_script", "variant_1", "variant_2"]
      },
      tools: [{ googleSearch: {} }]
    }
  }));

  if (!response.text) {
    throw new Error("No response from Gemini");
  }

  return JSON.parse(response.text) as ScriptResult;
}

export interface KlingOptions {
  videoUrl: string;
  videoGoal: string;
  visualStyle: string;
  quality: string;
  duration: string;
  ratio: string;
  cameraStyle: string;
  klingMode: string;
  detailLevel: string;
  creativeDistance: string;
  negativePrompt: string;
  customShotCount: string;
}

export interface KlingResult {
  reference_analysis: {
    video_theme: string;
    location_type: string;
    scene_flow: string[];
    strongest_visual_elements: string[];
    visual_hooks: string[];
    camera_motion_pattern: string;
    pacing_style: string;
    shot_density: string;
    lighting_style: string;
    color_palette_feel: string;
    material_texture_language: string[];
    emotional_tone: string;
    spatial_feeling: string;
    recommended_original_direction: string;
    suggested_kling_mode: string;
    detected_camera_for_reference: string;
    final_camera_for_prompt: string;
  };
  visual_direction: string;
  main_kling_prompt: string;
  variant_1: string;
  variant_2: string;
  negative_prompt: string;
  directors_cut_prompt: string;
  camera_plan: string[];
  kling_settings_summary: {
    quality: string;
    duration: string;
    ratio: string;
    recommended_mode: string;
  };
  multi_shot_plan: {
    shot_flow: string[];
    summary_prompt: string;
  };
  custom_multi_shot_plan: {
    shot: string;
    duration_seconds: number;
    purpose: string;
    prompt: string;
  }[];
}

export async function generateKlingPrompt(
  videoData: { mimeType: string; data: string } | null,
  options: KlingOptions
): Promise<KlingResult> {
  const systemInstruction = `Bạn là đạo diễn hình ảnh và chuyên gia viết prompt video cho nội dung về nhà đẹp, nội thất, không gian sống và kiến trúc. Nhiệm vụ của bạn là phân tích video tham khảo rồi chuyển tinh thần hình ảnh đó thành prompt video gốc để dùng với Kling VIDEO 3.0. Không được sao chép nguyên bản video tham khảo. Hãy giữ lại nhịp hình, ánh sáng, chuyển động camera, chất liệu không gian và cảm xúc tổng thể, nhưng biến nó thành một hướng hình ảnh mới, rõ ràng, điện ảnh, giàu chi tiết và có thể dùng ngay để tạo video. Nếu là Multi-Shot, hãy tạo cấu trúc shot hợp lý. Nếu là Custom Multi-Shot, hãy chia shot hợp lý, tối đa 6 shot và tổng thời lượng không quá thời lượng đã chọn, và thời lượng đã chọn không vượt 15 giây. Nếu camera mode là Auto thì suy ra camera từ video tham khảo. Nếu camera mode là Manual thì ưu tiên camera do người dùng chọn.`;

  const prompt = `Phân tích video tham khảo này và tạo output theo JSON structure của Kling tab.

Thông tin thêm:
- Mục tiêu video: ${options.videoGoal}
- Phong cách hình ảnh: ${options.visualStyle}
- Chất lượng: ${options.quality}
- Thời lượng: ${options.duration}
- Tỉ lệ khung hình: ${options.ratio}
- Camera mode: ${options.cameraStyle === 'Auto từ video tham khảo' ? 'Auto' : 'Manual'}
- Nếu manual, kiểu camera: ${options.cameraStyle !== 'Auto từ video tham khảo' ? options.cameraStyle : 'N/A'}
- Chế độ Kling: ${options.klingMode}
- Mức độ chi tiết: ${options.detailLevel}
- Mức độ khác với video tham khảo: ${options.creativeDistance}
- Yếu tố cần tránh: ${options.negativePrompt || 'Không có'}
- Nếu là Custom Multi-Shot, số shot mong muốn: ${options.customShotCount}
${options.videoUrl ? `- Link video tham khảo: ${options.videoUrl}` : ''}`;

  const parts: any[] = [];
  if (videoData) {
    parts.push({ inlineData: videoData });
  }
  parts.push({ text: prompt });

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: { parts },
    config: {
      systemInstruction,
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          reference_analysis: {
            type: Type.OBJECT,
            properties: {
              video_theme: { type: Type.STRING },
              location_type: { type: Type.STRING },
              scene_flow: { type: Type.ARRAY, items: { type: Type.STRING } },
              strongest_visual_elements: { type: Type.ARRAY, items: { type: Type.STRING } },
              visual_hooks: { type: Type.ARRAY, items: { type: Type.STRING } },
              camera_motion_pattern: { type: Type.STRING },
              pacing_style: { type: Type.STRING },
              shot_density: { type: Type.STRING },
              lighting_style: { type: Type.STRING },
              color_palette_feel: { type: Type.STRING },
              material_texture_language: { type: Type.ARRAY, items: { type: Type.STRING } },
              emotional_tone: { type: Type.STRING },
              spatial_feeling: { type: Type.STRING },
              recommended_original_direction: { type: Type.STRING },
              suggested_kling_mode: { type: Type.STRING },
              detected_camera_for_reference: { type: Type.STRING },
              final_camera_for_prompt: { type: Type.STRING }
            }
          },
          visual_direction: { type: Type.STRING },
          main_kling_prompt: { type: Type.STRING },
          variant_1: { type: Type.STRING },
          variant_2: { type: Type.STRING },
          negative_prompt: { type: Type.STRING },
          directors_cut_prompt: { type: Type.STRING },
          camera_plan: { type: Type.ARRAY, items: { type: Type.STRING } },
          kling_settings_summary: {
            type: Type.OBJECT,
            properties: {
              quality: { type: Type.STRING },
              duration: { type: Type.STRING },
              ratio: { type: Type.STRING },
              recommended_mode: { type: Type.STRING }
            }
          },
          multi_shot_plan: {
            type: Type.OBJECT,
            properties: {
              shot_flow: { type: Type.ARRAY, items: { type: Type.STRING } },
              summary_prompt: { type: Type.STRING }
            }
          },
          custom_multi_shot_plan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                shot: { type: Type.STRING },
                duration_seconds: { type: Type.NUMBER },
                purpose: { type: Type.STRING },
                prompt: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  }));

  if (!response.text) {
    throw new Error("No response from Gemini");
  }

  return JSON.parse(response.text) as KlingResult;
}

export async function transcribeAudio(audioData: { mimeType: string; data: string }): Promise<string> {
  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: audioData },
        { text: "Transcribe this audio to Vietnamese text. Only return the transcription, nothing else." }
      ]
    }
  }));
  return response.text || "";
}

export async function generateSpeech(text: string, voiceName: string = 'Zephyr'): Promise<string | undefined> {
  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName }
        }
      }
    }
  }));
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
}

export async function chatWithBot(history: { role: string; text: string }[], message: string): Promise<string> {
  const contents = history.map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));
  contents.push({ role: "user", parts: [{ text: message }] });

  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents,
    config: {
      systemInstruction: "Bạn là trợ lý AI chuyên về kịch bản TikTok nhà đẹp. Hãy trả lời ngắn gọn, súc tích bằng tiếng Việt, giúp người dùng cải thiện kịch bản hoặc giải đáp thắc mê về video.",
    }
  }));

  return response.text || "";
}
