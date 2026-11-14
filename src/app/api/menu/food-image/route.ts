import { NextRequest, NextResponse } from 'next/server';
import { getFoodPhotoForDish, getFoodPhotoOptions, FoodPhotoResult } from '@/lib/foodImageSearch';

async function fetchWikiFoodImages(term: string): Promise<FoodPhotoResult[]> {
  try {
    const cleanTerm = term.replace(/[0-9()\-.,]/g, ' ').trim();
    if (!cleanTerm) return [];

    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&pithumbsize=800&generator=search&gsrsearch=${encodeURIComponent(cleanTerm)}&gsrlimit=4`;
    const res = await fetch(url, { 
      headers: { 'User-Agent': 'RestaurantQRMenuApp/1.0 (culinary photo finder)' },
      next: { revalidate: 3600 }
    });

    if (!res.ok) return [];
    const data = await res.json();
    const pages = data.query?.pages || {};
    
    return Object.values(pages)
      .filter((p: any) => {
        const src = p.thumbnail?.source;
        return src && !src.includes('Flag') && !src.includes('Map') && !src.includes('Icon') && !src.includes('svg');
      })
      .map((p: any) => ({
        url: p.thumbnail.source,
        thumbnail: p.thumbnail.source,
        title: `${p.title} (Wikipedia)`,
        source: 'web' as const,
      }));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || undefined;

  if (!q.trim()) {
    return NextResponse.json({ success: false, error: 'Query parameter q is required' }, { status: 400 });
  }

  const primaryPhoto = getFoodPhotoForDish(q, category);
  const curatedOptions = getFoodPhotoOptions(q, category);
  
  // Also fetch live web dish photos
  const webOptions = await fetchWikiFoodImages(q);

  // Combine and deduplicate
  const seenUrls = new Set<string>();
  const combinedOptions: FoodPhotoResult[] = [];

  for (const opt of [...webOptions, ...curatedOptions]) {
    if (!seenUrls.has(opt.url)) {
      seenUrls.add(opt.url);
      combinedOptions.push(opt);
    }
  }

  return NextResponse.json({
    success: true,
    query: q,
    primaryPhoto: webOptions[0]?.url || primaryPhoto,
    options: combinedOptions.slice(0, 9),
  });
}
