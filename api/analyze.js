import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      shopProfile,
      quickAnswers,
      deepAnswers,
      diagnosisPacket,
      mode = "step1"
    } = req.body || {};

    const systemPrompt = `
คุณคือ mentor ที่เชี่ยวชาญการปั้นร้าน Shopee สำหรับร้านเล็กถึงกลาง
เขียนภาษาไทยแบบเป็นมนุษย์ ตรง แต่ไม่แข็ง
ห้ามใช้คำว่า แรง, secondary label, algorithm มองว่า
ห้ามใช้ภาษาระบบ
ให้ตอบตามหัวข้อที่กำหนดเท่านั้น
ถ้าเป้าหมายไกลเกินจริง ให้เตือนอย่างจริงใจ
ต้องอิงจากข้อมูลร้านที่ได้รับจริง
`;

    const userPrompt = `
ข้อมูลร้าน:
${JSON.stringify(shopProfile, null, 2)}

คำตอบรอบแรก:
${JSON.stringify(quickAnswers, null, 2)}

คำตอบรอบลึก:
${JSON.stringify(deepAnswers, null, 2)}

สรุปจาก logic engine:
${JSON.stringify(diagnosisPacket, null, 2)}

โหมด:
${mode}

ถ้า mode = "step1" ให้ตอบเป็นหัวข้อ:
1. ภาพรวมด้านความพร้อมของร้าน
2. จุดที่ร้านทำได้ดี
3. จุดหลักลำดับแรกที่ทำให้ยอดไม่มา

ถ้า mode = "step2" ให้ตอบเป็นหัวข้อ:
1. ภาพรวมตอนนี้ร้านควรโตบน Shopee แบบไหน
2. แกนปัญหาหลักของร้าน
3. สิ่งที่ยังพอเป็นแรงจูงใจให้ลูกค้าซื้อได้อยู่
4. 3 เรื่องที่ควรโฟกัสก่อน
5. แผน 30 วัน
`;

    const response = await client.responses.create({
      model: "gpt-5",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });

    return res.status(200).json({
      text: response.output_text
    });
  } catch (error) {
    console.error("OpenAI analyze error:", error);
    return res.status(500).json({
      error: "Analyze failed"
    });
  }
}
