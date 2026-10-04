/* eslint-disable @next/next/no-html-link-for-pages */
'use client';

import { useMemo, useState, useEffect } from 'react';
import type { Job, JobStatus } from '@/lib/types';

const statusLabels: Record<JobStatus, { label: string; class: string }> = {
  OPEN: { label: 'เปิดรับสมัคร', class: 'open' },
  LOW_SLOTS: { label: 'เหลือน้อย', class: 'low_slots' },
  LIMITED: { label: 'เหลือน้อย', class: 'limited' },
  PENDING: { label: 'รอเข้าเพิ่ม', class: 'pending' },
  COMING_SOON: { label: 'เร็วๆ นี้', class: 'coming_soon' },
  PRE_PLACEMENT: { label: 'Pre-Placement', class: 'limited' },
  CONFIRMED: { label: 'Confirmed', class: 'open' },
  FULL: { label: 'เต็มแล้ว', class: 'full' },
  CLOSED: { label: 'ปิดรับ', class: 'full' },
  UNKNOWN: { label: 'ไม่โชว์จำนวน', class: 'unknown' },
};

const categoryLabels: Record<string, string> = {
  KITCHEN_BOH: 'Kitchen / BOH',
  FOOD_BOH: 'Kitchen / BOH',
  FOOD_FOH: 'Food & Service (FOH)',
  HOUSEKEEPING: 'Housekeeping',
  ATTRACTION: 'Attraction & Rides',
  RETAIL: 'Retail & Cashier',
  OTHER: 'General Staff',
};

const defaultFallbacks = [
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
];

function getFallbackForJob(j: Job): string {
  if (j.state === 'Alaska' || j.state === 'AK' || (j.employer && j.employer.toLowerCase().includes('glacier'))) {
    return 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80';
  }
  if (j.category === 'KITCHEN_BOH' || j.category === 'FOOD_BOH') {
    return 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80';
  }
  if (j.category === 'ATTRACTION') {
    return 'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?auto=format&fit=crop&w=800&q=80';
  }
  let hash = 0;
  for (let i = 0; i < j.employer.length; i++) {
    hash = (hash + j.employer.charCodeAt(i)) % defaultFallbacks.length;
  }
  return defaultFallbacks[hash];
}

const PAGE_CHUNK = 48;

export default function Dashboard({ initialJobs }: { initialJobs: Job[] }) {
  const [q, setQ] = useState('');
  const [agency, setAgency] = useState('ALL');
  const [state, setState] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState<'fit' | 'wage' | 'slots' | 'newest'>('fit');
  const [displayLimit, setDisplayLimit] = useState(PAGE_CHUNK);

  // Quick Filter Chips
  const [chipGroup3, setChipGroup3] = useState(false);
  const [chipKitchen, setChipKitchen] = useState(false);
  const [chipHighWage, setChipHighWage] = useState(false);
  const [chipAlaska, setChipAlaska] = useState(false);
  const [chipOpenOnly, setChipOpenOnly] = useState(false);

  // Quick View Modal
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedJob(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset page chunk when search or filters change
  useEffect(() => {
    setDisplayLimit(PAGE_CHUNK);
  }, [q, agency, state, status, chipGroup3, chipKitchen, chipHighWage, chipAlaska, chipOpenOnly, sortBy]);

  // Agency Counts
  const agencyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const j of initialJobs) {
      counts[j.agency] = (counts[j.agency] || 0) + 1;
    }
    return counts;
  }, [initialJobs]);

  const agencies = useMemo(() => ['ALL', 'OEG', 'New Step', 'ALC', 'IEE', 'iHappy'], []);
  const states = useMemo(
    () => ['ALL', ...Array.from(new Set(initialJobs.map((j) => j.state).filter(Boolean) as string[])).sort()],
    [initialJobs]
  );

  const filteredJobs = useMemo(() => {
    return initialJobs.filter((j) => {
      const hay = [j.employer, j.position, j.city, j.state, j.agency, j.category].join(' ').toLowerCase();
      if (q && !hay.includes(q.toLowerCase())) return false;
      if (agency !== 'ALL' && j.agency !== agency) return false;
      if (state !== 'ALL' && j.state !== state) return false;
      if (status !== 'ALL' && j.status !== status) return false;

      // Chip filters
      if (chipGroup3 && (j.availableSlots != null ? j.availableSlots < 3 : false)) return false;
      if (chipKitchen && j.category !== 'KITCHEN_BOH' && j.category !== 'FOOD_BOH') return false;
      if (chipHighWage && (j.wageMin || 0) < 16) return false;
      if (chipAlaska && j.state !== 'Alaska' && j.state !== 'AK') return false;
      if (chipOpenOnly && j.status === 'FULL') return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'wage') return (b.wageMin || 0) - (a.wageMin || 0);
      if (sortBy === 'slots') return (b.availableSlots || 0) - (a.availableSlots || 0);
      if (sortBy === 'newest') return new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime();
      return (b.fitScore || 0) - (a.fitScore || 0);
    });
  }, [initialJobs, q, agency, state, status, chipGroup3, chipKitchen, chipHighWage, chipAlaska, chipOpenOnly, sortBy]);

  const displayedJobs = useMemo(() => filteredJobs.slice(0, displayLimit), [filteredJobs, displayLimit]);

  // Statistics
  const openCount = useMemo(() => initialJobs.filter((j) => j.status === 'OPEN' || j.status === 'LOW_SLOTS').length, [initialJobs]);
  const group3Count = useMemo(() => initialJobs.filter((j) => j.availableSlots == null || j.availableSlots >= 3).length, [initialJobs]);
  const totalAgencies = useMemo(() => new Set(initialJobs.map((j) => j.agency)).size, [initialJobs]);

  const resetFilters = () => {
    setQ('');
    setAgency('ALL');
    setState('ALL');
    setStatus('ALL');
    setChipGroup3(false);
    setChipKitchen(false);
    setChipHighWage(false);
    setChipAlaska(false);
    setChipOpenOnly(false);
  };

  const hasActiveFilters = q || agency !== 'ALL' || state !== 'ALL' || status !== 'ALL' || chipGroup3 || chipKitchen || chipHighWage || chipAlaska || chipOpenOnly;

  return (
    <main className="page">
      {/* Hero Section */}
      <section className="hero">
        <div>
          <span className="eyebrow-chip">⚡ MULTI-AGENCY RADAR · SUMMER 2027</span>
          <h1>เรดาร์รวมงาน Work & Travel 2027</h1>
          <p>
            รวมงานสาธารณะอัตโนมัติจาก 5 Agency ชั้นนำ (OEG, New Step, ALC, IEE, iHappy) รวม {initialJobs.length.toLocaleString()} ตำแหน่ง
            เปรียบเทียบค่าแรง ที่พัก จำนวนว่างจริง และภาพสถานที่ได้ในที่เดียว
          </p>
        </div>
        <div className="live-badge">
          <span className="pulse-dot" />
          Near Real-Time Active ({totalAgencies} Agencies)
        </div>
      </section>

      {/* KPI Metrics */}
      <section className="metrics">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f0f9ff', color: '#0284c7' }}>💼</div>
          <div className="stat-content">
            <b>{initialJobs.length.toLocaleString()}</b>
            <span>ตำแหน่งงานทั้งหมดในระบบ</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>🟢</div>
          <div className="stat-content">
            <b>{openCount.toLocaleString()}</b>
            <span>ตำแหน่งที่ยังเปิดรับสมัคร</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fff7ed', color: '#ea580c' }}>👥</div>
          <div className="stat-content">
            <b>{group3Count.toLocaleString()}</b>
            <span>ตำแหน่งที่รองรับกลุ่ม 3 คน</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>🏢</div>
          <div className="stat-content">
            <b>{totalAgencies} Agencies</b>
            <span>OEG, NewStep, ALC, IEE, iHappy</span>
          </div>
        </div>
      </section>

      {/* Filter Control Center */}
      <section className="filter-center">
        {/* Agency Quick Tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {agencies.map((a) => {
            const count = a === 'ALL' ? initialJobs.length : (agencyCounts[a] || 0);
            const isSelected = agency === a;
            return (
              <button
                key={a}
                type="button"
                className={`preset-chip ${isSelected ? 'active' : ''}`}
                style={{
                  fontSize: 13,
                  padding: '7px 14px',
                  fontWeight: isSelected ? 700 : 500
                }}
                onClick={() => setAgency(a)}
              >
                {a === 'ALL' ? '🏢 ทุก Agency' : a} ({count.toLocaleString()})
              </button>
            );
          })}
        </div>

        <div className="filter-row-primary">
          <div className="search-box-wrap">
            <span className="search-icon-left">🔍</span>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาตำแหน่ง, นายจ้าง, รัฐ, เมือง (เช่น Cook, Denali, Alaska, Gaylord, Foxwoods)..."
            />
            {q && (
              <button className="search-clear-btn" onClick={() => setQ('')} title="ล้างการค้นหา">
                ✕
              </button>
            )}
          </div>

          <select className="filter-select" value={state} onChange={(e) => setState(e.target.value)}>
            {states.map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? '📍 ทุกรัฐ (All States)' : `รัฐ: ${s}`}
              </option>
            ))}
          </select>

          <select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">📋 ทุกสถานะการรับ</option>
            {Object.entries(statusLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>

          <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
            <option value="fit">⭐ เรียงตาม Fit Score</option>
            <option value="wage">💵 เรียงตามค่าแรง สูง-ต่ำ</option>
            <option value="slots">🔢 เรียงตามที่ว่าง มาก-น้อย</option>
            <option value="newest">🕒 อัปเดตล่าสุด</option>
          </select>
        </div>

        {/* Quick Filter Preset Chips */}
        <div className="quick-chips-wrap">
          <span className="chip-label">Quick Filters:</span>
          <button
            type="button"
            className={`preset-chip ${chipGroup3 ? 'active emerald' : ''}`}
            onClick={() => setChipGroup3(!chipGroup3)}
          >
            👥 รองรับ 3 คน (Slots ≥ 3)
          </button>
          <button
            type="button"
            className={`preset-chip ${chipKitchen ? 'active' : ''}`}
            onClick={() => setChipKitchen(!chipKitchen)}
          >
            🍳 งานครัว & BOH
          </button>
          <button
            type="button"
            className={`preset-chip ${chipHighWage ? 'active' : ''}`}
            onClick={() => setChipHighWage(!chipHighWage)}
          >
            💰 ค่าแรงสูง ($16+/hr)
          </button>
          <button
            type="button"
            className={`preset-chip ${chipAlaska ? 'active' : ''}`}
            onClick={() => setChipAlaska(!chipAlaska)}
          >
            🌲 Alaska & Nature
          </button>
          <button
            type="button"
            className={`preset-chip ${chipOpenOnly ? 'active emerald' : ''}`}
            onClick={() => setChipOpenOnly(!chipOpenOnly)}
          >
            🟢 เปิดรับอยู่เท่านั้น
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              className="preset-chip"
              style={{ color: '#ef4444', borderColor: '#fca5a5' }}
              onClick={resetFilters}
            >
              ✕ ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      </section>

      {/* Result Bar */}
      <div className="result-bar">
        <div className="result-bar-title">
          <span>พบทั้งหมด</span>
          <span className="result-count-badge">{filteredJobs.length.toLocaleString()} ตำแหน่ง</span>
          {filteredJobs.length > displayLimit && (
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              (แสดง {displayedJobs.length} รายการแรก)
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>
          คลิกที่การ์ดเพื่อดูรายละเอียดสถานที่และค่าตอบแทนเต็ม
        </div>
      </div>

      {/* Promax Cards Grid */}
      <section className="job-grid">
        {displayedJobs.map((j) => (
          <JobCard key={j.id} job={j} onSelect={() => setSelectedJob(j)} />
        ))}
      </section>

      {/* Load More Button */}
      {filteredJobs.length > displayLimit && (
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button
            type="button"
            className="preset-chip active"
            style={{
              padding: '12px 28px',
              fontSize: 14,
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)'
            }}
            onClick={() => setDisplayLimit((prev) => prev + PAGE_CHUNK)}
          >
            + โหลดงานเพิ่มอีก {Math.min(PAGE_CHUNK, filteredJobs.length - displayLimit)} ตำแหน่ง (เหลืออีก {(filteredJobs.length - displayLimit).toLocaleString()} งาน)
          </button>
        </div>
      )}

      {filteredJobs.length === 0 && (
        <div className="empty" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔎</div>
          <h3 style={{ color: 'var(--text-main)' }}>ไม่พบงานที่ตรงกับตัวกรองที่เลือก</h3>
          <p>ลองปรับคำค้นหา หรือกดปุ่ม "ล้างตัวกรองทั้งหมด" เพื่อดูงานทั้งหมดในระบบ</p>
          <button
            type="button"
            className="preset-chip active"
            style={{ marginTop: 16 }}
            onClick={resetFilters}
          >
            แสดงงานทั้งหมด ({initialJobs.length.toLocaleString()})
          </button>
        </div>
      )}

      {/* Quick View Modal */}
      {selectedJob && <JobModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </main>
  );
}

function JobCard({ job, onSelect }: { job: Job; onSelect: () => void }) {
  const fallbackImg = useMemo(() => getFallbackForJob(job), [job]);
  const [imgSrc, setImgSrc] = useState(job.imageUrl || fallbackImg);

  const agencyClass = job.agency.toLowerCase().replace(/\s+/g, '');
  const statusInfo = statusLabels[job.status] || { label: job.status, class: 'unknown' };

  const isGroup3 = job.availableSlots == null || job.availableSlots >= 3;
  const locationDisplay = [job.city, job.state].filter(Boolean).join(', ') || 'USA';

  return (
    <article className="promax-card" onClick={onSelect}>
      {/* Media Cover Banner */}
      <div className="card-media-wrap">
        <img
          src={imgSrc}
          alt={job.employer}
          className="card-img"
          loading="lazy"
          onError={() => setImgSrc(fallbackImg)}
        />
        <div className="card-img-overlay" />

        <div className="card-top-tags">
          <span className={`agency-badge ${agencyClass}`}>{job.agency}</span>
          <span className={`status-pill ${statusInfo.class}`}>
            <span className="dot" />
            {statusInfo.label}
          </span>
        </div>

        <div className="card-location-floating">
          <span>📍</span>
          <span>{locationDisplay}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="card-content">
        <h2 className="card-employer-title" title={job.employer}>
          {job.employer}
        </h2>

        <div className="card-pos-wrap">
          <h3 className="card-pos-title" title={job.position || 'ตำแหน่งงาน'}>
            {job.position || 'General Position'}
          </h3>
          <span className="category-tag">
            {categoryLabels[job.category || 'OTHER'] || job.category || 'General'}
          </span>
        </div>

        {/* 2x2 Key Metrics Matrix */}
        <div className="metrics-matrix">
          <div className="metric-cell">
            <span className="metric-cell-label">💵 ค่าแรง</span>
            <span className="metric-cell-val val-highlight">{job.wageText || '—'}</span>
          </div>

          <div className="metric-cell">
            <span className="metric-cell-label">🏠 ที่พัก</span>
            <span className="metric-cell-val">
              {job.housingWeekly ? `$${job.housingWeekly}/wk` : job.housingText ? job.housingText.slice(0, 18) : 'มีจัดสรรให้'}
            </span>
          </div>

          <div className="metric-cell">
            <span className="metric-cell-label">🔢 จำนวนที่ว่าง</span>
            <span className={`metric-cell-val ${job.status === 'OPEN' ? 'val-green' : ''}`}>
              {job.availabilityText || (job.availableSlots != null ? `${job.availableSlots} คน` : 'เปิดรับ')}
            </span>
          </div>

          <div className="metric-cell">
            <span className="metric-cell-label">🗣️ ภาษาอังกฤษ</span>
            <span className="metric-cell-val">{job.englishFit || 'ตามที่กำหนด'}</span>
          </div>
        </div>

        {/* 3 Friends Compatibility Ribbon */}
        {isGroup3 && (
          <div className="group-compatible-badge">
            <span>✨</span>
            <span>เหมาะสำหรับกลุ่ม 3 คน (รับ ≥ 3 หรือเปิดกว้าง)</span>
          </div>
        )}

        {/* Card Footer Actions */}
        <div className="card-bottom-actions">
          <button
            type="button"
            className="btn-detail"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            🔍 ดูข้อมูลเต็ม
          </button>

          <a
            href={job.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-external-link"
            onClick={(e) => e.stopPropagation()}
          >
            ต้นทาง {job.agency} ↗
          </a>
        </div>
      </div>
    </article>
  );
}

function JobModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const fallbackImg = useMemo(() => getFallbackForJob(job), [job]);
  const [imgSrc, setImgSrc] = useState(job.imageUrl || fallbackImg);
  const statusInfo = statusLabels[job.status] || { label: job.status, class: 'unknown' };
  const agencyClass = job.agency.toLowerCase().replace(/\s+/g, '');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-banner">
          <img
            src={imgSrc}
            alt={job.employer}
            onError={() => setImgSrc(fallbackImg)}
          />
          <button className="modal-close-btn" onClick={onClose} title="ปิด (Esc)">
            ✕
          </button>
          <div className="card-img-overlay" />
          <div className="card-top-tags">
            <span className={`agency-badge ${agencyClass}`}>{job.agency}</span>
            <span className={`status-pill ${statusInfo.class}`}>
              <span className="dot" />
              {statusInfo.label}
            </span>
          </div>
          <div className="card-location-floating" style={{ fontSize: 14 }}>
            <span>📍</span>
            <span>{[job.city, job.state].filter(Boolean).join(', ') || 'United States'}</span>
          </div>
        </div>

        <div className="modal-body">
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', color: 'var(--text-main)' }}>
            {job.employer}
          </h2>
          <div style={{ color: 'var(--sky-blue)', fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
            {job.position || 'General Position'}
            <span style={{ color: 'var(--text-dim)', fontWeight: 400, marginLeft: 8 }}>
              · {job.season}
            </span>
          </div>

          <div className="modal-section-title">📊 ข้อมูลค่าตอบแทนและการทำงาน</div>
          <div className="modal-details-grid">
            <div className="metric-cell">
              <span className="metric-cell-label">💵 ค่าตอบแทน / Wage</span>
              <span className="metric-cell-val val-highlight" style={{ fontSize: 16 }}>
                {job.wageText || '—'}
              </span>
            </div>
            <div className="metric-cell">
              <span className="metric-cell-label">🔢 จำนวนที่ว่าง / Slots</span>
              <span className="metric-cell-val val-green" style={{ fontSize: 15 }}>
                {job.availabilityText || (job.availableSlots != null ? `${job.availableSlots} ตำแหน่ง` : 'ไม่ระบุตัวเลข')}
              </span>
            </div>
            <div className="metric-cell">
              <span className="metric-cell-label">⏱️ ชั่วโมงทำงาน / Hours</span>
              <span className="metric-cell-val">{job.hoursText || '32-40 ชม./สัปดาห์'}</span>
            </div>
            <div className="metric-cell">
              <span className="metric-cell-label">🗣️ ทักษะภาษาอังกฤษ</span>
              <span className="metric-cell-val">{job.englishFit || 'ตามที่ Agency กำหนด'}</span>
            </div>
          </div>

          <div className="modal-section-title">🏠 ที่พักและสวัสดิการ (Housing & Meals)</div>
          <div className="modal-details-grid">
            <div className="metric-cell">
              <span className="metric-cell-label">ค่าที่พักโดยประมาณ</span>
              <span className="metric-cell-val">
                {job.housingWeekly ? `$${job.housingWeekly}/สัปดาห์` : 'ตามประกาศนายจ้าง'}
              </span>
            </div>
            <div className="metric-cell">
              <span className="metric-cell-label">อาหาร (Meal Plan)</span>
              <span className="metric-cell-val">
                {job.mealsIncluded ? '🍱 มีอาหารจัดเตรียม/ส่วนลด' : 'ซื้อเองหรือตามสะดวก'}
              </span>
            </div>
            <div className="metric-cell" style={{ gridColumn: 'span 2' }}>
              <span className="metric-cell-label">รายละเอียดที่พัก</span>
              <span className="metric-cell-val" style={{ whiteSpace: 'normal', lineHeight: 1.5 }}>
                {job.housingText || 'มีที่พักจัดสรรให้โดยนายจ้างหรือประสานงานผ่าน Agency'}
              </span>
            </div>
          </div>

          <div className="modal-section-title">📅 ช่วงวันเริ่ม-จบงาน (Work Dates)</div>
          <div className="modal-details-grid">
            <div className="metric-cell">
              <span className="metric-cell-label">วันเริ่มงาน</span>
              <span className="metric-cell-val">{job.startText || 'พฤษภาคม - มิถุนายน 2027'}</span>
            </div>
            <div className="metric-cell">
              <span className="metric-cell-label">วันสิ้นสุดงาน</span>
              <span className="metric-cell-val">{job.endText || 'สิงหาคม - กันยายน 2027'}</span>
            </div>
          </div>

          {job.fitScore != null && (
            <>
              <div className="modal-section-title">⭐ Fit Score ประเมินไลฟ์สไตล์ ({job.fitScore}/10)</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
                <span className="preset-chip">🌲 ธรรมชาติ {job.natureFit ?? '—'}/10</span>
                <span className="preset-chip">💼 ทางเลือก Job 2 {job.secondJobFit ?? '—'}/10</span>
                <span className="preset-chip">🏢 คุณภาพนายจ้าง {job.employerFit ?? '—'}/10</span>
                <span className="preset-chip">🤝 บรรยากาศสังคม {job.socialFit ?? '—'}/10</span>
              </div>
            </>
          )}

          <div style={{ marginTop: 24 }}>
            <a
              href={job.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="modal-btn-cta"
            >
              เปิดดูหน้าประกาศต้นทางที่ {job.agency} ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
