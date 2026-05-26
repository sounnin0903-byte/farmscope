'use client';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('./components/MapView'), { ssr: false });

const DEFAULT_FARMS = [
  { id: 1, name: '1번 논',      loc: '충남 논산시 연산면 고정리', crop: '벼',  emoji: '🌾', type: '논',    pnu: '44100250222101350000', lat: 36.18,  lon: 127.07,  region: '충남' },
  { id: 2, name: '2번 밭',      loc: '충남 논산시 연산면 청동리', crop: '배추', emoji: '🥬', type: '밭',    pnu: '44100250222101360000', lat: 36.185, lon: 127.075, region: '충남' },
  { id: 3, name: '3번 과수원',  loc: '충남 논산시 가야곡면 두월리', crop: '사과', emoji: '🍎', type: '과수원', pnu: '44100250222101370000', lat: 36.25,  lon: 127.01,  region: '충남' },
  { id: 4, name: '4번 시설재배',loc: '충남 논산시 부적면 덕평리', crop: '딸기', emoji: '🍓', type: '시설',  pnu: '44100250222101380000', lat: 36.17,  lon: 127.05,  region: '충남' },
];

const CROPS = [
  { name: '벼',    emoji: '🌾' },
  { name: '배추',  emoji: '🥬' },
  { name: '사과',  emoji: '🍎' },
  { name: '딸기',  emoji: '🍓' },
  { name: '고추',  emoji: '🌶️' },
  { name: '마늘',  emoji: '🧄' },
  { name: '양파',  emoji: '🧅' },
  { name: '감자',  emoji: '🥔' },
  { name: '고구마', emoji: '🍠' },
  { name: '토마토', emoji: '🍅' },
  { name: '오이',  emoji: '🥒' },
  { name: '옥수수', emoji: '🌽' },
  { name: '콩',   emoji: '🫘' },
  { name: '참깨',  emoji: '🌿' },
  { name: '들깨',  emoji: '🌱' },
  { name: '포도',  emoji: '🍇' },
  { name: '복숭아', emoji: '🍑' },
  { name: '배',   emoji: '🍐' },
  { name: '감',   emoji: '🟠' },
  { name: '수박',  emoji: '🍉' },
  { name: '참외',  emoji: '🍈' },
  { name: '상추',  emoji: '🥗' },
  { name: '시금치', emoji: '🥬' },
  { name: '무',   emoji: '🫚' },
];

// 작물별 증상 → 병해충 매핑 (농촌진흥청 농작물 병해충 발생정보 2026년 제5호 근거)
const SYMPTOMS = {
  벼: [
    { id: 'r_brown_spot',  label: '잎에 갈색 타원형 점무늬가 생기고 이삭에 알이 차지 않나요?', pests: [{ name: '깨씨무늬병',         action: '규산질 비료를 충분히 시용하고 전용 살균제를 출수 전 살포하세요' }] },
    { id: 'r_seedling_rot',label: '모가 잘록해지며 쓰러지거나 뿌리가 검게 썩나요?',          pests: [{ name: '모마름병·뜸모',       action: '종자 소독을 철저히 하고 육묘 상자에 전용 살균제를 처리하세요' }] },
    { id: 'r_stripe_leaf', label: '잎에 황백색 줄무늬가 나타나고 생장이 멈추나요?',           pests: [{ name: '벼줄무늬잎마름병',    action: '매개충인 애멸구 방제를 최우선으로 하고 이병 모는 즉시 제거하세요' }] },
    { id: 'r_neck_rot',    label: '잎이 회갈색으로 마르고 이삭 목 부분이 꺾이나요?',          pests: [{ name: '도열병',              action: '출수기 전후 10일 이내 전용 살균제를 2회 살포하세요' }] },
  ],
  배추: [
    { id: 'bc_rot',        label: '잎이 물러지며 악취가 나고 녹갈색으로 썩나요?',             pests: [{ name: '무름병',              action: '이병주를 즉시 제거하고 석회를 토양에 시용하세요' }] },
    { id: 'bc_downy',      label: '잎 뒷면에 흰 곰팡이가 피고 앞면이 노랗게 변하나요?',      pests: [{ name: '노균병',              action: '과습하지 않도록 배수를 개선하고 예방 살균제를 뿌리세요' }] },
    { id: 'bc_root_gall',  label: '포기 밑동이 부풀고 뿌리에 혹이 생겨 시드나요?',           pests: [{ name: '뿌리혹병',            action: '석회를 시용해 토양 pH를 7.2 이상으로 올리고 연작을 피하세요' }] },
    { id: 'bc_holes',      label: '잎에 구멍이 뚫리거나 진딧물이 붙어있나요?',                pests: [{ name: '배추좀나방·진딧물',   action: '유충 초기 BT 계열 약제를 살포하고 진딧물은 잎 뒷면 위주로 방제하세요' }] },
  ],
  사과: [
    { id: 'ap_fire_blight',label: '꽃·잎·열매가 불에 탄 듯 검게 변하며 말라죽나요?',         pests: [{ name: '과수화상병(즉시 신고)',action: '즉시 시군 농업기술센터에 신고하세요. 전정 도구는 반드시 소독 후 사용하세요' }] },
    { id: 'ap_rust',       label: '잎에 등황색·붉은 별 모양 반점이 생기나요?',                pests: [{ name: '붉은별무늬병',        action: '향나무류 중간 기주를 제거하고 개화 전후 살균제를 예방 살포하세요' }] },
    { id: 'ap_fruit_rot',  label: '과실에 검은 반점이 생기고 함몰되며 썩나요?',               pests: [{ name: '탄저병·검은별무늬병', action: '이병과를 즉시 제거하고 낙화 후 10일 간격으로 살균제를 정기 살포하세요' }] },
    { id: 'ap_lanternfly', label: '가지에 화려한 무늬 벌레들이 집단으로 붙어있나요?',         pests: [{ name: '꽃매미·깍지벌레',     action: '발생 초기 전용 살충제를 뿌리고 알집은 발견 즉시 긁어 제거하세요' }] },
  ],
  딸기: [
    { id: 'st_powdery',    label: '잎·과실에 흰 가루가 덮이며 마르나요?',                    pests: [{ name: '흰가루병',            action: '저온·건조 시 발생이 잦으니 황 성분 약제를 예방 위주로 사용하세요' }] },
    { id: 'st_gray_mold',  label: '과실이 회색 곰팡이로 덮이며 물러 썩나요?',                pests: [{ name: '잿빛곰팡이병',        action: '환기를 늘리고 발생 초기 전용 살균제를 2~3회 교호 살포하세요' }] },
    { id: 'st_thrips',     label: '꽃이나 잎을 두드리면 작은 벌레가 날리나요?',               pests: [{ name: '총채벌레류',          action: '황색 점착 트랩을 설치하고 발생 초기 전용 살충제를 살포하세요' }] },
    { id: 'st_mite',       label: '잎 뒷면이 누렇게 변하고 거미줄 같은 것이 생기나요?',      pests: [{ name: '응애',                action: '응애 전용 살비제를 잎 뒷면에 집중 살포하세요' }] },
  ],
  고추: [
    { id: 'pp_stem_rot',   label: '줄기 밑이 검게 물러지며 줄기째 쓰러지나요?',         pests: [{ name: '역병',                action: '배수를 철저히 하고 이병주 제거 후 역병 전용 약제를 관주하세요' }] },
    { id: 'pp_anthracnose',label: '과실에 검은 반점이 생기고 움푹 파이며 썩나요?',            pests: [{ name: '탄저병',              action: '발병 즉시 이병과를 제거하고 안전기 내 전용 살균제를 살포하세요' }] },
    { id: 'pp_mosaic',     label: '잎이 모자이크 무늬로 오그라들거나 기형이 되나요?',         pests: [{ name: '바이러스(진딧물 매개)',action: '진딧물을 조기 방제하고 이병 포기는 즉시 제거하세요' }] },
    { id: 'pp_larvae',     label: '잎·과실에 구멍이 뚫리거나 유충이 파고드나요?',            pests: [{ name: '담배나방',            action: '산란 최성기에 살충제를 2회 이상 살포하고 피해 과실은 즉시 제거하세요' }] },
  ],
  마늘: [
    { id: 'ga_tip_blight', label: '잎 끝부터 갈색으로 마르며 점점 아래로 번지나요?',          pests: [{ name: '잎마름병',            action: '발병 초기 전용 살균제를 7~10일 간격으로 2~3회 살포하세요' }] },
    { id: 'ga_bulb_black', label: '구근 껍질이 검게 변하고 흰 균사가 생기나요?',              pests: [{ name: '흑색썩음균핵병',      action: '종구 소독 후 파종하고 연작지는 토양 훈증 처리하세요' }] },
    { id: 'ga_maggot',     label: '마늘이 점점 시들며 아래 줄기부터 노랗게 변하나요?',        pests: [{ name: '고자리파리',          action: '파종 시 토양 살충제를 처리하고 성충 발생기에 유살 트랩을 설치하세요' }] },
    { id: 'ga_bulb_mite',  label: '구근이 썩고 주변에 작은 응애가 보이나요?',                 pests: [{ name: '뿌리응애',            action: '종구를 선별하고 파종 전 살비제 처리 후 재식하세요' }] },
  ],
  양파: [
    { id: 'on_tip_blight', label: '잎 끝부터 갈색으로 마르고 전체가 시드나요?',               pests: [{ name: '잎마름병',            action: '발병 초기 전용 살균제를 7~10일 간격으로 2~3회 살포하세요' }] },
    { id: 'on_downy',      label: '잎에 옅은 황색 반점과 함께 회보라색 곰팡이가 피나요?',    pests: [{ name: '노균병',              action: '과습하지 않도록 배수를 개선하고 예방 위주로 살균제를 살포하세요' }] },
    { id: 'on_bulb_black', label: '구근 껍질이 검게 변하고 지상부가 노랗게 마르나요?',        pests: [{ name: '흑색썩음균핵병',      action: '연작을 피하고 토양 살균 처리 후 건전 종구를 파종하세요' }] },
    { id: 'on_root_fly',   label: '포기 아래 줄기가 노랗게 변하며 뿌리가 썩나요?',            pests: [{ name: '고자리파리·뿌리응애', action: '파종 시 토양 살충제를 처리하고 피해 포기는 즉시 제거하세요' }] },
  ],
  감자: [
    { id: 'po_blight',     label: '잎에 수침상 암갈색 반점이 생기고 빠르게 번지나요?',        pests: [{ name: '역병',                action: '발병 즉시 역병 전용 약제를 살포하고 과습하지 않도록 배수하세요' }] },
    { id: 'po_virus',      label: '잎이 오그라들거나 모자이크 무늬가 생기나요?',               pests: [{ name: '바이러스',            action: '진딧물을 조기 방제하고 감염 포기는 즉시 제거하세요' }] },
    { id: 'po_beetle',     label: '잎에 노란 반점이 생기고 잎살이 갉아먹혀 있나요?',          pests: [{ name: '28점박이무당벌레',    action: '성충·유충 발견 시 전용 살충제를 잎 뒷면 위주로 살포하세요' }] },
    { id: 'po_scab',       label: '표피에 코르크 같은 딱딱한 반점이 생기나요?',                pests: [{ name: '더뎅이병',            action: '토양 pH를 5.0~6.0으로 조정하고 종서 소독 후 재식하세요' }] },
  ],
  고구마: [
    { id: 'sw_vine_wilt',  label: '덩굴이 시들고 단면이 갈색으로 변색되어 있나요?',           pests: [{ name: '덩굴쪼김병',          action: '건전 삽수를 사용하고 연작지는 토양 소독 후 재식하세요' }] },
    { id: 'sw_virus',      label: '잎이 오그라들거나 모자이크 무늬가 나타나나요?',             pests: [{ name: '바이러스',            action: '바이러스 무병 묘를 사용하고 진딧물을 조기에 방제하세요' }] },
    { id: 'sw_leaf_miner', label: '잎에 구불구불한 흰 줄이 생기나요?',                        pests: [{ name: '굴나방',              action: '발생 초기 전용 살충제를 살포하고 피해 잎은 제거하세요' }] },
    { id: 'sw_black_rot',  label: '괴근 표면에 검은 반점이 생기고 속이 썩나요?',              pests: [{ name: '검은무늬병',          action: '저장 전 큐어링 처리를 하고 상처 난 괴근은 반드시 선별 제거하세요' }] },
  ],
  토마토: [
    { id: 'tm_tswv',       label: '잎에 갈색 원형 반점이 생기고 식물 전체가 시드나요?',       pests: [{ name: '토마토반점위조바이러스(TSWV)', action: '총채벌레를 즉시 방제하고 이병 포기는 즉시 제거하세요' }] },
    { id: 'tm_tylcv',      label: '잎이 노랗게 말리고 위쪽 잎부터 황화가 진행되나요?',        pests: [{ name: '토마토황화잎말림바이러스(TYLCV)', action: '온실가루이를 조기 방제하고 감염 포기는 즉시 제거하세요' }] },
    { id: 'tm_hornworm',   label: '잎에 구멍이 생기거나 과실 속에 유충이 보이나요?',          pests: [{ name: '토마토뿔나방',        action: '산란 초기 BT 계열 살충제를 살포하고 피해과는 즉시 제거하세요' }] },
    { id: 'tm_gray_mold',  label: '잎·줄기에 회색 곰팡이가 생기며 물러지나요?',              pests: [{ name: '잿빛곰팡이병',        action: '환기를 늘리고 발생 초기 전용 살균제를 2~3회 교호 살포하세요' }] },
  ],
  오이: [
    { id: 'cu_downy',      label: '잎에 황색 각진 반점이 생기고 습할 때 곰팡이가 피나요?',   pests: [{ name: '노균병',              action: '환기를 개선하고 발병 초기 전용 살균제를 7일 간격으로 살포하세요' }] },
    { id: 'cu_powdery',    label: '잎에 흰 가루가 덮이며 마르나요?',                          pests: [{ name: '흰가루병',            action: '환기 개선 후 황 계열 살균제를 살포하세요' }] },
    { id: 'cu_mite',       label: '잎 뒷면에 거미줄이 생기고 잎이 누렇게 변하나요?',          pests: [{ name: '응애',                action: '응애 전용 살비제를 잎 뒷면에 집중 살포하세요' }] },
    { id: 'cu_gray_mold',  label: '과실이나 줄기에 회색 곰팡이가 생기며 썩나요?',             pests: [{ name: '잿빛곰팡이병',        action: '환기를 늘리고 발생 초기 전용 살균제를 교호 살포하세요' }] },
  ],
  옥수수: [
    { id: 'co_armyworm',   label: '잎에 구멍이 생기고 속대 안에 유충이 파고들었나요?',        pests: [{ name: '열대거세미나방·멸강나방', action: '어린 유충 시기에 전용 살충제를 살포하고 대발생 시 즉시 신고하세요' }] },
    { id: 'co_smut',       label: '이삭이나 줄기에 검은 가루 덩어리가 생기나요?',              pests: [{ name: '깜부기병',            action: '종자 소독 후 파종하고 이병 부위는 포자 비산 전 즉시 제거하세요' }] },
    { id: 'co_stripe',     label: '잎에 황백색 줄무늬가 생기고 생육이 멈추나요?',              pests: [{ name: '검은줄오갈병',        action: '매개충 방제를 우선하고 발병 포기는 즉시 제거하세요' }] },
    { id: 'co_aphid',      label: '잎과 줄기에 진딧물이 밀집해 있나요?',                      pests: [{ name: '진딧물',              action: '전용 살충제를 잎 뒷면 위주로 살포하고 천적을 보호하세요' }] },
  ],
  콩: [
    { id: 'sb_mosaic',     label: '잎에 모자이크 무늬가 생기고 오그라드나요?',                 pests: [{ name: '콩모자이크바이러스',   action: '진딧물을 조기 방제하고 감염 포기는 즉시 제거하세요' }] },
    { id: 'sb_anthrac',    label: '잎·줄기에 갈색 반점이 생기고 곰팡이가 피나요?',            pests: [{ name: '탄저병·노균병',       action: '발병 초기 전용 살균제를 살포하고 배수 불량지는 배수로를 정비하세요' }] },
    { id: 'sb_pod_borer',  label: '꼬투리 안에 유충이 들어있거나 껍질이 뚫려있나요?',         pests: [{ name: '콩나방',              action: '알 부화기인 7~8월에 전용 살충제를 살포하세요' }] },
    { id: 'sb_stinkbug',   label: '잎 뒷면에 노린재가 붙어있고 꼬투리가 쭉정이가 되나요?',   pests: [{ name: '노린재',              action: '성충과 약충 발생 시 전용 살충제를 신속히 살포하세요' }] },
  ],
  참깨: [
    { id: 'se_blight',     label: '줄기 밑부분이 물러지며 포기 전체가 급격히 시드나요?',      pests: [{ name: '역병',                action: '배수로를 정비하고 이병 포기 제거 후 역병 전용 약제를 관주하세요' }] },
    { id: 'se_leaf_blight',label: '잎에 갈색 반점이 생기고 점점 커지나요?',                   pests: [{ name: '잎마름병·세균성점무늬병', action: '발병 초기 전용 살균제를 7~10일 간격으로 2~3회 살포하세요' }] },
    { id: 'se_larvae',     label: '꼬투리나 잎에 유충이 파고드나요?',                         pests: [{ name: '담배나방',            action: '알 부화 초기 BT 계열 또는 전용 살충제를 살포하세요' }] },
    { id: 'se_virus',      label: '잎이 오그라들거나 모자이크 무늬가 생기나요?',               pests: [{ name: '바이러스',            action: '진딧물을 조기에 방제하고 이병 포기는 즉시 제거하세요' }] },
  ],
  들깨: [
    { id: 'pe_blight',     label: '줄기 밑이 물러지며 급격히 시드나요?',                      pests: [{ name: '역병',                action: '배수를 철저히 하고 발생 초기 역병 전용 약제를 관주하세요' }] },
    { id: 'pe_downy',      label: '잎 뒷면에 흰 곰팡이가 피고 앞면이 노랗게 되나요?',         pests: [{ name: '노균병',              action: '과습하지 않도록 배수를 개선하고 예방 살균제를 살포하세요' }] },
    { id: 'pe_larvae',     label: '잎에 작은 구멍이 뚫리거나 유충이 붙어있나요?',              pests: [{ name: '담배나방·진딧물',     action: 'BT 계열 약제로 유충을 방제하고 진딧물은 잎 뒷면 위주로 살포하세요' }] },
    { id: 'pe_mite',       label: '잎이 오그라들거나 뒷면에 아주 작은 벌레가 보이나요?',                 pests: [{ name: '바이러스·응애',       action: '응애 전용 살비제를 살포하고 바이러스 이병주는 즉시 제거하세요' }] },
  ],
  포도: [
    { id: 'gr_downy',      label: '잎에 기름 묻은 듯한 반점이 생기고 흰 곰팡이가 피나요?',   pests: [{ name: '노균병',              action: '개화 전부터 예방 위주로 보르도액 또는 살균제를 10일 간격 살포하세요' }] },
    { id: 'gr_lanternfly', label: '가지에 화려한 무늬의 벌레들이 집단으로 붙어있나요?',        pests: [{ name: '꽃매미',              action: '발생 초기 전용 살충제를 살포하고 알집은 긁어 모아 소각하세요' }] },
    { id: 'gr_anthracnose',label: '과실에 검은 반점이 생기고 함몰되며 썩나요?',               pests: [{ name: '탄저병·잿빛곰팡이병', action: '결실 후 7~10일 간격으로 살균제를 교호 살포하세요' }] },
    { id: 'gr_brown_spot', label: '잎에 붉은색 반점이 나타나고 조기 낙엽이 지나요?',          pests: [{ name: '새눈무늬병',          action: '잎눈 트는 시기부터 예방 살균제를 2~3주 간격으로 살포하세요' }] },
  ],
  복숭아: [
    { id: 'pc_seed_wasp',  label: '어린 과실 안에서 애벌레가 나오거나 속이 파여있나요?',      pests: [{ name: '복숭아씨살이좀벌',    action: '낙화 직후 전용 살충제를 2회 살포하고 피해 낙과는 즉시 수거하세요' }] },
    { id: 'pc_shoot',      label: '새 가지 끝이 시들며 꺾여 말라죽나요?',                     pests: [{ name: '복숭아순나방',        action: '교미 교란제를 설치하고 산란 최성기에 전용 살충제를 살포하세요' }] },
    { id: 'pc_fruit_rot',  label: '과실에 검은 반점이 생기고 함몰되며 썩나요?',               pests: [{ name: '탄저병·검은별무늬병', action: '낙화 후 10일 간격으로 살균제를 정기 살포하세요' }] },
    { id: 'pc_shot_hole',  label: '잎에 작은 구멍이 뚫리며 갈색 테두리가 생기나요?',          pests: [{ name: '세균성구멍병',        action: '발아 직전과 낙화 후 구리 계열 살균제를 살포하세요' }] },
  ],
  배: [
    { id: 'pe_fire_blight',label: '꽃·잎·열매가 불에 탄 듯 검게 변하며 말라죽나요?',         pests: [{ name: '과수화상병(즉시 신고)',action: '즉시 시군 농업기술센터에 신고하세요. 전정 도구는 반드시 소독 후 사용하세요' }] },
    { id: 'pe_rust',       label: '잎에 등황색·붉은 별 모양 반점이 생기나요?',                pests: [{ name: '붉은별무늬병',        action: '향나무류 중간 기주를 제거하고 개화 전후 살균제를 예방 살포하세요' }] },
    { id: 'pe_scab',       label: '과실·잎에 검은 반점이 생기며 그을음처럼 번지나요?',        pests: [{ name: '검은별무늬병',        action: '낙화 후부터 전용 살균제를 10일 간격으로 정기 살포하세요' }] },
    { id: 'pe_anthrac',    label: '과실이 검게 함몰되며 썩나요?',                              pests: [{ name: '탄저병',              action: '수확 전 안전 기간을 지켜 전용 살균제를 2회 이상 살포하세요' }] },
  ],
  감: [
    { id: 'ps_anthrac',    label: '과실에 검은 반점이 생기고 함몰되며 썩나요?',               pests: [{ name: '탄저병',              action: '낙화 후 15일 간격으로 전용 살균제를 정기 살포하세요' }] },
    { id: 'ps_leaf_spot',  label: '잎에 갈색 둥근 반점이 생기고 조기 낙엽이 지나요?',         pests: [{ name: '둥근무늬낙엽병',      action: '7월부터 전용 살균제를 10~15일 간격으로 살포하세요' }] },
    { id: 'ps_moth',       label: '어린 과실이 낙과하거나 꼭지 부근에 유충이 보이나요?',      pests: [{ name: '감꼭지나방',          action: '성충 발생 최성기에 전용 살충제를 2회 살포하세요' }] },
    { id: 'ps_scale',      label: '가지나 과실에 납처럼 딱딱한 껍질이 붙어있나요?',            pests: [{ name: '깍지벌레',            action: '발아 전 기계유 유제를 살포하고 부화 직후 전용 살충제를 뿌리세요' }] },
  ],
  수박: [
    { id: 'wm_anthrac',    label: '과실 표면에 검은 반점이 생기고 함몰되며 썩나요?',           pests: [{ name: '탄저병',              action: '이병과를 즉시 제거하고 안전기 내 전용 살균제를 살포하세요' }] },
    { id: 'wm_gummy',      label: '줄기가 갈색으로 말라죽고 진물이 흐르나요?',                 pests: [{ name: '덩굴마름병',          action: '접목 재배로 예방하고 발병 초기 전용 살균제를 살포하세요' }] },
    { id: 'wm_powdery',    label: '잎에 흰 가루가 덮이며 노랗게 마르나요?',                    pests: [{ name: '흰가루병',            action: '환기 개선 후 황 계열 살균제를 살포하세요' }] },
    { id: 'wm_thrips',     label: '잎과 줄기에 작은 벌레가 밀집해 있나요?',                    pests: [{ name: '총채벌레·진딧물',     action: '황색 점착 트랩을 설치하고 발생 초기 전용 살충제를 살포하세요' }] },
  ],
  참외: [
    { id: 'me_downy',      label: '잎에 황색 각진 반점이 생기고 습할 때 곰팡이가 피나요?',   pests: [{ name: '노균병',              action: '환기를 개선하고 발병 초기 전용 살균제를 7일 간격으로 살포하세요' }] },
    { id: 'me_anthrac',    label: '과실에 검은 반점이 생기고 함몰되며 썩나요?',               pests: [{ name: '탄저병',              action: '이병과를 즉시 제거하고 전용 살균제를 정기 살포하세요' }] },
    { id: 'me_powdery',    label: '잎에 흰 가루가 덮이며 마르나요?',                          pests: [{ name: '흰가루병',            action: '환기 개선 후 황 계열 살균제를 살포하세요' }] },
    { id: 'me_whitefly',   label: '잎 뒷면에 작은 흰 벌레나 진딧물이 붙어있나요?',            pests: [{ name: '온실가루이·진딧물',   action: '황색 점착 트랩을 설치하고 발생 초기 전용 살충제를 잎 뒷면 위주로 살포하세요' }] },
  ],
  상추: [
    { id: 'lt_gray_mold',  label: '잎이 회색 곰팡이로 덮이며 물러 썩나요?',                  pests: [{ name: '잿빛곰팡이병',        action: '환기를 늘리고 발생 초기 전용 살균제를 2~3회 교호 살포하세요' }] },
    { id: 'lt_downy',      label: '잎 뒷면에 흰 곰팡이가 피고 앞면이 노랗게 변하나요?',      pests: [{ name: '노균병',              action: '과습하지 않도록 배수를 개선하고 예방 살균제를 뿌리세요' }] },
    { id: 'lt_sclerotinia',label: '줄기 밑동이 물러지며 흰 균사와 검은 균핵이 생기나요?',     pests: [{ name: '균핵병',              action: '연작을 피하고 발병 초기 전용 살균제를 살포하세요' }] },
    { id: 'lt_aphid',      label: '잎에 진딧물이 밀집해 있나요?',                              pests: [{ name: '진딧물',              action: '점착 트랩을 설치하고 살충제를 잎 뒷면 위주로 살포하세요' }] },
  ],
  시금치: [
    { id: 'sp_downy',      label: '잎 뒷면에 흰 곰팡이가 피고 앞면에 황색 반점이 생기나요?', pests: [{ name: '노균병',              action: '환기를 개선하고 발병 초기 전용 살균제를 살포하세요' }] },
    { id: 'sp_gray_mold',  label: '잎이 회색 곰팡이로 덮이며 물러지나요?',                    pests: [{ name: '잿빛곰팡이병',        action: '환기를 늘리고 발생 초기 전용 살균제를 교호 살포하세요' }] },
    { id: 'sp_sclerotinia',label: '줄기 밑동이 물러지며 흰 균사가 생기나요?',                  pests: [{ name: '균핵병',              action: '연작을 피하고 과습 방지 위해 배수로를 정비하세요' }] },
    { id: 'sp_aphid',      label: '잎에 진딧물이 밀집해 있나요?',                              pests: [{ name: '진딧물',              action: '발생 초기 전용 살충제를 잎 뒷면 위주로 살포하세요' }] },
  ],
  무: [
    { id: 'rd_rot',        label: '뿌리가 물러지며 악취가 나고 녹갈색으로 썩나요?',            pests: [{ name: '무름병',              action: '이병주를 즉시 제거하고 석회를 토양에 시용하세요' }] },
    { id: 'rd_downy',      label: '잎 뒷면에 흰 곰팡이가 피고 앞면이 노랗게 변하나요?',       pests: [{ name: '노균병',              action: '과습하지 않도록 배수를 개선하고 예방 살균제를 뿌리세요' }] },
    { id: 'rd_root_gall',  label: '뿌리 표면에 혹이 생기고 지상부가 시드나요?',               pests: [{ name: '뿌리혹병',            action: '석회를 시용해 토양 pH를 높이고 연작을 피하세요' }] },
    { id: 'rd_holes',      label: '잎에 구멍이 뚫리거나 유충이 보이나요?',                     pests: [{ name: '배추좀나방·벼룩잎벌레', action: '유충 초기 BT 계열 약제를 살포하고 벼룩잎벌레는 전용 살충제를 뿌리세요' }] },
  ],
};

const DEFAULT_SYMPTOMS = [
  { id: 'leaf_yellow', label: '잎이 누렇게 변하거나 위축돼요',          pests: [{ name: '영양 결핍·바이러스', action: '엽면 시비 후 증상이 지속되면 바이러스 검사를 받아보세요' }] },
  { id: 'white_dust',  label: '잎·줄기에 흰 가루나 곰팡이가 보여요',    pests: [{ name: '흰가루병',          action: '환기 개선 후 황 계열 살균제를 살포하세요' }] },
  { id: 'insect',      label: '벌레가 보이거나 흡즙 흔적이 있어요',      pests: [{ name: '해충',              action: '전용 살충제를 선택해 잎 앞뒤로 꼼꼼히 살포하세요' }] },
  { id: 'rot',         label: '줄기나 뿌리가 썩거나 식물이 고사해요',    pests: [{ name: '토양 병해',          action: '배수를 개선하고 토양 살균제를 처리하세요' }] },
];

const SCORE_WEIGHTS = {
  벼:    { soil: 40, weather: 30, pest: 30 },
  배추:  { soil: 30, weather: 40, pest: 30 },
  사과:  { soil: 35, weather: 30, pest: 35 },
  딸기:  { soil: 35, weather: 35, pest: 30 },
  고추:  { soil: 30, weather: 35, pest: 35 },
  마늘:  { soil: 40, weather: 30, pest: 30 },
  양파:  { soil: 40, weather: 30, pest: 30 },
  감자:  { soil: 40, weather: 30, pest: 30 },
  고구마: { soil: 35, weather: 35, pest: 30 },
  토마토: { soil: 30, weather: 35, pest: 35 },
  오이:  { soil: 30, weather: 35, pest: 35 },
  옥수수: { soil: 35, weather: 35, pest: 30 },
  콩:    { soil: 35, weather: 35, pest: 30 },
  참깨:  { soil: 35, weather: 35, pest: 30 },
  들깨:  { soil: 35, weather: 35, pest: 30 },
  포도:  { soil: 35, weather: 30, pest: 35 },
  복숭아: { soil: 35, weather: 30, pest: 35 },
  배:    { soil: 35, weather: 30, pest: 35 },
  감:    { soil: 35, weather: 30, pest: 35 },
  수박:  { soil: 30, weather: 40, pest: 30 },
  참외:  { soil: 30, weather: 40, pest: 30 },
  상추:  { soil: 30, weather: 40, pest: 30 },
  시금치: { soil: 35, weather: 40, pest: 25 },
  무:    { soil: 35, weather: 35, pest: 30 },
};

const CROP_TEMP = {
  벼:    { min: 20, max: 30 },
  배추:  { min: 15, max: 22 },
  사과:  { min: 15, max: 25 },
  딸기:  { min: 15, max: 25 },
  고추:  { min: 20, max: 30 },
  마늘:  { min: 15, max: 25 },
  양파:  { min: 15, max: 25 },
  감자:  { min: 15, max: 22 },
  고구마: { min: 22, max: 30 },
  토마토: { min: 18, max: 27 },
  오이:  { min: 20, max: 28 },
  옥수수: { min: 20, max: 30 },
  콩:    { min: 20, max: 28 },
  참깨:  { min: 23, max: 30 },
  들깨:  { min: 20, max: 28 },
  포도:  { min: 18, max: 28 },
  복숭아: { min: 15, max: 25 },
  배:    { min: 15, max: 25 },
  감:    { min: 18, max: 28 },
  수박:  { min: 22, max: 30 },
  참외:  { min: 22, max: 30 },
  상추:  { min: 15, max: 22 },
  시금치: { min: 10, max: 20 },
  무:    { min: 15, max: 22 },
};

// 작물별 토양 적정 기준 (농촌진흥청 표준시비처방기준 근거)
// pH[low,high], om[low,high](g/kg), phos[low,high](mg/kg), k[low,high](cmol/kg), ca[low,high](cmol/kg), ecMax(dS/m)
const SOIL_CRITERIA = {
  default: { pH: [5.5, 7.0], om: [25, 35], phos: [80,  150],  k: [0.25, 0.55], ca: [5.0, 6.0], mg: [1.5, 2.0] },
  벼:      { pH: [5.5, 6.5], om: [25, 35], phos: [80,  120],  k: [0.20, 0.35], ca: [5.0, 6.0], mg: [1.5, 2.0] },
  배추:    { pH: [6.0, 7.0], om: [25, 35], phos: [350, 500],  k: [0.70, 0.90], ca: [5.0, 6.0], mg: [1.5, 2.0] },
  사과:    { pH: [5.5, 6.5], om: [25, 35], phos: [200, 300],  k: [0.30, 0.50], ca: [5.0, 6.0], mg: [1.5, 2.0] },
  딸기:    { pH: [5.5, 6.5], om: [25, 35], phos: [350, 450],  k: [0.50, 0.70], ca: [5.0, 6.0], mg: [1.5, 2.0] },
  고추:    { pH: [6.0, 7.0], om: [25, 35], phos: [350, 450],  k: [0.50, 0.70], ca: [5.0, 6.0], mg: [1.5, 2.0] },
  마늘:    { pH: [6.0, 7.0], om: [20, 30], phos: [300, 450],  k: [0.50, 0.70], ca: [5.0, 6.0], mg: [1.5, 2.0] },
  양파:    { pH: [6.0, 7.0], om: [20, 30], phos: [300, 450],  k: [0.50, 0.70], ca: [5.0, 6.0], mg: [1.5, 2.0] },
  감자:    { pH: [5.0, 6.0], om: [25, 35], phos: [250, 350],  k: [0.50, 0.70], ca: [4.0, 5.5], mg: [1.5, 2.0] },
  고구마:  { pH: [5.5, 6.5], om: [15, 25], phos: [200, 300],  k: [0.50, 0.70], ca: [5.0, 6.0], mg: [1.5, 2.0] },
  토마토:  { pH: [6.0, 7.0], om: [25, 35], phos: [350, 500],  k: [0.70, 0.90], ca: [5.0, 6.0], mg: [1.5, 2.0] },
  오이:    { pH: [6.0, 7.0], om: [25, 35], phos: [350, 500],  k: [0.50, 0.70], ca: [5.0, 6.0], mg: [1.5, 2.0] },
  옥수수:  { pH: [5.8, 7.0], om: [20, 30], phos: [100, 200],  k: [0.30, 0.50], ca: [5.0, 6.0], mg: [1.5, 2.0] },
  콩:      { pH: [6.0, 7.0], om: [20, 30], phos: [100, 200],  k: [0.30, 0.50], ca: [5.0, 6.0], mg: [1.5, 2.0] },
  참깨:    { pH: [6.0, 7.0], om: [15, 25], phos: [150, 250],  k: [0.25, 0.45], ca: [5.0, 6.0], mg: [1.5, 2.0] },
  들깨:    { pH: [5.5, 6.5], om: [20, 30], phos: [150, 250],  k: [0.25, 0.45], ca: [5.0, 6.0], mg: [1.5, 2.0] },
  포도:    { pH: [6.0, 7.0], om: [25, 35], phos: [200, 350],  k: [0.30, 0.50], ca: [5.0, 6.0], mg: [1.5, 2.0] },
  복숭아:  { pH: [5.5, 6.5], om: [25, 35], phos: [200, 300],  k: [0.30, 0.50], ca: [5.0, 6.0], mg: [1.5, 2.0] },
  배:      { pH: [5.5, 6.5], om: [25, 35], phos: [200, 300],  k: [0.30, 0.50], ca: [5.0, 6.0], mg: [1.5, 2.0] },
  감:      { pH: [5.5, 6.5], om: [25, 35], phos: [200, 300],  k: [0.30, 0.50], ca: [5.0, 6.0], mg: [1.5, 2.0] },
  수박:    { pH: [5.5, 7.0], om: [20, 30], phos: [300, 450],  k: [0.50, 0.70], ca: [5.0, 6.0], mg: [1.5, 2.0] },
  참외:    { pH: [6.0, 7.0], om: [20, 30], phos: [300, 450],  k: [0.50, 0.70], ca: [5.0, 6.0], mg: [1.5, 2.0] },
  상추:    { pH: [6.0, 7.0], om: [25, 35], phos: [350, 500],  k: [0.50, 0.70], ca: [5.0, 6.0], mg: [1.5, 2.0] },
  시금치:  { pH: [6.5, 7.5], om: [25, 35], phos: [350, 500],  k: [0.50, 0.70], ca: [5.5, 7.0], mg: [1.5, 2.0] },
  무:      { pH: [6.0, 7.0], om: [20, 30], phos: [300, 450],  k: [0.50, 0.70], ca: [5.0, 6.0], mg: [1.5, 2.0] },
};

// 강수 민감도: [가뭄(0mm) 점수, 과다(>20mm) 점수] — 적당한 비(1~20mm)는 1.0
const RAIN_RATE = {
  default: [0.85, 0.70],
  벼:      [0.90, 0.90],  // 논작물 — 담수 관리로 가뭄 일부 커버, 과우에도 강함
  콩:      [0.85, 0.85],  // 뿌리혹박테리아 활성에 수분 유리
  들깨:    [0.85, 0.85],
  참깨:    [0.85, 0.60],  // 습해에 매우 약함 — 과습 시 역병·줄기썩음 급증
  감자:    [0.80, 0.60],  // 가뭄·과습 모두 취약 — 역병(Phytophthora) 폭발적 발생
  마늘:    [0.85, 0.65],  // 인편 비대기 과습 → 부패 직결
  양파:    [0.85, 0.65],
  사과:    [0.85, 0.65],  // 개화기·수확기 강우 → 탄저병·과실 균열
  포도:    [0.80, 0.60],  // 가뭄·과습 모두 취약 — 노균병·잿빛곰팡이 강우와 직결
  복숭아:  [0.85, 0.65],
  배:      [0.85, 0.65],
  딸기:    [0.85, 0.65],  // 잿빛곰팡이 습도 민감
  수박:    [0.85, 0.65],  // 과습 → 탄저병·당도 저하
  참외:    [0.85, 0.65],
};

// 병해충 감점 민감도: warn = '조금' 감점, alert = '심함' 감점
const PEST_SENSITIVITY = {
  default: { warn: 0.10, alert: 0.20 },
  벼:      { warn: 0.12, alert: 0.26 }, // 도열병·흰잎마름병 — 한 번 발생 시 수량 회복 불가
  사과:    { warn: 0.12, alert: 0.28 }, // 병해충이 과실 품질·상품성 직결
  포도:    { warn: 0.12, alert: 0.28 }, // 노균병 전파 속도 빠름
  딸기:    { warn: 0.12, alert: 0.26 }, // 잿빛곰팡이 — 수확 직전 치명
  고추:    { warn: 0.12, alert: 0.26 }, // 탄저병 — 수확기 급속 전파
  복숭아:  { warn: 0.12, alert: 0.26 },
  배:      { warn: 0.12, alert: 0.26 },
  토마토:  { warn: 0.12, alert: 0.26 },
  감자:    { warn: 0.10, alert: 0.22 }, // 역병 포함
  오이:    { warn: 0.10, alert: 0.22 },
  감:      { warn: 0.10, alert: 0.22 },
  콩:      { warn: 0.08, alert: 0.16 }, // 단기 피해 흡수 가능, 회복력 있음
  상추:    { warn: 0.08, alert: 0.16 }, // 빠른 수확 주기로 회복 가능
  시금치:  { warn: 0.08, alert: 0.16 },
  마늘:    { warn: 0.08, alert: 0.18 }, // 비교적 강건한 작물
  양파:    { warn: 0.08, alert: 0.18 },
  고구마:  { warn: 0.08, alert: 0.18 },
  옥수수:  { warn: 0.08, alert: 0.18 },
  참깨:    { warn: 0.08, alert: 0.18 },
  들깨:    { warn: 0.08, alert: 0.18 },
  무:      { warn: 0.08, alert: 0.18 },
  수박:    { warn: 0.10, alert: 0.20 },
  참외:    { warn: 0.10, alert: 0.20 },
};

function clamp01(v) { return Math.max(0, Math.min(1, v)); }

// 적정 범위 내 1.0, 범위 밖은 절반 폭만큼 나가면 0
function soilItemScore(val, low, high) {
  if (val >= low && val <= high) return 1.0;
  const half = (high - low) / 2;
  return val < low ? clamp01(1 - (low - val) / half) : clamp01(1 - (val - high) / half);
}

function calcSoilRate(soil, crop) {
  if (!soil) return 0;
  const c = SOIL_CRITERIA[crop] ?? SOIL_CRITERIA.default;
  const scores = [
    soilItemScore(soil.pH,   c.pH[0],   c.pH[1]),
    soilItemScore(soil.om,   c.om[0],   c.om[1]),
    soilItemScore(soil.phos, c.phos[0], c.phos[1]),
    soilItemScore(soil.k,    c.k[0],    c.k[1]),
    soilItemScore(soil.ca,   c.ca[0],   c.ca[1]),
    soilItemScore(soil.mg,   c.mg[0],   c.mg[1]),
  ];
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function calcWeatherRate(weather, crop) {
  if (!weather?.today) return 0;
  const { min, max } = CROP_TEMP[crop] ?? { min: 15, max: 30 };
  const mid = (min + max) / 2;
  const temp = weather.today.temp;
  const tempRate = temp >= min && temp <= max
    ? 1 - Math.abs(temp - mid) / (max - mid) * 0.3
    : temp < min ? clamp01(1 - (min - temp) / 10) : clamp01(1 - (temp - max) / 10);
  const [dryRate, heavyRate] = RAIN_RATE[crop] ?? RAIN_RATE.default;
  const rainRate = weather.today.rain > 20 ? heavyRate : weather.today.rain > 0 ? 1.0 : dryRate;
  return tempRate * 0.7 + rainRate * 0.3;
}

function calcPestRate(pests, crop) {
  if (!pests || pests.length === 0) return 1;
  const { warn, alert } = PEST_SENSITIVITY[crop] ?? PEST_SENSITIVITY.default;
  const penalty = { 0: 0, 1: warn, 2: alert };
  return clamp01(1 - pests.reduce((s, p) => s + (penalty[p.level] ?? 0), 0));
}

function buildGuidelines(soil, weather, pests, crop) {
  const items = [];

  // ── 병해충 ──
  if (pests && pests.length > 0) {
    pests.filter(p => p.level >= 1).forEach(p => {
      items.push({ type: 'pest', level: p.level >= 2 ? 2 : 1, icon: p.level >= 2 ? '🚨' : '⚠️',
        title: `${p.name} — 방제 필요`, desc: p.action,
        time: '오늘 · 관찰 증상 기반', badge: p.status, badgeCls: p.level >= 2 ? 'gb-alert' : 'gb-warn' });
    });
  } else {
    items.push({ type: 'pest', level: 0, icon: '✅',
      title: `${crop} 병해충 이상 없음`,
      desc: '현재까지 관찰된 병해충 증상이 없습니다. 예방 차원에서 포장을 정기적으로 순시하세요.',
      time: '오늘 · 자가진단 기반', badge: '이상없음', badgeCls: 'gb-ok' });
  }

  // ── 기상 ──
  if (weather?.today) {
    const temp = weather.today.temp;
    const rain = weather.today.rain ?? 0;
    const { min, max } = CROP_TEMP[crop] ?? { min: 15, max: 30 };
    const [, heavyRate] = RAIN_RATE[crop] ?? RAIN_RATE.default;

    if (temp < min - 5) {
      items.push({ type: 'weather', level: 2, icon: '🥶', title: `저온 경보 — 현재 ${temp}°C`,
        desc: `${crop} 최저 생육온도(${min}°C)보다 크게 낮습니다. 보온 덮개·부직포를 즉시 씌우고 관수 동파에 주의하세요.`,
        time: '오늘', badge: '경보', badgeCls: 'gb-alert' });
    } else if (temp < min) {
      items.push({ type: 'weather', level: 1, icon: '🌡️', title: `저온 주의 — 현재 ${temp}°C`,
        desc: `${crop} 생육 하한(${min}°C)에 근접했습니다. 야간 보온 관리를 강화하고 새벽 기온 변화를 확인하세요.`,
        time: '오늘', badge: '주의', badgeCls: 'gb-warn' });
    } else if (temp > max + 5) {
      items.push({ type: 'weather', level: 2, icon: '🔥', title: `고온 경보 — 현재 ${temp}°C`,
        desc: `${crop} 최고 생육온도(${max}°C)를 ${temp - max}°C 초과했습니다. 차광망 설치와 오전·오후 관수로 지온을 낮추세요.`,
        time: '오늘', badge: '경보', badgeCls: 'gb-alert' });
    } else if (temp > max) {
      items.push({ type: 'weather', level: 1, icon: '☀️', title: `고온 주의 — 현재 ${temp}°C`,
        desc: `${crop} 생육 상한(${max}°C)을 초과했습니다. 환기를 늘리고 충분히 관수하세요.`,
        time: '오늘', badge: '주의', badgeCls: 'gb-warn' });
    } else {
      items.push({ type: 'weather', level: 0, icon: '✅', title: `기온 적정 — ${temp}°C`,
        desc: `${crop} 생육에 알맞은 기온입니다 (적정 ${min}~${max}°C). 오늘 포장 관리 작업을 진행하기 좋습니다.`,
        time: '오늘', badge: '적정', badgeCls: 'gb-ok' });
    }

    const rainDescHeavy = {
      벼: '논 수위를 확인하고 과잉 담수 시 즉시 배수하세요. 강우 후 도열병·흰잎마름병 발생을 주의 깊게 관찰하세요.',
      참깨: '과습에 매우 취약합니다. 즉시 배수로를 정비하고 역병·줄기썩음병 예방 살균제를 살포하세요.',
      감자: '강우 후 48시간 이내 역병(Phytophthora) 발생 위험이 높습니다. 예방 살균제를 즉시 살포하세요.',
      포도: '강우 후 노균병·잿빛곰팡이 발생 위험이 높습니다. 봉지 씌우기 상태와 과방 병반을 즉시 확인하세요.',
      사과: '강우 후 탄저병·점무늬낙엽병 발생 위험이 높습니다. 비 그친 후 즉시 살균제를 살포하세요.',
      마늘: '인편 비대기 과습 시 부패 직결입니다. 즉시 배수하고 멀칭 상태를 점검하세요.',
      양파: '인경 비대기 과습 시 무름병 위험이 높습니다. 배수로를 정비하고 토양 통기를 확보하세요.',
      딸기: '잿빛곰팡이 발생 위험이 높습니다. 시설 내 습도를 낮추고 예방 살균제를 살포하세요.',
    };
    const rainDescLight = {
      참깨: '소량 강우라도 과습 징후를 확인하세요. 배수 상태를 점검하세요.',
      감자: '비 뒤 잎의 수침상 병반 발생 여부를 확인하세요.',
      포도: '봉지 씌우기가 안 된 과방은 비 뒤 병해 발생 여부를 관찰하세요.',
    };
    const rainDescDry = {
      벼: '맑은 날씨입니다. 논 수위를 유지하고 분얼기에 적정 수심(5~7cm)을 확보하세요.',
      딸기: '건조한 날씨입니다. 점적 관수로 뿌리에 직접 수분을 공급하고 과습은 피하세요.',
      상추: '건조한 날씨가 지속되면 잎이 단단해집니다. 오전에 관수를 실시하세요.',
      시금치: '건조 시 잎이 억세집니다. 표토가 마르기 전에 관수하세요.',
    };

    if (rain > 20) {
      const desc = rainDescHeavy[crop] ?? `강수량이 많습니다 (${rain}mm). 포장 배수로를 즉시 점검하고 물이 고이지 않도록 정비하세요.`;
      const lv = heavyRate < 0.7 ? 2 : 1;
      items.push({ type: 'weather', level: lv, icon: '🌧️', title: `강수 많음 — ${rain}mm`,
        desc, time: '오늘', badge: lv >= 2 ? '경계' : '주의', badgeCls: lv >= 2 ? 'gb-alert' : 'gb-warn' });
    } else if (rain > 0) {
      const desc = rainDescLight[crop] ?? `가벼운 비가 내렸습니다 (${rain}mm). 토양 과습 여부를 확인하고 작업 계획을 조정하세요.`;
      items.push({ type: 'weather', level: 0, icon: '🌦️', title: `소량 강수 — ${rain}mm`,
        desc, time: '오늘', badge: '확인', badgeCls: 'gb-warn' });
    } else {
      const desc = rainDescDry[crop] ?? `맑은 날씨입니다. 토양 수분을 확인하고 필요 시 관수하세요.`;
      items.push({ type: 'weather', level: 0, icon: '☀️', title: '맑음 — 강수 없음',
        desc, time: '오늘', badge: '맑음', badgeCls: 'gb-ok' });
    }

    if (weather.forecast?.[1]) {
      const f = weather.forecast[1];
      const isRain = f.sky === '🌧️';
      items.push({ type: 'weather', level: isRain ? 1 : 0, icon: isRain ? '🌧️' : '📅',
        title: `내일 ${f.low}~${f.high}°C · ${isRain ? '강수 예상' : '맑음'}`,
        desc: isRain
          ? `내일 강수가 예상됩니다. 방제·시비 등 실외 작업은 오늘 완료하거나 모레로 미루세요. 배수로를 사전에 점검하세요.`
          : `내일은 강수 없이 ${f.low}~${f.high}°C 예상됩니다. ${crop} 방제·시비 작업에 적합한 날씨입니다.`,
        time: '내일', badge: isRain ? '주의' : '적합', badgeCls: isRain ? 'gb-warn' : 'gb-ok' });
    }
  }

  // ── 토양 ──
  if (soil) {
    const c = SOIL_CRITERIA[crop] ?? SOIL_CRITERIA.default;
    const soilParams = [
      { name: '산도(pH)', st: soil.phStatus,
        low:  `토양이 산성입니다 (현재 pH ${soil.pH}, ${crop} 적정 ${c.pH[0]}~${c.pH[1]}). 소석회 200~300kg/10a를 시용해 산도를 교정하세요.`,
        high: `토양이 알칼리성입니다 (현재 pH ${soil.pH}, ${crop} 적정 ${c.pH[0]}~${c.pH[1]}). 황산암모늄이나 황 성분 비료를 이용해 pH를 낮추세요.` },
      { name: '유기물', st: soil.omStatus,
        low:  `유기물 함량이 부족합니다 (현재 ${soil.om}g/kg, 적정 ${c.om[0]}~${c.om[1]}g/kg). 완숙 퇴비 1,000~2,000kg/10a를 가을에 투입하세요.`,
        high: `유기물 함량이 높습니다 (현재 ${soil.om}g/kg). 질소 과잉을 유발할 수 있으므로 질소 비료 투입량을 줄이세요.` },
      { name: '유효인산', st: soil.pStatus,
        low:  `유효인산이 부족합니다 (현재 ${soil.phos}mg/kg, 적정 ${c.phos[0]}~${c.phos[1]}mg/kg). 과인산석회 또는 용과린을 추가 시용하세요.`,
        high: `유효인산이 과다합니다 (현재 ${soil.phos}mg/kg, 적정 ${c.phos[0]}~${c.phos[1]}mg/kg). 인산 비료 투입을 중단하고 심경으로 토양을 희석하세요.` },
      { name: '칼륨', st: soil.kStatus,
        low:  `칼륨이 부족합니다 (현재 ${soil.k}cmol/kg, 적정 ${c.k[0]}~${c.k[1]}cmol/kg). 황산칼리 비료를 추가 시용하세요.`,
        high: `칼륨이 과다합니다 (현재 ${soil.k}cmol/kg). 칼리 비료 투입을 중단하고 칼슘·마그네슘과의 균형을 점검하세요.` },
      { name: '칼슘', st: soil.caStatus,
        low:  `칼슘이 부족합니다 (현재 ${soil.ca}cmol/kg, 적정 ${c.ca[0]}~${c.ca[1]}cmol/kg). 석회 시용 또는 칼슘 엽면시비를 실시하세요.`,
        high: `칼슘이 과다합니다 (현재 ${soil.ca}cmol/kg). 석회 시용을 중단하고 다른 양이온과의 균형을 점검하세요.` },
      { name: '마그네슘', st: soil.mgStatus,
        low:  `마그네슘이 부족합니다 (현재 ${soil.mg}cmol/kg, 적정 ${c.mg[0]}~${c.mg[1]}cmol/kg). 황산마그네슘(고토석회) 40~50kg/10a를 시용하거나 2% 황산마그네슘 수용액을 엽면시비하세요.`,
        high: `마그네슘이 과다합니다 (현재 ${soil.mg}cmol/kg). 칼슘·칼륨과 길항 관계로 흡수가 저해될 수 있습니다. 마그네슘 함유 비료 투입을 중단하고 칼슘·칼륨과의 균형을 점검하세요.` },
    ];

    let okCount = 0;
    soilParams.forEach(p => {
      if (p.st === '부족' && p.low) {
        items.push({ type: 'soil', level: 1, icon: '🌱', title: `토양 ${p.name} 부족`, desc: p.low,
          time: soil.mock ? '' : `${soil.examYear}년 검정 기준`, badge: '부족', badgeCls: 'gb-warn' });
      } else if (p.st === '과다' && p.high) {
        items.push({ type: 'soil', level: 1, icon: '⚠️', title: `토양 ${p.name} 과다`, desc: p.high,
          time: soil.mock ? '' : `${soil.examYear}년 검정 기준`, badge: '과다', badgeCls: 'gb-warn' });
      } else {
        okCount++;
      }
    });

    if (okCount === soilParams.length) {
      items.push({ type: 'soil', level: 0, icon: '🌱', title: '토양 상태 양호',
        desc: `${crop} 재배에 적합한 토양 상태입니다. 현재 비료 처방을 유지하고 2~3년 주기로 토양 재검정을 권장합니다.`,
        time: soil.mock ? '' : `${soil.examYear}년 검정 기준`, badge: '양호', badgeCls: 'gb-ok' });
    }

    if (soil.fertilizer) {
      items.push({ type: 'soil', level: 0, icon: '💧', title: '시비 처방 (토양 검정 기반)',
        desc: soil.mock ? '토양검정 이력이 없으면 지역별 평균값이 표시됩니다.' : `${soil.examYear}년 토양 검정 결과를 바탕으로 산출된 비료 투입 기준입니다.`,
        time: soil.mock ? '' : `${soil.examYear}년 검정 기준`, badge: '처방', badgeCls: 'gb-ok',
        fertilizer: soil.fertilizer });
    }
  }

  items.sort((a, b) => b.level - a.level);
  return items;
}

function calcScore(soil, weather, pest, crop) {
  const w = SCORE_WEIGHTS[crop] ?? { soil: 33, weather: 34, pest: 33 };
  const soilScore    = soil    ? Math.round(w.soil    * calcSoilRate(soil, crop))     : 0;
  const weatherScore = weather ? Math.round(w.weather * calcWeatherRate(weather, crop)) : 0;
  const pestScore    = pest    ? Math.round(w.pest    * calcPestRate(pest, crop))      : 0;
  return { total: soilScore + weatherScore + pestScore, soilScore, weatherScore, pestScore, w };
}

function statusColor(s) {
  if (s === '적정') return 's-good';
  if (s === '부족' || s === '과다') return 's-warn';
  return '';
}


function cropEmoji(name) {
  return CROPS.find(c => c.name === name)?.emoji ?? '🌱';
}

export default function Home() {
  const today = new Date();
  const todayStr = `${today.getMonth() + 1}월 ${today.getDate()}일`;

  // 농지 목록 (저장 가능)
  const [farms, setFarms] = useState(DEFAULT_FARMS);

  // 현재 활성 컨텍스트 — 목록 클릭 or 검색 선택 어디서든 설정
  const [active, setActive] = useState(DEFAULT_FARMS[0]);

  // 검색 패널 상태
  const [searchQuery,    setSearchQuery]    = useState('');
  const [searchResults,  setSearchResults]  = useState([]);
  const [showResults,   setShowResults]   = useState(false);
  const [showMap,       setShowMap]       = useState(false);
  const [pickedParcel,  setPickedParcel]  = useState(null);  // 검색에서 선택한 필지
  const [pickedCrop,    setPickedCrop]    = useState(null);  // 해당 필지의 작물

  // 데이터
  const [weather,    setWeather]    = useState(null);
  const [soil,       setSoil]       = useState(null);
  const [pests,         setPests]         = useState([]);
  const [symptomLevels, setSymptomLevels] = useState({});
  const [loading,    setLoading]    = useState(false);
  // 토양 직접 입력
  const [soilInputOpen, setSoilInputOpen] = useState(false);
  const [soilManual, setSoilManual] = useState({ pH: '', om: '', phos: '', k: '', ca: '', mg: '' });
  // 농작물 상태 수정 패널
  const [editingSymptoms, setEditingSymptoms] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const scoreFgRef    = useRef(null);
  const barRefs       = useRef([]);
  const soilManualRef = useRef(null);
  const stepTwoRef  = useRef(null);
  const scoreRef    = useRef(null);
  const R = 45, CIRC = 2 * Math.PI * R;
  const score = calcScore(soil, weather, pests, active.crop);
  const gradeLabel = score.total >= 90 ? '매우 좋음' : score.total >= 75 ? '좋음' : score.total >= 60 ? '보통' : '주의';

  // 마운트 후 localStorage에서 농지 목록 복원
  useEffect(() => {
    try {
      const saved = localStorage.getItem('farmscope_farms');
      if (saved) {
        const list = JSON.parse(saved);
        if (list.length > 0) setFarms(list);
      }
    } catch {}
  }, []);

  // 농지 목록 변경 시 localStorage 저장 (초기 DEFAULT 제외)
  useEffect(() => {
    try { localStorage.setItem('farmscope_farms', JSON.stringify(farms)); } catch {}
  }, [farms]);

  // 초기 로드 없음 — 농지 카드 클릭 시에만 데이터 로드

  // 농지 전환 시 토양 수동 입력 초기화
  useEffect(() => {
    soilManualRef.current = null;
    setSoilManual({ pH: '', om: '', phos: '', k: '', ca: '', mg: '' });
    setSoilInputOpen(false);
  }, [active]);

  // 새 필지 선택 시 토양 직접 입력 초기화 (Step 4와 정보 수정 패널 독립)
  useEffect(() => {
    setSoilManual({ pH: '', om: '', phos: '', k: '', ca: '', mg: '' });
    setSoilInputOpen(false);
  }, [pickedParcel]);

  // 새 필지 선택 시 증상 초기화 (저장된 농지 카드 클릭 시에는 초기화 안 함)
  useEffect(() => {
    if (pickedParcel) setSymptomLevels({});
  }, [pickedParcel]);

  // symptomLevels 변경 시 pests 계산
  useEffect(() => {
    const symptoms = SYMPTOMS[active.crop] ?? DEFAULT_SYMPTOMS;
    const result = [];
    symptoms.forEach(s => {
      const level = symptomLevels[s.id] ?? 0;
      if (level > 0) {
        s.pests.forEach(p => {
          if (!result.find(r => r.name === p.name)) {
            result.push({ name: p.name, level, status: level === 1 ? '주의' : '경계', action: p.action });
          }
        });
      }
    });
    setPests(result);
  }, [symptomLevels, active.crop]);

  // 점수 원 애니메이션
  useEffect(() => {
    if (!scoreFgRef.current) return;
    scoreFgRef.current.style.strokeDashoffset = CIRC - (score.total / 100) * CIRC;
    barRefs.current.forEach(el => { if (el) el.style.width = el.dataset.target; });
  }, [score.total]);

  function soilStatus(val, low, high) {
    if (val < low) return '부족';
    if (val > high) return '과다';
    return '적정';
  }

  function applySoilInput() {
    const pH   = parseFloat(soilManual.pH);
    const om   = parseFloat(soilManual.om);
    const phos = parseFloat(soilManual.phos);
    const k    = parseFloat(soilManual.k);
    const ca   = parseFloat(soilManual.ca);
    const mg   = parseFloat(soilManual.mg);
    if ([pH, om, phos, k, ca, mg].some(isNaN)) return;
    const c = SOIL_CRITERIA[active.crop] ?? SOIL_CRITERIA.default;
    const manual = {
      examYear: new Date().getFullYear().toString(),
      pH,   phStatus: soilStatus(pH,   c.pH[0],   c.pH[1]),
      om,   omStatus: soilStatus(om,   c.om[0],   c.om[1]),
      phos, pStatus:  soilStatus(phos, c.phos[0], c.phos[1]),
      k,    kStatus:  soilStatus(k,    c.k[0],    c.k[1]),
      ca,   caStatus: soilStatus(ca,   c.ca[0],   c.ca[1]),
      mg,   mgStatus: soilStatus(mg,   c.mg[0],   c.mg[1]),
      fertilizer: { N: 9, P: 4.5, K: 5.7 },
      mock: false, manual: true,
    };
    soilManualRef.current = manual;
    setSoil(manual);
    setSoilInputOpen(false);
  }

  function registerFarm() {
    if (!pickedParcel || !pickedCrop) return;
    const ctx = {
      name:    pickedParcel.address,
      loc:     pickedParcel.address,
      crop:    pickedCrop,
      emoji:   cropEmoji(pickedCrop),
      type:    pickedParcel.type,
      pnu:     pickedParcel.pnu,
      bjdCode: pickedParcel.bjdCode,
      lat:     pickedParcel.lat,
      lon:     pickedParcel.lon,
      region:  pickedParcel.region,
    };
    const alreadySaved = farms.some(f => {
      const sameLocation = f.pnu && pickedParcel.pnu
        ? f.pnu === pickedParcel.pnu
        : f.loc === pickedParcel.address;
      return sameLocation && f.crop === pickedCrop;
    });
    if (!alreadySaved) {
      const nextId = farms.length + 1;
      setFarms(prev => [...prev, {
        id: nextId, name: `${nextId}번 ${pickedParcel.type}`,
        loc: pickedParcel.address, crop: pickedCrop, emoji: cropEmoji(pickedCrop),
        type: pickedParcel.type, pnu: pickedParcel.pnu,
        lat: pickedParcel.lat, lon: pickedParcel.lon, region: pickedParcel.region,
        symptomLevels: { ...symptomLevels },
      }]);
    }
    setActive(ctx);
    fetchData(ctx);
    setIsReady(true);
    setPickedParcel(null);
    setPickedCrop(null);
    setShowResults(false);
    setShowMap(false);
    setTimeout(() => scoreRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
  }

  async function fetchData(ctx) {
    setLoading(true);
    setWeather(null); setSoil(null);
    try {
      const [w, s] = await Promise.all([
        fetch(`/api/weather?lat=${ctx.lat}&lon=${ctx.lon}`).then(r => r.json()),
        fetch(`/api/soil?pnu=${ctx.pnu}&bjdCode=${ctx.bjdCode ?? ''}&type=${encodeURIComponent(ctx.type ?? '')}&crop=${encodeURIComponent(ctx.crop ?? '')}`).then(r => r.json()),
      ]);
      setWeather(w);
      setSoil(soilManualRef.current ?? s);
    } catch {}
    setLoading(false);
  }

  // 필지 선택 시 Step 2로 자동 스크롤
  useEffect(() => {
    if (pickedParcel && stepTwoRef.current) {
      stepTwoRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [pickedParcel]);


  function pickFarm(farm) {
    setActive(farm);
    setPickedParcel(null);
    setPickedCrop(null);
    setSymptomLevels(farm.symptomLevels ?? {});
    setEditingSymptoms(false);
    setIsReady(true);
    fetchData(farm);
    setTimeout(() => scoreRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
  }

  function deleteFarm(e, id) {
    e.stopPropagation();
    const remaining = farms.filter(f => f.id !== id);
    setFarms(remaining);
    if (active.id === id || active.pnu === farms.find(f => f.id === id)?.pnu) {
      setActive({});
      setIsReady(false);
    }
  }

  async function searchAddr() {
    if (!searchQuery.trim()) return;
    setPickedParcel(null); setPickedCrop(null);
    try {
      const res  = await fetch(`/api/address?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.results ?? []);
    } catch {}
    setShowResults(true); setShowMap(true);
  }


  function saveSymptoms() {
    setFarms(prev => prev.map(f =>
      f.pnu === active.pnu && f.crop === active.crop
        ? { ...f, symptomLevels: { ...symptomLevels } }
        : f
    ));
    setEditingSymptoms(false);
  }


  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="logo" onClick={() => window.location.reload()} style={{ cursor: 'pointer' }}>
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <line x1="13" y1="22" x2="13" y2="10" stroke="#7dbf82" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M13 16 C12 13 9 11 6 12 C7 15 10 17 13 16Z" fill="#5da462"/>
            <path d="M13 12 C14 9 17 7 20 8 C19 11 16 13 13 12Z" fill="#4e7c52"/>
            <ellipse cx="13" cy="22" rx="4" ry="1.2" fill="#2a3d2a"/>
          </svg>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span className="logo-text">팜스코프</span>
            <span className="logo-sub">FARMSCOPE</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="icon-btn">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a5 5 0 00-5 5v3l-1.5 2H14.5L13 9V6a5 5 0 00-5-5zm0 13a2 2 0 01-2-2h4a2 2 0 01-2 2z"/></svg>
          </button>
          <button className="icon-btn">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v8M5 6l3-4 3 4M3 11v2h10v-2"/></svg>
          </button>
          <button className="icon-btn">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M11.5 4.5l1.4-1.4M3.1 12.9l1.4-1.4"/></svg>
          </button>
        </div>
      </header>

      <div className="main">

        {/* ─── 내 농지 점수 찾기 ─── */}
        <div className="search-panel">
          <div className="search-panel-title">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#7dbf82" strokeWidth="1.5">
              <path d="M8 1C5.24 1 3 3.24 3 6c0 4 5 9 5 9s5-5 5-9c0-2.76-2.24-5-5-5z"/>
              <circle cx="8" cy="6" r="1.5"/>
            </svg>
            내 농지 등록하기
          </div>
          <div className="soil-apply-hint" style={{ marginBottom: 8 }}>
            ※ 아직 토양검정을 받지 않으셨다면 가까운 농업기술센터에 신청하세요&nbsp;·&nbsp;
            <a href="https://soil.rda.go.kr" target="_blank" rel="noreferrer">흙토람 바로가기</a>
          </div>

          {/* ── 가로 스텝 표시 ── */}
          <div className="stepper">
            <div className="step-item">
              <div className={`step-num ${!showResults ? 'idle' : pickedParcel ? 'done' : 'active'}`}>1</div>
              <span className={`step-text ${!showResults ? 'idle' : pickedParcel ? 'done' : 'active'}`}>필지</span>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item">
              <div className={`step-num ${!pickedParcel ? 'idle' : pickedCrop ? 'done' : 'active'}`}>2</div>
              <span className={`step-text ${!pickedParcel ? 'idle' : pickedCrop ? 'done' : 'active'}`}>작물</span>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item">
              <div className={`step-num ${!pickedCrop ? 'idle' : 'active'}`}>3</div>
              <span className={`step-text ${!pickedCrop ? 'idle' : 'active'}`}>농작물 상태</span>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item">
              <div className={`step-num ${pickedCrop && !loading ? 'active' : 'idle'}`}>4</div>
              <span className={`step-text ${pickedCrop && !loading ? 'active' : 'idle'}`}>등록</span>
            </div>
          </div>

          {/* 주소 검색 */}
          <div className="search-row">
            <div className="search-input-wrap">
              <div className="search-icon">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="4"/><path d="M10.5 10.5l3 3"/></svg>
              </div>
              <input
                className="search-input"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchAddr()}
                placeholder="예) 충남 논산시 연산면 고정리"
              />
            </div>
            <button className="btn-primary" onClick={searchAddr}>검색</button>
          </div>

          {/* 검색 결과 목록 */}
          {showResults && searchResults.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                검색된 필지 — 목록 또는 지도에서 선택하세요
              </div>
              {searchResults.map((r, i) => (
                <div
                  key={i}
                  className={`search-result-item${pickedParcel === r ? ' selected' : ''}`}
                  onClick={() => { setPickedParcel(r); setPickedCrop(null); }}
                >
                  <div style={{ fontSize: 16 }}>
                    {r.type === '논' ? '🌾' : r.type === '밭' ? '🥬' : r.type === '과수원' ? '🍎' : '🏡'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="result-main">{r.address}</div>
                    <div className="result-sub">{r.type} · {r.area}</div>
                  </div>
                  {pickedParcel === r
                    ? <div style={{ fontSize: 11, color: 'var(--green-text)', fontWeight: 600 }}>선택됨 ✓</div>
                    : <div className="result-badge">{r.type}</div>
                  }
                </div>
              ))}
            </div>
          )}

          {/* 지도 — 실제 지도 (OpenStreetMap) */}
          {showMap && searchResults.length > 0 && (
            <div className="map-wrap" style={{ marginTop: 10 }}>
              <MapView
                results={searchResults}
                picked={pickedParcel}
                onPick={(r) => { setPickedParcel(r); setPickedCrop(null); }}
              />
              <div className="map-bar">
                <div>
                  {pickedParcel
                    ? <strong style={{ color: 'var(--text-primary)' }}>{pickedParcel.address}</strong>
                    : <span style={{ color: 'var(--text-muted)' }}>핀을 클릭해서 필지를 선택하세요</span>
                  }
                </div>
                {pickedParcel && <div className="map-pnu">PNU: {pickedParcel.pnu}</div>}
              </div>
            </div>
          )}

          {/* Step 2–4 (필지 선택 후 노출) */}
          {pickedParcel && (
            <div ref={stepTwoRef} className="crop-picker slide-down">

              {/* ── Step 2: 작물 선택 ── */}
              <div className="crop-picker-title" style={{ marginBottom: 10 }}>
                <span className="step-badge">2</span>
                재배 작물을 선택하세요
              </div>
              <div className="crop-btn-grid" style={{ maxHeight: '220px', overflowY: 'auto', paddingRight: '2px' }}>
                {CROPS.map(c => (
                  <button
                    key={c.name}
                    className={`crop-btn${pickedCrop === c.name ? ' selected' : ''}`}
                    onClick={() => setPickedCrop(c.name)}
                  >
                    <span className="crop-btn-emoji">{c.emoji}</span>
                    {c.name}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, textAlign: 'center' }}>
                찾는 작물이 없으신가요?&nbsp;
                <a href="mailto:ekgmleowkd@gmail.com" style={{ color: 'var(--green-text)', textDecoration: 'underline' }}>문의하기</a>
              </div>

              {/* ── Step 3: 농작물 상태 자가진단 ── */}
              {pickedCrop && (
                <div className="symptom-section slide-down">
                  <div className="crop-picker-title" style={{ marginTop: 16 }}>
                    <span className="step-badge">3</span>
                    농작물 상태를 확인해주세요
                  </div>
                  <div className="symptom-hint">
                    ▸ 해당 증상이 있으면 선택하세요 · 없으면 그대로 두세요 (이상 없음 처리)
                  </div>
                  <div className="symptom-list">
                    {(SYMPTOMS[pickedCrop] ?? DEFAULT_SYMPTOMS).map(s => {
                      const level = symptomLevels[s.id] ?? 0;
                      return (
                        <div className={`symptom-row${level > 0 ? ' has-symptom' : ''}`} key={s.id}>
                          <div className="symptom-label">{s.label}</div>
                          <div className="symptom-btns">
                            {[{ l: 0, text: '없음' }, { l: 1, text: '조금' }, { l: 2, text: '심함' }].map(opt => (
                              <button
                                key={opt.l}
                                className={`symptom-btn${
                                  level === opt.l
                                    ? opt.l === 0 ? ' sb-none' : opt.l === 1 ? ' sb-warn' : ' sb-alert'
                                    : ''
                                }`}
                                onClick={() => setSymptomLevels(prev => ({ ...prev, [s.id]: opt.l }))}
                              >
                                {opt.text}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
                    ※ 농촌진흥청 농작물 병해충 발생정보를 바탕으로 구성했으며, 시기별 유행 병해를 반영해 주기적으로 업데이트합니다.
                  </div>

                  {/* ── Step 4: 점수 확인 ── */}
                  <div className="step4-wrap">

                    {/* 토양 직접 입력 (선택) */}
                    <div style={{ marginBottom: 12 }}>
                      <button className="soil-direct-toggle" onClick={() => setSoilInputOpen(o => !o)}>
                        <span>{soilInputOpen ? '▲' : '▼'}</span>
                        토양 검정 기록 직접 입력하기
                        {soilManualRef.current && <span className="soil-manual-badge">적용됨</span>}
                      </button>
                      <div className="soil-apply-hint">
                        ※ 아직 토양검정을 받지 않으셨다면 가까운 농업기술센터에 신청하세요&nbsp;·&nbsp;
                        <a href="https://soil.rda.go.kr" target="_blank" rel="noreferrer">흙토람 바로가기</a>
                      </div>
                      {soilInputOpen && (
                        <div className="soil-input-body">
                          <div className="soil-input-grid">
                            {[
                              { key: 'pH',   label: 'pH (산도)',  placeholder: '5.5~7.0', unit: 'pH'    },
                              { key: 'om',   label: '유기물',      placeholder: '25~35',   unit: 'g/kg'  },
                              { key: 'phos', label: '유효인산',    placeholder: '80~150',  unit: 'mg/kg' },
                              { key: 'k',    label: '칼륨',        placeholder: '0.3~0.6', unit: 'cmol'  },
                              { key: 'ca',   label: '칼슘',        placeholder: '5.0~6.0', unit: 'cmol'  },
                              { key: 'mg',   label: '마그네슘',    placeholder: '1.5~2.0', unit: 'cmol'  },
                            ].map(f => (
                              <div className="soil-input-field" key={f.key}>
                                <label className="soil-input-label">{f.label}</label>
                                <div className="soil-input-row">
                                  <input
                                    className="soil-input-box"
                                    type="number"
                                    step="any"
                                    value={soilManual[f.key]}
                                    onChange={e => setSoilManual(prev => ({ ...prev, [f.key]: e.target.value }))}
                                    placeholder={f.placeholder}
                                  />
                                  <span className="soil-input-unit">{f.unit}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button
                            className="btn-primary"
                            style={{ width: '100%', marginTop: 10 }}
                            onClick={applySoilInput}
                            disabled={Object.values(soilManual).some(v => v === '')}
                          >
                            적용하기
                          </button>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
                            농업기술센터 토양검정 성적서의 수치를 입력하세요
                          </div>
                        </div>
                      )}
                    </div>

                    {farms.some(f => {
                      const sameLocation = f.pnu && pickedParcel?.pnu
                        ? f.pnu === pickedParcel.pnu
                        : f.loc === pickedParcel?.address;
                      return sameLocation && f.crop === pickedCrop;
                    })
                      ? (
                        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--green-text)', fontWeight: 700, padding: '10px 0', letterSpacing: 0.3 }}>
                          ✓ 이미 등록됨
                        </div>
                      )
                      : (
                        <button
                          className="save-btn"
                          onClick={registerFarm}
                          style={{ width: '100%', background: 'var(--green-accent)', borderColor: 'var(--green-accent)', fontSize: 13, fontWeight: 700 }}
                        >
                          내 농지 등록하기 →
                        </button>
                      )
                    }
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── 내 농지 목록 ─── */}
        <div className="section-title">내 농지 목록</div>
        <div className="farms-grid">
          {farms.map(f => (
            <div
              key={f.id}
              className={`farm-card${active.pnu === f.pnu && active.crop === f.crop && !pickedParcel && isReady ? ' active' : ''}`}
              onClick={() => pickFarm(f)}
              style={{ position: 'relative' }}
            >
              <div
                className="farm-card-delete"
                onClick={e => deleteFarm(e, f.id)}
                style={{ position: 'absolute', top: 5, right: 6 }}
              >×</div>
              <div className="farm-num">{f.name}</div>
              <div className="farm-loc">{f.loc}</div>
              <div className="farm-crop"><span>{f.emoji}</span> {f.crop}</div>
            </div>
          ))}
          <div className="farm-add">
            <div style={{ fontSize: 18 }}>＋</div>
            <div>위에서 검색</div>
          </div>
        </div>

        {/* 선택 전 안내 */}
        {!isReady && (
          <div style={{ textAlign: 'center', padding: '52px 16px' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🌾</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)' }}>농지를 선택하세요</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.7 }}>
              위 목록에서 농지 카드를 클릭하면<br/>건강 점수 분석이 시작됩니다
            </div>
          </div>
        )}

        {/* Breadcrumb */}
        {isReady && (<>
        <div className="breadcrumb">
          <span className="crumb-active">{active.name}</span>
          <span style={{ color: 'var(--text-muted)' }}>→</span>
          <span style={{ color: 'var(--text-secondary)' }}>{active.emoji} {active.crop} 기준 건강 리포트</span>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <span className="badge">{active.region}</span>
          <span className="badge">{active.type}</span>
          <span className="badge">{todayStr}</span>
        </div>

        {/* ① 건강 점수 */}
        <div className="score-section" ref={scoreRef}>
          <div className="score-header">{active.emoji} {active.crop} 기준 건강 점수</div>
          <div className="score-body">
            <div className="score-circle-wrap">
              <div className="score-circle">
                <svg viewBox="0 0 110 110">
                  <circle className="score-circle-bg" cx="55" cy="55" r={R} />
                  <circle
                    ref={scoreFgRef}
                    className="score-circle-fg"
                    cx="55" cy="55" r={R}
                    strokeDasharray={CIRC}
                    strokeDashoffset={CIRC}
                  />
                </svg>
                <div className="score-value">
                  <div className={`score-num${loading ? ' loading-pulse' : ''}`}>
                    {loading ? '--' : score.total}
                  </div>
                  <div className="score-total">/ 100</div>
                </div>
              </div>
              <div className="score-grade">{loading ? '…' : gradeLabel}</div>
            </div>

            <div className="score-bars">
              {[
                { label: '토양',   val: score.soilScore,    max: score.w.soil,    cls: 'fill-soil' },
                { label: '기상',   val: score.weatherScore, max: score.w.weather, cls: 'fill-weather' },
                { label: '병해충', val: score.pestScore,    max: score.w.pest,    cls: 'fill-pest' },
              ].map((b, i) => (
                <div className="score-bar-row" key={b.label}>
                  <div className="score-bar-label">{b.label}</div>
                  <div className="score-bar-track">
                    <div
                      ref={el => barRefs.current[i] = el}
                      className={`score-bar-fill ${b.cls}`}
                      style={{ width: '0%' }}
                      data-target={`${score.w[Object.keys(score.w)[i]] > 0 ? Math.round((b.val / b.max) * 100) : 0}%`}
                    />
                  </div>
                  <div className="score-bar-val">{b.val}/{b.max}</div>
                </div>
              ))}

              {soil && (
                <div className="score-note">
                  토양 최적 pH <span className="hl">{(SOIL_CRITERIA[active.crop] ?? SOIL_CRITERIA.default).pH.join('~')}</span>, 현재 <span className="hl">{soil.pH}</span>
                  {weather?.today && (
                    <> · 현재 기온{' '}
                      <span className={weather.today.temp < (CROP_TEMP[active.crop]?.min ?? 15) ? 'wn' : 'hl'}>
                        {weather.today.temp}°C
                      </span>
                    </>
                  )}
                </div>
              )}

              <div className="score-footer">
                <div className="score-pnu">
                  <span>{active.loc}</span>
                  <span className="crop-tag">{active.emoji} {active.crop}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 정보 수정 패널 */}
        {!pickedParcel && (
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}>
            <div style={{ padding: '11px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="var(--green-text)" strokeWidth="1.5"><path d="M11 2l3 3-9 9H2v-3L11 2z"/></svg>
                정보 수정
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>증상·토양 데이터를 업데이트하세요</div>
            </div>
            <div style={{ display: 'flex' }}>
              <button
                style={{ flex: 1, padding: '11px 0', fontSize: 12, fontWeight: 600, background: editingSymptoms ? 'var(--green-accent)' : 'transparent', color: editingSymptoms ? '#fff' : 'var(--text-secondary)', border: 'none', borderRight: '1px solid var(--border)', cursor: 'pointer' }}
                onClick={() => { setEditingSymptoms(o => !o); setSoilInputOpen(false); }}
              >
                🌿 농작물 상태
                {Object.values(symptomLevels).some(v => v > 0) && <span className="soil-manual-badge" style={{ marginLeft: 4 }}>입력됨</span>}
              </button>
              <button
                style={{ flex: 1, padding: '11px 0', fontSize: 12, fontWeight: 600, background: soilInputOpen ? 'var(--green-accent)' : 'transparent', color: soilInputOpen ? '#fff' : 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
                onClick={() => { setSoilInputOpen(o => !o); setEditingSymptoms(false); }}
              >
                🌱 토양 검정 기록
                {soilManualRef.current && <span className="soil-manual-badge" style={{ marginLeft: 4 }}>적용됨</span>}
              </button>
            </div>

            {editingSymptoms && (
              <div style={{ padding: '12px 14px' }}>
                <div className="symptom-hint" style={{ marginBottom: 8 }}>
                  ▸ 해당 증상이 있으면 선택하세요 · 없으면 그대로 두세요
                </div>
                <div className="symptom-list">
                  {(SYMPTOMS[active.crop] ?? DEFAULT_SYMPTOMS).map(s => {
                    const level = symptomLevels[s.id] ?? 0;
                    return (
                      <div className={`symptom-row${level > 0 ? ' has-symptom' : ''}`} key={s.id}>
                        <div className="symptom-label">{s.label}</div>
                        <div className="symptom-btns">
                          {[{ l: 0, text: '없음' }, { l: 1, text: '조금' }, { l: 2, text: '심함' }].map(opt => (
                            <button
                              key={opt.l}
                              className={`symptom-btn${level === opt.l ? opt.l === 0 ? ' sb-none' : opt.l === 1 ? ' sb-warn' : ' sb-alert' : ''}`}
                              onClick={() => setSymptomLevels(prev => ({ ...prev, [s.id]: opt.l }))}
                            >
                              {opt.text}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
                  ※ 농촌진흥청 농작물 병해충 발생정보를 바탕으로 구성했으며, 시기별 유행 병해를 반영해 주기적으로 업데이트합니다.
                </div>
                <button className="btn-primary" style={{ width: '100%', marginTop: 10 }} onClick={saveSymptoms}>
                  저장하기
                </button>
              </div>
            )}

            {soilInputOpen && (
              <div className="soil-input-body" style={{ margin: '0', padding: '8px 12px 4px', borderTop: '1px solid var(--border)', borderRadius: 0 }}>
                <div className="soil-input-grid">
                  {[
                    { key: 'pH',   label: 'pH (산도)',  placeholder: '5.5~7.0', unit: 'pH'    },
                    { key: 'om',   label: '유기물',      placeholder: '25~35',   unit: 'g/kg'  },
                    { key: 'phos', label: '유효인산',    placeholder: '80~150',  unit: 'mg/kg' },
                    { key: 'k',    label: '칼륨',        placeholder: '0.3~0.6', unit: 'cmol'  },
                    { key: 'ca',   label: '칼슘',        placeholder: '5.0~6.0', unit: 'cmol'  },
                    { key: 'mg',   label: '마그네슘',    placeholder: '1.5~2.0', unit: 'cmol'  },
                  ].map(f => (
                    <div className="soil-input-field" key={f.key}>
                      <label className="soil-input-label">{f.label}</label>
                      <div className="soil-input-row">
                        <input
                          className="soil-input-box"
                          type="number"
                          step="any"
                          value={soilManual[f.key]}
                          onChange={e => setSoilManual(prev => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                        />
                        <span className="soil-input-unit">{f.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="btn-primary"
                  style={{ width: '100%', marginTop: 10 }}
                  onClick={applySoilInput}
                  disabled={Object.values(soilManual).some(v => v === '')}
                >
                  적용하기
                </button>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
                  농업기술센터 토양검정 성적서의 수치를 입력하세요
                </div>
              </div>
            )}
          </div>
        )}

        {/* ② 영농 지침 */}
        <div className="guideline-section">
          <div className="section-head">
            <div className="section-head-title">오늘의 영농 지침</div>
            <div className="section-head-sub">지역 맞춤 · {todayStr}</div>
          </div>

          {loading && !soil && !weather ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '12px 0', textAlign: 'center' }} className="loading-pulse">
              데이터 불러오는 중...
            </div>
          ) : (
            buildGuidelines(soil, weather, pests, active.crop).map((item, i) => (
              <div className="guideline-row" key={i}>
                <div className={`guideline-icon ${item.level >= 2 ? 'gi-alert' : item.level === 1 ? 'gi-warn' : item.type === 'soil' ? 'gi-soil' : 'gi-ok'}`}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="guideline-title">{item.title}</div>
                  <div className="guideline-desc">{item.desc}</div>
                  {item.fertilizer && (
                    <div className="fert-mini-grid">
                      {[
                        { val: item.fertilizer.N, unit: 'kg/10a', name: '질소 (N)' },
                        { val: item.fertilizer.P, unit: 'kg/10a', name: '인산 (P₂O₅)' },
                        { val: item.fertilizer.K, unit: 'kg/10a', name: '칼리 (K₂O)' },
                      ].map(f => (
                        <div className="fert-mini-card" key={f.name}>
                          <div className="fert-mini-val">{f.val}</div>
                          <div className="fert-mini-unit">{f.unit}</div>
                          <div className="fert-mini-name">{f.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="guideline-time">{item.time}</div>
                </div>
                <div className={`guideline-badge ${item.badgeCls}`}>{item.badge}</div>
              </div>
            ))
          )}
        </div>

        {/* ③ 기상 */}
        <div>
          <div className="weather-section">
            <div className="section-head">
              <div className="section-head-title">오늘 기상</div>
              <div className="section-head-sub">
                {active.crop} 최적 <span style={{ color: 'var(--yellow)' }}>
                  {CROP_TEMP[active.crop]?.min ?? 15}~{CROP_TEMP[active.crop]?.max ?? 30}°C
                </span>
              </div>
            </div>
            <div className="weather-grid">
              {[
                { val: weather?.today?.temp, unit: '°C', label: '현재 기온', warn: weather?.today?.temp < (CROP_TEMP[active.crop]?.min ?? 15) },
                { val: weather?.today?.rain, unit: 'mm', label: '강수량' },
                { val: weather?.today?.humidity, unit: '%', label: '습도' },
                { emoji: weather?.today?.skyEmoji ?? '☀️', text: weather?.today?.sky ?? '-', label: '날씨' },
              ].map((c, i) => (
                <div className="weather-card" key={i}>
                  {c.emoji ? (
                    <>
                      <div style={{ fontSize: 22 }}>{c.emoji}</div>
                      <div className="weather-label" style={{ marginTop: 4 }}>{c.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.text}</div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                        <span className="weather-val">{loading ? '--' : (c.val ?? '--')}</span>
                        <span className="weather-unit">{c.unit}</span>
                      </div>
                      <div className="weather-label">{c.label}</div>
                      {c.warn && <div style={{ fontSize: 10, color: 'var(--yellow)', marginTop: 2 }}>하한 근접</div>}
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="forecast-title">주간 예보</div>
            {(weather?.forecast ?? []).map((f, i) => {
              const pct = Math.min((f.high - f.low) / 20, 1);
              return (
                <div className="forecast-row" key={i}>
                  <div className="forecast-day">{f.day}</div>
                  <div style={{ fontSize: 11, color: 'var(--blue)', width: 24, textAlign: 'right', flexShrink: 0 }}>{f.low}°</div>
                  <div className="forecast-bar-track">
                    <div className="forecast-bar-fill" style={{ width: `${Math.round(pct * 100)}%` }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--orange)', width: 24, flexShrink: 0 }}>{f.high}°</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>·</div>
                  <div style={{ fontSize: 12, width: 20, flexShrink: 0, textAlign: 'right' }}>{f.sky}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ④ 토양 분석 */}
        {soil && (
          <div className="soil-section">
            <div className="section-head">
              <div className="section-head-title">토양 분석</div>
              <div className="section-head-sub">{!soil.mock && `최근 검정일 ${soil.examYear}.05 · `}{active.crop} 최적 pH {(SOIL_CRITERIA[active.crop] ?? SOIL_CRITERIA.default).pH.join('~')}</div>
            </div>
            <div className="soil-meta">
              토양검정 이력이 없으면 지역별 평균값이 표시됩니다. 농업기술센터에 정밀 신청 시 필지별 실측값이 표시됩니다.
            </div>
            <div className="soil-grid">
              {[
                { val: soil.pH,   unit: 'pH',   name: '산도',    st: soil.phStatus },
                { val: soil.om,   unit: 'g/kg', name: '유기물',  st: soil.omStatus },
                { val: soil.phos, unit: 'mg',   name: '유효인산', st: soil.pStatus  },
                { val: soil.k,    unit: 'cmol', name: '칼륨',    st: soil.kStatus  },
                { val: soil.ca,   unit: 'cmol', name: '칼슘',    st: soil.caStatus },
                { val: soil.mg,   unit: 'cmol', name: '마그네슘', st: soil.mgStatus },
              ].map(c => (
                <div className="soil-card" key={c.name}>
                  <div className="soil-val">{c.val}</div>
                  <div className="soil-unit">{c.unit}</div>
                  <div className="soil-name">{c.name}</div>
                  <div className={`soil-status ${statusColor(c.st)}`}>{c.st}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        </>)}
      </div>
    </>
  );
}
