import { loadLocalStore } from '@/lib/engine';
import { getSourceRuns } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const store = loadLocalStore();
  const healthEntries = Object.values(store.sourceHealth);

  const agencyBadges: Record<string, string> = {
    OEG: 'oeg',
    'New Step': 'newstep',
    ALC: 'alc',
    IEE: 'iee',
    iHappy: 'ihappy',
  };

  return (
    <main className="page">
      <section className="hero">
        <div>
          <span className="eyebrow-chip">🛡️ AUDIT & HEALTH STATUS</span>
          <h1>สถานะแหล่งข้อมูลและการเชื่อมต่อ (Source Health)</h1>
          <p>
            ตรวจสอบความสมบูรณ์ในการดึงข้อมูล (Coverage) และสถานะการเข้าถึงหน้าเว็บของทั้ง 5 Agency
            ถ้า Agency ใดเปลี่ยนโครงสร้างหน้าเว็บ ระบบจะขึ้นเตือนทันที
          </p>
        </div>
      </section>

      <section className="sourcegrid">
        {healthEntries.map((h) => {
          const badgeClass = agencyBadges[h.agencyId] || 'oeg';
          return (
            <article key={h.agencyId}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`agency-badge ${badgeClass}`}>{h.agencyId}</span>
                <span className="health ok">
                  ✓ {h.lastStatus} ({h.lastCoveragePct}%)
                </span>
              </div>

              <h2>{h.agencyId}</h2>
              <b>{h.positionsCount.toLocaleString()} ตำแหน่งงาน</b>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                จาก {h.employersCount} นายจ้าง (เปิดรับ {h.activePositionsCount} ตำแหน่ง)
              </div>
              <small>
                ประเภท Connector: {h.connectorType} · ซิงก์ล่าสุด {h.lastSyncAt ? new Date(h.lastSyncAt).toLocaleString('th-TH') : 'วันนี้'}
              </small>

              {h.lastError && (
                <p style={{ color: 'var(--rose-dark)', fontSize: 12 }}>
                  ⚠ {h.lastError}
                </p>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}
