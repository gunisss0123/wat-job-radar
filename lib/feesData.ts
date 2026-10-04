export interface AgencyFeeDetail {
  id: string;
  name: string;
  legalName: string;
  badgeClass: string;
  establishedYear: number;
  highlight: string;
  usSponsors: string[];
  
  // Fee Breakdown (THB)
  applicationFee: number;
  applicationFeeNote: string;
  jobReservationFee?: number;
  jobReservationNote?: string;
  installment1: number;
  installment1Due: string;
  installment2: number;
  installment2Due: string;
  installment3?: number;
  installment3Due?: string;
  
  // Total Program Fee to Agency
  totalAgencyFeeMin: number;
  totalAgencyFeeMax: number;
  
  // Compulsory US Gov Fees
  sevisFeeUsd: number;
  sevisFeeThbApprox: number;
  sevisIncludedInFee: boolean;
  sevisNote: string;
  visaFeeUsd: number;
  visaFeeThbApprox: number;
  visaFeeNote: string;
  
  // Insurance
  insuranceIncluded: boolean;
  insuranceCoverageDays: number;
  insuranceDetails: string;
  
  // Flight Ticket Policy
  flightPolicy: 'MANDATORY_AGENCY' | 'FLEXIBLE_CHOICE' | 'SELF_BOOK_ALLOWED';
  flightPolicyText: string;
  estimatedFlightThbMin: number;
  estimatedFlightThbMax: number;
  
  // In-US Settlement Funds
  recommendedPocketMoneyUsd: number;
  estimatedHousingDepositUsd: number;
  
  // Refund Policy
  refundJobFail: string;
  refundVisaFail: string;
  refundVoluntaryCancel: string;
  visaProtectionPackageAvailable: boolean;
  visaProtectionDetails?: string;
  
  // Promotions
  earlyBirdDiscount: number;
  earlyBirdNote: string;
  groupDiscount2: number;
  groupDiscount3: number;
  groupDiscount5: number;
  alumniDiscount: number;
  specialPerks: string[];
}

export const AGENCY_FEES_DATA: AgencyFeeDetail[] = [
  {
    id: 'oeg',
    name: 'OEG',
    legalName: 'บริษัท โอเวอร์ซีส์ เอ็ด กรุ๊ป จำกัด (Overseas Ed Group)',
    badgeClass: 'oeg',
    establishedYear: 1990,
    highlight: 'เอเจนซี่อันดับ 1 ประสบการณ์ 30+ ปี เครือข่าย Sponsor ใหญ่ที่สุด (CIEE, Intrax, Spirit)',
    usSponsors: ['CIEE', 'Intrax', 'Spirit', 'InterExchange'],
    applicationFee: 3000,
    applicationFeeNote: 'ชำระวันสมัคร เพื่อจองคิววัดระดับภาษาและเปิดแฟ้มประวัติ (Non-refundable)',
    jobReservationFee: 5000,
    jobReservationNote: 'ชำระภายใน 1 วันหลังเลือกจองงานที่ผ่านเกณฑ์ภาษา',
    installment1: 30000,
    installment1Due: 'ชำระภายใน 60 วันหลังจองงาน หรือก่อนสัมภาษณ์งาน 15 วัน',
    installment2: 45000,
    installment2Due: 'ชำระภายใน 10 วันหลังผ่านสัมภาษณ์งาน (Spirit 5 วัน)',
    totalAgencyFeeMin: 83000,
    totalAgencyFeeMax: 90000,
    sevisFeeUsd: 35,
    sevisFeeThbApprox: 1260,
    sevisIncludedInFee: false,
    sevisNote: 'ชำระพร้อมค่าโครงการงวดที่ 2 ตามอัตราแลกเปลี่ยนทางการ',
    visaFeeUsd: 185,
    visaFeeThbApprox: 6660,
    visaFeeNote: 'ชำระตรงกับระบบนัดคิวสัมภาษณ์สถานทูตสหรัฐฯ (U.S. Embassy)',
    insuranceIncluded: true,
    insuranceCoverageDays: 120,
    insuranceDetails: 'รวมประกันอุบัติเหตุและสุขภาพพื้นฐานตามเกณฑ์ Department of State ตลอดสัญญา DS-2019',
    flightPolicy: 'FLEXIBLE_CHOICE',
    flightPolicyText: 'มีตั๋วเครื่องบินราคาพิเศษสำหรับนักศึกษา Work & Travel หรือสามารถขออนุมัติจองเองได้ตามเงื่อนไขวันเริ่ม-จบงาน',
    estimatedFlightThbMin: 42000,
    estimatedFlightThbMax: 65000,
    recommendedPocketMoneyUsd: 900,
    estimatedHousingDepositUsd: 350,
    refundJobFail: 'หากสัมภาษณ์งานรอบแรกไม่ผ่าน สามารถเลือกสัมภาษณ์งานรอบ 2 ได้ฟรี หากสละสิทธิ์คืนเงินงวด 1-2 (หักค่าสมัคร 3,000 บ. และค่าธรรมเนียมจัดสอบ 2,000 บ.)',
    refundVisaFail: 'คืนเงินค่าโครงการงวดที่ 1 และ 2 เต็มจำนวน (หักค่าธรรมเนียมองค์กรแลกเปลี่ยนตามจริงประมาณ 8,000 - 14,000 บาท ส่วนค่าวีซ่า/SEVIS เป็นของรัฐบาลสหรัฐไม่สามารถคืนได้)',
    refundVoluntaryCancel: 'ก่อนสัมภาษณ์งาน หัก 5,000 บ. / หลังผ่านงานก่อนออก DS-2019 หัก 15,000 บ. / หลังออก DS-2019 คืนตามเงื่อนไข Sponsor',
    visaProtectionPackageAvailable: false,
    earlyBirdDiscount: 3000,
    earlyBirdNote: 'สมัครภายในช่วง Early Bird ประจำรอบ ลดค่าโครงการทันที 2,000 - 3,000 บาท',
    groupDiscount2: 1000,
    groupDiscount3: 1500,
    groupDiscount5: 2000,
    alumniDiscount: 3000,
    specialPerks: [
      'สัมมนา Orientation และเตรียมตัวสัมภาษณ์วีซ่าระดับมืออาชีพ',
      'ทีมงาน Support ฉุกเฉินประจำสหรัฐฯ ตลอด 24 ชม.',
      'ระบบ Pay-in Slip สแกน QR Code ตรวจสอบยอดเงินแบบอัตโนมัติ'
    ]
  },
  {
    id: 'newstep',
    name: 'New Step',
    legalName: 'บริษัท นิวยูโรเปียน จำกัด (New Step Thailand)',
    badgeClass: 'newstep',
    establishedYear: 2008,
    highlight: 'โปรโมชั่นสุดคุ้ม ผ่อนชำระสบาย ไม่บังคับซื้อตั๋วเครื่องบิน พร้อมแคมเปญคืนเงินวีซ่า 100%',
    usSponsors: ['Intrax', 'Spirit', 'AWA', 'Greenheart'],
    applicationFee: 2900,
    applicationFeeNote: 'ช่วงโปรโมชั่นลดเหลือ 2,900 บาท (จากราคาปกติ 5,900 บาท)',
    installment1: 30000,
    installment1Due: 'ชำระภายใน 30 วันหลังสมัคร หรือก่อนเข้าคิวสัมภาษณ์งาน',
    installment2: 41900,
    installment2Due: 'ชำระภายใน 7 วันหลังทราบผลว่าผ่านการสัมภาษณ์งาน',
    totalAgencyFeeMin: 74800,
    totalAgencyFeeMax: 84800,
    sevisFeeUsd: 35,
    sevisFeeThbApprox: 3900,
    sevisIncludedInFee: false,
    sevisNote: 'ค่า SEVIS Fee ชำระ 3,900 บาท พร้อมงวดที่ 2',
    visaFeeUsd: 185,
    visaFeeThbApprox: 6660,
    visaFeeNote: 'ชำระผ่านระบบสถานทูตสหรัฐฯ $185 (ประมาณ 6,660 บาท)',
    insuranceIncluded: true,
    insuranceCoverageDays: 120,
    insuranceDetails: 'รวมประกันสุขภาพและอุบัติเหตุครอบคลุมการรักษาในสหรัฐฯ ตลอดช่วงทำงาน',
    flightPolicy: 'SELF_BOOK_ALLOWED',
    flightPolicyText: 'ให้อิสระในการจองตั๋วเครื่องบิน 100% ไม่บังคับซื้อผ่านเอเจนซี่ น้องสามารถหาตั๋วโปรโมชั่นที่ถูกที่สุดเองได้',
    estimatedFlightThbMin: 38000,
    estimatedFlightThbMax: 58000,
    recommendedPocketMoneyUsd: 800,
    estimatedHousingDepositUsd: 300,
    refundJobFail: 'สัมภาษณ์งานไม่ผ่าน สามารถเลือกงานใหม่และสัมภาษณ์ต่อได้ฟรีจนกว่าจะได้งาน หรือขอยกเลิกคืนเงินค่าโครงการ',
    refundVisaFail: 'มีโปรโมชั่นประกันวีซ่า คืนเงินค่าโครงการ 100% ตามรอบโปรโมชั่นที่สมัคร (ตรวจสอบเงื่อนไขในสัญญา)',
    refundVoluntaryCancel: 'ยกเลิกก่อนเลือกงาน หักเฉพาะค่าสมัคร / ยกเลิกหลังเลือกงานหักค่าดำเนินการตามขั้นตอนจริง',
    visaProtectionPackageAvailable: true,
    visaProtectionDetails: 'แคมเปญการันตีคืนค่าโครงการเต็มจำนวน 100% หากสัมภาษณ์วีซ่า J-1 ไม่ผ่านในรอบแรก',
    earlyBirdDiscount: 4000,
    earlyBirdNote: 'ลดค่าสมัครจาก 5,900 เหลือ 2,900 และลดค่าโครงการงวด 2 เพิ่มอีก 1,000 บาท',
    groupDiscount2: 1000,
    groupDiscount3: 1500,
    groupDiscount5: 2500,
    alumniDiscount: 2500,
    specialPerks: [
      'ไม่บังคับจองตั๋วเครื่องบิน เลือกสายการบินและแวะเที่ยวได้ตามใจชอบ',
      'พี่ทีมงานดูแลใกล้ชิดตั้งแต่ทำเอกสารจนถึงวันเดินทาง',
      'ระบบติดตามสถานะเอกสารออนไลน์ New Step Portal'
    ]
  },
  {
    id: 'alc',
    name: 'ALC',
    legalName: 'บริษัท อเมริกัน เลิร์นนิ่ง จำกัด (American Learning Center)',
    badgeClass: 'alc',
    establishedYear: 2002,
    highlight: 'ฐานข้อมูลตำแหน่งงานเยอะที่สุด (629 งาน) แบ่งชำระได้ถึง 3 งวด มีส่วนลดพิเศษตัดงวดท้าย',
    usSponsors: ['IACE', 'GeoVisions', 'Intrax', 'InterExchange'],
    applicationFee: 8000,
    applicationFeeNote: 'ค่าสมัครรวมคัดกรองระดับภาษาและการจัดแฟ้มประวัติผู้สมัคร (Non-refundable)',
    installment1: 20000,
    installment1Due: 'ชำระเพื่อเริ่มกระบวนการจัดหางานและล็อคโควตาตำแหน่งงาน',
    installment2: 22000,
    installment2Due: 'ชำระเมื่อส่งใบสมัครงานและเตรียมนัดสัมภาษณ์งานกับนายจ้าง',
    installment3: 38000,
    installment3Due: 'ชำระหลังผ่านสัมภาษณ์งานและได้รับ Job Offer (ส่วนลดโปรโมชั่นจะนำมาหักในงวดนี้)',
    totalAgencyFeeMin: 84000,
    totalAgencyFeeMax: 88000,
    sevisFeeUsd: 35,
    sevisFeeThbApprox: 1260,
    sevisIncludedInFee: false,
    sevisNote: 'ชำระ $35 ตามอัตราแลกเปลี่ยนจริงก่อนยื่นขอเอกสาร DS-2019',
    visaFeeUsd: 185,
    visaFeeThbApprox: 6660,
    visaFeeNote: 'ชำระค่าธรรมเนียมกงสุลสถานทูต $185',
    insuranceIncluded: true,
    insuranceCoverageDays: 120,
    insuranceDetails: 'รวมประกันสุขภาพของ Sponsor มาตรฐานอเมริกา ไม่ต้องจ่ายเพิ่ม',
    flightPolicy: 'FLEXIBLE_CHOICE',
    flightPolicyText: 'มีตั๋วเครื่องบินกลุ่มราคาพิเศษของสายการบินพันธมิตร หรือแจ้งขอจองตั๋วเองได้เมื่อได้วีซ่าผ่านแล้ว',
    estimatedFlightThbMin: 40000,
    estimatedFlightThbMax: 62000,
    recommendedPocketMoneyUsd: 850,
    estimatedHousingDepositUsd: 350,
    refundJobFail: 'หากสัมภาษณ์งานไม่ผ่าน สามารถเลือกงานใหม่และสัมภาษณ์ต่อได้ฟรี หากไม่มีงานที่ตรงใจ คืนเงินงวด 2 และ 3',
    refundVisaFail: 'คืนเงินค่าโครงการงวด 2 และ 3 (หักค่าใช้จ่ายดำเนินการเอกสารและ Sponsor ประมาณ 10,000 - 12,000 บาท)',
    refundVoluntaryCancel: 'หากขอยกเลิกเอง จะคืนเงินตามลำดับงวดที่ยังไม่ได้เริ่มกระบวนการ',
    visaProtectionPackageAvailable: false,
    earlyBirdDiscount: 4000,
    earlyBirdNote: 'ส่วนลดพิเศษนำไปหักลบในค่างวดสุดท้าย (งวดที่ 3) สูงสุด 4,000 บาท เมื่อชำระตามกำหนด',
    groupDiscount2: 1000,
    groupDiscount3: 1500,
    groupDiscount5: 2000,
    alumniDiscount: 3000,
    specialPerks: [
      'ตัวเลือกงานเยอะที่สุดในไทย ครอบคลุมกว่า 384 นายจ้างทั่วสหรัฐฯ',
      'มีทีมติวสัมภาษณ์งานภาษาอังกฤษแบบเข้มข้นก่อนลงสนามจริง',
      'แอปพลิเคชัน myALCapp เช็คสถานะแบบเรียลไทม์'
    ]
  },
  {
    id: 'iee',
    name: 'IEE',
    legalName: 'สถาบัน ไอ อี อี ประเทศไทย (International Education Exchange)',
    badgeClass: 'iee',
    establishedYear: 1999,
    highlight: 'แพ็กเกจคุ้มค่า All-Inclusive รวมค่าวีซ่าและ SEVIS ชัดเจน มีตัวเลือก Visa Protection',
    usSponsors: ['IEE US Network', 'CIEE', 'AWA', 'Spirit'],
    applicationFee: 4500,
    applicationFeeNote: 'ค่าสมัครและทดสอบประเมินความพร้อมภาษาอังกฤษ',
    installment1: 30000,
    installment1Due: 'ชำระเมื่องวดจองตำแหน่งงานและยืนยันรอบโครงการ',
    installment2: 47500,
    installment2Due: 'ชำระเมื่อผ่านการสัมภาษณ์งาน (แพ็กเกจ All-Inclusive รวม SEVIS + VISA รวมเบ็ดเสร็จประมาณ 82,000 บ.)',
    totalAgencyFeeMin: 76500,
    totalAgencyFeeMax: 82000,
    sevisFeeUsd: 35,
    sevisFeeThbApprox: 1260,
    sevisIncludedInFee: true,
    sevisNote: 'รวมอยู่ในแพ็กเกจ All-Inclusive เรียบร้อยแล้ว ไม่ต้องจ่ายเพิ่ม',
    visaFeeUsd: 185,
    visaFeeThbApprox: 6660,
    visaFeeNote: 'รวมอยู่ในแพ็กเกจ All-Inclusive หรือแยกจ่ายตามแพ็กเกจที่เลือก',
    insuranceIncluded: true,
    insuranceCoverageDays: 120,
    insuranceDetails: 'รวมประกันสุขภาพอุบัติเหตุระดับพรีเมียม วงเงินคุ้มครองตามเกณฑ์กระทรวงการต่างประเทศสหรัฐฯ',
    flightPolicy: 'SELF_BOOK_ALLOWED',
    flightPolicyText: 'จองเองได้อิสระ หรือใช้บริการ IEE Travel Desk จองตั๋วนักเรียนแบบเปลี่ยนวันเดินทางฟรี',
    estimatedFlightThbMin: 39000,
    estimatedFlightThbMax: 60000,
    recommendedPocketMoneyUsd: 800,
    estimatedHousingDepositUsd: 300,
    refundJobFail: 'การันตีสัมภาษณ์งานใหม่ได้ฟรีจนกว่าจะได้งาน หรือคืนเงินงวด 2 หากไม่พึงพอใจในตำแหน่งงานสำรอง',
    refundVisaFail: 'สำหรับแพ็กเกจ Visa Protection จะได้รับเงินคืนค่าโครงการสูงสุด หักเฉพาะค่าธรรมเนียมที่ชำระให้สถานทูตจริง',
    refundVoluntaryCancel: 'ก่อนสัมภาษณ์งาน คืนงวดโครงการ หักค่าสมัคร 4,500 บาท / หลังออก DS-2019 คืนตามเงื่อนไข Sponsor',
    visaProtectionPackageAvailable: true,
    visaProtectionDetails: 'มีแพ็กเกจ Visa Protection เพิ่มความอุ่นใจ คุ้มครองยอดเงินคืนหากสัมภาษณ์วีซ่าไม่ผ่าน',
    earlyBirdDiscount: 3500,
    earlyBirdNote: 'สมัครล่วงหน้าลดค่าโครงการ 2,500 - 3,500 บาท พร้อมฟรีคอร์สภาษา',
    groupDiscount2: 1000,
    groupDiscount3: 1500,
    groupDiscount5: 2000,
    alumniDiscount: 2500,
    specialPerks: [
      'คลาสติวสัมภาษณ์วีซ่าแบบตัวต่อตัว (1-on-1 Mock Interview)',
      'ตัวเลือกแพ็กเกจ All-Inclusive งบไม่บานปลาย รู้ยอดจ่ายจริงตั้งแต่แรก',
      'พี่ทีมงาน IEE ดูแลประสานงานตั้งแต่กรุงเทพฯ จนถึงสหรัฐฯ'
    ]
  },
  {
    id: 'ihappy',
    name: 'iHappy',
    legalName: 'ไอแฮปปี้ เอ็ดดูเคชั่น (iHappy Education)',
    badgeClass: 'ihappy',
    establishedYear: 2014,
    highlight: 'ราคาค่าโครงการย่อมเยา โปรโมชั่นกลุ่มเพื่อนโดนใจ มีนายจ้างกระจายครบ 50 รัฐ',
    usSponsors: ['Janets', 'Intrax', 'United Work and Travel', 'Spirit'],
    applicationFee: 4500,
    applicationFeeNote: 'ค่าสมัครและค่าตรวจสอบคุณสมบัติเบื้องต้น',
    installment1: 28000,
    installment1Due: 'ชำระเมื่อจับคู่ตำแหน่งงานและนัดวันสัมภาษณ์',
    installment2: 44000,
    installment2Due: 'ชำระภายใน 7-10 วันหลังผ่านการสัมภาษณ์งาน',
    totalAgencyFeeMin: 76500,
    totalAgencyFeeMax: 79500,
    sevisFeeUsd: 35,
    sevisFeeThbApprox: 1260,
    sevisIncludedInFee: false,
    sevisNote: 'ชำระ $35 (ประมาณ 1,260 บาท) ก่อนการออก DS-2019',
    visaFeeUsd: 185,
    visaFeeThbApprox: 6660,
    visaFeeNote: 'ชำระตรงกับระบบนัดสัมภาษณ์สถานทูตสหรัฐฯ $185',
    insuranceIncluded: true,
    insuranceCoverageDays: 120,
    insuranceDetails: 'รวมประกันสุขภาพอุบัติเหตุตามกฎหมายวีซ่า J-1 ตลอดอายุสัญญา',
    flightPolicy: 'SELF_BOOK_ALLOWED',
    flightPolicyText: 'เปิดกว้างให้น้องๆ จองตั๋วเครื่องบินเองได้อย่างเสรี ไม่มีค่าปรับหรือบังคับซื้อพ่วง',
    estimatedFlightThbMin: 38000,
    estimatedFlightThbMax: 58000,
    recommendedPocketMoneyUsd: 800,
    estimatedHousingDepositUsd: 300,
    refundJobFail: 'สัมภาษณ์งานไม่ผ่าน สามารถสัมภาษณ์งานใหม่ได้ไม่จำกัดจำนวนครั้ง หรือขอรับเงินงวดโครงการคืน',
    refundVisaFail: 'กรณีวีซ่าไม่ผ่าน คืนเงินค่าโครงการงวด 1 และ 2 (หักค่าธรรมเนียมออกเอกสาร DS-2019 ของ Sponsor ประมาณ 9,500 บาท)',
    refundVoluntaryCancel: 'หักตามขั้นตอนจริง หากยังไม่ออกเอกสาร DS-2019 คืนเงินงวด 2 เต็มจำนวน',
    visaProtectionPackageAvailable: false,
    earlyBirdDiscount: 3000,
    earlyBirdNote: 'โปรโมชั่น Early Bird ลดค่าโครงการทันที 2,000 - 3,000 บาท',
    groupDiscount2: 1000,
    groupDiscount3: 1500,
    groupDiscount5: 2500,
    alumniDiscount: 2000,
    specialPerks: [
      'โปรโมชั่นกลุ่ม 5 คนลดสูงสุด 2,500 บาท/คน คุ้มที่สุดสำหรับแก๊งเพื่อน',
      'ฟรีเสื้อยืดและกระเป๋าเดินทางโครงการ iHappy',
      'บรรยากาศเป็นกันเอง พี่ๆ ให้คำปรึกษาตลอด 24 ชม.'
    ]
  },
  {
    id: 'acadex',
    name: 'ACADEX',
    legalName: 'อะคาเดกซ์ ประเทศไทย (ACADEX Thailand)',
    badgeClass: 'acadex',
    establishedYear: 2012,
    highlight: 'ระบบพอร์ทัลตรวจเช็คโปร่งใส 24 ชม. แบ่งระดับ Tier งานชัดเจน มีระบบผ่อน 0% และโปรบินก่อนจ่ายทีหลัง',
    usSponsors: ['ASSE', 'Spirit', 'InterExchange', 'CIEE'],
    applicationFee: 3900,
    applicationFeeNote: 'ช่วงโปรโมชั่นลดเหลือ 3,900 บาท (จากปกติ 4,900 บาท)',
    installment1: 29000,
    installment1Due: 'ชำระภายใน 15-30 วันหลังสมัคร หรือก่อนวันสัมภาษณ์งาน',
    installment2: 44000,
    installment2Due: 'ชำระหลังผ่านสัมภาษณ์งาน (Standard Tier 44k, Premium Tier 49k, Exclusive Tier 53k)',
    totalAgencyFeeMin: 76900,
    totalAgencyFeeMax: 85900,
    sevisFeeUsd: 35,
    sevisFeeThbApprox: 1260,
    sevisIncludedInFee: false,
    sevisNote: 'ชำระค่าธรรมเนียม SEVIS $35 ตามอัตราแลกเปลี่ยนจริง',
    visaFeeUsd: 185,
    visaFeeThbApprox: 6660,
    visaFeeNote: 'ชำระผ่านระบบธนาคาร/สถานทูตสหรัฐฯ $185',
    insuranceIncluded: true,
    insuranceCoverageDays: 120,
    insuranceDetails: 'รวมประกันสุขภาพอุบัติเหตุมาตรฐานอเมริกาตลอดระยะเวลาทำงาน',
    flightPolicy: 'SELF_BOOK_ALLOWED',
    flightPolicyText: 'จองตั๋วเองได้อย่างอิสระ หรือเลือกจองแพ็กเกจตั๋วกลุ่มผ่าน ACADEX ที่มีรถรับส่งถึงที่พัก',
    estimatedFlightThbMin: 39000,
    estimatedFlightThbMax: 62000,
    recommendedPocketMoneyUsd: 850,
    estimatedHousingDepositUsd: 350,
    refundJobFail: 'สัมภาษณ์ไม่ผ่าน เลือกงานใหม่สัมภาษณ์ฟรีได้ตลอด หรือขอยกเลิกคืนเงินค่าโครงการ',
    refundVisaFail: 'กรณีวีซ่าไม่ผ่าน คืนเงินค่าโครงการ (หักค่าธรรมเนียม Sponsor และค่าออกเอกสารตามจริงประมาณ 9,000 - 12,000 บาท)',
    refundVoluntaryCancel: 'ตรวจสอบกำหนดเวลาและเงื่อนไขการคืนเงินผ่านระบบ Portal ได้ทันที',
    visaProtectionPackageAvailable: false,
    earlyBirdDiscount: 4000,
    earlyBirdNote: 'ส่วนลด Early Bird สูงสุด 4,000 บาท ตามรอบการสมัคร',
    groupDiscount2: 1000,
    groupDiscount3: 1500,
    groupDiscount5: 2000,
    alumniDiscount: 3000,
    specialPerks: [
      'ระบบ Portal ออนไลน์ document.acadexthailand.com ตรวจสอบงวดเงินและเอกสาร 24 ชม.',
      'ทางเลือกผ่อนชำระ 0% ผ่านบัตรเครดิตที่ร่วมรายการ',
      'Friend Referral แนะนำเพื่อนมาร่วมโครงการรับค่าแนะนำ 1,000 - 2,000 บาท/คน'
    ]
  },
  {
    id: 'interchange',
    name: 'Interchange',
    legalName: 'อินเตอร์เชนจ์ ประเทศไทย (Interchange Thailand)',
    badgeClass: 'interchange',
    establishedYear: 2005,
    highlight: 'เน้นงาน Premium Location คุณภาพสูง ดูแลนักศึกษาอย่างอบอุ่น ติวสัมภาษณ์วีซ่าภาษาอังกฤษ 1-on-1',
    usSponsors: ['InterExchange', 'Cultural Homestay International (CHI)', 'Spirit'],
    applicationFee: 4000,
    applicationFeeNote: 'ค่าสมัครและทดสอบระดับภาษาอังกฤษกับผู้เชี่ยวชาญ',
    installment1: 28000,
    installment1Due: 'ชำระเมื่อส่งใบสมัครและยืนยันรอบสัมภาษณ์กับนายจ้าง',
    installment2: 45000,
    installment2Due: 'ชำระภายใน 7-10 วันหลังผ่านการสัมภาษณ์งานและตอบรับ Job Offer',
    totalAgencyFeeMin: 77000,
    totalAgencyFeeMax: 81000,
    sevisFeeUsd: 35,
    sevisFeeThbApprox: 1260,
    sevisIncludedInFee: false,
    sevisNote: 'ชำระ $35 (ประมาณ 1,260 บาท) ก่อนการออกเอกสารสิทธิ์ DS-2019',
    visaFeeUsd: 185,
    visaFeeThbApprox: 6660,
    visaFeeNote: 'ชำระตรงกับระบบนัดคิวสถานทูตสหรัฐฯ $185',
    insuranceIncluded: true,
    insuranceCoverageDays: 120,
    insuranceDetails: 'รวมประกันสุขภาพอุบัติเหตุตามเกณฑ์ J-1 Visa ตลอดอายุสัญญา DS-2019',
    flightPolicy: 'SELF_BOOK_ALLOWED',
    flightPolicyText: 'นักศึกษาสามารถเปรียบเทียบและจองตั๋วเครื่องบินไป-กลับเองได้อย่างอิสระ ไม่บังคับซื้อตั๋วพ่วง',
    estimatedFlightThbMin: 38000,
    estimatedFlightThbMax: 59000,
    recommendedPocketMoneyUsd: 850,
    estimatedHousingDepositUsd: 350,
    refundJobFail: 'หากสัมภาษณ์ไม่ผ่าน มีสิทธิ์สัมภาษณ์งานสำรองได้ฟรี 2-3 ครั้ง หรือคืนเงินงวดโครงการ',
    refundVisaFail: 'กรณีวีซ่าไม่ผ่าน คืนเงินค่าโครงการงวด 1 และ 2 (หักค่าดำเนินการเอกสารของ Sponsor ประมาณ 10,000 บาท)',
    refundVoluntaryCancel: 'หักตามขั้นตอนที่เกิดขึ้นจริงตามที่ระบุในสัญญาอย่างโปร่งใส',
    visaProtectionPackageAvailable: false,
    earlyBirdDiscount: 3000,
    earlyBirdNote: 'โปรโมชั่น Early Bird ลดค่าโครงการทันที 2,000 - 3,000 บาท',
    groupDiscount2: 1000,
    groupDiscount3: 1500,
    groupDiscount5: 2000,
    alumniDiscount: 2500,
    specialPerks: [
      'เน้นงาน Exclusive Premium Locations เช่น Wisconsin Dells, Virginia Beach, Liberty Island NYC',
      'บริการจัดสัมภาษณ์จำลอง (Mock Visa Interview) แบบตัวต่อตัวฟรี',
      'สำนักงานใจกลางเมือง อาคารฟอรั่มทาวเวอร์ รัชดาภิเษก เดินทางสะดวก'
    ]
  },
  {
    id: 'i4group',
    name: 'I4 Group',
    legalName: 'บริษัท ไอโฟร์กรุ๊ป จำกัด (iFourGroup Thailand)',
    badgeClass: 'i4group',
    establishedYear: 2009,
    highlight: 'การันตีไม่บังคับซื้อตั๋วเครื่องบินเด็ดขาด ทำงานร่วมกับ CIEE & Intrax พร้อมบริการให้คำปรึกษา Tax Refund ฟรี',
    usSponsors: ['CIEE', 'Intrax', 'Spirit', 'InterExchange', 'AWA'],
    applicationFee: 4000,
    applicationFeeNote: 'ค่าสมัครและประเมินระดับความสามารถทางภาษาอังกฤษ',
    installment1: 30000,
    installment1Due: 'ชำระเมื่องวดจัดหางานและเตรียมนัดสัมภาษณ์',
    installment2: 43000,
    installment2Due: 'ชำระหลังทราบผลผ่านสัมภาษณ์งานและเริ่มกระบวนการขอ DS-2019',
    totalAgencyFeeMin: 77000,
    totalAgencyFeeMax: 81000,
    sevisFeeUsd: 35,
    sevisFeeThbApprox: 1260,
    sevisIncludedInFee: false,
    sevisNote: 'ชำระ $35 ตามอัตราแลกเปลี่ยนทางการ (บางแพ็กเกจรวมอยู่ในค่าโครงการแล้ว)',
    visaFeeUsd: 185,
    visaFeeThbApprox: 6660,
    visaFeeNote: 'ชำระค่าธรรมเนียมกงสุลสถานทูต $185',
    insuranceIncluded: true,
    insuranceCoverageDays: 120,
    insuranceDetails: 'รวมประกันสุขภาพอุบัติเหตุคุ้มครองสูงสุดตามมาตรฐานกระทรวงการต่างประเทศสหรัฐฯ',
    flightPolicy: 'SELF_BOOK_ALLOWED',
    flightPolicyText: 'มีนโยบายชัดเจน 100% ว่าไม่มีการบังคับซื้อตั๋วเครื่องบินผ่านบริษัท ให้นักเรียนจองตั๋วเองได้อย่างอิสระ',
    estimatedFlightThbMin: 38000,
    estimatedFlightThbMax: 58000,
    recommendedPocketMoneyUsd: 800,
    estimatedHousingDepositUsd: 300,
    refundJobFail: 'สัมภาษณ์ไม่ผ่าน สามารถเลือกเปลี่ยนงานใหม่ได้ฟรีจนกว่าจะได้งานที่พึงพอใจ',
    refundVisaFail: 'กรณีวีซ่าไม่ผ่าน คืนเงินค่าโครงการ (หักเฉพาะค่าธรรมเนียม Sponsor ตัวจริงตามใบเสร็จ ประมาณ 9,500 - 11,000 บาท)',
    refundVoluntaryCancel: 'คืนเงินตามสัดส่วนขั้นตอนเอกสารในสัญญาอย่างเป็นธรรม',
    visaProtectionPackageAvailable: false,
    earlyBirdDiscount: 3000,
    earlyBirdNote: 'โปรโมชั่น Early Bird ลดค่าโครงการ 2,500 - 3,000 บาท',
    groupDiscount2: 1000,
    groupDiscount3: 1500,
    groupDiscount5: 2500,
    alumniDiscount: 2500,
    specialPerks: [
      'นโยบายไม่บังคับซื้อตั๋วเครื่องบินอย่างแท้จริง ช่วยประหยัดค่าเดินทางได้มาก',
      'บริการจัดเตรียมและตรวจทานเอกสาร DS-160 อย่างละเอียด',
      'ให้คำปรึกษาและประสานงานขอภาษีคืน (Tax Refund) ฟรีหลังจบโครงการ'
    ]
  }
];

// Helper calculation function
export function calculateAgencyTotalBudget(
  agency: AgencyFeeDetail,
  flightOption: 'budget' | 'standard' | 'direct' = 'standard',
  pocketMoneyUsd: number = 850,
  housingDepositUsd: number = 350,
  hasEarlyBird: boolean = false,
  groupSize: number = 1,
  isAlumni: boolean = false
): {
  agencyNetFee: number;
  govFeesThb: number;
  flightTicketThb: number;
  usFundsThb: number;
  grandTotalThb: number;
  totalDiscountThb: number;
} {
  const usdRate = 36.0;
  
  // Base agency fee (average of min and max)
  let agencyFee = (agency.totalAgencyFeeMin + agency.totalAgencyFeeMax) / 2;
  
  // Discounts
  let totalDiscount = 0;
  if (hasEarlyBird) totalDiscount += agency.earlyBirdDiscount;
  if (isAlumni) totalDiscount += agency.alumniDiscount;
  else if (groupSize >= 5) totalDiscount += agency.groupDiscount5;
  else if (groupSize >= 3) totalDiscount += agency.groupDiscount3;
  else if (groupSize === 2) totalDiscount += agency.groupDiscount2;
  
  const agencyNetFee = Math.max(0, agencyFee - totalDiscount);
  
  // Government fees
  const sevisThb = agency.sevisIncludedInFee ? 0 : agency.sevisFeeThbApprox;
  const govFeesThb = sevisThb + agency.visaFeeThbApprox;
  
  // Flight ticket estimate
  let flightTicketThb = 48000;
  if (flightOption === 'budget') flightTicketThb = agency.estimatedFlightThbMin;
  else if (flightOption === 'direct') flightTicketThb = agency.estimatedFlightThbMax;
  else flightTicketThb = Math.round((agency.estimatedFlightThbMin + agency.estimatedFlightThbMax) / 2);
  
  // In-US funds (Pocket money + Housing Deposit) in THB
  const usFundsThb = Math.round((pocketMoneyUsd + housingDepositUsd) * usdRate);
  
  const grandTotalThb = agencyNetFee + govFeesThb + flightTicketThb + usFundsThb;
  
  return {
    agencyNetFee,
    govFeesThb,
    flightTicketThb,
    usFundsThb,
    grandTotalThb,
    totalDiscountThb: totalDiscount
  };
}
