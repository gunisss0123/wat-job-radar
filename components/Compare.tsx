'use client';

import { useMemo, useState, useDeferredValue } from 'react';
import type { Job } from '@/lib/types';

function formatArrivalDateTime(isoString?: string): string {
  if (!isoString) return 'เร็วๆ นี้';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'เร็วๆ นี้';
    const bangkokTime = new Date(d.getTime() + (7 * 60 + d.getTimezoneOffset()) * 60000);
    const day = bangkokTime.getDate();
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const month = months[bangkokTime.getMonth()];
    const hours = String(bangkokTime.getHours()).padStart(2, '0');
    const minutes = String(bangkokTime.getMinutes()).padStart(2, '0');
    return `${day} ${month} เวลา ${hours}:${minutes} น.`;
  } catch {
    return 'เร็วๆ นี้';
  }
}

function formatTimeAgo(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const now = Date.now();
    const diffMs = now - d.getTime();
    if (diffMs < 0) return 'เมื่อสักครู่';
    const diffMins = Math.floor(diffMs / (60 * 1000));
    if (diffMins < 60) return diffMins <= 1 ? 'เมื่อสักครู่' : `${diffMins} นาทีที่แล้ว`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} วันที่แล้ว`;
  } catch {
    return '';
  }
}

function isRecentJob(isoString?: string, withinHours: number = 48): boolean {
  if (!isoString) return false;
  try {
    const d = new Date(isoString);
    const diffHours = (Date.now() - d.getTime()) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= withinHours;
  } catch {
    return false;
  }
}


const defaultFallbacks = [
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
];

function getFallback(j: Job): string {
  if (j.state === 'Alaska' || j.state === 'AK' || (j.employer && j.employer.toLowerCase().includes('glacier'))) {
    return 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80';
  }
  let hash = 0;
  for (let i = 0; i < j.employer.length; i++) hash = (hash + j.employer.charCodeAt(i)) % defaultFallbacks.length;
  return defaultFallbacks[hash];
}

export default function Compare({ jobs }: { jobs: Job[] }) {
  // Location Filters
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');
  const [selectedAgency, setSelectedAgency] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const deferredSearch = useDeferredValue(searchQuery);

  // 4 Compare Slots (IDs)
  const initialTop = useMemo(() => {
    return [...jobs].sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0)).slice(0, 3).map((j) => j.id);
  }, [jobs]);

  const [slotIds, setSlotIds] = useState<(string | null)[]>([
    initialTop[0] || null,
    initialTop[1] || null,
    initialTop[2] || null,
    null,
  ]);

  // Extract all available states
  const statesWithCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const j of jobs) {
      if (j.state) counts[j.state] = (counts[j.state] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, [jobs]);

  // Extract cities in the selected state (or all cities if ALL)
  const citiesWithCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const j of jobs) {
      if (selectedState !== 'ALL' && j.state !== selectedState) continue;
      if (j.city) counts[j.city] = (counts[j.city] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, [jobs, selectedState]);

  // Extract all available agencies
  const agenciesWithCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const j of jobs) {
      if (j.agency) counts[j.agency] = (counts[j.agency] || 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, [jobs]);

  // When state changes, reset city to ALL
  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedCity('ALL');
  };

  // Filtered available jobs matching the location filters
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (selectedState !== 'ALL' && j.state !== selectedState) return false;
      if (selectedCity !== 'ALL' && j.city !== selectedCity) return false;
      if (selectedAgency !== 'ALL' && j.agency !== selectedAgency) return false;
      if (deferredSearch) {
        const hay = [j.employer, j.position, j.city, j.state, j.agency].join(' ').toLowerCase();
        if (!hay.includes(deferredSearch.toLowerCase())) return false;
      }
      return true;
    }).sort((a, b) => {
      // Newest arrival first
      const timeB = new Date(b.firstSeenAt || b.lastSeenAt || 0).getTime();
      const timeA = new Date(a.firstSeenAt || a.lastSeenAt || 0).getTime();
      if (timeB !== timeA) return timeB - timeA;
      return (b.fitScore || 0) - (a.fitScore || 0);
    });
  }, [jobs, selectedState, selectedCity, selectedAgency, deferredSearch]);

  // Resolved Job objects for the 4 slots
  const selectedJobs = useMemo(() => {
    return slotIds.map((id) => (id ? jobs.find((j) => j.id === id) || null : null));
  }, [slotIds, jobs]);

  const activeJobs = useMemo(() => selectedJobs.filter(Boolean) as Job[], [selectedJobs]);

  // Slot handlers
  const setSlotJob = (index: number, jobId: string | null) => {
    const updated = [...slotIds];
    updated[index] = jobId;
    setSlotIds(updated);
  };

  const addJobToNextAvailableSlot = (jobId: string) => {
    // Check if already in a slot
    if (slotIds.includes(jobId)) return;
    const nextEmptyIndex = slotIds.findIndex((id) => id === null);
    if (nextEmptyIndex !== -1) {
      setSlotJob(nextEmptyIndex, jobId);
    } else {
      // If full, replace slot 0
      setSlotJob(0, jobId);
    }
  };

  const resetFilters = () => {
    setSelectedState('ALL');
    setSelectedCity('ALL');
    setSelectedAgency('ALL');
    setSearchQuery('');
  };

  return (
    <main className="page">
      {/* Hero Section */}
      <section className="hero">
        <div>
          <span className="eyebrow-chip">⚖️ MULTI-AGENCY COMPARISON · SUMMER 2027</span>
          <h1>เปรียบเทียบงาน Work & Travel 2027</h1>
          <p>
            เลือกรัฐและเมืองที่คุณสนใจก่อน จากนั้นเลือกตำแหน่งงานมาวางเทียบกันแบบเคียงข้าง (Side-by-Side) สูงสุด 4 งาน
            ทั้งค่าจ้าง, ที่พัก, วันตรวจพบในเว็บ Agency, สวัสดิการ และ Fit Score ไลฟ์สไตล์
          </p>
        </div>
      </section>

      {/* Location Filter Control Panel */}
      <section className="compare-filter-panel">
        <div className="compare-filter-title">
          <span>📍</span>
          <span>ขั้นตอนที่ 1: เลือกรัฐและเมืองเพื่อค้นหางานที่ต้องการเปรียบเทียบ</span>
        </div>

        <div className="compare-filter-grid">
          {/* State Select */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-dim)' }}>
              1. เลือกรัฐ (State)
            </label>
            <select value={selectedState} onChange={(e) => handleStateChange(e.target.value)}>
              <option value="ALL">📍 ทุกรัฐ (All States) — {jobs.length.toLocaleString()} งาน</option>
              {statesWithCount.map(([st, count]) => (
                <option key={st} value={st}>
                  {st} ({count} งาน)
                </option>
              ))}
            </select>
          </div>

          {/* City Select */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-dim)' }}>
              2. เลือกเมือง (City)
            </label>
            <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}>
              <option value="ALL">
                {selectedState !== 'ALL' ? `🏙️ ทุกเมืองในรัฐ ${selectedState}` : '🏙️ ทุกเมือง (All Cities)'} ({citiesWithCount.reduce((acc, curr) => acc + curr[1], 0)} งาน)
              </option>
              {citiesWithCount.map(([ct, count]) => (
                <option key={ct} value={ct}>
                  {ct} ({count} งาน)
                </option>
              ))}
            </select>
          </div>

          {/* Agency Select */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-dim)' }}>
              3. เอเจนซี่ (Agency)
            </label>
            <select value={selectedAgency} onChange={(e) => setSelectedAgency(e.target.value)}>
              <option value="ALL">🏢 ทุก Agency ({agenciesWithCount.length} แห่ง)</option>
              {agenciesWithCount.map(([agencyName, count]) => (
                <option key={agencyName} value={agencyName}>
                  {agencyName} ({count.toLocaleString()} ตำแหน่ง)
                </option>
              ))}
            </select>
          </div>

          {/* Keyword Search */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-dim)' }}>
              4. ค้นหานายจ้าง / ตำแหน่ง
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="เช่น Kalahari, Cook, Denali..."
            />
          </div>
        </div>

        {(selectedState !== 'ALL' || selectedCity !== 'ALL' || selectedAgency !== 'ALL' || searchQuery) && (
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
            <span style={{ color: 'var(--sky-blue)', fontWeight: 600 }}>
              ✓ กรองพบ {filteredJobs.length.toLocaleString()} ตำแหน่งงาน
            </span>
            <button
              type="button"
              onClick={resetFilters}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0
              }}
            >
              ✕ ล้างตัวกรองพื้นที่
            </button>
          </div>
        )}
      </section>

      {/* 4 Compare Slots Header */}
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
          ช่องเปรียบเทียบงาน ({activeJobs.length}/4 ช่อง)
        </h2>
        {activeJobs.length > 0 && (
          <button
            type="button"
            className="slot-clear-btn"
            style={{ fontSize: 13, padding: '4px 10px', background: '#fee2e2' }}
            onClick={() => setSlotIds([null, null, null, null])}
          >
            ✕ ล้างทุกช่อง
          </button>
        )}
      </div>

      {/* 4 Slots Grid */}
      <section className="compare-slots-container">
        {[0, 1, 2, 3].map((slotIdx) => {
          const currentJob = selectedJobs[slotIdx];

          if (currentJob) {
            const agencyClass = currentJob.agency.toLowerCase().replace(/\s+/g, '');
            const fallbackImg = getFallback(currentJob);
            return (
              <div key={slotIdx} className="slot-card filled">
                <div className="slot-card-header">
                  <span>ช่องที่ {slotIdx + 1}</span>
                  <button
                    type="button"
                    className="slot-clear-btn"
                    onClick={() => setSlotJob(slotIdx, null)}
                    title="นำงานนี้ออกจากช่อง"
                  >
                    ✕ นำออก
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <img
                    src={currentJob.imageUrl || fallbackImg}
                    alt={currentJob.employer}
                    style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = fallbackImg;
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span className={`agency-badge ${agencyClass}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                        {currentJob.agency}
                      </span>
                      {isRecentJob(currentJob.firstSeenAt || currentJob.lastSeenAt, 48) && (
                        <span className="new-arrival-pill" style={{ fontSize: 9.5, padding: '1px 6px' }}>
                          🆕 ใหม่
                        </span>
                      )}
                    </div>
                    <h4
                      style={{
                        margin: '4px 0 2px',
                        fontSize: 13.5,
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      title={currentJob.employer}
                    >
                      {currentJob.employer}
                    </h4>
                    <div style={{ fontSize: 12, color: 'var(--sky-blue)', fontWeight: 600 }}>
                      {currentJob.position || 'General Position'}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>📍 {[currentJob.city, currentJob.state].filter(Boolean).join(', ')}</span>
                  <span style={{ fontWeight: 700, color: 'var(--orange)' }}>{currentJob.wageText || '—'}</span>
                </div>

                {/* Quick Switch Dropdown */}
                <select
                  value={currentJob.id}
                  onChange={(e) => setSlotJob(slotIdx, e.target.value || null)}
                  style={{ fontSize: 12, padding: '6px 8px', marginTop: 4 }}
                >
                  <option value={currentJob.id}>✓ {currentJob.employer} ({currentJob.position})</option>
                  {filteredJobs
                    .filter((j) => j.id !== currentJob.id)
                    .slice(0, 30)
                    .map((j) => (
                      <option key={j.id} value={j.id}>
                        เปลี่ยนเป็น: {j.employer} · {j.position} ({j.agency})
                      </option>
                    ))}
                </select>
              </div>
            );
          }

          return (
            <div key={slotIdx} className="slot-card empty">
              <div className="slot-card-header" style={{ width: '100%', marginBottom: 8 }}>
                <span>ช่องที่ {slotIdx + 1} (ว่าง)</span>
              </div>
              <div style={{ fontSize: 30, color: 'var(--text-light)', marginBottom: 8 }}>➕</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                เลือกจากคลังงานด้านล่าง หรือเลือกด่วน:
              </div>
              <select
                value=""
                onChange={(e) => setSlotJob(slotIdx, e.target.value || null)}
                style={{ width: '100%', fontSize: 12, padding: '8px 10px' }}
              >
                <option value="">
                  — เลือกงานใน {selectedCity !== 'ALL' ? selectedCity : selectedState !== 'ALL' ? selectedState : 'ทุกพื้นที่'} —
                </option>
                {filteredJobs.slice(0, 50).map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.employer} · {j.position} ({j.agency} - {j.wageText || '—'})
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </section>

      {/* Comparison Shelf: Matching jobs from selected State & City */}
      <section className="compare-shelf-wrap">
        <div className="compare-shelf-header">
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-main)' }}>
              คลังงานในพื้นที่ที่เลือก ({filteredJobs.length.toLocaleString()} งาน)
            </h3>
            <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>
              {selectedState !== 'ALL' ? `📍 รัฐ: ${selectedState}` : 'ทุกรัฐ'}
              {selectedCity !== 'ALL' ? ` · เมือง: ${selectedCity}` : ''}
              {selectedAgency !== 'ALL' ? ` · Agency: ${selectedAgency}` : ''}
              {' '}— คลิกปุ่ม "ใส่ช่อง..." เพื่อนำขึ้นตารางเปรียบเทียบทันที
            </span>
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
            ไม่พบงานที่ตรงกับรัฐ/เมืองที่เลือก ลองเลือกรัฐหรือเมืองอื่น
          </div>
        ) : (
          <div className="compare-shelf-grid">
            {filteredJobs.slice(0, 18).map((j) => {
              const agencyClass = j.agency.toLowerCase().replace(/\s+/g, '');
              const isAlreadyAdded = slotIds.includes(j.id);
              const fallbackImg = getFallback(j);

              return (
                <div key={j.id} className="shelf-item-card">
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <img
                      src={j.imageUrl || fallbackImg}
                      alt={j.employer}
                      style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = fallbackImg;
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                        <span className={`agency-badge ${agencyClass}`} style={{ fontSize: 9.5, padding: '2px 5px' }}>
                          {j.agency}
                        </span>
                        {isRecentJob(j.firstSeenAt || j.lastSeenAt, 48) && (
                          <span className="new-arrival-pill" style={{ fontSize: 8.5, padding: '1px 5px' }}>
                            🆕 ใหม่
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={j.employer}
                      >
                        {j.employer}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--sky-blue)', fontWeight: 600 }}>
                        {j.position || 'General Position'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span>📍 {[j.city, j.state].filter(Boolean).join(', ')}</span>
                    <span style={{ fontWeight: 700, color: 'var(--orange)' }}>{j.wageText || '—'}</span>
                  </div>

                  {/* Add action */}
                  <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    {isAlreadyAdded ? (
                      <span style={{ fontSize: 11, color: 'var(--emerald-dark)', fontWeight: 700, padding: '4px 0' }}>
                        ✓ ถูกใส่ในตารางแล้ว
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="preset-chip active"
                          style={{ fontSize: 11, padding: '4px 8px', flex: 1, justifyContent: 'center' }}
                          onClick={() => addJobToNextAvailableSlot(j.id)}
                        >
                          + ใส่ตารางเปรียบเทียบ
                        </button>
                        {[0, 1, 2, 3].map((sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            className="preset-chip"
                            style={{ fontSize: 10, padding: '4px 6px' }}
                            title={`ใส่ลงในช่องที่ ${sIdx + 1}`}
                            onClick={() => setSlotJob(sIdx, j.id)}
                          >
                            ช.{sIdx + 1}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Comparison Matrix Table */}
      {activeJobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>⚖️</div>
          <h3 style={{ color: 'var(--text-main)', margin: '0 0 6px' }}>ยังไม่มีตำแหน่งงานในช่องเปรียบเทียบ</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            กรุณาเลือกรัฐและเมืองด้านบน แล้วกดเลือกงานจากคลังงานเพื่อนำมาเปรียบเทียบกัน
          </p>
        </div>
      ) : (
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th style={{ minWidth: 180 }}>หัวข้อเปรียบเทียบ</th>
                {selectedJobs.map((j, i) =>
                  j ? (
                    <th key={j.id} style={{ minWidth: 220 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span className={`agency-badge ${j.agency.toLowerCase().replace(/\s+/g, '')}`}>
                          {j.agency}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>ช่องที่ {i + 1}</span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-main)' }}>{j.employer}</div>
                      <small style={{ color: 'var(--sky-blue)', fontSize: 13, fontWeight: 600 }}>{j.position}</small>
                    </th>
                  ) : (
                    <th key={`empty-${i}`} style={{ minWidth: 200, color: 'var(--text-light)', fontStyle: 'italic' }}>
                      ช่องที่ {i + 1} (ว่าง)
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {buildComparisonRows(activeJobs).map(([title, renderVals], rowIdx) => (
                <tr key={rowIdx}>
                  <td>{title}</td>
                  {selectedJobs.map((j, colIdx) =>
                    j ? (
                      <td key={j.id}>{renderVals(j)}</td>
                    ) : (
                      <td key={`empty-cell-${colIdx}`} style={{ color: 'var(--text-light)' }}>
                        —
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function buildComparisonRows(activeJobs: Job[]): [string, (j: Job) => React.ReactNode][] {
  // Find highest wage among active jobs
  const maxWage = Math.max(...activeJobs.map((j) => j.wageMin || 0));

  return [
    [
      '🏢 Agency ต้นทาง',
      (j) => (
        <span className={`agency-badge ${j.agency.toLowerCase().replace(/\s+/g, '')}`}>
          {j.agency}
        </span>
      ),
    ],
    [
      '📅 วันที่ตรวจพบในเว็บ Agency',
      (j) => (
        <div>
          <b style={{ color: 'var(--text-main)' }}>{formatArrivalDateTime(j.firstSeenAt || j.lastSeenAt)}</b>
          {isRecentJob(j.firstSeenAt || j.lastSeenAt, 48) && (
            <span className="new-arrival-pill" style={{ marginLeft: 6, fontSize: 10 }}>
              🆕 ใหม่
            </span>
          )}
          {formatTimeAgo(j.firstSeenAt || j.lastSeenAt) && (
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
              ({formatTimeAgo(j.firstSeenAt || j.lastSeenAt)})
            </div>
          )}
        </div>
      ),
    ],
    [
      '📍 รัฐและเมือง (Location)',
      (j) => <b>{[j.city, j.state].filter(Boolean).join(', ') || 'United States'}</b>,
    ],
    [
      '💵 ค่าตอบแทน (Wage)',
      (j) => {
        const isHighest = (j.wageMin || 0) === maxWage && maxWage > 0 && activeJobs.length > 1;
        return (
          <div>
            <b style={{ fontSize: 15, color: isHighest ? 'var(--emerald-dark)' : 'var(--orange)' }}>
              {j.wageText || (j.wageMin ? `$${j.wageMin}/hr` : '—')}
            </b>
            {isHighest && (
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 10.5,
                  padding: '2px 6px',
                  background: '#ecfdf5',
                  color: '#059669',
                  borderRadius: 4,
                  fontWeight: 700
                }}
              >
                ⭐ ค่าแรงสูงสุด
              </span>
            )}
          </div>
        );
      },
    ],
    [
      '🏠 ค่าที่พัก (Housing Weekly)',
      (j) => (
        <span>
          {j.housingWeekly ? <b>${j.housingWeekly}/สัปดาห์</b> : 'ตามที่นายจ้างกำหนด'}
        </span>
      ),
    ],
    [
      '🏘️ รายละเอียดที่พัก',
      (j) => (
        <span style={{ fontSize: 13, lineHeight: 1.4 }}>
          {j.housingText || 'มีที่พักจัดสรรให้โดยนายจ้างหรือประสานงานผ่าน Agency'}
        </span>
      ),
    ],
    [
      '🍱 แผนอาหาร (Meal Plan)',
      (j) => (
        <span>
          {j.mealsIncluded ? '🍱 รวมอาหาร/มี meal voucher' : j.mealsText || 'ซื้อเองหรือตามสะดวก'}
        </span>
      ),
    ],
    [
      '⏱️ ชั่วโมงทำงาน (Hours/Week)',
      (j) => <span>{j.hoursText || '32-40 ชม./สัปดาห์'}</span>,
    ],
    [
      '🔢 จำนวนที่ว่าง & สถานะ',
      (j) => (
        <div>
          <b style={{ color: j.status === 'OPEN' ? 'var(--emerald-dark)' : 'inherit' }}>
            {j.availabilityText || (j.availableSlots != null ? `${j.availableSlots} ตำแหน่ง` : 'ไม่ระบุตัวเลข')}
          </b>
          <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
            สถานะ: {j.status}
          </div>
        </div>
      ),
    ],
    [
      '🗣️ ระดับภาษาอังกฤษ',
      (j) => <span>{j.englishFit || 'ตามที่ Agency กำหนด'}</span>,
    ],
    [
      '👥 ความเข้ากันได้กลุ่ม 3 คน',
      (j) => {
        const isG3 = j.availableSlots == null || j.availableSlots >= 3;
        return isG3 ? (
          <span style={{ color: 'var(--emerald-dark)', fontWeight: 700 }}>
            ✨ เหมาะมาก (รับ ≥ 3 คน)
          </span>
        ) : (
          <span style={{ color: 'var(--text-dim)' }}>รับเดี่ยว/จำนวนจำกัด</span>
        );
      },
    ],
    [
      '📅 ช่วงวันทำงาน (Work Dates)',
      (j) => (
        <div style={{ fontSize: 12.5 }}>
          <div>เริ่ม: {j.startText || 'พ.ค. - มิ.ย. 2027'}</div>
          <div>จบ: {j.endText || 'ส.ค. - ก.ย. 2027'}</div>
        </div>
      ),
    ],
    [
      '🌲 Fit Score: ธรรมชาติ',
      (j) => <b>{j.natureFit != null ? `${j.natureFit}/10` : '—'}</b>,
    ],
    [
      '💼 Fit Score: โอกาส Job 2',
      (j) => <b>{j.secondJobFit != null ? `${j.secondJobFit}/10` : '—'}</b>,
    ],
    [
      '🏢 Fit Score: นายจ้าง',
      (j) => <b>{j.employerFit != null ? `${j.employerFit}/10` : '—'}</b>,
    ],
    [
      '🤝 Fit Score: สังคม',
      (j) => <b>{j.socialFit != null ? `${j.socialFit}/10` : '—'}</b>,
    ],
    [
      '⭐ คะแนนรวมไลฟ์สไตล์',
      (j) => (
        <b style={{ fontSize: 15, color: 'var(--sky-blue)' }}>
          {j.fitScore != null ? `${j.fitScore}/10` : '—'}
        </b>
      ),
    ],
    [
      '🔗 หน้าประกาศต้นทาง',
      (j) => (
        <a
          href={j.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="preset-chip active"
          style={{ fontSize: 11, padding: '4px 10px', textDecoration: 'none', display: 'inline-flex' }}
        >
          เปิดเว็บ {j.agency} ↗
        </a>
      ),
    ],
  ];
}
