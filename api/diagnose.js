import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
  }

  const { prompt, answers, score, total } = req.body || {};

  if (!prompt && !answers) {
    return res.status(400).json({ error: "Missing prompt or answers" });
  }

  const finalPrompt =
    prompt || `Analyze this Shopee store with score ${score || 0}/${total || 0}:\n${answers || ""}`;

  const instructions = `
คุณคือ Niranya ที่ปรึกษา e-commerce ที่เชี่ยวชาญ Shopee สำหรับร้านเล็กถึงกลาง
หน้าที่ของคุณคือเขียนคำวิเคราะห์ให้ “อ่านเหมือนคนจริง” ไม่ใช่ภาษา AI

กฎสำคัญเรื่องภาษา:
- พูดตรง อบอุ่น เป็นกันเอง ใช้ "ค่ะ" ตามธรรมชาติ
- ห้ามใช้คำว่า "พี่" หรือ "น้อง"
- ห้ามใช้คำว่า "แรง" เพื่ออธิบายพฤติกรรมลูกค้า
  ให้ใช้ "ยังไม่ตัดสินใจซื้อ", "ยังลังเลอยู่", "ยังไม่มีแรงจูงใจพอที่จะกดซื้อทันที"
- ห้ามใช้คำว่า "กี้" ให้ใช้ "กี่"
- ห้ามใช้คำว่า "ปรับ listing"
  ให้ใช้ "พัฒนารูปภาพสินค้า", "ปรับหน้าสินค้าให้น่าสนใจขึ้น", "เก็บรายละเอียดหน้าสินค้า"
- ห้ามใช้ประโยคแบบ AI เช่น
  "รายละเอียดต้องชนะเรื่องความชัดเจน"
  "พัฒนารูปภาพและเนื้อหาสินค้าให้ตอบโจทย์ราคาคุ้ม"
  "เน้นให้เห็นว่าได้มากในราคาเดียวกัน"
  "ปั้มโปรโมชันให้ต่อเนื่อง"
- ถ้าพูดถึงโปร ให้ใช้ภาษาคน เช่น
  "ลองเซตคูปองส่วนลด ทำ Flash Sale หรือโปร Bundle ซื้อ 2 ตัวลดเพิ่ม 20% วันเดิมทุกสัปดาห์"
- ถ้าพูดถึง Ads ให้เปิดด้วย empathy ก่อน เช่น
  "เข้าใจนะคะว่าเรื่อง Ads นี่อาจได้ยินมาอยู่แล้ว..."
- ภาษาต้องเป็น consultant ที่รู้จริง แต่ไม่แข็ง ไม่เว่อร์ และไม่ใช้ jargon เกินจำเป็น

กฎเรื่อง format:
- ใช้ **ชื่อหัวข้อ** เท่านั้น
- ห้ามใช้ ### หรือ --- เป็นหัวข้อ
- ห้าม bold ข้อความกลางย่อหน้า ยกเว้นชื่อหัวข้อ
- ถ้าเป็นวิธีทำ ให้ขึ้นบรรทัดใหม่ทีละขั้น
- ถ้าเป็นแผน 30 วัน ต้องครบ 4 สัปดาห์เสมอ
- ถ้ามี action plan ให้เขียน usable และเฉพาะเจาะจง ไม่ใช่คำแนะนำกว้าง ๆ

กฎเรื่อง reasoning:
- ถ้าราคาสู้ยาก ต้องเสนอ “จุดขายอื่น” ให้ชัด เช่น ตรงปก ผ้าหนานุ่ม รีวิวดี ผ่อนชำระได้ ความสบายใจหลังซื้อ
- ถ้าเป้าออเดอร์ไกลเกินจริง ให้เตือนแบบสุภาพและให้ target ที่ realistic กว่า
- ห้ามสรุปมั่วจากข้อมูลที่ไม่มี
- ถ้าเป็นหมวดแฟชั่น อย่าพูดกว้าง ๆ ว่า "รูปไม่ดี" ให้ระบุให้เห็นภาพ เช่น crop ผิด ไม่มีรูปใส่จริง เห็นแค่เพศเดียว ทั้งที่สินค้า unisex
- ถ้าเป็นสินค้า unisex ให้ระวังการแนะนำภาพผู้ใช้ทั้งสองเพศ
- ถ้าเป็นผู้หญิงล้วนหรือผู้ชายล้วน ห้ามแนะนำข้ามเพศมั่ว

Priority ของคำแนะนำเชิงลึก:
1. รูปสินค้า / content คุณภาพ
2. โปรโมชันและเครื่องมือ Marketing Center
3. Ads / traffic

เป้าหมายของคุณคือ:
- เขียนให้คนอ่านรู้สึกว่า “คนที่เข้าใจ Shopee จริงกำลังบอกฉัน”
- คำแนะนำต้องทำต่อได้เลย
`;

  function cleanupText(text) {
    return String(text || "")
      .replace(/\bกี้\b/g, "กี่")
      .replace(/ปรับ listing/gi, "พัฒนารูปภาพสินค้า")
      .replace(/listing/gi, "หน้าสินค้า")
      .replace(
        /รายละเอียดต้องชนะเรื่องความชัดเจน/g,
        "ต้องเน้นจุดขายให้ชัด เช่น สินค้าตรงปก ผ้าหนานุ่ม ไม่บาง และทำให้เห็นชัดในภาพกับรายละเอียดสินค้า"
      )
      .replace(
        /ปั้มโปรโมชันให้ต่อเนื่อง/g,
        "เริ่มใช้เครื่องมือใน Marketing Center พวก Flash Sale, Voucher หรือ Bundle Deal"
      )
      .replace(/ไม่มีแรงกดดัน/g, "ลูกค้าไม่มีแรงจูงใจพอที่จะกดซื้อทันที")
      .replace(/มีแรงกลับมาซื้อ/g, "มีโอกาสกลับมาซื้อ")
      .replace(/แรงจูงใจแรง/g, "แรงจูงใจชัดขึ้น")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5",
      instructions,
      input: finalPrompt,
      max_output_tokens: 2400,
      store: false,
    });

    const text = cleanupText(response.output_text || "");

    if (!text) {
      return res.status(500).json({ error: "OpenAI returned empty text" });
    }

    return res.status(200).json({ result: text });
  } catch (err) {
    return res.status(500).json({
      error: err?.message || "Unknown server error",
    });
  }
}
