// // app/api/translate/route.js
// import { NextResponse } from 'next/server';

// // Simple in-memory cache (works for dev; use Redis for production)
// const CACHE = new Map();

// export async function POST(req) {
//   try {
//     const { q, target, source } = await req.json();
//     if (!q || !target) {
//       return NextResponse.json({ error: 'Missing q or target' }, { status: 400 });
//     }

//     const key = JSON.stringify({ q, target, source });
//     if (CACHE.has(key)) {
//       return NextResponse.json({ translatedText: CACHE.get(key) });
//     }

//     // configure your backend libretranslate URL via env (default public instance)
//     const LIBRE_URL = process.env.LIBRETRANSLATE_URL || 'https://libretranslate.com/translate';

//     const res = await fetch(LIBRE_URL, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         q,
//         source: source || 'auto',
//         target,
//         format: 'text'
//       })
//     });

//     if (!res.ok) {
//       const text = await res.text();
//       return NextResponse.json({ error: 'Upstream translate error', details: text }, { status: 502 });
//     }

//     const data = await res.json();
//     const translated = data.translatedText ?? data.translated_text ?? data; // be flexible

//     // cache translated text (dev only)
//     try { CACHE.set(key, translated); } catch (e) {}

//     return NextResponse.json({ translatedText: translated });
//   } catch (err) {
//     return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 });
//   }
// }
