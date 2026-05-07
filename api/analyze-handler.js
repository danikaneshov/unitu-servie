import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analyzeImage(imageUrl, geminiApiKey, item1Name, item2Name) {
  const genAI = new GoogleGenerativeAI(geminiApiKey);

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const imageResp = await fetch(imageUrl);
  const arrayBuffer = await imageResp.arrayBuffer();

  const name1 = item1Name || "Дымный коктейль 1";
  const name2 = item2Name || "Дымный коктейль 2";

  const prompt = `
    Ты — автоматизированный ассистент по учету продаж в кальянной.
    Проанализируй фото отчета о закрытии смены (кассовый чек или записи).
    Найди количество проданных позиций "${name1}" и "${name2}".
    Если названия немного отличаются, но смысл тот же — считай их.
    
    ВЕРНИ ОТВЕТ СТРОГО В ТАКОМ ФОРМАТЕ JSON, без Markdown и без лишних слов:
    {"cocktail1": X, "cocktail2": Y}
    Где X и Y — найденные количества. Если позиция не найдена, пиши 0.
  `;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: Buffer.from(arrayBuffer).toString("base64"),
        mimeType: "image/jpeg",
      },
    },
  ]);

  const responseText = result.response.text();
  const cleanJsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(cleanJsonString);
}