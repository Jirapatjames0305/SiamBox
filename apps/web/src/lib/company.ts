// Legal identity shown on the public site.
//
// ⚠️ ต้องตรงกับ "หนังสือรับรองบริษัท" ทุกตัวอักษร
// ทีม compliance ของ payment gateway เปิดเว็บมาเทียบกับเอกสารที่ยื่นสมัคร
// ถ้าไม่ตรงกันคือถูกปฏิเสธ หรือถูกปิดบัญชีทีหลังเมื่อตรวจพบ
//
// ช่องที่ยังว่างจะไม่ถูกแสดงบนหน้าเว็บ — หน้า /contact จะไม่สมบูรณ์จนกว่าจะกรอก

export const COMPANY = {
  /** ชื่อแบรนด์ที่ลูกค้าเห็น */
  brand: "SiamBox",
  site: "siambox.shop",

  // ---- นิติบุคคลผู้ประกอบการ ----
  // SiamBox เป็นแบรนด์ภายใต้บริษัทนี้ — ผู้สมัครกับ payment gateway คือนิติบุคคลนี้
  // ที่มา: aviautosolution.com/about (5 ส.ค. 2026) — ต้องเทียบกับหนังสือรับรองบริษัทอีกครั้ง
  legalNameTh: "บริษัท เอวีไอ ออโต้ โซลูชั่น จำกัด",
  legalNameEn: "AVI AUTO SOLUTION CO., LTD.",
  /** เลขทะเบียนนิติบุคคล / เลขประจำตัวผู้เสียภาษี 13 หลัก */
  registrationNo: "0115569023720",
  addressTh: "3592 หมู่ 1 ตำบลสำโรงเหนือ อำเภอเมือง จังหวัดสมุทรปราการ",
  addressEn: "3592 Moo 1, Samrong Nuea, Mueang, Samut Prakan, Thailand",
  phone: "091-004-3865",

  // ---- ช่องทางติดต่อที่ใช้งานอยู่แล้ว ----
  email: "siamboxsupport@gmail.com",
  line: "@siambox",
  wechat: "admin_Siambox",
} as const;

/**
 * ⚠️ ที่อยู่ยังไม่มีรหัสไปรษณีย์ — หน้าเว็บที่ PSP ตรวจควรมีให้ครบ
 * สำโรงเหนือ สมุทรปราการ น่าจะเป็น 10270 แต่ยังไม่ได้ยืนยัน จึงไม่ใส่ไว้
 */

/** true เมื่อกรอกข้อมูลนิติบุคคลครบพอที่จะให้ PSP ตรวจได้ */
export function hasLegalIdentity(): boolean {
  return Boolean(COMPANY.legalNameTh && COMPANY.registrationNo && COMPANY.addressTh);
}
