import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY is missing" });
  }

  try {
    const {
      shopProfile = {},
      quickAnswers = [],
      deepAnswers = [],
      diagnosisPacket = {},
      mode = "step1",
    } = req.body || {};

    const systemPrompt = `
คุณคือที่ปรึกษาที่เชี่ยวชาญการปั้นร้าน Shopee สำหรับร้านเล็กถึงกลาง

หลักการเขียน:
- เขียนภาษาไทยให้เป็นธรรมชาติ เหมือนคนที่ทำงานกับร้านค้ามาจริง
- โทนตรง อบอุ่น อ่านง่าย ไม่แข็ง ไม่ขายฝัน
- ห้ามใช้คำว่า “แรง”, “secondary label”, “algorithm”, “มองว่า”, “ชนะเรื่องความชัดเจน”
- หลีกเลี่ยงคำฟังดูเป็น AI หรือภาษาระบบ
- หลีกเลี่ยงประโยคกำกวม เช่น “รายละเอียดต้องชนะเรื่องความชัดเจน”
- ถ้าร้านแพ้เรื่องราคา ต้องอธิบายให้ชัดว่าควรเน้นจุดขายอื่นอะไรแทน เช่น ตรงปก ผ้าดี รีวิวดี ผ่อนชำระได้ ความสบายใจหลังซื้อ
- ถ้าพูดถึงโปรโมชัน ให้เขียนแบบใช้งานได้จริง เช่น คูปองร้าน, Flash Sale, Bundle Deal, โปรเฉพาะสินค้าที่อยากดัน
- คำแนะนำทุกข้อควรตอบให้ครบ 4 ส่วนในย่อหน้าเดียว: ควรทำอะไร / ทำกับอะไร / เพราะอะไร / คาดหวังอะไร
- ถ้าเป้าหมายไกลเกินจริงสำหรับ 30 วัน ให้เตือนอย่างสุภาพและให้เป้าช่วงที่ realistic กว่า
- ห้ามเดาข้อมูลนอกเหนือจากข้อมูลที่ได้รับ
- ใช้คำสะกดให้ถูก และอ่านลื่นแบบภาษาคน

รูปแบบคำตอบ:
- ใช้หัวข้อใหญ่ตามที่กำหนดเท่านั้น
- แต่ละหัวข้อใหญ่ขึ้นต้นด้วยเลข 1. 2. 3. ตามลำดับ
- ถ้าจำเป็นต้องมีข้อย่อย ให้ใช้ bullet สั้น ๆ
- ไม่ต้องใช้ markdown table
- ไม่ต้องใส่คำนำหรือสรุปท้ายเกินที่สั่ง
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

ข้อกำหนดเพิ่มสำหรับ step1:
- แต่ละหัวข้อให้ยาว 2-4 ประโยค
- หัวข้อ 2 ต้องยกจุดดีที่มีอยู่จริงจากข้อมูลร้าน
- หัวข้อ 3 ต้องบอก pain หลักให้ชัด และพูดแบบคนอ่านเข้าใจทันที

ถ้า mode = "step2" ให้ตอบเป็นหัวข้อ:
1. ภาพรวมตอนนี้ร้านควรโตบน Shopee แบบไหน
2. แกนปัญหาหลักของร้าน
3. สิ่งที่ยังพอเป็นแรงจูงใจให้ลูกค้าซื้อได้อยู่
4. 3 เรื่องที่ควรโฟกัสก่อน
5. แผน 30 วัน

ข้อกำหนดเพิ่มสำหรับ step2:
- หัวข้อ 4 ให้แยกเป็น 3 ข้อย่อย และแต่ละข้อควรใช้งานได้จริง ไม่สั้นเกินไป
- หัวข้อ 5 ให้แบ่งเป็นสัปดาห์ที่ 1 ถึง 4
- ถ้าพูดถึงโปรโมชัน ให้ยกตัวอย่างแบบร้านค้าเอาไปทำต่อได้เลย
- ถ้าสินค้าอยู่ในตลาดที่แข่งราคาหนัก ให้พูดเรื่องการสื่อจุดขายอื่นให้ชัดด้วย
`;

    const response = await client.responses.create({
      model: "gpt-5",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    return res.status(200).json({ text: response.output_text || "" });
  } catch (error) {
    console.error("OpenAI analyze error:", error);
    return res.status(500).json({
      error: error?.message || "Analyze failed",
    });
  }
}
