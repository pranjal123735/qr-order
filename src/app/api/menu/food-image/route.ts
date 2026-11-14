import { NextRequest, NextResponse } from 'next/server';
import { getFoodPhotoForDish, getFoodPhotoOptions } from '@/lib/foodImageSearch';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || undefined;

  if (!q.trim()) {
    return NextResponse.json({ success: false, error: 'Query parameter q is required' }, { status: 400 });
  }

  const primaryPhoto = getFoodPhotoForDish(q, category);
  const options = getFoodPhotoOptions(q, category);

  return NextResponse.json({
    success: true,
    query: q,
    primaryPhoto,
    options,
  });
}
