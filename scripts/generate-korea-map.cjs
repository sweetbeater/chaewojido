#!/usr/bin/env node
/**
 * 새 한국 지도 SVG 생성 스크립트
 * GeoJSON → region_id 매핑 → mapshaper dissolve → public/korea-map.svg
 *
 * 사용법: node scripts/generate-korea-map.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const JSON_DIR = 'C:/Users/jsyoo/Desktop/maps-main/maps-main/json';
const TEMP_FILE = path.join(__dirname, '../temp_combined_map.json');
const OUT_SVG = path.join(__dirname, '../public/korea-map.svg');

// ── 1. 파일명 기반 매핑 (광역시/특별시/자치시 전체 → 하나의 region)
// 해당 파일의 모든 feature는 이 region_id를 가짐
const METRO_FILE_MAP = {
  '서울특별시_시군구_경계': 'seoul',
  '부산광역시_시군구_경계': 'busan',
  '대구광역시_시군구_경계': 'daegu',
  '인천광역시_시군구_경계': 'incheon',
  '광주광역시_시군구_경계': 'gwangju',
  '대전광역시_시군구_경계': 'daejeon',
  '울산광역시_시군구_경계': 'ulsan',
  '세종특별자치시_시군구_경계': 'sejong',
};

// ── 2. "파일명::지역명" 기반 매핑 (중복 이름 처리, ex: 고성군)
const FILE_TITLE_MAP = {
  '강원도_시군구_경계::고성군':   'gangwon_goseong',
  '경상남도_시군구_경계::고성군': 'gyeongnam_goseong',
};

// ── 3. 지역명 기반 매핑 (도 단위 시군구)
// 광역시 구 이름은 여기서 제외 — METRO_FILE_MAP이 처리함
const TITLE_MAP = {
  // 경기도
  '가평군': 'gyeonggi_gapyeong',
  '고양시 덕양구': 'gyeonggi_goyang',
  '고양시 일산동구': 'gyeonggi_goyang',
  '고양시 일산서구': 'gyeonggi_goyang',
  '과천시': 'gyeonggi_gwacheon',
  '광명시': 'gyeonggi_gwangmyeong',
  '광주시': 'gyeonggi_gwangju',
  '구리시': 'gyeonggi_guri',
  '군포시': 'gyeonggi_gunpo',
  '김포시': 'gyeonggi_gimpo',
  '남양주시': 'gyeonggi_namyangju',
  '동두천시': 'gyeonggi_dongducheon',
  '부천시': 'gyeonggi_bucheon',
  '성남시 분당구': 'gyeonggi_seongnam',
  '성남시 수정구': 'gyeonggi_seongnam',
  '성남시 중원구': 'gyeonggi_seongnam',
  '수원시 권선구': 'gyeonggi_suwon',
  '수원시 영통구': 'gyeonggi_suwon',
  '수원시 장안구': 'gyeonggi_suwon',
  '수원시 팔달구': 'gyeonggi_suwon',
  '시흥시': 'gyeonggi_siheung',
  '안산시 단원구': 'gyeonggi_ansan',
  '안산시 상록구': 'gyeonggi_ansan',
  '안성시': 'gyeonggi_anseong',
  '안양시 동안구': 'gyeonggi_anyang',
  '안양시 만안구': 'gyeonggi_anyang',
  '양주시': 'gyeonggi_yangju',
  '양평군': 'gyeonggi_yangpyeong',
  '여주시': 'gyeonggi_yeoju',
  '연천군': 'gyeonggi_yeoncheon',
  '오산시': 'gyeonggi_osan',
  '용인시 기흥구': 'gyeonggi_yongin',
  '용인시 수지구': 'gyeonggi_yongin',
  '용인시 처인구': 'gyeonggi_yongin',
  '의왕시': 'gyeonggi_uiwang',
  '의정부시': 'gyeonggi_uijeongbu',
  '이천시': 'gyeonggi_icheon',
  '파주시': 'gyeonggi_paju',
  '평택시': 'gyeonggi_pyeongtaek',
  '포천시': 'gyeonggi_pocheon',
  '하남시': 'gyeonggi_hanam',
  '화성시': 'gyeonggi_hwaseong',

  // 강원도 (고성군 제외 → FILE_TITLE_MAP 처리)
  '강릉시': 'gangwon_gangneung',
  '동해시': 'gangwon_donghae',
  '삼척시': 'gangwon_samcheok',
  '속초시': 'gangwon_sokcho',
  '양구군': 'gangwon_yanggu',
  '양양군': 'gangwon_yangyang',
  '영월군': 'gangwon_yeongwol',
  '원주시': 'gangwon_wonju',
  '인제군': 'gangwon_inje',
  '정선군': 'gangwon_jeongseon',
  '철원군': 'gangwon_cheorwon',
  '춘천시': 'gangwon_chuncheon',
  '태백시': 'gangwon_taebaek',
  '평창군': 'gangwon_pyeongchang',
  '홍천군': 'gangwon_hongcheon',
  '화천군': 'gangwon_hwacheon',
  '횡성군': 'gangwon_hoengseong',

  // 충청북도
  '청주시 상당구': 'chungbuk_cheongju',
  '청주시 서원구': 'chungbuk_cheongju',
  '청주시 청원구': 'chungbuk_cheongju',
  '청주시 흥덕구': 'chungbuk_cheongju',
  '충주시': 'chungbuk_chungju',
  '제천시': 'chungbuk_jecheon',
  '보은군': 'chungbuk_boeun',
  '옥천군': 'chungbuk_okcheon',
  '영동군': 'chungbuk_yeongdong',
  '증평군': 'chungbuk_jeungpyeong',
  '진천군': 'chungbuk_jincheon',
  '괴산군': 'chungbuk_goesan',
  '음성군': 'chungbuk_eumseong',
  '단양군': 'chungbuk_danyang',

  // 충청남도
  '천안시 동남구': 'chungnam_cheonan',
  '천안시 서북구': 'chungnam_cheonan',
  '공주시': 'chungnam_gongju',
  '보령시': 'chungnam_boryeong',
  '아산시': 'chungnam_asan',
  '서산시': 'chungnam_seosan',
  '논산시': 'chungnam_nonsan',
  '계룡시': 'chungnam_gyeryong',
  '당진시': 'chungnam_dangjin',
  '금산군': 'chungnam_geumsan',
  '부여군': 'chungnam_buyeo',
  '서천군': 'chungnam_seocheon',
  '청양군': 'chungnam_cheongyang',
  '홍성군': 'chungnam_hongseong',
  '예산군': 'chungnam_yesan',
  '태안군': 'chungnam_taean',

  // 전라북도
  '전주시 완산구': 'jeonbuk_jeonju',
  '전주시 덕진구': 'jeonbuk_jeonju',
  '군산시': 'jeonbuk_gunsan',
  '익산시': 'jeonbuk_iksan',
  '정읍시': 'jeonbuk_jeongeup',
  '남원시': 'jeonbuk_namwon',
  '김제시': 'jeonbuk_gimje',
  '완주군': 'jeonbuk_wanju',
  '진안군': 'jeonbuk_jinan',
  '무주군': 'jeonbuk_muju',
  '장수군': 'jeonbuk_jangsu',
  '임실군': 'jeonbuk_imsil',
  '순창군': 'jeonbuk_sunchang',
  '고창군': 'jeonbuk_gochang',
  '부안군': 'jeonbuk_buan',

  // 전라남도
  '목포시': 'jeonnam_mokpo',
  '여수시': 'jeonnam_yeosu',
  '순천시': 'jeonnam_suncheon',
  '나주시': 'jeonnam_naju',
  '광양시': 'jeonnam_gwangyang',
  '담양군': 'jeonnam_damyang',
  '곡성군': 'jeonnam_gokseong',
  '구례군': 'jeonnam_gurye',
  '고흥군': 'jeonnam_goheung',
  '보성군': 'jeonnam_boseong',
  '화순군': 'jeonnam_hwasun',
  '장흥군': 'jeonnam_jangheung',
  '강진군': 'jeonnam_gangjin',
  '해남군': 'jeonnam_haenam',
  '영암군': 'jeonnam_yeongam',
  '무안군': 'jeonnam_muan',
  '함평군': 'jeonnam_hampyeong',
  '영광군': 'jeonnam_yeonggwang',
  '장성군': 'jeonnam_jangseong',
  '완도군': 'jeonnam_wando',
  '진도군': 'jeonnam_jindo',
  '신안군': 'jeonnam_sinan',

  // 경상북도
  '포항시 남구': 'gyeongbuk_pohang',
  '포항시 북구': 'gyeongbuk_pohang',
  '경주시': 'gyeongbuk_gyeongju',
  '김천시': 'gyeongbuk_gimcheon',
  '안동시': 'gyeongbuk_andong',
  '구미시': 'gyeongbuk_gumi',
  '영주시': 'gyeongbuk_yeongju',
  '영천시': 'gyeongbuk_yeongcheon',
  '상주시': 'gyeongbuk_sangju',
  '문경시': 'gyeongbuk_mungyeong',
  '경산시': 'gyeongbuk_gyeongsan',
  '군위군': 'gyeongbuk_gunwi',
  '의성군': 'gyeongbuk_uiseong',
  '청송군': 'gyeongbuk_cheongsong',
  '영양군': 'gyeongbuk_yeongyang',
  '영덕군': 'gyeongbuk_yeongdeok',
  '청도군': 'gyeongbuk_cheongdo',
  '고령군': 'gyeongbuk_goryeong',
  '성주군': 'gyeongbuk_seongju',
  '칠곡군': 'gyeongbuk_chilgok',
  '예천군': 'gyeongbuk_yecheon',
  '봉화군': 'gyeongbuk_bonghwa',
  '울진군': 'gyeongbuk_uljin',
  '울릉군': 'gyeongbuk_ulleung',

  // 경상남도 (고성군 제외 → FILE_TITLE_MAP 처리)
  '창원시 의창구': 'gyeongnam_changwon',
  '창원시 성산구': 'gyeongnam_changwon',
  '창원시 마산합포구': 'gyeongnam_changwon',
  '창원시 마산회원구': 'gyeongnam_changwon',
  '창원시 진해구': 'gyeongnam_changwon',
  '진주시': 'gyeongnam_jinju',
  '통영시': 'gyeongnam_tongyeong',
  '사천시': 'gyeongnam_sacheon',
  '김해시': 'gyeongnam_gimhae',
  '밀양시': 'gyeongnam_miryang',
  '거제시': 'gyeongnam_geoje',
  '양산시': 'gyeongnam_yangsan',
  '의령군': 'gyeongnam_uiryeong',
  '함안군': 'gyeongnam_haman',
  '창녕군': 'gyeongnam_changnyeong',
  '남해군': 'gyeongnam_namhae',
  '하동군': 'gyeongnam_hadong',
  '산청군': 'gyeongnam_sancheong',
  '함양군': 'gyeongnam_hamyang',
  '거창군': 'gyeongnam_geochang',
  '합천군': 'gyeongnam_hapcheon',

  // 제주
  '제주시': 'jeju_jeju',
  '서귀포시': 'jeju_seogwipo',
};

function getRegionId(fileName, title) {
  const baseName = path.basename(fileName, '.json');
  // 1. 파일 전체 매핑 (광역시)
  if (METRO_FILE_MAP[baseName]) return METRO_FILE_MAP[baseName];
  // 2. 파일+이름 조합 (고성군 충돌)
  const fileKey = `${baseName}::${title}`;
  if (FILE_TITLE_MAP[fileKey]) return FILE_TITLE_MAP[fileKey];
  // 3. 이름 기반
  return TITLE_MAP[title] || null;
}

// ── 모든 GeoJSON 읽어서 합치기
console.log('📂 GeoJSON 파일 읽는 중...');
const files = fs.readdirSync(JSON_DIR)
  .filter(f => f.endsWith('.json') && f !== '전국_시도_경계.json');

const allFeatures = [];
const unmapped = [];

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(JSON_DIR, file), 'utf8'));
  for (const feat of data.features) {
    const title = feat.properties.title;
    const regionId = getRegionId(file, title);
    if (!regionId) {
      unmapped.push(`${file}: "${title}"`);
      continue;
    }
    allFeatures.push({
      type: 'Feature',
      geometry: feat.geometry,
      properties: { region_id: regionId },
    });
  }
}

if (unmapped.length > 0) {
  console.error('❌ 매핑 실패 지역:');
  unmapped.forEach(u => console.error('  ', u));
  process.exit(1);
}

// region_id별 feature 수 확인
const regionCounts = {};
allFeatures.forEach(f => {
  const r = f.properties.region_id;
  regionCounts[r] = (regionCounts[r] || 0) + 1;
});
const totalRegions = Object.keys(regionCounts).length;
const multiFeature = Object.entries(regionCounts).filter(([,c]) => c > 1);
console.log(`✅ 총 features: ${allFeatures.length}개 → dissolve 후 regions: ${totalRegions}개`);
console.log(`   (병합 필요: ${multiFeature.length}개 지역)`);

// 임시 파일 저장
fs.writeFileSync(TEMP_FILE, JSON.stringify({ type: 'FeatureCollection', features: allFeatures }));

// ── mapshaper: dissolve + SVG 생성
console.log('\n🗺️ mapshaper 실행 중 (dissolve + SVG 변환)...');
const cmd = `npx mapshaper "${TEMP_FILE}" -dissolve region_id -simplify 10% -o "${OUT_SVG}" format=svg id-field=region_id`;
console.log('>', cmd, '\n');

try {
  execSync(cmd, { stdio: 'inherit' });
} catch (err) {
  console.error('❌ mapshaper 실패:', err.message);
  process.exit(1);
} finally {
  try { fs.unlinkSync(TEMP_FILE); } catch (_) {}
}

// ── 생성된 SVG에 독도 추가
console.log('\n🏝️ 독도 추가 중...');
let svg = fs.readFileSync(OUT_SVG, 'utf8');

// SVG viewBox와 크기 파싱
const vbMatch = svg.match(/viewBox="0 0 (\d+\.?\d*) (\d+\.?\d*)"/);
if (!vbMatch) {
  console.error('❌ SVG viewBox 파싱 실패');
  process.exit(1);
}
const svgW = parseFloat(vbMatch[1]);
const svgH = parseFloat(vbMatch[2]);
console.log(`   SVG 크기: ${svgW} × ${svgH}`);

// 울릉도(gyeongbuk_ulleung) path 위치 파악 후, 그 오른쪽 아래에 독도 배치
// 독도를 울릉도 아래 왼쪽에 배치 (화면 기준)
// 울릉도 path의 대략적인 중심 X,Y를 파악해야 하는데,
// 생성된 SVG에서 먼저 확인 후 오프셋으로 배치
// 일단 전체 SVG 비율로 예상 위치에 배치

// SVG 내 울릉도 path의 D 속성 첫 좌표 추출 (대략적 위치 파악)
const ulleungMatch = svg.match(/id="gyeongbuk_ulleung"[^>]*\/?>\s*(?:<path[^>]*d="([^"]*)")?|<path[^>]*id="gyeongbuk_ulleung"[^>]*d="([^"]*)"/);
console.log('   울릉도 path 탐지 중...');

// 좀 더 정확하게: gyeongbuk_ulleung 이후 첫 path 찾기
const ulleungPathMatch = svg.match(/<path[^>]*id="gyeongbuk_ulleung"[^>]*d="M\s*(\d+\.?\d*)\s+(\d+\.?\d*)/) ||
                          svg.match(/id="gyeongbuk_ulleung"[^/]*\/>\s*<path[^>]*d="M\s*(\d+\.?\d*)\s+(\d+\.?\d*)/);

// 독도 좌표: 화면 비율 기준으로 배치
// 전체 SVG 기준, 울릉도의 오른쪽 아래쪽 (지도에서 울릉도 남쪽에 위치)
// 실제 위치: 울릉도(130.9°E, 37.5°N), 독도(131.9°E, 37.2°N) → 동쪽이자 약간 남쪽
// mapshaper SVG는 Y가 아래 방향, X가 오른쪽 방향
// 울릉도가 SVG 내 어디 있는지 확인 후 독도를 그 오른쪽 하단에 배치

// SVG path bounding box를 코드로 계산하는 대신,
// 울릉도 ID를 가진 path의 첫 M 명령어 좌표를 찾아 대략적 위치 파악
const ulPathRegex = /<path[^>]*id="gyeongbuk_ulleung"[^>]*d="([^"]*)"/;
const ulMatch = svg.match(ulPathRegex);
if (!ulMatch) {
  console.warn('   ⚠️ 울릉도 path를 찾을 수 없음, 독도 위치를 기본값으로 설정');
}

// 독도 path 생성 (울릉도 아래 왼쪽, 실제 지리적으로 독도는 울릉도의 동남쪽)
// SVG 기준: x가 클수록 동쪽, y가 클수록 남쪽
// 울릉도의 SVG 좌표를 파악하려면 path d 파싱이 필요 → 여기서는 SVG 비율로 추정
// 울릉도는 한국 전체 지도에서 오른쪽 상단에 위치 (동해 쪽)
// 독도는 울릉도에서 동쪽으로 약 87km 떨어짐

// 독도를 울릉도 아래에 상징적으로 표시 (지리적으로 정확하진 않지만 기존 앱 방식 유지)
// 기존 앱: ulleung bbox 아래에 작은 폴리곤으로 표시

// SVG에서 울릉도 path d 값의 첫 좌표 (M cx cy) 추출
let dokdoCx = svgW * 0.88;  // 기본값: SVG 오른쪽 88%
let dokdoCy = svgH * 0.28;  // 기본값: SVG 위쪽 28%

if (ulMatch) {
  const dAttr = ulMatch[1];
  const firstM = dAttr.match(/M\s*([\d.]+)\s+([\d.]+)/);
  if (firstM) {
    dokdoCx = parseFloat(firstM[1]);
    dokdoCy = parseFloat(firstM[2]) + 30; // 울릉도 아래쪽
    console.log(`   울릉도 첫 좌표: ${firstM[1]}, ${firstM[2]}`);
    console.log(`   독도 배치 위치: ${dokdoCx.toFixed(1)}, ${dokdoCy.toFixed(1)}`);
  }
}

// 독도: 두 개의 작은 폴리곤 (서도 + 동도 모양, 기존 앱과 동일한 스타일)
const r = 4; // 반지름 (픽셀 단위, 독도 크기)
const dokdoPath = `
<path id="dokdo" d="
  M ${(dokdoCx - r).toFixed(1)} ${(dokdoCy - r * 0.5).toFixed(1)}
  l ${(r * 0.4).toFixed(1)} ${(-r * 0.8).toFixed(1)}
  l ${(r * 0.6).toFixed(1)} ${(-r * 0.3).toFixed(1)}
  l ${(r * 0.5).toFixed(1)} ${(r * 0.6).toFixed(1)}
  l ${(-r * 0.3).toFixed(1)} ${(r * 0.9).toFixed(1)}
  l ${(-r * 0.8).toFixed(1)} ${(r * 0.4).toFixed(1)}
  l ${(-r * 0.6).toFixed(1)} ${(-r * 0.3).toFixed(1)}
  Z
" fill="#EAEAEA" stroke="#EAEAEA" stroke-width="0.3"/>`.trim();

// </g> 닫기 직전에 독도 path 삽입
svg = svg.replace(/<\/g>\s*$/, `\n${dokdoPath}\n</g>\n`);
fs.writeFileSync(OUT_SVG, svg);

// 검증
const finalIds = [...svg.matchAll(/id="([^"]+)"/g)].map(m => m[1]).filter(id => id !== 'temp_combined_map');
const layerName = path.basename(TEMP_FILE, '.json');
const regionIds = finalIds.filter(id => id !== layerName && !id.startsWith('temp'));

console.log(`\n✅ 최종 SVG 생성 완료!`);
console.log(`   파일: ${OUT_SVG}`);
console.log(`   크기: ${svgW} × ${svgH}`);
console.log(`   지역 수: ${regionIds.length}개 (dokdo 포함)`);
console.log(`   (기대: 163개)`);
