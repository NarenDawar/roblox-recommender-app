import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache'; // Import revalidatePath

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const path = searchParams.get('path'); // Path to revalidate, e.g., '/' or '/games'

  // Validate secret token
  if (secret !== process.env.NEXT_REVALIDATE_SECRET_TOKEN) {
    return NextResponse.json({ message: 'Invalid secret token' }, { status: 401 });
  }

  // Validate path
  if (!path) {
    return NextResponse.json({ message: 'Missing path parameter' }, { status: 400 });
  }

  try {
    revalidatePath(path); // Revalidate the specified path
    return NextResponse.json({ revalidated: true, now: Date.now(), path });
  } catch (err) {
    return NextResponse.json({ message: 'Error revalidating', error: err.message }, { status: 500 });
  }
}