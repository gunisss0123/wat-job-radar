'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import {
  AGENCY_FEES_DATA, FEES_CHECKED_ON, GOVERNMENT_FEES, UNKNOWN_FEE_TEXT,
  calculateAgencyTotalBudget, type BudgetInputs, type FeeFact, type FeeEvidence,
} from '@/lib/feesData';

const card: CSSProperties = { background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 20 };
const grid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 16 };
const inputStyle: CSSProperties = { width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14 };
const money = (value: number | null) => value === null ? 'ยังคำนวณไม่ได้' : `฿${value.toLocaleString('th-TH')}`;

function Evidence({ evidence }: { evidence: FeeEvidence }) {
  return <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 8, lineHeight: 1.6 }}>
    <a href={evidence.url} target="_blank" rel="noopener noreferrer">↗ {evidence.title}</a>
    <div>{evidence.scope} · ตรวจ {evidence.checkedOn}</div>
  </div>;
}

function Fact({ value }: { value: FeeFact }) {
  return <div style={{ fontSize: 13, lineHeight: 1.65 }}>
    <div style={{ color: value.text === null ? 'var(--text-dim)' : 'var(--text-main)' }}>{value.text ?? UNKNOWN_FEE_TEXT}</div>
    {value.note && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{value.note}</div>}
    {value.source && <Evidence evidence={value.source} />}
  </div>;
}

function FactCard({ title, value }: { title: string; value: FeeFact }) {
  return <section style={card}><h3 style={{ margin: '0 0 10px', fontSize: 16 }}>{title}</h3><Fact value={value} /></section>;
}

function Label({ title, children }: { title: string; children: ReactNode }) {
  return <label style={{ display: 'block', fontSize: 13, fontWeight: 600 }}>
    <span style={{ display: 'block', marginBottom: 8 }}>{title}</span>{children}
  </label>;
}

function Inclusion({ title, value, onChange }: { title: string; value: boolean | null; onChange: (value: boolean | null) => void }) {
  return <Label title={title}><select style={inputStyle} value={value === null ? '' : String(value)} onChange={e => onChange(e.target.value === '' ? null : e.target.value === 'true')}>
    <option value="">ยังไม่ทราบ — ตรวจใบเสนอราคา</option>
    <option value="true">รวมในยอด Agency แล้ว</option>
    <option value="false">ยังไม่รวม ต้องจ่ายเพิ่ม</option>
  </select></Label>;
}

// Mounted with an agency key so amounts from one agency never carry to another.
function BudgetCalculator({ agencyName }: { agencyName: string }) {
  const [input, setInput] = useState<BudgetInputs>({
    agencyQuoteThb: null, usdRate: 36, flightTicketThb: null,
    pocketMoneyUsd: 850, housingDepositUsd: 350,
    visaIncluded: null, sevisIncluded: null, sevisChargeThb: null,
  });
  const update = <K extends keyof BudgetInputs>(key: K, value: BudgetInputs[K]) => setInput(previous => ({ ...previous, [key]: value }));
  const budget = calculateAgencyTotalBudget(input);
  const numberField = (key: 'agencyQuoteThb' | 'flightTicketThb' | 'sevisChargeThb', title: string) =>
    <Label title={title}><input type="number" min="0" step="1" style={inputStyle} value={input[key] ?? ''} placeholder="กรอกยอดจากใบเสนอราคา" onChange={e => update(key, e.target.value === '' ? null : Number(e.target.value))} /></Label>;

  return <section style={{ ...card, border: '2px solid var(--orange)', marginTop: 24 }}>
    <h3 style={{ margin: '0 0 8px', fontSize: 19 }}>🧮 คำนวณงบจากใบเสนอราคา {agencyName}</h3>
    <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
      กรอกยอดสุทธิหลังส่วนลด รวมค่าสมัคร จองงาน ทุกงวด ค่าการเลือกงาน และค่าบริการทั้งหมดตามใบเสนอราคา
      ระบุว่ารวมค่ารัฐบาลแล้วหรือยัง เพื่อป้องกันการนับซ้ำ งบนี้คือเงินเตรียมเดินทางและเงินสำรองช่วงแรก
      ยังไม่รวมค่าเที่ยวหรือค่าใช้จ่ายส่วนตัวตลอดการอยู่สหรัฐฯ
    </p>
    <div style={grid}>
      {numberField('agencyQuoteThb', 'ยอดสุทธิที่จ่าย Agency ทุกงวด (บาท)')}
      {numberField('flightTicketThb', 'งบตั๋วไปกลับ + ต่อเครื่องภายในประเทศ (บาท)')}
      <Label title="อัตรา USD/THB สำหรับประมาณการ"><input style={inputStyle} type="number" min="0.01" step="0.01" value={Number.isNaN(input.usdRate) ? '' : input.usdRate} onChange={e => update('usdRate', e.target.value === '' ? NaN : Number(e.target.value))} />
        <small style={{ fontWeight: 400 }}>ค่าเริ่มต้น 36 เป็นสมมติฐาน ไม่ใช่เรตสด; ค่าวีซ่าเงินบาทใช้เรตระบบชำระจริง</small>
      </Label>
      <Label title="เงินสำรองช่วงแรก (USD)"><input style={inputStyle} type="number" min="0" step="50" value={Number.isNaN(input.pocketMoneyUsd) ? '' : input.pocketMoneyUsd} onChange={e => update('pocketMoneyUsd', e.target.value === '' ? NaN : Number(e.target.value))} /></Label>
      <Label title="มัดจำที่พัก + ค่าเช่างวดแรกที่ต้องจ่าย (USD)"><input style={inputStyle} type="number" min="0" step="25" value={Number.isNaN(input.housingDepositUsd) ? '' : input.housingDepositUsd} onChange={e => update('housingDepositUsd', e.target.value === '' ? NaN : Number(e.target.value))} />
        <small style={{ fontWeight: 400 }}>850/350 USD เป็นสมมติฐานตั้งต้น ปรับตาม Job Offer; มัดจำอาจเป็น 0</small>
      </Label>
      <Inclusion title="ค่าวีซ่าอยู่ในยอด Agency หรือยัง?" value={input.visaIncluded} onChange={value => update('visaIncluded', value)} />
      <Inclusion title="SEVIS/ค่าบริการอยู่ในยอด Agency หรือยัง?" value={input.sevisIncluded} onChange={value => update('sevisIncluded', value)} />
      {input.sevisIncluded === false && numberField('sevisChargeThb', 'ยอด SEVIS + ค่าบริการที่ต้องจ่ายเพิ่ม (บาท)')}
    </div>
    <div style={{ background: '#fff7ed', border: '1px solid #fdba74', padding: 20, borderRadius: 12, marginTop: 20 }} aria-live="polite">
      <b>งบเตรียมเดินทางและเงินสำรองโดยประมาณ</b>
      <div style={{ fontSize: 30, fontWeight: 900, color: '#9a3412', margin: '8px 0' }}>{money(budget.grandTotalThb)}</div>
      {budget.missing.length > 0 ? <p style={{ fontSize: 13, margin: 0 }}>ข้อมูลที่ต้องระบุ: {budget.missing.join(' · ')}</p> :
        <p style={{ fontSize: 13, margin: 0 }}>Agency {money(input.agencyQuoteThb)} + วีซ่า/SEVIS ที่ยังไม่รวม {money(budget.govFeesThb)} + ตั๋ว {money(input.flightTicketThb)} + เงินสำรอง {money(budget.usFundsThb)}</p>}
    </div>
  </section>;
}

const comparisonRows: { key: 'application' | 'program' | 'extraJobFee' | 'installments' | 'sevisCharge' | 'flightPolicy' | 'insurance' | 'sponsors'; label: string }[] = [
  { key: 'application', label: 'ค่าสมัคร' }, { key: 'program', label: 'ค่าโครงการ (ดูขอบเขตปี/แพ็กเกจ)' },
  { key: 'extraJobFee', label: 'ค่าการเลือกงานเพิ่มเติม' }, { key: 'installments', label: 'งวดชำระ' },
  { key: 'sevisCharge', label: 'SEVIS/ค่าบริการที่ Agency ระบุ' }, { key: 'flightPolicy', label: 'ตั๋วเครื่องบิน' },
  { key: 'insurance', label: 'ประกัน' }, { key: 'sponsors', label: 'Sponsor ที่มีหลักฐาน' },
];

export default function FeeCalculator() {
  const [activeTab, setActiveTab] = useState<'detail' | 'matrix' | 'refund'>('detail');
  const [selectedAgencyId, setSelectedAgencyId] = useState('oeg');
  const currentAgency = AGENCY_FEES_DATA.find(agency => agency.id === selectedAgencyId)!;
  const tabs = [ ['detail', '🔍 เจาะลึกราย Agency & เครื่องคำนวณงบประมาณ'], ['matrix', '⚖️ ตารางเปรียบเทียบ 8 Agency'], ['refund', '🛡️ นโยบายคืนเงิน'] ] as const;

  return <div style={{ maxWidth: 1240, margin: '0 auto', paddingBottom: 60 }}>
    <section className="hero" style={{ marginBottom: 24 }}><div>
      <span className="eyebrow-chip">💰 AGENCY COST & SOURCE CHECK</span>
      <h1 style={{ fontSize: '2.1rem' }}>ระบบเปรียบเทียบค่าใช้จ่าย 8 Agency Work & Travel 2027</h1>
      <p>ตรวจราคา sponsor และเงื่อนไขจากแหล่งทางการ พร้อมขอบเขตปีและลิงก์อ้างอิงรายรายการ</p>
      <p style={{ fontSize: 13 }}>ตรวจล่าสุด {FEES_CHECKED_ON} (4 ตุลาคม 2569) · เป็นข้อมูล ณ วันที่ตรวจ ไม่ใช่ข้อมูลสด · ยังยืนยันไม่ได้ ≠ ไม่มีค่าใช้จ่าย</p>
    </div></section>

    <section style={{ ...card, background: '#f0f9ff', marginBottom: 24 }}>
      <h2 style={{ margin: '0 0 8px', fontSize: 17 }}>🇺🇸 ค่ารัฐบาลสหรัฐฯ แยกจากยอดที่ Agency เรียกเก็บ</h2>
      <div style={grid}>
        <div><b>SEVIS I-901 สำหรับ SWT: ${GOVERNMENT_FEES.sevis.usd}</b><Evidence evidence={GOVERNMENT_FEES.sevis.source} /></div>
        <div><b>ค่าคำร้องวีซ่า J-1 (MRV): ${GOVERNMENT_FEES.visa.usd}</b><Evidence evidence={GOVERNMENT_FEES.visa.source} /></div>
      </div>
      <p style={{ fontSize: 13, marginBottom: 0 }}>ยอดเงินบาทขึ้นกับเรตที่ใช้ชำระ และค่าบริการเพิ่มเติมต้องดูใบเสนอราคา; ค่ารัฐบาลข้างต้นไม่ใช่ค่า Sponsor แยกต่างหาก</p>
    </section>

    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
      {tabs.map(([id, label]) => <button key={id} type="button" className={`preset-chip ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)} style={{ fontSize: 13, padding: '8px 16px' }}>{label}</button>)}
    </div>

    {activeTab === 'detail' && <>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {AGENCY_FEES_DATA.map(agency => <button key={agency.id} type="button" aria-pressed={agency.id === selectedAgencyId} onClick={() => setSelectedAgencyId(agency.id)} style={{ ...card, padding: '9px 14px', cursor: 'pointer', border: agency.id === selectedAgencyId ? '2px solid var(--orange)' : '1px solid var(--border)' }}>
          <span className={`agency-badge ${agency.badgeClass}`}>{agency.name}</span>
        </button>)}
      </div>
      <section style={{ ...card, marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 8px', fontSize: 22 }}>{currentAgency.name}</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{currentAgency.auditNote}</p>
        <a href={currentAgency.officialUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13 }}>↗ เว็บไซต์ทางการ / ขอราคาและเงื่อนไขปัจจุบัน</a>
        <h3 style={{ fontSize: 15, margin: '16px 0 6px' }}>US sponsor ที่พบหลักฐาน</h3>
        <Fact value={currentAgency.sponsors} />
        <Evidence evidence={GOVERNMENT_FEES.sponsors} />
      </section>
      <div style={grid}>
        <FactCard title="📝 ค่าสมัคร" value={currentAgency.application} />
        <FactCard title="💰 ค่าโครงการ" value={currentAgency.program} />
        <FactCard title="📅 งวดชำระ" value={currentAgency.installments} />
        <FactCard title="📍 ค่าการเลือกงาน / Location" value={currentAgency.extraJobFee} />
        <FactCard title="🇺🇸 SEVIS / ค่าบริการที่เรียกเก็บ" value={currentAgency.sevisCharge} />
        <FactCard title="✈️ นโยบายตั๋วเครื่องบิน" value={currentAgency.flightPolicy} />
        <FactCard title="🏥 ประกันและระยะเวลาคุ้มครอง" value={currentAgency.insurance} />
        <section style={card}><h3 style={{ margin: '0 0 10px', fontSize: 16 }}>🎁 โปรโมชั่นและสิทธิพิเศษ</h3>
          {currentAgency.promotions.length ? currentAgency.promotions.map((value, index) => <div key={index} style={{ marginBottom: 14 }}><Fact value={value} /></div>) : <Fact value={{ text: null }} />}
        </section>
      </div>
      {currentAgency.historical && <details style={{ ...card, marginTop: 16 }}><summary style={{ cursor: 'pointer', fontWeight: 700 }}>เอกสารปีเก่า — ใช้อ้างอิงย้อนหลังเท่านั้น</summary><Fact value={currentAgency.historical} /></details>}
      <BudgetCalculator key={currentAgency.id} agencyName={currentAgency.name} />
    </>}

    {activeTab === 'matrix' && <div style={{ ...card, overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: 2100, borderCollapse: 'collapse' }}>
        <caption style={{ textAlign: 'left', paddingBottom: 16, fontSize: 13 }}>แต่ละรายการอาจมาจากคนละปีหรือแพ็กเกจ ดูขอบเขตใต้แหล่งอ้างอิงก่อนเปรียบเทียบ; ไม่จัดอันดับงบรวมเมื่อข้อมูลยังไม่ครบ</caption>
        <thead><tr><th style={{ padding: 12, textAlign: 'left' }}>รายการ</th>{AGENCY_FEES_DATA.map(agency => <th key={agency.id} style={{ padding: 12 }}><span className={`agency-badge ${agency.badgeClass}`}>{agency.name}</span></th>)}</tr></thead>
        <tbody>{comparisonRows.map(row => <tr key={row.key} style={{ borderTop: '1px solid var(--border)' }}>
          <th scope="row" style={{ textAlign: 'left', verticalAlign: 'top', padding: 12, minWidth: 170, fontSize: 13 }}>{row.label}</th>
          {AGENCY_FEES_DATA.map(agency => <td key={agency.id} style={{ padding: 12, verticalAlign: 'top', minWidth: 230 }}><Fact value={agency[row.key]} /></td>)}
        </tr>)}</tbody>
      </table>
    </div>}

    {activeTab === 'refund' && <section style={card}>
      <h2 style={{ margin: '0 0 8px', fontSize: 19 }}>🛡️ นโยบายคืนเงินและเงื่อนไขตามแพ็กเกจ</h2>
      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>คำว่า “คืนค่าโครงการ” ไม่ได้ยืนยันการคืนทุกรายการ ต้องตรวจค่าสมัคร ค่ารัฐบาล ค่าเอกสาร และข้อยกเว้นในสัญญาแยกกัน</p>
      {AGENCY_FEES_DATA.map(agency => <section key={agency.id} style={{ borderTop: '1px solid var(--border)', padding: '20px 0' }}>
        <h3><span className={`agency-badge ${agency.badgeClass}`}>{agency.name}</span></h3>
        <div style={grid}>
          <FactCard title="สัมภาษณ์งานไม่ผ่าน" value={agency.refundJobFail} />
          <FactCard title="วีซ่าไม่ผ่าน" value={agency.refundVisaFail} />
          <FactCard title="ยกเลิกเอง" value={agency.refundVoluntaryCancel} />
        </div>
        <a style={{ display: 'inline-block', fontSize: 12, marginTop: 12 }} href={agency.officialUrl} target="_blank" rel="noopener noreferrer">↗ ตรวจสัญญาและเงื่อนไขกับ {agency.name}</a>
      </section>)}
    </section>}
  </div>;
}
