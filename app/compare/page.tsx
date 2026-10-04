import { getJobs } from '@/lib/db';
import Compare from '@/components/Compare';

export const revalidate = 60;

export default async function Page() {
  const jobs = await getJobs();
  return <Compare jobs={jobs} />;
}
