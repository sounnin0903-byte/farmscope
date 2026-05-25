import { NextResponse } from 'next/server';

function latLonToGrid(lat, lon) {
  const RE = 6371.00877, GRID = 5.0;
  const SLAT1 = 30.0, SLAT2 = 60.0, OLON = 126.0, OLAT = 38.0;
  const XO = 43, YO = 136, DEGRAD = Math.PI / 180;

  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD, slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD, olat = OLAT * DEGRAD;

  let sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) /
           Math.log(Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5));
  const sf = Math.pow(Math.tan(Math.PI * 0.25 + slat1 * 0.5), sn) * Math.cos(slat1) / sn;
  const ro = re * sf / Math.pow(Math.tan(Math.PI * 0.25 + olat * 0.5), sn);
  const ra = re * sf / Math.pow(Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5), sn);

  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2 * Math.PI;
  if (theta < -Math.PI) theta += 2 * Math.PI;
  theta *= sn;

  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}

function getBaseDateTime() {
  const now = new Date();
  const hours = [2, 5, 8, 11, 14, 17, 20, 23];
  const h = now.getHours();
  let baseHour = [...hours].reverse().find(t => t <= h) ?? 23;
  const base = new Date(now);
  if (baseHour === 23 && h < 23) base.setDate(base.getDate() - 1);
  const p = n => String(n).padStart(2, '0');
  return {
    base_date: `${base.getFullYear()}${p(base.getMonth() + 1)}${p(base.getDate())}`,
    base_time: `${p(baseHour)}00`,
  };
}

const MOCK = {
  today: { temp: 19.2, rain: 0, humidity: 56, sky: '맑음', skyEmoji: '☀️' },
  forecast: [
    { day: '내일',   low: 10, high: 22, sky: '☁️' },
    { day: '모레',   low: 10, high: 21, sky: '☀️' },
    { day: '3일 후', low:  7, high: 22, sky: '☀️' },
    { day: '4일 후', low: 10, high: 23, sky: '☀️' },
    { day: '5일 후', low:  9, high: 21, sky: '🌧️' },
  ],
};

const SKY_EMOJI = { '1': '☀️', '3': '⛅', '4': '☁️' };
const PTY_EMOJI = { '1': '🌧️', '2': '🌨️', '3': '❄️', '4': '🌦️' };
const SKY_TEXT  = { '1': '맑음', '3': '구름많음', '4': '흐림' };

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') ?? '36.18');
  const lon = parseFloat(searchParams.get('lon') ?? '127.07');

  const KEY = process.env.WEATHER_API_KEY;
  if (!KEY) return NextResponse.json({ ...MOCK, mock: true });

  try {
    const { nx, ny } = latLonToGrid(lat, lon);
    const { base_date, base_time } = getBaseDateTime();
    const url =
      `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst` +
      `?serviceKey=${KEY}&pageNo=1&numOfRows=1000&dataType=JSON` +
      `&base_date=${base_date}&base_time=${base_time}&nx=${nx}&ny=${ny}`;

    const res = await fetch(url);
    const data = await res.json();
    const items = data?.response?.body?.items?.item ?? [];

    if (!items.length) return NextResponse.json({ ...MOCK, mock: true });

    // 오늘 현재 날씨 (첫 번째 시간대)
    const getFirst = (cat) => items.find(i => i.category === cat)?.fcstValue ?? '0';
    const pty = getFirst('PTY');
    const sky = getFirst('SKY');
    const skyEmoji = pty !== '0' ? (PTY_EMOJI[pty] ?? '🌧️') : (SKY_EMOJI[sky] ?? '☀️');
    const skyText  = pty !== '0' ? '비/눈' : (SKY_TEXT[sky] ?? '맑음');

    const today = {
      temp:     parseFloat(getFirst('TMP')),
      rain:     getFirst('PCP') === '강수없음' ? 0 : parseFloat(getFirst('PCP') || '0'),
      humidity: parseFloat(getFirst('REH')),
      sky:      skyText,
      skyEmoji,
    };

    // 날짜별 주간 예보 계산
    const now = new Date();
    const p = n => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}`;

    const dates = [...new Set(items.map(i => i.fcstDate))].sort();

    const forecast = dates.filter(date => {
      if (date === todayStr) return false; // 오늘은 상단 카드에서 표시
      const tmpCount = items.filter(i => i.fcstDate === date && i.category === 'TMP').length;
      const hasTmx   = items.some(i => i.fcstDate === date && i.category === 'TMX');
      return tmpCount >= 3 || hasTmx;
    }).slice(0, 5).map(date => {
      const dayItems = items.filter(i => i.fcstDate === date);

      const tmnItem = dayItems.find(i => i.category === 'TMN');
      const tmxItem = dayItems.find(i => i.category === 'TMX');
      const tmpVals = dayItems.filter(i => i.category === 'TMP').map(i => parseFloat(i.fcstValue));
      const low  = tmnItem ? Math.round(parseFloat(tmnItem.fcstValue)) : tmpVals.length ? Math.round(Math.min(...tmpVals)) : null;
      const high = tmxItem ? Math.round(parseFloat(tmxItem.fcstValue)) : tmpVals.length ? Math.round(Math.max(...tmpVals)) : null;

      const noonPty = dayItems.find(i => i.category === 'PTY' && i.fcstTime === '1200');
      const noonSky = dayItems.find(i => i.category === 'SKY' && i.fcstTime === '1200');
      const dPty = noonPty?.fcstValue ?? '0';
      const dSky = noonSky?.fcstValue ?? dayItems.find(i => i.category === 'SKY')?.fcstValue ?? '1';
      const dayEmoji = dPty !== '0' ? (PTY_EMOJI[dPty] ?? '🌧️') : (SKY_EMOJI[dSky] ?? '☀️');

      const yr = parseInt(date.slice(0, 4));
      const mo = parseInt(date.slice(4, 6)) - 1;
      const dy = parseInt(date.slice(6, 8));
      const todayD = new Date(parseInt(todayStr.slice(0, 4)), parseInt(todayStr.slice(4, 6)) - 1, parseInt(todayStr.slice(6, 8)));
      const diff = Math.round((new Date(yr, mo, dy) - todayD) / (1000 * 60 * 60 * 24));
      const dayLabel = diff === 0 ? '오늘' : diff === 1 ? '내일' : diff === 2 ? '모레' : `${mo + 1}/${dy}`;

      return { day: dayLabel, low, high, sky: dayEmoji };
    });

    return NextResponse.json({ today, forecast });
  } catch (err) {
    return NextResponse.json({ ...MOCK, mock: true, error: err.message });
  }
}
