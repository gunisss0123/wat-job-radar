import {getJobs} from '@/lib/db'; import Compare from '@/components/Compare'; export const dynamic='force-dynamic'; export default async function Page(){return <Compare jobs={await getJobs()}/>}
