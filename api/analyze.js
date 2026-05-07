/* global process */
import { analyzeImage } from './analyze-handler.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageUrl, item1Name, item2Name } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: 'Необходима ссылка на изображение' });
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    console.error('GEMINI_API_KEY not set!');
    return res.status(500).json({
      error: 'API ключ не настроен',
      details: 'Добавьте GEMINI_API_KEY в Environment Variables на Vercel'
    });
  }

  try {
    const result = await analyzeImage(imageUrl, geminiApiKey, item1Name, item2Name);
    res.status(200).json(result);
  } catch (error) {
    console.error('Gemini error:', error);
    res.status(500).json({
      error: 'Ошибка при анализе фото',
      details: error.message
    });
  }
}
