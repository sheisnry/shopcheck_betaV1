import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload = req.body;

    const response = await client.responses.create({
      model: "gpt-5.2",
      input: [
        {
          role: "system",
          content: "คุณคือ mentor ที่ช่วยวิเคราะห์ร้าน Shopee เป็นภาษาไทยแบบมนุษย์"
        },
        {
          role: "user",
          content: JSON.stringify(payload)
        }
      ]
    });

    return res.status(200).json({
      text: response.output_text
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Analyze failed" });
  }
}
