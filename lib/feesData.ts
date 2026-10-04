import alcSponsorAudit from '../data/alc-sponsor-audit.json';

export const FEES_CHECKED_ON = '2026-10-04';
export const UNKNOWN_FEE_TEXT = 'ยังยืนยันไม่ได้ — ขอใบเสนอราคา/สัญญาปี 2027 จาก Agency';

export interface FeeEvidence {
  url: string;
  title: string;
  scope: string;
  checkedOn: string;
}

// null means unknown, never free or excluded. A current page does not establish
// a 2027 contract: each fact carries its own source and season/year scope.
export interface FeeFact {
  text: string | null;
  source?: FeeEvidence;
  note?: string;
}

export interface AgencyFeeDetail {
  id: string;
  name: string;
  badgeClass: string;
  officialUrl: string;
  auditNote: string;
  application: FeeFact;
  program: FeeFact;
  extraJobFee: FeeFact;
  installments: FeeFact;
  sevisCharge: FeeFact;
  flightPolicy: FeeFact;
  insurance: FeeFact;
  sponsors: FeeFact;
  refundJobFail: FeeFact;
  refundVisaFail: FeeFact;
  refundVoluntaryCancel: FeeFact;
  promotions: FeeFact[];
  historical?: FeeFact;
}

const source = (url: string, title: string, scope: string): FeeEvidence => ({ url, title, scope, checkedOn: FEES_CHECKED_ON });
const unknown = (note?: string): FeeFact => ({ text: null, note });
const fact = (text: string, evidence: FeeEvidence, note?: string): FeeFact => ({ text, source: evidence, note });
const newStepCosts = source('https://newstepthailand.com/blog/expenses-work-and-travel-usa', 'New Step: ค่าใช้จ่าย Work and Travel', 'ข้อมูลทั่วไป อัปเดตบนเว็บ 6 ก.ย. 2026; ไม่ใช่ใบเสนอราคาเฉพาะบุคคล');
const newStepPromo = source('https://newstepthailand.com/promotions', 'New Step: โปรโมชั่น 2027', 'Spring / Summer 2027; สมัครถึง 15 ต.ค. 2026');
const acadexInfo = source('https://www.acadexthailand.com/work-and-travel-2/', 'ACADEX: รายละเอียดโครงการ', 'ข้อมูลทั่วไป ไม่ระบุปีในเงื่อนไขค่าใช้จ่าย');
const acadexJobs = source('https://www.acadexthailand.com/program/work-and-travel-summer/', 'ACADEX: Summer 2027', 'หน้ารวมงาน Summer 2027; ไม่ระบุวันหมดอายุโปรโมชั่น');
const oegJobs = source('https://www.oeg.co.th/work-and-travel-usa', 'OEG: รายการงาน', 'ชื่อ sponsor ในบางงาน ณ วันที่ตรวจ; ไม่ใช่รายชื่อพันธมิตรทั้งหมด');
const oegOldFees = source('https://oeg.co.th/oegfile/OEGWorkAndTravel2026Fee.pdf', 'OEG: เอกสารค่าธรรมเนียม 2026', 'ปี 2026 เท่านั้น; สมัครและจองงานถึง 28 ก.พ. 2026');
const alcSponsors = source('https://api.myalcapp.com/api/v1/web/wat/job?page=1&size=100', 'ALC: API รายการงานทางการ', 'อ่านครบ 4 หน้า / 384 รายการ ณ วันที่ตรวจ; API ระบุฤดูกาล แต่ไม่ระบุปีโครงการ');
const iHappySpring = source('https://www.ihappyeducation.com/wp-content/uploads/2026/09/All-in-one-2.png', 'iHappy: โปสเตอร์ All in One', 'Spring 2027; สมัครถึง 25 ต.ค. 2026');
const iHappySummer = source('https://www.ihappyeducation.com/wp-content/uploads/2026/09/Summer-2.png', 'iHappy: โปสเตอร์ Your Summer Adventure', 'Summer 2027; สมัครถึง 25 ต.ค. 2026');
const iHappySpringProtect = source('https://www.ihappyeducation.com/wp-content/uploads/2026/09/SP-Protect-3.png', 'iHappy: Visa Protection Spring', 'Spring 2027; สมัครถึง 25 ต.ค. 2026');
const iHappySummerProtect = source('https://www.ihappyeducation.com/wp-content/uploads/2026/09/SM-Protect-3.png', 'iHappy: Visa Protection Summer', 'Summer 2027; สมัครถึง 25 ต.ค. 2026');

function agency(id: string, name: string, officialUrl: string): AgencyFeeDetail {
  return {
    id, name, badgeClass: id, officialUrl,
    auditNote: 'ตรวจเว็บไซต์ทางการแล้ว แต่ยังไม่พบหลักฐานสาธารณะที่ยืนยันราคา sponsor และสัญญาคืนเงินปี 2027 ได้ครบ',
    application: unknown(), program: unknown(), extraJobFee: unknown(), installments: unknown(),
    sevisCharge: unknown('ขอแยกค่ารัฐบาล I-901 กับค่าบริการ และตรวจว่ารวมในค่าโครงการหรือไม่'),
    flightPolicy: unknown(), insurance: unknown(), sponsors: unknown('ชื่อ sponsor จริงต้องตรวจจากงานที่เลือกและ DS-2019'),
    refundJobFail: unknown(), refundVisaFail: unknown(), refundVoluntaryCancel: unknown(), promotions: [],
  };
}

export const AGENCY_FEES_DATA: AgencyFeeDetail[] = [
  {
    ...agency('oeg', 'OEG', 'https://www.oeg.co.th/work-and-travel-usa'),
    auditNote: 'พบเอกสารราคา 2026 แต่ยังยืนยันราคา 2027 ไม่ได้; ไม่นำราคาเก่ามาใช้แทนปี 2027',
    sponsors: fact('CIEE, Spirit', oegJobs, 'ยืนยันเฉพาะชื่อที่พบในรายการงาน ไม่ยืนยัน Intrax หรือ InterExchange จากหลักฐานนี้'),
    historical: fact('อ้างอิงปี 2026 เท่านั้น: สมัคร 4,900 + จองงาน 20,000 + งวดแรก 35,000 + งวดสอง 52,000 = 111,900 บาท ก่อนส่วนลดและค่ารัฐบาล', oegOldFees),
  },
  {
    ...agency('newstep', 'New Step', 'https://newstepthailand.com/promotions'),
    auditNote: 'ยืนยันโปรโมชั่น Spring/Summer 2027 ได้บางรายการ; ราคาแต่ละแพ็กเกจต้องขอใบเสนอราคาแยก',
    application: fact('โปรทั่วไป: Spring 4,900 / Summer 5,900 บาท; V Care We Safe: Spring 16,900 / Summer 17,900 บาท', newStepPromo),
    program: fact('54,900–89,900 บาท เฉพาะค่าโครงการ; ค่าสมัครและรายการอื่นแยกต่างหาก', newStepCosts, 'ช่วงราคาตามโปรโมชั่น ไม่ใช่ราคาแพ็กเกจเดียว; ไม่หักส่วนลดเพิ่มอัตโนมัติ'),
    extraJobFee: fact('ค่าการเลือกงาน 0 / 5,000 / 10,000 บาท ตามประเภทงาน', newStepCosts),
    installments: fact('ทั่วไปแบ่ง 2 งวด: งวดแรกภายใน 30 วันหลังสมัครหรือก่อนสัมภาษณ์; งวดสองภายใน 7 วันหลังผ่านงาน', newStepCosts),
    sevisCharge: fact('หน้า Agency ระบุ 3,900 บาทในรายการ SEVIS', newStepCosts, 'ต่างจากค่ารัฐบาล SWT $35; เว็บไม่แยกส่วนต่าง ต้องขอรายละเอียดค่าบริการ และตรวจยอดในใบเสนอราคา'),
    flightPolicy: fact('จองเองได้; เว็บประมาณตั๋วไปกลับ 40,000–70,000 บาท', newStepCosts, 'ประมาณการ ไม่ใช่ราคาตั๋วรับประกัน'),
    insurance: fact('ระบุรวมประกันสุขภาพ/อุบัติเหตุตามเงื่อนไขและระยะเวลาโครงการ', newStepCosts, 'ไม่ยืนยัน 120 วันหรือความคุ้มครองช่วงเที่ยว'),
    refundVisaFail: fact('V Care We Safe ประกาศคืนค่าโครงการ 100% เมื่อสัมภาษณ์สถานทูตไม่ผ่าน; ต้องผ่านวัดระดับภาษา', newStepPromo, 'เฉพาะแพ็กเกจนี้ ไม่รับรองคืนค่าสมัคร วีซ่า SEVIS หรือตั๋ว; ขอข้อยกเว้นในสัญญา'),
    promotions: [
      fact('Spring ลดค่าโครงการ 34,000 / Summer 32,000 บาท; กลุ่มสูงสุด 2,000 บาท/คน; ศิษย์เก่า 3,000 บาท', newStepPromo, 'ยอดหลังโปรและสิทธิ์ใช้ร่วมกันให้ยืนยันในใบเสนอราคา'),
      fact('ไปก่อนจ่ายทีหลัง: สมัคร 6,900 + ก่อนเดินทาง 30,000 + หลังจบโครงการ 45,000 บาท', newStepPromo, 'Spring เฉพาะงาน TN/MO/AL/SC; Summer เฉพาะ Lifeguard ใน DC/MD/VA; รวม 81,900 บาทก่อนรายการอื่น หน้าเว็บเรียกงวดไม่สอดคล้องกัน จึงต้องตรวจสัญญา'),
    ],
  },
  {
    ...agency('alc', 'ALC', 'https://myalcapp.com/work-and-travel'),
    auditNote: 'ตรวจ sponsor จาก API งานทางการแล้ว; ไม่พบราคาหรือสัญญาคืนเงิน 2027 ในหน้าโครงการสาธารณะที่อ่านได้',
    sponsors: fact(alcSponsorAudit.sponsors.join(', '), alcSponsors, 'เก็บป้ายชื่อ API ตามจริง รวมป้าย Self; ไม่ถือว่าป้ายที่ต่างกันเป็นหลักฐานขององค์กรแยกกัน ตรวจชื่อเต็มและปีโครงการจาก DS-2019'),
  },
  agency('iee', 'IEE', 'https://www.ieethailand.com/work-and-travel-new/'),
  {
    ...agency('ihappy', 'iHappy', 'https://www.ihappyeducation.com/hot-promotion/'),
    auditNote: 'อ่านโปสเตอร์โปรโมชั่น Spring/Summer 2027 บนเว็บไซต์ทางการแล้ว; ราคาแยกตามแพ็กเกจ และยังไม่พบข้อกำหนดคืนเงินฉบับเต็ม',
    application: fact('Spring All in One: 3,500 บาท', iHappySpring, 'เป็นราคาของแพ็กเกจนี้เท่านั้น; ราคา Summer และ Visa Protection ดูการ์ดโปรโมชั่น'),
    program: fact('Spring All in One: 82,000 บาท; รวม VISA และ SEVIS ตามโปสเตอร์', iHappySpring, 'ค่าสมัคร 3,500 บาทแยกต่างหาก รวมสองรายการ 85,500 บาท ก่อนรายการอื่นและส่วนลดกลุ่ม'),
    sevisCharge: fact('Spring All in One ระบุรวม VISA และ SEVIS ในค่าโครงการ 82,000 บาท', iHappySpring, 'ไม่บวก $185/$35 ซ้ำสำหรับแพ็กเกจนี้; แพ็กเกจอื่นต้องตรวจใบเสนอราคา'),
    promotions: [
      fact('Spring All in One: กลุ่ม 3 คนลดเพิ่ม 1,500 บาท; กลุ่ม 5 คนลดเพิ่ม 2,000 บาท', iHappySpring, 'โปสเตอร์ระบุลดค่าโครงการ; ตรวจสิทธิ์รายคนและการใช้ร่วมโปรอื่น'),
      fact('Summer Adventure: สมัคร 4,500 + ค่าโครงการ 77,900 = 82,400 บาท; กลุ่ม 3 คนลด 1,000 / 5 คนลด 1,500 บาท', iHappySummer, 'โปสเตอร์ไม่ระบุว่ารวม VISA/SEVIS จึงไม่ถือว่ารวม'),
      fact('Spring Visa Protection: สมัคร 16,900 + ค่าโครงการ 70,900 = 87,800 บาท; กลุ่ม 3 คนลด 1,500 / 5 คนลด 2,000 บาท', iHappySpringProtect, 'คำว่า Visa Protection ในโปสเตอร์ยังไม่ยืนยันยอดคืน ข้อยกเว้น หรือรวมค่ารัฐบาล ต้องขอสัญญา'),
      fact('Summer Visa Protection: สมัคร 17,500 + ค่าโครงการ 68,900 = 86,400 บาท; กลุ่ม 3 คนลด 1,000 / 5 คนลด 1,500 บาท', iHappySummerProtect, 'ยังไม่ยืนยันขอบเขตคืนเงินและการรวมค่ารัฐบาล'),
    ],
  },
  {
    ...agency('acadex', 'ACADEX', 'https://www.acadexthailand.com/work-and-travel-2/'),
    auditNote: 'พบค่าสมัครโปร Summer 2027 และรายละเอียดทั่วไป; ยังไม่ยืนยันราคาทุกกลุ่มงานหรือสัญญาคืนเงิน 2027',
    application: fact('โปรค่าสมัคร 3,900 บาทที่หน้ารวมงาน Summer 2027', acadexJobs, 'ไม่ระบุวันหมดอายุและเงื่อนไขครบ ต้องตรวจสิทธิ์ก่อนสมัคร'),
    installments: fact('แบ่งชำระเป็นงวด แต่ไม่ระบุยอดของแต่ละงวด', acadexInfo),
    sevisCharge: fact('ระบุค่าธรรมเนียมนักเรียนแลกเปลี่ยนรวมค่าบริการ 3,900 บาท', acadexInfo, 'ตรวจว่าใบเสนอราคารวมยอดนี้แล้วหรือยัง; ไม่บวกค่ารัฐบาล $35 ซ้ำ'),
    flightPolicy: fact('จองเองได้หลังวีซ่าผ่าน; หน้าโครงการประมาณ 35,000 บาท', acadexInfo, 'ประมาณการทั่วไป ไม่รับประกันราคาปี 2027'),
    refundJobFail: fact('Yellowstone Summer 2027: ไม่ผ่านพิจารณา/สัมภาษณ์ สามารถเลือกงานในองค์กรแลกเปลี่ยนเดิมโดยไม่เสียค่าใช้จ่าย', source('https://www.acadexthailand.com/location/xanterra-yellowstone-national-park-wyoming-summer-2027-group-x/', 'ACADEX: Yellowstone Summer 2027', 'เฉพาะ Yellowstone Summer 2027 Group X'), 'เป็นสิทธิ์เปลี่ยนงาน ไม่ใช่หลักฐานคืนเงิน'),
  },
  agency('interchange', 'Interchange', 'https://www.interchangethailand.com/'),
  {
    ...agency('i4group', 'I4 Group', 'https://i4gs.com/work-and-travel-in-usa-program/'),
    installments: fact('ชำระส่วนแรกก่อนส่งใบสมัครให้องค์กร และส่วนที่เหลือเมื่อได้รับ Job Offer; ไม่ระบุยอด', source('https://i4gs.com/work-and-travel-in-usa-program/', 'I4 Group: ขั้นตอนเข้าร่วมโครงการ', 'ข้อมูลทั่วไป ไม่ระบุปีโครงการ')),
  },
];

export const GOVERNMENT_FEES = {
  visa: { usd: 185, source: source('https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/fees/fees-visa-services.html', 'U.S. Department of State: Visa fees', 'ค่าคำร้องวีซ่า J ปัจจุบัน; ไม่รับประกันอัตราปี 2027') },
  sevis: { usd: 35, source: source('https://www.ecfr.gov/current/title-8/chapter-I/subchapter-B/part-214/subpart-A/section-214.13', '8 CFR 214.13(c): SEVIS', 'เฉพาะ Summer Work/Travel; J-1 ประเภทอื่นอาจต่างกัน') },
  sponsors: source('https://j1visa.state.gov/participants/how-to-apply/sponsor-search/?program=Summer%20Work%20Travel', 'BridgeUSA: Designated sponsors', 'ตรวจสถานะองค์กร; ไม่ใช่หลักฐานพันธมิตรกับ Agency ไทย'),
};

export interface BudgetInputs {
  // Net agency invoice includes application, reservations, installments,
  // location/sponsor/service charges after confirmed discounts.
  agencyQuoteThb: number | null;
  usdRate: number;
  flightTicketThb: number | null;
  pocketMoneyUsd: number;
  housingDepositUsd: number;
  visaIncluded: boolean | null;
  sevisIncluded: boolean | null;
  sevisChargeThb: number | null;
}

export function calculateAgencyTotalBudget(input: BudgetInputs) {
  const validMoney = (value: number | null): value is number => value !== null && Number.isFinite(value) && value >= 0;
  const missing: string[] = [];
  if (!validMoney(input.agencyQuoteThb)) missing.push('ยอดสุทธิจากใบเสนอราคา Agency');
  if (!validMoney(input.flightTicketThb)) missing.push('งบตั๋วเครื่องบิน');
  if (!Number.isFinite(input.usdRate) || input.usdRate <= 0) missing.push('อัตรา USD/THB ที่มากกว่า 0');
  if (!validMoney(input.pocketMoneyUsd) || !validMoney(input.housingDepositUsd)) missing.push('เงินสำรองและมัดจำที่พัก');
  if (typeof input.visaIncluded !== 'boolean') missing.push('ใบเสนอราคารวมค่าวีซ่าหรือไม่');
  if (typeof input.sevisIncluded !== 'boolean') missing.push('ใบเสนอราคารวม SEVIS หรือไม่');
  if (input.sevisIncluded === false && !validMoney(input.sevisChargeThb)) missing.push('ยอด SEVIS/ค่าบริการที่เรียกเก็บจริง');
  if (missing.length) return { grandTotalThb: null, govFeesThb: null, usFundsThb: null, missing };
  const govFeesThb = Math.round((input.visaIncluded ? 0 : GOVERNMENT_FEES.visa.usd * input.usdRate) + (input.sevisIncluded ? 0 : input.sevisChargeThb!));
  const usFundsThb = Math.round((input.pocketMoneyUsd + input.housingDepositUsd) * input.usdRate);
  const grandTotalThb = Math.round(input.agencyQuoteThb! + govFeesThb + input.flightTicketThb! + usFundsThb);
  return { grandTotalThb, govFeesThb, usFundsThb, missing };
}
