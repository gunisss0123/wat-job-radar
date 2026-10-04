import { getJobs } from '@/lib/db';
import GroupPlanner from '@/components/GroupPlanner';

export const revalidate = 60;

export default async function Page() {
  return <GroupPlanner jobs={await getJobs()} />;
}
