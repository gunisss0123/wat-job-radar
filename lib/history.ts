import type { JobSnapshot, JobEvent } from './types';

// Legacy snapshots lack an event type. Compare actual snapshots; never invent a previous 0.
export function snapshotEvents(snapshots: JobSnapshot[]): (JobSnapshot & Pick<JobEvent, 'eventType' | 'beforeValue' | 'afterValue'>)[] {
  const previous = new Map<string, JobSnapshot>();
  const events: ReturnType<typeof snapshotEvents> = [];
  for (const current of snapshots) {
    const old = previous.get(current.positionId);
    if (current.baseline) { previous.set(current.positionId, current); continue; }
    if (current.eventType) events.push({ ...current, eventType: current.eventType });
    else if (!old) events.push({ ...current, eventType: 'NEW_JOB', afterValue: 'ตรวจพบครั้งแรก' });
    else {
      for (const [field, type] of [['status', 'STATUS_CHANGE'], ['availableSlots', 'SLOT_CHANGE'], ['wageHourly', 'WAGE_CHANGE']] as const) {
        if (old[field] !== current[field]) events.push({ ...current, eventType: type, beforeValue: String(old[field] ?? 'ไม่ระบุ'), afterValue: String(current[field] ?? 'ไม่ระบุ') });
      }
    }
    previous.set(current.positionId, current);
  }
  return events;
}
