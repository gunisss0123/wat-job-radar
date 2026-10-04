'use client';

import { useState, useMemo } from 'react';
import { AGENCY_FEES_DATA, AgencyFeeDetail, calculateAgencyTotalBudget } from '@/lib/feesData';

export default function FeeCalculator() {
  const [activeTab, setActiveTab] = useState<'detail' | 'matrix' | 'refund'>('detail');
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('oeg');

  // Interactive Calculator State
  const [flightOption, setFlightOption] = useState<'budget' | 'standard' | 'direct'>('standard');
  const [pocketMoneyUsd, setPocketMoneyUsd] = useState<number>(850);
  const [housingDepositUsd, setHousingDepositUsd] = useState<number>(350);
  const [hasEarlyBird, setHasEarlyBird] = useState<boolean>(true);
  const [groupSize, setGroupSize] = useState<number>(1);
  const [isAlumni, setIsAlumni] = useState<boolean>(false);

  // Selected agency
  const currentAgency = useMemo(() => {
    return AGENCY_FEES_DATA.find((a) => a.id === selectedAgencyId) || AGENCY_FEES_DATA[0];
  }, [selectedAgencyId]);

  // Budget calculations
  const budget = useMemo(() => {
    return calculateAgencyTotalBudget(
      currentAgency,
      flightOption,
      pocketMoneyUsd,
      housingDepositUsd,
      hasEarlyBird,
      groupSize,
      isAlumni
    );
  }, [currentAgency, flightOption, pocketMoneyUsd, housingDepositUsd, hasEarlyBird, groupSize, isAlumni]);

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', paddingBottom: 60 }}>
      {/* Top Hero Section */}
      <section className="hero" style={{ marginBottom: 24 }}>
        <div>
          <span className="eyebrow-chip">💰 COMPREHENSIVE COST & FEE CALCULATOR</span>
          <h1 style={{ fontSize: '2.1rem' }}>ระบบเปรียบเทียบค่าใช้จ่าย 8 Agency Work & Travel 2027</h1>
          <p>
            รวมโครงสร้างค่าใช้จ่ายจริงครบถ้วนทุกรายการ: ค่าสมัคร, งวดชำระเงิน, SEVIS, ค่าวีซ่า, ตั๋วเครื่องบิน, เงินติดตัว,
            พร้อมนโยบายการคืนเงินเมื่อสัมภาษณ์ไม่ผ่าน และโปรโมชั่นส่วนลดล่าสุดของทั้ง 8 Agency
          </p>
        </div>
      </section>

      {/* Main Mode Navigation Tabs */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        <button
          type="button"
          className={`preset-chip ${activeTab === 'detail' ? 'active' : ''}`}
          style={{ fontSize: 13, padding: '8px 16px', fontWeight: 700 }}
          onClick={() => setActiveTab('detail')}
        >
          🔍 เจาะลึกราย Agency & เครื่องคำนวณงบประมาณ
        </button>
        <button
          type="button"
          className={`preset-chip ${activeTab === 'matrix' ? 'active' : ''}`}
          style={{ fontSize: 13, padding: '8px 16px', fontWeight: 700 }}
          onClick={() => setActiveTab('matrix')}
        >
          ⚖️ ตารางเปรียบเทียบ 8 Agency เคียงข้างกัน (Matrix)
        </button>
        <button
          type="button"
          className={`preset-chip ${activeTab === 'refund' ? 'active' : ''}`}
          style={{ fontSize: 13, padding: '8px 16px', fontWeight: 700 }}
          onClick={() => setActiveTab('refund')}
        >
          🛡️ นโยบายการคืนเงิน & คุ้มครองความเสี่ยง (Refund Policy)
        </button>
      </div>

      {/* TAB 1: DEEP-DIVE CALCULATOR */}
      {activeTab === 'detail' && (
        <div>
          {/* Agency Selector Buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {AGENCY_FEES_DATA.map((ag) => {
              const isSelected = ag.id === selectedAgencyId;
              return (
                <button
                  key={ag.id}
                  type="button"
                  onClick={() => setSelectedAgencyId(ag.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: isSelected ? '2px solid var(--orange)' : '1px solid var(--border)',
                    background: isSelected ? '#fff7ed' : '#ffffff',
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? 'var(--orange)' : 'var(--text-main)',
                    cursor: 'pointer',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: isSelected ? '0 2px 8px rgba(234, 88, 12, 0.2)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span className={`agency-badge ${ag.badgeClass}`} style={{ fontSize: 9.5, padding: '2px 6px' }}>
                    {ag.name}
                  </span>
                  <span>{ag.name}</span>
                </button>
              );
            })}
          </div>

          {/* Agency Banner Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              padding: 24,
              marginBottom: 24,
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span className={`agency-badge ${currentAgency.badgeClass}`} style={{ fontSize: 13, padding: '4px 12px' }}>
                    {currentAgency.name}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                    ก่อตั้งปี ค.ศ. {currentAgency.establishedYear} (ประสบการณ์ {2027 - currentAgency.establishedYear} ปี)
                  </span>
                </div>
                <h2 style={{ fontSize: 20, margin: '4px 0 6px', fontWeight: 800 }}>{currentAgency.legalName}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: 0 }}>
                  💡 {currentAgency.highlight}
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 4 }}>
                  พันธมิตร US SPONSORS
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {currentAgency.usSponsors.map((sp) => (
                    <span key={sp} className="preset-chip" style={{ fontSize: 11, padding: '2px 8px' }}>
                      {sp}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 4-Stage Payment Breakdown */}
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 14px' }}>
            📅 งวดการชำระเงินตามลำดับขั้นตอน (Payment Stages)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>
            {/* Stage 1 */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: 18,
                borderTop: '4px solid #0284c7'
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>
                ระยะที่ 1 · วันสมัครแรกเข้า
              </div>
              <h4 style={{ margin: '6px 0 10px', fontSize: 16, fontWeight: 800 }}>ค่าสมัคร & วัดระดับภาษา</h4>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-main)', marginBottom: 6 }}>
                ฿{currentAgency.applicationFee.toLocaleString()}
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.4, margin: '0 0 10px' }}>
                {currentAgency.applicationFeeNote}
              </p>
              {currentAgency.jobReservationFee && (
                <div style={{ background: '#f0f9ff', padding: '8px 10px', borderRadius: 6, fontSize: 12 }}>
                  <b style={{ color: '#0369a1' }}>+ ค่าจองงาน: ฿{currentAgency.jobReservationFee.toLocaleString()}</b>
                  <div style={{ color: 'var(--text-dim)', marginTop: 2 }}>{currentAgency.jobReservationNote}</div>
                </div>
              )}
            </div>

            {/* Stage 2 */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: 18,
                borderTop: '4px solid #ea580c'
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: '#ea580c', textTransform: 'uppercase' }}>
                ระยะที่ 2 · ก่อนสัมภาษณ์งาน
              </div>
              <h4 style={{ margin: '6px 0 10px', fontSize: 16, fontWeight: 800 }}>ค่าโครงการ งวดที่ 1</h4>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--orange)', marginBottom: 6 }}>
                ฿{currentAgency.installment1.toLocaleString()}
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.4, margin: '0 0 10px' }}>
                {currentAgency.installment1Due}
              </p>
              <div style={{ background: '#fff7ed', padding: '8px 10px', borderRadius: 6, fontSize: 12, color: '#c2410c' }}>
                ✓ ล็อคตำแหน่งงานและนัดหมายวันสัมภาษณ์กับนายจ้างชาวอเมริกัน
              </div>
            </div>

            {/* Stage 3 */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: 18,
                borderTop: '4px solid #059669'
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>
                ระยะที่ 3 · หลังผ่านงาน & ยื่นวีซ่า
              </div>
              <h4 style={{ margin: '6px 0 10px', fontSize: 16, fontWeight: 800 }}>ค่าโครงการ งวดที่ 2 {currentAgency.installment3 ? '& 3' : ''}</h4>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--emerald-dark)', marginBottom: 6 }}>
                ฿{currentAgency.installment2.toLocaleString()}
                {currentAgency.installment3 && (
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>
                    {' '}+ ฿{currentAgency.installment3.toLocaleString()} (งวด 3)
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.4, margin: '0 0 10px' }}>
                {currentAgency.installment2Due}
              </p>
              <div style={{ background: '#ecfdf5', padding: '8px 10px', borderRadius: 6, fontSize: 12, color: '#047857' }}>
                ✓ สปอนเซอร์สหรัฐฯ ออกเอกสารสิทธิ์ DS-2019 เพื่อนำไปขอนัดสัมภาษณ์วีซ่า J-1
              </div>
            </div>

            {/* Stage 4 */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: 18,
                borderTop: '4px solid #7c3aed'
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase' }}>
                ระยะที่ 4 · ก่อนบิน & เมื่อถึงอเมริกา
              </div>
              <h4 style={{ margin: '6px 0 10px', fontSize: 16, fontWeight: 800 }}>ตั๋วบิน, วีซ่า & เงินติดตัว</h4>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#7c3aed', marginBottom: 6 }}>
                ฿{(currentAgency.visaFeeThbApprox + (currentAgency.sevisIncludedInFee ? 0 : currentAgency.sevisFeeThbApprox) + 48000 + 43200).toLocaleString()}*
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.4, margin: '0 0 10px' }}>
                *ประมาณการ: ค่าวีซ่า J-1 (฿6,660) + ตั๋วเครื่องบิน (฿48k) + Pocket Money & มัดจำบ้าน (฿43k)
              </p>
              <div style={{ background: '#f5f3ff', padding: '8px 10px', borderRadius: 6, fontSize: 12, color: '#6d28d9' }}>
                ✓ นโยบายตั๋วบิน: {currentAgency.flightPolicyText}
              </div>
            </div>
          </div>

          {/* Interactive Personal Budget Simulator Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '2px solid var(--orange)',
              padding: 24,
              marginBottom: 32,
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>🧮</span>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
                  เครื่องคำนวณงบประมาณรวมส่วนบุคคล (Personal Budget Simulator)
                </h3>
                <span style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>
                  ปรับแต่งตัวเลือกเพื่อดูยอดเงินทั้งหมดที่ต้องเตรียมจริงสำหรับ {currentAgency.name}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 20 }}>
              {/* Flight Tier */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-dim)' }}>
                  ✈️ รูปแบบตั๋วเครื่องบินไป-กลับ
                </label>
                <select
                  value={flightOption}
                  onChange={(e) => setFlightOption(e.target.value as any)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}
                >
                  <option value="budget">ประหยัด (ต่อเครื่อง 1-2 จุด) ≈ ฿{currentAgency.estimatedFlightThbMin.toLocaleString()}</option>
                  <option value="standard">มาตรฐาน (สายการบินชั้นนำ) ≈ ฿{Math.round((currentAgency.estimatedFlightThbMin + currentAgency.estimatedFlightThbMax) / 2).toLocaleString()}</option>
                  <option value="direct">บินตรง / ยืดหยุ่นวันเดินทาง ≈ ฿{currentAgency.estimatedFlightThbMax.toLocaleString()}</option>
                </select>
              </div>

              {/* Pocket Money Slider */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-dim)' }}>
                  💵 เงินติดตัวไปอเมริกา (Pocket Money): ${pocketMoneyUsd} (≈ ฿{(pocketMoneyUsd * 36).toLocaleString()})
                </label>
                <input
                  type="range"
                  min="600"
                  max="1500"
                  step="50"
                  value={pocketMoneyUsd}
                  onChange={(e) => setPocketMoneyUsd(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-dim)' }}>
                  <span>$600 (ประหยัด)</span>
                  <span>$1,000 (แนะนำ)</span>
                  <span>$1,500 (เผื่อเที่ยว)</span>
                </div>
              </div>

              {/* Housing Deposit Slider */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-dim)' }}>
                  🏠 มัดจำที่พัก & ค่าเช่างวดแรก: ${housingDepositUsd} (≈ ฿{(housingDepositUsd * 36).toLocaleString()})
                </label>
                <input
                  type="range"
                  min="200"
                  max="600"
                  step="25"
                  value={housingDepositUsd}
                  onChange={(e) => setHousingDepositUsd(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-dim)' }}>
                  <span>$200</span>
                  <span>$350 (เฉลี่ย)</span>
                  <span>$600</span>
                </div>
              </div>

              {/* Discounts & Perks */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-dim)' }}>
                  🎁 โปรโมชั่น & ส่วนลดที่ได้รับ
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={hasEarlyBird}
                      onChange={(e) => setHasEarlyBird(e.target.checked)}
                    />
                    <span>ส่วนลด Early Bird (ประหยัด ฿{currentAgency.earlyBirdDiscount.toLocaleString()})</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={isAlumni}
                      onChange={(e) => setIsAlumni(e.target.checked)}
                    />
                    <span>ศิษย์เก่าโครงการ (Alumni ลด ฿{currentAgency.alumniDiscount.toLocaleString()})</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Friends Group Size Selector */}
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  👥 สมัครพร้อมเพื่อน (Group Discount):
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 5].map((count) => {
                    const isSelected = groupSize === count;
                    let label = `${count} คน`;
                    if (count === 1) label = 'ไปคนเดียว';
                    if (count === 5) label = '5+ คน (แก๊งใหญ่)';
                    return (
                      <button
                        key={count}
                        type="button"
                        className={`preset-chip ${isSelected ? 'active' : ''}`}
                        style={{ fontSize: 11.5, padding: '4px 10px' }}
                        onClick={() => setGroupSize(count)}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {budget.totalDiscountThb > 0 && (
                <div style={{ color: 'var(--emerald-dark)', fontSize: 12, fontWeight: 700, marginTop: 6 }}>
                  ✓ รวมส่วนลดที่ได้รับทั้งหมด: -฿{budget.totalDiscountThb.toLocaleString()}
                </div>
              )}
            </div>

            {/* Calculated Grand Total Box */}
            <div
              style={{
                background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                border: '1px solid #fdba74',
                borderRadius: 12,
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16
              }}
            >
              <div>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#c2410c', textTransform: 'uppercase' }}>
                  งบประมาณรวมสุทธิตลอดโครงการ ({currentAgency.name})
                </span>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#9a3412', lineHeight: 1.1, marginTop: 4 }}>
                  ฿{budget.grandTotalThb.toLocaleString()}
                </div>
                <div style={{ fontSize: 12.5, color: '#7c2d12', marginTop: 4 }}>
                  (รวมค่าโครงการสุทธิ ฿{budget.agencyNetFee.toLocaleString()} + ค่ารัฐบาล ฿{budget.govFeesThb.toLocaleString()} + ตั๋วบิน ฿{budget.flightTicketThb.toLocaleString()} + เงินสำรองในสหรัฐฯ ฿{budget.usFundsThb.toLocaleString()})
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#7c2d12' }}>
                  ประเมินเป็นเงินดอลลาร์ (อัตรา $1 = ฿36.0):
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#9a3412' }}>
                  ${Math.round(budget.grandTotalThb / 36).toLocaleString()} USD
                </div>
              </div>
            </div>
          </div>

          {/* Highlights & Specific Perks */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {/* Perks card */}
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: 20 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800 }}>✨ สิทธิพิเศษและจุดเด่นของ {currentAgency.name}</h4>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13.5, lineHeight: 1.7, color: 'var(--text-main)' }}>
                {currentAgency.specialPerks.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
                <li>ประกันสุขภาพคุ้มครอง: {currentAgency.insuranceDetails}</li>
              </ul>
            </div>

            {/* Refund snapshot card */}
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', padding: 20 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800 }}>🛡️ สรุปนโยบายคืนเงินของ {currentAgency.name}</h4>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text-muted)' }}>
                <p style={{ margin: '0 0 8px' }}>
                  <b>• สัมภาษณ์งานไม่ผ่าน:</b> {currentAgency.refundJobFail}
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  <b>• วีซ่า J-1 ไม่ผ่าน:</b> {currentAgency.refundVisaFail}
                </p>
                <p style={{ margin: 0 }}>
                  <b>• ยกเลิกเอง:</b> {currentAgency.refundVoluntaryCancel}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SIDE-BY-SIDE MATRIX TABLE */}
      {activeTab === 'matrix' && (
        <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 20, overflowX: 'auto' }}>
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800 }}>
              ⚖️ ตารางเปรียบเทียบค่าใช้จ่าย 8 Agency ครบทุกมิติ (Side-by-Side Matrix)
            </h3>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              เปรียบเทียบค่าสมัคร, ค่าโครงการ, ค่าวีซ่า, นโยบายตั๋วเครื่องบิน และโปรโมชั่น เพื่อเลือกที่ที่คุ้มค่าที่สุด
            </span>
          </div>

          <table className="compare-table" style={{ width: '100%', minWidth: 980 }}>
            <thead>
              <tr>
                <th style={{ minWidth: 170, textAlign: 'left' }}>หัวข้อเปรียบเทียบ</th>
                {AGENCY_FEES_DATA.map((ag) => (
                  <th key={ag.id} style={{ minWidth: 140, textAlign: 'center' }}>
                    <span className={`agency-badge ${ag.badgeClass}`} style={{ fontSize: 10, padding: '3px 8px' }}>
                      {ag.name}
                    </span>
                    <div style={{ fontSize: 12, fontWeight: 800, marginTop: 4 }}>{ag.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700 }}>💵 ค่าสมัครแรกเข้า</td>
                {AGENCY_FEES_DATA.map((ag) => (
                  <td key={ag.id} style={{ textAlign: 'center', fontWeight: 600 }}>
                    ฿{ag.applicationFee.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>📌 ค่าโครงการ งวดที่ 1</td>
                {AGENCY_FEES_DATA.map((ag) => (
                  <td key={ag.id} style={{ textAlign: 'center', fontWeight: 600, color: 'var(--orange)' }}>
                    ฿{ag.installment1.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>📌 ค่าโครงการ งวดที่ 2 {`(& 3)`}</td>
                {AGENCY_FEES_DATA.map((ag) => (
                  <td key={ag.id} style={{ textAlign: 'center', fontWeight: 600, color: 'var(--emerald-dark)' }}>
                    ฿{ag.installment2.toLocaleString()}
                    {ag.installment3 ? ` + ฿${ag.installment3.toLocaleString()}` : ''}
                  </td>
                ))}
              </tr>
              <tr style={{ background: '#f8fafc' }}>
                <td style={{ fontWeight: 800, color: 'var(--text-main)' }}>💰 รวมยอดจ่ายให้ Agency</td>
                {AGENCY_FEES_DATA.map((ag) => (
                  <td key={ag.id} style={{ textAlign: 'center', fontWeight: 900, color: 'var(--orange)', fontSize: 14 }}>
                    ฿{ag.totalAgencyFeeMin.toLocaleString()} - {ag.totalAgencyFeeMax.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>🇺🇸 ค่า SEVIS Fee ($35)</td>
                {AGENCY_FEES_DATA.map((ag) => (
                  <td key={ag.id} style={{ textAlign: 'center', fontSize: 12 }}>
                    {ag.sevisIncludedInFee ? (
                      <span style={{ color: 'var(--emerald-dark)', fontWeight: 700 }}>✓ รวมในแพ็กเกจ</span>
                    ) : (
                      `฿${ag.sevisFeeThbApprox.toLocaleString()}`
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>🛂 ค่าวีซ่า J-1 ($185)</td>
                {AGENCY_FEES_DATA.map((ag) => (
                  <td key={ag.id} style={{ textAlign: 'center', fontSize: 12 }}>
                    {ag.sevisIncludedInFee && ag.id === 'iee' ? (
                      <span style={{ color: 'var(--emerald-dark)', fontWeight: 700 }}>✓ รวมใน All-In</span>
                    ) : (
                      '≈ ฿6,660'
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>✈️ นโยบายตั๋วเครื่องบิน</td>
                {AGENCY_FEES_DATA.map((ag) => (
                  <td key={ag.id} style={{ textAlign: 'center', fontSize: 11.5 }}>
                    {ag.flightPolicy === 'SELF_BOOK_ALLOWED' ? (
                      <span style={{ color: 'var(--emerald-dark)', fontWeight: 700 }}>✓ จองเองได้ 100%</span>
                    ) : (
                      <span>ยืดหยุ่น / เลือกได้</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>🏥 ประกันสุขภาพในสหรัฐฯ</td>
                {AGENCY_FEES_DATA.map((ag) => (
                  <td key={ag.id} style={{ textAlign: 'center', color: 'var(--emerald-dark)', fontWeight: 700 }}>
                    ✓ รวมตลอดโครงการ
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>🛡️ คุ้มครองวีซ่าไม่ผ่าน</td>
                {AGENCY_FEES_DATA.map((ag) => (
                  <td key={ag.id} style={{ textAlign: 'center', fontSize: 11 }}>
                    {ag.visaProtectionPackageAvailable ? (
                      <span style={{ background: '#ecfdf5', color: '#047857', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                        การันตีคืน 100%
                      </span>
                    ) : (
                      'คืนหักค่าจริง'
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>🎁 ส่วนลด Early Bird</td>
                {AGENCY_FEES_DATA.map((ag) => (
                  <td key={ag.id} style={{ textAlign: 'center', fontWeight: 700, color: 'var(--orange)' }}>
                    -฿{ag.earlyBirdDiscount.toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>👥 ส่วนลดกลุ่ม 3 คน</td>
                {AGENCY_FEES_DATA.map((ag) => (
                  <td key={ag.id} style={{ textAlign: 'center', fontWeight: 600 }}>
                    -฿{ag.groupDiscount3.toLocaleString()}/คน
                  </td>
                ))}
              </tr>
              <tr style={{ background: '#fff7ed' }}>
                <td style={{ fontWeight: 800, color: '#9a3412' }}>🎯 งบประมาณรวมสุทธิโดยประมาณ</td>
                {AGENCY_FEES_DATA.map((ag) => {
                  const b = calculateAgencyTotalBudget(ag, 'standard', 850, 350, true, 1, false);
                  return (
                    <td key={ag.id} style={{ textAlign: 'center', fontWeight: 900, color: '#9a3412', fontSize: 14 }}>
                      ฿{b.grandTotalThb.toLocaleString()}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: REFUND POLICY MATRIX */}
      {activeTab === 'refund' && (
        <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800 }}>
              🛡️ เจาะลึกนโยบายการคืนเงินและคุ้มครองความเสี่ยง (Refund Policies & Protection)
            </h3>
            <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-muted)' }}>
              ข้อควรรู้ก่อนจ่ายเงิน: กรณีสัมภาษณ์งานไม่ผ่าน, วีซ่าสถานทูตปฏิเสธ, หรือต้องการขอยกเลิกเอง แต่ละ Agency มีเงื่อนไขการคืนเงินอย่างไร
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {AGENCY_FEES_DATA.map((ag) => (
              <div
                key={ag.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: 18,
                  background: '#fafafa'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`agency-badge ${ag.badgeClass}`} style={{ fontSize: 11, padding: '3px 8px' }}>
                      {ag.name}
                    </span>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{ag.legalName}</h4>
                  </div>
                  {ag.visaProtectionPackageAvailable && (
                    <span className="preset-chip active" style={{ fontSize: 11.5, background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}>
                      ✓ มีแคมเปญคุ้มครองวีซ่าไม่ผ่าน 100%
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, fontSize: 13 }}>
                  <div style={{ background: '#ffffff', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <b style={{ color: '#0284c7', display: 'block', marginBottom: 4 }}>1. กรณีสัมภาษณ์งานไม่ผ่าน</b>
                    <span>{ag.refundJobFail}</span>
                  </div>

                  <div style={{ background: '#ffffff', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <b style={{ color: '#ea580c', display: 'block', marginBottom: 4 }}>2. กรณีสัมภาษณ์วีซ่าไม่ผ่าน (Visa Denied)</b>
                    <span>{ag.refundVisaFail}</span>
                  </div>

                  <div style={{ background: '#ffffff', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <b style={{ color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>3. กรณียกเลิกโครงการเอง</b>
                    <span>{ag.refundVoluntaryCancel}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
