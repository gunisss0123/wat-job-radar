import {NextResponse} from 'next/server';import {getEvents} from '@/lib/db';export const dynamic='force-dynamic';export async function GET(){return NextResponse.json({events:await getEvents(200)})}
