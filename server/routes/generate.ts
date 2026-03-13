import express from 'express';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const router = express.Router();

router.post('/', async (req, res) => {
  const { videoData, videoUrl, options, extraInstructions } = req.body;

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      throw new Error('Thiếu API Key của Gemini. Vui lòng kiểm tra lại cấu hình môi trường.');
    }

    const ai = new GoogleGenAI({ apiKey });

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

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: { parts },
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        responseMimeType: 'application/json',
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
          required: ['quick_analysis', 'recommended_angle', 'hooks', 'main_script', 'variant_1', 'variant_2']
        },
        tools: [{ googleSearch: {} }]
      }
    });

    if (!response.text) {
      throw new Error('No response from Gemini');
    }

    const resultJson = response.text;
    const parsedResult = JSON.parse(resultJson);

    res.json({
      result: parsedResult
    });

  } catch (err: any) {
    console.error('Generation error:', err);
    res.status(500).json({ error: err.message || 'Lỗi tạo kịch bản' });
  }
});

export default router;
