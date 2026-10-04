import {getJobs} from '@/lib/db'; import Dashboard from '@/components/Dashboard';
export const dynamic='force-dynamic';
export default async function Page(){const jobs=await getJobs();return <Dashboard initialJobs={jobs}/>}
