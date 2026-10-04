import { getJobs } from '@/lib/db';
import Dashboard from '@/components/Dashboard';

export const revalidate = 60;

export default async function Page() {
  const jobs = await getJobs();
  return <Dashboard initialJobs={jobs} />;
}
