import { NextResponse } from 'next/server';

const MOCK = {
  벼: [
    { name: '도열병',    status: '주의', level: 1, desc: '도열병 방제 약제 처리 권장' },
    { name: '벼멸구',    status: '경계', level: 2, desc: '벼멸구 방제 약제 처리 권장' },
    { name: '흰잎마름병', status: '경계', level: 2, desc: '흰잎마름병 방제 약제 처리 권장' },
  ],
  배추: [
    { name: '무름병',   status: '주의', level: 1, desc: '무름병 방제 약제 처리 권장' },
    { name: '배추좀나방', status: '경계', level: 2, desc: '배추좀나방 방제 필요' },
  ],
  사과: [
    { name: '점무늬낙엽병', status: '주의', level: 1, desc: '점무늬낙엽병 방제 권장' },
    { name: '사과면충',    status: '안전', level: 0, desc: '현재 발생 없음' },
  ],
  딸기: [
    { name: '잿빛곰팡이병', status: '경계', level: 2, desc: '잿빛곰팡이병 방제 필요' },
    { name: '응애',        status: '주의', level: 1, desc: '응애 방제 약제 처리 권장' },
  ],
};

const DEFAULT_PESTS = [
  { name: '병해충 1', status: '안전', level: 0, desc: '현재 발생 없음' },
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const crop = searchParams.get('crop') ?? '벼';

  const KEY = process.env.PEST_API_KEY;
  if (!KEY) {
    return NextResponse.json({ pests: MOCK[crop] ?? DEFAULT_PESTS, mock: true });
  }

  try {
    const today = new Date();
    const sDate = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}01`;
    const eDate = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

    const url =
      `https://ncpms.rda.go.kr/npms/GovAgrBystService.np` +
      `?serviceKey=${KEY}&numOfRows=10&pageIndex=1` +
      `&searchCropName=${encodeURIComponent(crop)}&sDate=${sDate}&eDate=${eDate}&displayYn=Y`;

    console.log('[pest] NCPMS 요청:', url.replace(KEY, '***'));
    const res  = await fetch(url);
    const text = await res.text();
    console.log('[pest] NCPMS 응답:', text.slice(0, 300));

    // XML 파싱
    const items = [...text.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
      const get = (tag) => m[1].match(new RegExp(`<${tag}>(.*?)<\/${tag}>`))?.[1] ?? '';
      return {
        name:   get('insectName') || get('cropName') || '병해충',
        status: get('insectLevel') === '3' ? '경계' : get('insectLevel') === '2' ? '주의' : '안전',
        level:  parseInt(get('insectLevel') || '0'),
        desc:   get('insectDesc') || get('cropName') + ' 관련 병해충 발생 정보',
      };
    });

    if (!items.length) return NextResponse.json({ pests: MOCK[crop] ?? DEFAULT_PESTS, mock: true });
    return NextResponse.json({ pests: items });
  } catch (err) {
    console.log('[pest] 오류:', err.message);
    return NextResponse.json({ pests: MOCK[crop] ?? DEFAULT_PESTS, mock: true, error: err.message });
  }
}
