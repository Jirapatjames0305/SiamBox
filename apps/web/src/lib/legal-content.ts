// Copy for the policy pages, in the three locales the site serves.
//
// Kept as data rather than in messages/*.json because these are long prose blocks —
// JSON makes them unreadable and unreviewable. The numbers here (delivery windows,
// shipping fees, refund window) MUST stay in step with what is stated in the payment
// gateway application (docs/merchant-application.md) — reviewers compare the two.

import type { Locale } from "@/i18n/routing";

export type Section = { heading: string; body: string[] };
export type LegalDoc = { title: string; updated: string; intro?: string; sections: Section[] };

/** Last reviewed. Shown on every policy page — PSP reviewers look for a recent date. */
const UPDATED = { zh: "2026年8月5日", th: "5 สิงหาคม 2569", en: "5 August 2026" };

const shipping: Record<Locale, LegalDoc> = {
  th: {
    title: "นโยบายการจัดส่ง",
    updated: UPDATED.th,
    intro:
      "เราจัดส่งสินค้าจากประเทศไทยไปยังที่อยู่ของลูกค้าในสาธารณรัฐประชาชนจีนโดยตรง",
    sections: [
      {
        heading: "ระยะเวลาและค่าจัดส่ง",
        body: [
          "แบบธรรมดา — 7–15 วันทำการ ค่าจัดส่ง ¥10 ต่อคำสั่งซื้อ",
          "แบบด่วน — 3–5 วันทำการ ค่าจัดส่ง ¥50 ต่อคำสั่งซื้อ",
          "ระยะเวลาเริ่มนับจากวันที่ยืนยันการชำระเงิน ไม่รวมวันหยุดนักขัตฤกษ์ และไม่รวมเวลาที่พัสดุอยู่ระหว่างการตรวจของศุลกากร",
        ],
      },
      {
        heading: "การเตรียมและจัดส่ง",
        body: [
          "เราจัดเตรียมและส่งมอบพัสดุให้ผู้ให้บริการขนส่งภายใน 1–3 วันทำการหลังยืนยันการชำระเงิน",
          "เมื่อพัสดุออกจากคลัง ระบบจะออกหมายเลขติดตามให้ ลูกค้าตรวจสอบสถานะได้ที่หน้า ติดตามพัสดุ ด้วยหมายเลขคำสั่งซื้อ",
        ],
      },
      {
        heading: "ศุลกากรและภาษี",
        body: [
          "สินค้าทั้งหมดเป็นสินค้าอุปโภคบริโภคทั่วไปที่นำเข้าได้ตามปกติ",
          "หากมีภาษีนำเข้าหรือค่าธรรมเนียมศุลกากรที่ปลายทาง ผู้รับเป็นผู้รับผิดชอบตามระเบียบของประเทศปลายทาง",
          "เราจำกัดจำนวนสินค้าบางรายการต่อคำสั่งซื้อ เพื่อให้พัสดุอยู่ในเกณฑ์การนำเข้าเพื่อใช้ส่วนตัว",
        ],
      },
      {
        heading: "พัสดุล่าช้าหรือสูญหาย",
        body: [
          "หากพัสดุเกินกำหนดส่งมากกว่า 10 วันทำการ กรุณาติดต่อเรา เราจะติดตามกับผู้ให้บริการขนส่งให้",
          "กรณีผู้ให้บริการขนส่งยืนยันว่าพัสดุสูญหาย เราจะจัดส่งใหม่หรือคืนเงินเต็มจำนวนตามที่ลูกค้าเลือก",
        ],
      },
    ],
  },
  zh: {
    title: "配送政策",
    updated: UPDATED.zh,
    intro: "我们从泰国直接发货至中国大陆客户的收货地址。",
    sections: [
      {
        heading: "配送时间与费用",
        body: [
          "普通配送 — 7–15 个工作日，运费 ¥10／单",
          "加急配送 — 3–5 个工作日，运费 ¥50／单",
          "时间自付款确认之日起计算，不含法定节假日及海关查验所需时间。",
        ],
      },
      {
        heading: "备货与发货",
        body: [
          "付款确认后 1–3 个工作日内完成备货并交付承运商。",
          "包裹出库后系统会生成运单号，您可在「订单查询」页面输入订单号查看物流状态。",
        ],
      },
      {
        heading: "海关与税费",
        body: [
          "所售商品均为可正常进口的日用消费品。",
          "如目的地产生进口税或海关费用，由收件人按当地规定承担。",
          "部分商品设有单笔订单数量上限，以确保包裹符合个人自用进口标准。",
        ],
      },
      {
        heading: "延误或丢失",
        body: [
          "如超出预计送达时间 10 个工作日仍未收到，请联系我们，我们将向承运商发起查询。",
          "若承运商确认包裹丢失，我们将按您的选择重新发货或全额退款。",
        ],
      },
    ],
  },
  en: {
    title: "Shipping Policy",
    updated: UPDATED.en,
    intro:
      "We ship from Thailand directly to the customer's address in mainland China.",
    sections: [
      {
        heading: "Delivery times and fees",
        body: [
          "Standard — 7–15 business days, ¥10 shipping per order",
          "Express — 3–5 business days, ¥50 shipping per order",
          "Times are counted from payment confirmation and exclude public holidays and any time the parcel spends in customs inspection.",
        ],
      },
      {
        heading: "Handling and dispatch",
        body: [
          "Orders are packed and handed to the carrier within 1–3 business days of payment confirmation.",
          "A tracking number is issued once the parcel leaves our warehouse. Track it on the order tracking page using your order number.",
        ],
      },
      {
        heading: "Customs and duties",
        body: [
          "All items are ordinary consumer goods that may be imported normally.",
          "Any import duty or customs charge at the destination is the recipient's responsibility under local regulations.",
          "Some items are capped per order so that parcels stay within personal-use import allowances.",
        ],
      },
      {
        heading: "Delayed or lost parcels",
        body: [
          "If a parcel is more than 10 business days past its delivery window, contact us and we will open a trace with the carrier.",
          "If the carrier confirms the parcel is lost, we will reship or refund in full — your choice.",
        ],
      },
    ],
  },
};

const refund: Record<Locale, LegalDoc> = {
  th: {
    title: "นโยบายการคืนเงินและคืนสินค้า",
    updated: UPDATED.th,
    sections: [
      {
        heading: "กรณีที่คืนเงินเต็มจำนวน",
        body: [
          "สินค้าเสียหายหรือชำรุดระหว่างการขนส่ง",
          "ได้รับสินค้าไม่ตรงกับที่สั่ง หรือได้รับไม่ครบ",
          "พัสดุสูญหายระหว่างขนส่ง และผู้ให้บริการขนส่งยืนยันแล้ว",
          "เรายังไม่ได้จัดส่ง และลูกค้าแจ้งยกเลิกก่อนพัสดุออกจากคลัง",
        ],
      },
      {
        heading: "วิธีแจ้งขอคืนเงิน",
        body: [
          "ติดต่อเราภายใน 7 วันนับจากวันที่ได้รับสินค้า พร้อมแจ้งหมายเลขคำสั่งซื้อ",
          "กรณีสินค้าเสียหายหรือได้รับไม่ตรง กรุณาแนบภาพถ่ายสินค้าและกล่องพัสดุ",
          "เราจะแจ้งผลการพิจารณาภายใน 3 วันทำการ",
        ],
      },
      {
        heading: "ระยะเวลาคืนเงิน",
        body: [
          "เมื่ออนุมัติแล้ว เราคืนเงินผ่านช่องทางเดิมที่ลูกค้าใช้ชำระ ภายใน 7–14 วันทำการ",
          "ระยะเวลาที่เงินเข้าบัญชีจริงขึ้นอยู่กับผู้ให้บริการชำระเงินหรือธนาคารของลูกค้า",
          "เราไม่คืนเงินเป็นเงินสดหรือโอนเข้าบัญชีอื่นนอกเหนือจากช่องทางที่ชำระเข้ามา",
        ],
      },
      {
        heading: "กรณีที่ไม่สามารถคืนเงินได้",
        body: [
          "สินค้าถูกเปิดใช้งานหรือใช้ไปแล้วบางส่วน โดยไม่มีความเสียหายจากการขนส่ง",
          "แจ้งเกินกำหนด 7 วันนับจากวันที่ได้รับสินค้า",
          "ความเสียหายที่เกิดจากการเก็บรักษาหรือใช้งานผิดวิธีหลังได้รับสินค้า",
          "ลูกค้าให้ที่อยู่จัดส่งไม่ถูกต้องหรือไม่ครบถ้วน จนพัสดุถูกตีกลับหรือส่งไม่สำเร็จ",
        ],
      },
    ],
  },
  zh: {
    title: "退款与退货政策",
    updated: UPDATED.zh,
    sections: [
      {
        heading: "可全额退款的情形",
        body: [
          "商品在运输过程中破损或存在质量问题",
          "收到的商品与订单不符，或数量短缺",
          "包裹在运输中丢失且已获承运商确认",
          "我们尚未发货，且您在包裹出库前提出取消",
        ],
      },
      {
        heading: "申请方式",
        body: [
          "请在签收后 7 天内联系我们，并提供订单号。",
          "如涉及破损或错发，请附上商品与外包装的照片。",
          "我们将在 3 个工作日内告知处理结果。",
        ],
      },
      {
        heading: "退款时间",
        body: [
          "审核通过后，退款将原路返回至您付款时使用的账户，处理时间为 7–14 个工作日。",
          "实际到账时间取决于支付服务商或您的开户银行。",
          "我们不提供现金退款，也不会退至付款渠道以外的其他账户。",
        ],
      },
      {
        heading: "不予退款的情形",
        body: [
          "商品已拆封使用且无运输损坏",
          "超过签收后 7 天才提出申请",
          "签收后因保存或使用不当造成的损坏",
          "因您提供的收货地址有误或不完整，导致包裹退回或无法投递",
        ],
      },
    ],
  },
  en: {
    title: "Refund & Return Policy",
    updated: UPDATED.en,
    sections: [
      {
        heading: "Eligible for a full refund",
        body: [
          "Goods damaged or defective in transit",
          "Wrong items received, or items missing from the order",
          "Parcel lost in transit and confirmed as lost by the carrier",
          "Cancellation requested before we dispatch the parcel",
        ],
      },
      {
        heading: "How to request one",
        body: [
          "Contact us within 7 days of delivery, quoting your order number.",
          "For damage or incorrect items, include photos of the goods and the outer packaging.",
          "We respond with a decision within 3 business days.",
        ],
      },
      {
        heading: "Refund timing",
        body: [
          "Once approved, we refund to the original payment method within 7–14 business days.",
          "When the money actually appears depends on your payment provider or bank.",
          "We do not refund in cash, or to any account other than the one used to pay.",
        ],
      },
      {
        heading: "Not eligible",
        body: [
          "Items opened or partly used, with no transit damage",
          "Requests made more than 7 days after delivery",
          "Damage caused by storage or misuse after delivery",
          "Parcels returned or undeliverable because the address given was wrong or incomplete",
        ],
      },
    ],
  },
};

const terms: Record<Locale, LegalDoc> = {
  th: {
    title: "เงื่อนไขการใช้บริการ",
    updated: UPDATED.th,
    sections: [
      {
        heading: "ขอบเขตการให้บริการ",
        body: [
          "เราจำหน่ายสินค้าอุปโภคบริโภคแบรนด์ไทยแบบค้าปลีกออนไลน์ ให้ผู้บริโภครายย่อยที่พำนักอยู่ในสาธารณรัฐประชาชนจีน",
          "การใช้งานเว็บไซต์นี้ถือว่าท่านยอมรับเงื่อนไขฉบับนี้",
        ],
      },
      {
        heading: "การสั่งซื้อและราคา",
        body: [
          "ราคาสินค้าแสดงเป็นสกุลเงินหยวน (CNY) และรวมภาษีที่เกี่ยวข้องแล้ว ยังไม่รวมค่าจัดส่ง",
          "คำสั่งซื้อจะสมบูรณ์เมื่อเราได้รับชำระเงินเต็มจำนวนและยืนยันแล้ว",
          "หากสินค้าหมดหลังจากรับคำสั่งซื้อ เราจะติดต่อเพื่อเสนอสินค้าทดแทนหรือคืนเงินส่วนนั้น",
          "เราขอสงวนสิทธิ์ปฏิเสธหรือยกเลิกคำสั่งซื้อที่มีเหตุอันควรสงสัยว่าเป็นการทุจริต",
        ],
      },
      {
        heading: "การชำระเงิน",
        body: [
          "ชำระเต็มจำนวนก่อนจัดส่งทุกกรณี ไม่มีบริการเก็บเงินปลายทาง",
          "ไม่มีการผ่อนชำระ และไม่มีการตัดเงินอัตโนมัติแบบสมัครสมาชิกรายเดือน",
          "เราไม่จัดเก็บข้อมูลบัตรของลูกค้าไว้ในระบบ การชำระเงินดำเนินการผ่านผู้ให้บริการรับชำระเงินที่ได้รับอนุญาต",
        ],
      },
      {
        heading: "กฎหมายที่ใช้บังคับและการระงับข้อพิพาท",
        body: [
          "เงื่อนไขฉบับนี้อยู่ภายใต้กฎหมายไทย และอยู่ในเขตอำนาจของศาลไทย",
          "การทำธุรกรรมผ่านเว็บไซต์นี้มีผลผูกพันตาม พระราชบัญญัติว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544",
          "สิทธิของผู้บริโภคได้รับความคุ้มครองตาม พระราชบัญญัติคุ้มครองผู้บริโภค พ.ศ. 2522 และการประกอบธุรกิจตลาดแบบตรงอยู่ภายใต้ พระราชบัญญัติขายตรงและตลาดแบบตรง พ.ศ. 2545",
          "สำหรับลูกค้าที่พำนักอยู่ในสาธารณรัฐประชาชนจีน ท่านยังคงมีสิทธิตามกฎหมายคุ้มครองผู้บริโภคของประเทศจีนและกฎหมายพาณิชย์อิเล็กทรอนิกส์แห่งสาธารณรัฐประชาชนจีน เท่าที่ใช้บังคับได้ เงื่อนไขฉบับนี้ไม่ตัดสิทธิดังกล่าว",
          "กรณีมีข้อพิพาท กรุณาติดต่อเราก่อนเป็นลำดับแรก เรามุ่งหาข้อยุติภายใน 30 วัน",
        ],
      },
      {
        heading: "ข้อจำกัดความรับผิด",
        body: [
          "เรารับผิดชอบไม่เกินมูลค่าสินค้าและค่าจัดส่งของคำสั่งซื้อที่เกี่ยวข้อง",
          "เราไม่รับผิดต่อความล่าช้าที่เกิดจากศุลกากร ภัยธรรมชาติ หรือเหตุสุดวิสัยอื่นที่อยู่นอกเหนือการควบคุม",
        ],
      },
    ],
  },
  zh: {
    title: "服务条款",
    updated: UPDATED.zh,
    sections: [
      {
        heading: "服务范围",
        body: [
          "我们以在线零售方式向居住在中国大陆的个人消费者销售泰国品牌日用消费品。",
          "使用本网站即表示您接受本条款。",
        ],
      },
      {
        heading: "下单与价格",
        body: [
          "商品价格以人民币（CNY）显示，已含相关税费，不含运费。",
          "我们收到并确认全额付款后，订单方为成立。",
          "如接单后出现缺货，我们将联系您提供替代商品或退还该部分款项。",
          "对于有合理理由怀疑存在欺诈的订单，我们保留拒绝或取消的权利。",
        ],
      },
      {
        heading: "付款",
        body: [
          "所有订单均须在发货前全额付款，不提供货到付款。",
          "不提供分期付款，也没有按月自动扣款的订阅服务。",
          "我们不在系统中保存您的银行卡信息，付款由具备资质的支付服务商处理。",
        ],
      },
      {
        heading: "适用法律与争议解决",
        body: [
          "本条款适用泰国法律，并以泰国法院为管辖法院。",
          "通过本网站进行的交易依据泰国《电子交易法》(B.E. 2544/2001) 具有法律效力。",
          "消费者权益受泰国《消费者保护法》(B.E. 2522/1979) 保护；直销与直复营销业务受泰国《直销与直复营销法》(B.E. 2545/2002) 规范。",
          "对于居住在中华人民共和国境内的客户，您在适用范围内仍享有中国消费者权益保护法及《中华人民共和国电子商务法》所赋予的权利，本条款不排除上述权利。",
          "如发生争议，请先与我们联系，我们将力求在 30 天内达成解决方案。",
        ],
      },
      {
        heading: "责任限制",
        body: [
          "我们承担的责任以相关订单的商品金额及运费为上限。",
          "对于海关、自然灾害或其他不可抗力造成的延误，我们不承担责任。",
        ],
      },
    ],
  },
  en: {
    title: "Terms of Service",
    updated: UPDATED.en,
    sections: [
      {
        heading: "Scope",
        body: [
          "We sell Thai consumer goods online at retail to individual consumers residing in mainland China.",
          "Using this website means you accept these terms.",
        ],
      },
      {
        heading: "Orders and pricing",
        body: [
          "Prices are shown in Chinese yuan (CNY), inclusive of applicable taxes and exclusive of shipping.",
          "An order is formed once we receive and confirm payment in full.",
          "If an item goes out of stock after an order is placed, we will offer a substitute or refund that portion.",
          "We may refuse or cancel any order we reasonably suspect to be fraudulent.",
        ],
      },
      {
        heading: "Payment",
        body: [
          "All orders are paid in full before dispatch. We do not offer cash on delivery.",
          "There are no instalment plans and no recurring or subscription billing.",
          "We do not store card details. Payments are processed by licensed payment service providers.",
        ],
      },
      {
        heading: "Governing law and disputes",
        body: [
          "These terms are governed by Thai law and subject to the jurisdiction of the Thai courts.",
          "Transactions made through this site take legal effect under Thailand's Electronic Transactions Act B.E. 2544 (2001).",
          "Consumer rights are protected under Thailand's Consumer Protection Act B.E. 2522 (1979), and direct marketing activity is regulated by the Direct Sales and Direct Marketing Act B.E. 2545 (2002).",
          "Customers residing in mainland China retain any rights available to them under Chinese consumer protection law and the E-Commerce Law of the People's Republic of China, so far as applicable. Nothing in these terms removes those rights.",
          "If a dispute arises, please contact us first. We aim to reach a resolution within 30 days.",
        ],
      },
      {
        heading: "Limitation of liability",
        body: [
          "Our liability is limited to the value of the goods and shipping for the order concerned.",
          "We are not liable for delays caused by customs, natural events, or other circumstances beyond our control.",
        ],
      },
    ],
  },
};

const privacy: Record<Locale, LegalDoc> = {
  th: {
    title: "นโยบายความเป็นส่วนตัว",
    updated: UPDATED.th,
    sections: [
      {
        heading: "ข้อมูลที่เราเก็บ",
        body: [
          "ชื่อผู้รับ เบอร์โทรศัพท์ และที่อยู่จัดส่ง — ใช้เพื่อจัดส่งสินค้า",
          "WeChat ID (ถ้าให้ไว้) — ใช้เพื่อติดต่อเรื่องคำสั่งซื้อ",
          "ประวัติคำสั่งซื้อและสถานะการชำระเงิน",
          "เราไม่เก็บหมายเลขบัตรเครดิตหรือข้อมูลบัตรใด ๆ ไว้ในระบบของเรา",
        ],
      },
      {
        heading: "การใช้และการเปิดเผย",
        body: [
          "เราใช้ข้อมูลเพื่อดำเนินการตามคำสั่งซื้อ จัดส่ง และให้บริการหลังการขายเท่านั้น",
          "เราเปิดเผยข้อมูลเท่าที่จำเป็นให้ผู้ให้บริการขนส่ง (ชื่อ ที่อยู่ เบอร์โทร) และผู้ให้บริการรับชำระเงิน",
          "เราไม่ขาย ไม่ให้เช่า และไม่แลกเปลี่ยนข้อมูลลูกค้ากับบุคคลที่สามเพื่อวัตถุประสงค์ทางการตลาด",
        ],
      },
      {
        heading: "ฐานทางกฎหมาย",
        body: [
          "ผู้ควบคุมข้อมูลส่วนบุคคลคือนิติบุคคลที่ระบุไว้ท้ายหน้านี้ ซึ่งจดทะเบียนในประเทศไทย",
          "การเก็บและใช้ข้อมูลอยู่ภายใต้ พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) ของประเทศไทย",
          "ฐานทางกฎหมายที่เราใช้คือความจำเป็นเพื่อปฏิบัติตามสัญญาซื้อขายกับท่าน (มาตรา 24(3)) และเพื่อปฏิบัติตามกฎหมายบัญชีและภาษี (มาตรา 24(6))",
          "สำหรับลูกค้าที่พำนักอยู่ในสาธารณรัฐประชาชนจีน เราดำเนินการโดยคำนึงถึงกฎหมายคุ้มครองข้อมูลส่วนบุคคลแห่งสาธารณรัฐประชาชนจีน (PIPL) ซึ่งมีผลบังคับกับผู้ประกอบการนอกประเทศจีนที่ให้บริการแก่บุคคลในประเทศจีนด้วย",
        ],
      },
      {
        heading: "การส่งข้อมูลข้ามพรมแดน",
        body: [
          "เนื่องจากเป็นการซื้อขายระหว่างประเทศ ข้อมูลการจัดส่งของท่านจะถูกส่งจากประเทศไทยไปยังผู้ให้บริการขนส่งและหน่วยงานศุลกากรในประเทศปลายทาง เท่าที่จำเป็นต่อการนำส่งพัสดุ",
          "ข้อมูลคำสั่งซื้อจัดเก็บบนผู้ให้บริการฐานข้อมูลที่มีศูนย์ข้อมูลอยู่ในภูมิภาคเอเชียตะวันออกเฉียงใต้",
          "เมื่อท่านสั่งซื้อ ถือว่าท่านรับทราบและยินยอมให้มีการส่งข้อมูลข้ามพรมแดนเท่าที่จำเป็นต่อการปฏิบัติตามคำสั่งซื้อ",
        ],
      },
      {
        heading: "การเก็บรักษาและสิทธิของท่าน",
        body: [
          "ข้อมูลถูกเก็บบนผู้ให้บริการฐานข้อมูลที่มีการเข้ารหัส และเข้าถึงได้เฉพาะผู้ที่ได้รับอนุญาต",
          "ท่านขอดู แก้ไข หรือขอให้ลบข้อมูลส่วนบุคคลของท่านได้ โดยติดต่อเราผ่านช่องทางในหน้าติดต่อ",
          "เราเก็บข้อมูลคำสั่งซื้อไว้ตามระยะเวลาที่กฎหมายบัญชีและภาษีกำหนด",
        ],
      },
    ],
  },
  zh: {
    title: "隐私政策",
    updated: UPDATED.zh,
    sections: [
      {
        heading: "我们收集的信息",
        body: [
          "收件人姓名、电话与收货地址 — 用于配送",
          "微信号（如您提供）— 用于订单相关沟通",
          "订单记录与支付状态",
          "我们不在系统中保存任何银行卡号或卡片信息。",
        ],
      },
      {
        heading: "使用与共享",
        body: [
          "信息仅用于处理订单、配送及售后服务。",
          "我们仅在必要范围内向承运商（姓名、地址、电话）及支付服务商提供信息。",
          "我们不会为营销目的出售、出租或交换客户信息。",
        ],
      },
      {
        heading: "法律依据",
        body: [
          "个人信息控制者为本页末尾载明的公司，该公司在泰国注册成立。",
          "我们收集和使用信息的行为受泰国《个人资料保护法》(PDPA, B.E. 2562/2019) 规范。",
          "我们所依据的合法性基础为：履行与您之间买卖合同所必需，以及遵守会计与税务法规所必需。",
          "对于居住在中华人民共和国境内的客户，我们同时参照《中华人民共和国个人信息保护法》(PIPL) 处理个人信息——该法对向中国境内自然人提供产品或服务的境外经营者同样适用。",
        ],
      },
      {
        heading: "跨境数据传输",
        body: [
          "由于本交易属跨境贸易，您的收货信息将在必要范围内由泰国传输至承运商及目的地海关，用于完成配送与清关。",
          "订单数据存储于数据中心位于东南亚地区的数据库服务商。",
          "您下单即表示知悉并同意为履行订单所必需的跨境数据传输。",
        ],
      },
      {
        heading: "存储与您的权利",
        body: [
          "数据存储于加密的数据库服务中，仅授权人员可访问。",
          "您可通过联系页面的方式要求查阅、更正或删除您的个人信息。",
          "订单数据将按会计与税务法规要求的期限保存。",
        ],
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    updated: UPDATED.en,
    sections: [
      {
        heading: "What we collect",
        body: [
          "Recipient name, phone number and delivery address — used to ship your order",
          "WeChat ID, if you provide one — used to contact you about your order",
          "Order history and payment status",
          "We do not store card numbers or any card details in our systems.",
        ],
      },
      {
        heading: "How we use and share it",
        body: [
          "We use your information only to process orders, ship them, and provide after-sales support.",
          "We share the minimum necessary with carriers (name, address, phone) and payment providers.",
          "We do not sell, rent or trade customer information for marketing purposes.",
        ],
      },
      {
        heading: "Legal basis",
        body: [
          "The data controller is the company named at the foot of this page, registered in Thailand.",
          "Collection and use of personal data is governed by Thailand's Personal Data Protection Act B.E. 2562 (2019).",
          "We rely on performance of the sales contract with you, and compliance with accounting and tax obligations, as our lawful bases.",
          "For customers residing in mainland China we also have regard to the Personal Information Protection Law of the People's Republic of China (PIPL), which applies to operators outside China that provide products or services to individuals in China.",
        ],
      },
      {
        heading: "Cross-border data transfer",
        body: [
          "Because this is cross-border trade, your delivery details are transferred from Thailand to carriers and to customs authorities in the destination country, to the extent needed to deliver and clear the parcel.",
          "Order data is held with a database provider whose data centres are located in the Southeast Asia region.",
          "By placing an order you acknowledge and consent to the cross-border transfers necessary to fulfil it.",
        ],
      },
      {
        heading: "Storage and your rights",
        body: [
          "Data is held on an encrypted database service, accessible only to authorised staff.",
          "You may request access to, correction of, or deletion of your personal data via the contact page.",
          "Order records are retained for the period required by accounting and tax law.",
        ],
      },
    ],
  },
};

export const LEGAL_DOCS = { shipping, refund, terms, privacy } as const;
export type LegalDocKey = keyof typeof LEGAL_DOCS;
