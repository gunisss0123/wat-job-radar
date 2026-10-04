import {NextResponse} from 'next/server';import {getJobs} from '@/lib/db';export const dynamic='force-dynamic';export async function GET(){return NextResponse.json({jobs:await getJobs()})}
