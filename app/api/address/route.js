import { NextResponse } from 'next/server';

// 검색어에서 지역명 추출 후 그에 맞는 목 데이터 생성
function makeMockResults(query) {
  // 지역 키워드 매핑
  const regions = [
    { keys: ['논산', '연산'], sido: '충남', sigu: '논산시', dong: '연산면', base: '44100250222101350000', lat: 36.18, lon: 127.07 },
    { keys: ['천안'],        sido: '충남', sigu: '천안시', dong: '성환읍', base: '44130250222101350000', lat: 36.80, lon: 127.15 },
    { keys: ['수원', '경기'], sido: '경기', sigu: '수원시', dong: '팔달구', base: '41110250222101350000', lat: 37.27, lon: 127.00 },
    { keys: ['강릉'],        sido: '강원', sigu: '강릉시', dong: '성산면', base: '42150250222101350000', lat: 37.75, lon: 128.87 },
    { keys: ['전주'],        sido: '전북', sigu: '전주시', dong: '완산구', base: '45110250222101350000', lat: 35.82, lon: 127.14 },
    { keys: ['나주'],        sido: '전남', sigu: '나주시', dong: '금천면', base: '46170250222101350000', lat: 35.02, lon: 126.71 },
    { keys: ['안동'],        sido: '경북', sigu: '안동시', dong: '임동면', base: '47170250222101350000', lat: 36.57, lon: 128.72 },
    { keys: ['밀양'],        sido: '경남', sigu: '밀양시', dong: '삼랑진읍', base: '48250250222101350000', lat: 35.50, lon: 128.74 },
    { keys: ['제주'],        sido: '제주', sigu: '제주시', dong: '애월읍', base: '50110250222101350000', lat: 33.46, lon: 126.32 },
  ];

  const matched = regions.find(r => r.keys.some(k => query.includes(k)))
    ?? { sido: '충남', sigu: '논산시', dong: query.split(' ').slice(-1)[0] || '연산면', base: '44100250222101350000', lat: 36.18, lon: 127.07 };

  const types  = ['논', '밭', '과수원'];
  const extras = ['산 100', '101', '102-1'];
  const areas  = ['1,200㎡', '860㎡', '2,100㎡'];

  return types.map((type, i) => {
    const pnu = matched.base.slice(0, -2) + String(50 + i * 11).padStart(2, '0');
    return {
      address: `${matched.sido} ${matched.sigu} ${matched.dong} ${extras[i]}`,
      type,
      area: areas[i],
      pnu,
      lat: matched.lat + i * 0.001,
      lon: matched.lon + i * 0.001,
      region: matched.sido,
    };
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 });

  const KAKAO_KEY  = process.env.KAKAO_API_KEY;
  const VWORLD_KEY = process.env.VWORLD_API_KEY;

  if (!KAKAO_KEY) {
    console.log('[address] KAKAO_KEY 없음 → mock');
    return NextResponse.json({ results: makeMockResults(query), mock: true });
  }

  try {
    console.log('[address] 카카오 주소검색:', query);
    const kakaoRes = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}&size=5`,
      { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } }
    );
    const kakaoData = await kakaoRes.json();
    console.log('[address] 카카오 응답:', JSON.stringify(kakaoData).slice(0, 300));

    // 결과 없으면 키워드 검색으로 재시도
    let docs = kakaoData.documents ?? [];
    if (docs.length === 0) {
      const kakaoRes2 = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=5`,
        { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } }
      );
      const kakaoData2 = await kakaoRes2.json();
      console.log('[address] 키워드 응답:', JSON.stringify(kakaoData2).slice(0, 300));
      docs = kakaoData2.documents ?? [];
    }

    if (docs.length === 0) {
      return NextResponse.json({ results: makeMockResults(query), mock: true });
    }

    const results = await Promise.all(
      docs.slice(0, 5).map(async (doc) => {
        const lat = parseFloat(doc.y);
        const lon = parseFloat(doc.x);
        let pnu = null;

        if (VWORLD_KEY) {
          try {
            const vwRes = await fetch(
              `https://api.vworld.kr/req/data?service=data&request=GetFeature&data=LP_PA_CBND_BUBUN&key=${VWORLD_KEY}` +
              `&geomfilter=POINT(${lon} ${lat})&fields=pnu,addr_gb&geometry=false&attribute=true&crs=EPSG:4326&format=json`
            );
            const vwData = await vwRes.json();
            console.log('[vworld] 응답:', JSON.stringify(vwData).slice(0, 400));
            pnu = vwData?.response?.result?.featureCollection?.features?.[0]?.properties?.pnu ?? null;
          } catch (e) { console.log('[vworld] 오류:', e.message); }
        }

        const addr = doc.address ?? doc.road_address ?? {};
        return {
          address: doc.address_name ?? doc.place_name,
          type:    '논/밭',
          area:    '-',
          pnu,
          bjdCode: addr.b_code ?? null,
          lat, lon,
          region: addr.region_1depth_name ?? doc.address_name?.split(' ')[0] ?? '',
        };
      })
    );

    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ results: makeMockResults(query), mock: true, error: err.message });
  }
}
