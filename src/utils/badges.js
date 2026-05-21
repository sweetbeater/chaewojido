import { SVG_TO_REGION } from './regions'

// ── 지역 그룹 상수 ─────────────────────────────────────────────
const GANGWON_IDS = [
  "gangwon_chuncheon","gangwon_wonju","gangwon_gangneung","gangwon_donghae",
  "gangwon_taebaek","gangwon_sokcho","gangwon_samcheok","gangwon_hongcheon",
  "gangwon_hoengseong","gangwon_yeongwol","gangwon_pyeongchang","gangwon_jeongseon",
  "gangwon_cheorwon","gangwon_hwacheon","gangwon_yanggu","gangwon_inje",
  "gangwon_goseong","gangwon_yangyang"
]
const GYEONGGI_IDS = [
  "gyeonggi_suwon","gyeonggi_seongnam","gyeonggi_uijeongbu","gyeonggi_anyang",
  "gyeonggi_bucheon","gyeonggi_gwangmyeong","gyeonggi_pyeongtaek","gyeonggi_dongducheon",
  "gyeonggi_ansan","gyeonggi_goyang","gyeonggi_gwacheon","gyeonggi_guri",
  "gyeonggi_namyangju","gyeonggi_osan","gyeonggi_siheung","gyeonggi_gunpo",
  "gyeonggi_uiwang","gyeonggi_hanam","gyeonggi_yongin","gyeonggi_paju",
  "gyeonggi_icheon","gyeonggi_anseong","gyeonggi_gimpo","gyeonggi_hwaseong",
  "gyeonggi_gwangju","gyeonggi_yangju","gyeonggi_pocheon","gyeonggi_yeoju",
  "gyeonggi_yeoncheon","gyeonggi_gapyeong","gyeonggi_yangpyeong"
]
const CHUNGBUK_IDS = [
  "chungbuk_cheongju","chungbuk_chungju","chungbuk_jecheon",
  "chungbuk_boeun","chungbuk_okcheon","chungbuk_yeongdong",
  "chungbuk_goesan","chungbuk_eumseong","chungbuk_jeungpyeong",
  "chungbuk_jincheon","chungbuk_danyang"
]
const CHUNGNAM_IDS = [
  "chungnam_cheonan","chungnam_gongju","chungnam_boryeong",
  "chungnam_asan","chungnam_seosan","chungnam_nonsan",
  "chungnam_gyeryong","chungnam_geumsan","chungnam_buyeo",
  "chungnam_seocheon","chungnam_cheongyang","chungnam_hongseong",
  "chungnam_yesan","chungnam_taean","chungnam_dangjin"
]
const CHUNGCHEONG_IDS = [...CHUNGBUK_IDS, ...CHUNGNAM_IDS]
const GYEONGBUK_IDS = [
  "gyeongbuk_pohang","gyeongbuk_gyeongju","gyeongbuk_gimcheon","gyeongbuk_andong",
  "gyeongbuk_gumi","gyeongbuk_yeongju","gyeongbuk_yeongcheon","gyeongbuk_sangju",
  "gyeongbuk_mungyeong","gyeongbuk_gyeongsan","gyeongbuk_gunwi","gyeongbuk_uiseong",
  "gyeongbuk_cheongsong","gyeongbuk_yeongyang","gyeongbuk_yeongdeok","gyeongbuk_cheongdo",
  "gyeongbuk_goryeong","gyeongbuk_seongju","gyeongbuk_chilgok","gyeongbuk_yecheon",
  "gyeongbuk_bonghwa","gyeongbuk_uljin","gyeongbuk_ulleung"
]
const GYEONGNAM_IDS = [
  "gyeongnam_jinju","gyeongnam_tongyeong","gyeongnam_sacheon","gyeongnam_gimhae",
  "gyeongnam_miryang","gyeongnam_geoje","gyeongnam_yangsan","gyeongnam_changwon",
  "gyeongnam_uiryeong","gyeongnam_haman","gyeongnam_changnyeong","gyeongnam_goseong",
  "gyeongnam_namhae","gyeongnam_hadong","gyeongnam_sancheong","gyeongnam_hamyang",
  "gyeongnam_geochang","gyeongnam_hapcheon"
]
const GYEONGSANG_IDS = [...GYEONGBUK_IDS, ...GYEONGNAM_IDS]
const JEONBUK_IDS = [
  "jeonbuk_jeonju","jeonbuk_gunsan","jeonbuk_iksan","jeonbuk_jeongeup",
  "jeonbuk_namwon","jeonbuk_gimje","jeonbuk_wanju","jeonbuk_jinan",
  "jeonbuk_muju","jeonbuk_jangsu","jeonbuk_imsil","jeonbuk_sunchang",
  "jeonbuk_gochang","jeonbuk_buan"
]
const JEONNAM_IDS = [
  "jeonnam_mokpo","jeonnam_yeosu","jeonnam_suncheon","jeonnam_naju",
  "jeonnam_gwangyang","jeonnam_damyang","jeonnam_jangseong","jeonnam_gokseong",
  "jeonnam_gurye","jeonnam_goheung","jeonnam_boseong","jeonnam_hwasun",
  "jeonnam_jangheung","jeonnam_gangjin","jeonnam_haenam","jeonnam_yeongam",
  "jeonnam_muan","jeonnam_hampyeong","jeonnam_yeonggwang","jeonnam_wando",
  "jeonnam_jindo","jeonnam_sinan"
]
const JEOLLA_IDS = [...JEONBUK_IDS, ...JEONNAM_IDS]
const METRO_IDS = ["seoul","incheon",...GYEONGGI_IDS]
const COASTAL_IDS = [
  "busan","incheon","ulsan",
  "gangwon_gangneung","gangwon_donghae","gangwon_sokcho","gangwon_samcheok","gangwon_goseong","gangwon_yangyang",
  "chungnam_seosan","chungnam_taean","chungnam_boryeong","chungnam_dangjin",
  "jeonbuk_gunsan","jeonbuk_buan",
  "jeonnam_mokpo","jeonnam_yeosu","jeonnam_gwangyang","jeonnam_goheung",
  "jeonnam_jangheung","jeonnam_gangjin","jeonnam_haenam","jeonnam_yeongam",
  "jeonnam_muan","jeonnam_wando","jeonnam_jindo","jeonnam_sinan",
  "gyeongbuk_pohang","gyeongbuk_yeongdeok","gyeongbuk_uljin","gyeongbuk_ulleung",
  "gyeongnam_changwon","gyeongnam_tongyeong","gyeongnam_sacheon",
  "gyeongnam_geoje","gyeongnam_namhae","gyeongnam_goseong","gyeongnam_hadong",
  "jeju_jeju","jeju_seogwipo"
]
const ISLAND_IDS = [
  "incheon","jeju_jeju","jeju_seogwipo","gyeongbuk_ulleung",
  "jeonnam_wando","jeonnam_jindo","jeonnam_sinan","gyeongnam_geoje","gyeongnam_namhae"
]
const EAST_SEA_IDS = [
  "gangwon_gangneung","gangwon_donghae","gangwon_sokcho","gangwon_samcheok",
  "gangwon_goseong","gangwon_yangyang",
  "gyeongbuk_pohang","gyeongbuk_yeongdeok","gyeongbuk_uljin","gyeongbuk_ulleung","ulsan"
]
const SOUTH_SEA_IDS = [
  "busan",
  "gyeongnam_changwon","gyeongnam_tongyeong","gyeongnam_sacheon",
  "gyeongnam_geoje","gyeongnam_namhae","gyeongnam_goseong","gyeongnam_hadong",
  "jeonnam_yeosu","jeonnam_gwangyang","jeonnam_goheung","jeonnam_jangheung",
  "jeonnam_gangjin","jeonnam_haenam","jeonnam_wando","jeonnam_jindo","jeonnam_sinan",
  "jeju_jeju","jeju_seogwipo"
]
const WEST_SEA_IDS = [
  "incheon",
  "chungnam_seosan","chungnam_taean","chungnam_boryeong","chungnam_dangjin",
  "jeonbuk_gunsan","jeonbuk_buan",
  "jeonnam_mokpo","jeonnam_yeongam","jeonnam_muan","jeonnam_hampyeong","jeonnam_yeonggwang"
]
const MOUNTAIN_IDS = [
  "jeju_jeju","jeju_seogwipo",
  "gyeongnam_hadong","gyeongnam_hamyang","gyeongnam_sancheong","jeonnam_gurye","jeonbuk_namwon",
  "gangwon_sokcho","gangwon_inje","gangwon_yangyang","gangwon_goseong"
]
const TOTAL_UNIQUE_REGIONS = 162

// ── 날짜 상수 ────────────────────────────────────────────────────
const SEOLLAL_CHUSEOK = new Set([
  '2024-02-09','2024-02-10','2024-02-11',
  '2025-01-28','2025-01-29','2025-01-30',
  '2026-02-16','2026-02-17','2026-02-18',
  '2027-02-06','2027-02-07','2027-02-08',
  '2024-09-16','2024-09-17','2024-09-18',
  '2025-10-05','2025-10-06','2025-10-07',
  '2026-09-24','2026-09-25','2026-09-26',
  '2027-10-14','2027-10-15','2027-10-16',
])

// ── 헬퍼 ────────────────────────────────────────────────────────
const cv = (visited, list) => list.filter(id => visited.includes(id)).length
const toDate = (t) => { if (!t) return null; return typeof t.toDate === 'function' ? t.toDate() : new Date(t) }
const dk = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const mk = (d) => `${d.getFullYear()}-${d.getMonth()}`

const monthsWithMin = (records, min) => {
  const c = {}
  for (const r of records) { const d = toDate(r.createdAt); if (!d) continue; const k = mk(d); c[k] = (c[k]||0)+1 }
  return Object.values(c).filter(n => n >= min).length
}
const maxStreak = (records) => {
  const days = new Set()
  for (const r of records) { const d = toDate(r.createdAt); if (d) days.add(dk(d)) }
  if (!days.size) return 0
  const sorted = [...days].sort()
  let max = 1, streak = 1
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i]) - new Date(sorted[i-1])) / 86400000
    streak = diff === 1 ? streak + 1 : 1
    if (streak > max) max = streak
  }
  return max
}
const dayCounts = (records) => {
  const c = {}
  for (const r of records) { const d = toDate(r.createdAt); if (!d) continue; const k = dk(d); c[k] = (c[k]||0)+1 }
  return c
}

// ── 배지 목록 (카테고리별) ────────────────────────────────────────
export const BADGES = [

  // ═══ 전국 개수 ═══
  { id:"first_step",         name:"첫 발걸음",       description:"첫 번째 지역 색칠",           icon:"1f463", condition:(v)=>v.length>=1 },
  { id:"traveler",           name:"여행자",           description:"5개 이상 지역 색칠",           icon:"1f9f3", condition:(v)=>v.length>=5 },
  { id:"explorer",           name:"탐색자",           description:"10개 이상 지역 색칠",          icon:"1f50d", condition:(v)=>v.length>=10 },
  { id:"novice_adventurer",  name:"초보 탐험가",      description:"15개 이상 지역 색칠",          icon:"1f392", condition:(v)=>v.length>=15 },
  { id:"mid_adventurer",     name:"중급 탐험가",      description:"30개 이상 지역 색칠",          icon:"1f5fa", condition:(v)=>v.length>=30 },
  { id:"expert_adventurer",  name:"고수 탐험가",      description:"40개 이상 지역 색칠",          icon:"1f3c6", condition:(v)=>v.length>=40 },
  { id:"travel_expert",      name:"여행 전문가",      description:"50개 이상 지역 색칠",          icon:"2708",  condition:(v)=>v.length>=50 },
  { id:"national_march",     name:"국토 대장정",      description:"70개 이상 지역 색칠",          icon:"1f3c3", condition:(v)=>v.length>=70 },
  { id:"travel_youtuber",    name:"여행 유튜버세요?", description:"100개 이상 지역 색칠",         icon:"1f3ac", condition:(v)=>v.length>=100 },
  { id:"half_way",           name:"반환점",           description:"전국의 절반 이상 색칠",        icon:"1f3af", condition:(v)=>new Set(v).size>=Math.ceil(TOTAL_UNIQUE_REGIONS/2) },
  { id:"legend_explorer",    name:"전설의 탐험가",    description:"전국 모든 지역 색칠",          icon:"1f5fa", condition:(v)=>new Set(v).size>=TOTAL_UNIQUE_REGIONS },

  // ═══ 수도권 ═══
  { id:"seoul_first",        name:"상경",             description:"서울 처음으로 색칠",           icon:"1f3d9", condition:(v)=>v.includes("seoul") },
  { id:"incheon_first",      name:"인천공항",         description:"인천 처음으로 색칠",           icon:"1f6eb", condition:(v)=>v.includes("incheon") },
  { id:"gyeonggi_first",     name:"경기 시작합니다",  description:"경기도 처음으로 색칠",         icon:"1f306", condition:(v)=>cv(v,GYEONGGI_IDS)>=1 },
  { id:"gyeonggi_5",         name:"불경기",           description:"경기도 5개 이상 지역 색칠",    icon:"1f4c9", condition:(v)=>cv(v,GYEONGGI_IDS)>=5 },
  { id:"gyeonggi_expert",    name:"경기도 전문가",    description:"경기도 10개 이상 지역 색칠",   icon:"1f5fa", condition:(v)=>cv(v,GYEONGGI_IDS)>=10 },
  { id:"gyeonggi_resident",  name:"경기도민",         description:"경기도 15개 이상 지역 색칠",   icon:"1f3d8", condition:(v)=>cv(v,GYEONGGI_IDS)>=15 },
  { id:"gyeonggi_master",    name:"경기도 마스터",    description:"경기도 전 지역 색칠",          icon:"1f451", condition:(v)=>cv(v,GYEONGGI_IDS)>=GYEONGGI_IDS.length },
  { id:"metro_10",           name:"수도권 정복자",    description:"서울·인천·경기도 10개 이상 색칠", icon:"1f3d9", condition:(v)=>cv(v,METRO_IDS)>=10 },
  { id:"metro_all",          name:"수도승",           description:"서울·인천·경기도 전 지역 색칠", icon:"1f9d8", condition:(v)=>cv(v,METRO_IDS)>=METRO_IDS.length },

  // ═══ 강원도 ═══
  { id:"gangwon_first",      name:"감자 좋아하세요?", description:"강원도 처음으로 색칠",         icon:"1f954", condition:(v)=>cv(v,GANGWON_IDS)>=1 },
  { id:"gangwon_5",          name:"감자합니다",       description:"강원도 5개 이상 지역 색칠",    icon:"1f954", condition:(v)=>cv(v,GANGWON_IDS)>=5 },
  { id:"gangwon_expert",     name:"강원도 전문가",    description:"강원도 10개 이상 지역 색칠",   icon:"1f3d4", condition:(v)=>cv(v,GANGWON_IDS)>=10 },
  { id:"gangwon_resident",   name:"강원도민",         description:"강원도 13개 이상 지역 색칠",   icon:"26f0",  condition:(v)=>cv(v,GANGWON_IDS)>=13 },
  { id:"gangwon_master",     name:"강원도 마스터",    description:"강원도 전 지역 색칠",          icon:"1f3d4", condition:(v)=>cv(v,GANGWON_IDS)>=GANGWON_IDS.length },

  // ═══ 충청도 ═══
  { id:"chungcheong_first",  name:"어세오세유",       description:"충청도 처음으로 색칠",         icon:"1f44b", condition:(v)=>cv(v,CHUNGCHEONG_IDS)>=1 },
  { id:"chungcheong_5",      name:"반갑슈",           description:"충청도 5개 이상 지역 색칠",    icon:"1f91d", condition:(v)=>cv(v,CHUNGCHEONG_IDS)>=5 },
  { id:"chungcheong_10",     name:"밥은 먹었슈?",     description:"충청도 10개 이상 지역 색칠",   icon:"1f35a", condition:(v)=>cv(v,CHUNGCHEONG_IDS)>=10 },
  { id:"chungcheong_15",     name:"감사해유",         description:"충청도 15개 이상 지역 색칠",   icon:"1f64f", condition:(v)=>cv(v,CHUNGCHEONG_IDS)>=15 },
  { id:"chungcheong_all",    name:"충성도 100%",      description:"충청도 전 지역 색칠",          icon:"1f4af", condition:(v)=>cv(v,CHUNGCHEONG_IDS)>=CHUNGCHEONG_IDS.length },

  // ═══ 전라도 ═══
  { id:"jeolla_first",       name:"반갑소잉",         description:"전라도 처음으로 색칠",         icon:"1f60a", condition:(v)=>cv(v,JEOLLA_IDS)>=1 },
  { id:"jeolla_5",           name:"밥은 묵었는가?",   description:"전라도 5개 이상 지역 색칠",    icon:"1f958", condition:(v)=>cv(v,JEOLLA_IDS)>=5 },
  { id:"jeolla_10",          name:"아따 징하게 반갑소",description:"전라도 10개 이상 지역 색칠",  icon:"1f389", condition:(v)=>cv(v,JEOLLA_IDS)>=10 },
  { id:"jeolla_15",          name:"맛의 고향",        description:"전라도 15개 이상 지역 색칠",   icon:"1f37d", condition:(v)=>cv(v,JEOLLA_IDS)>=15 },
  { id:"jeolla_master",      name:"전라도 마스터",    description:"전라도 전 지역 색칠",          icon:"1f3c5", condition:(v)=>cv(v,JEOLLA_IDS)>=JEOLLA_IDS.length },

  // ═══ 경상도·부산·대구 ═══
  { id:"busan_first",        name:"부산 바캉스",      description:"부산 처음으로 색칠",           icon:"1f3d6", condition:(v)=>v.includes("busan") },
  { id:"gyeongsang_first",   name:"오셨십니꺼?",      description:"경상도 처음으로 색칠",         icon:"1fae1", condition:(v)=>cv(v,GYEONGSANG_IDS)>=1 },
  { id:"gyeongsang_5",       name:"맞나",             description:"경상도 5개 이상 지역 색칠",    icon:"1f914", condition:(v)=>cv(v,GYEONGSANG_IDS)>=5 },
  { id:"gyeongsang_10",      name:"고맙심더",         description:"경상도 10개 이상 지역 색칠",   icon:"1f917", condition:(v)=>cv(v,GYEONGSANG_IDS)>=10 },
  { id:"gyeongsang_resident",name:"경상도민",         description:"경상도 15개 이상 지역 색칠",   icon:"1f304", condition:(v)=>cv(v,GYEONGSANG_IDS)>=15 },
  { id:"gyeongsang_master",  name:"경상도 마스터",    description:"경상도 전 지역 색칠",          icon:"1f31f", condition:(v)=>cv(v,GYEONGSANG_IDS)>=GYEONGSANG_IDS.length },
  { id:"gukbap_road",        name:"국밥 로드",        description:"부산·대구·경상도 10개 이상 색칠",icon:"1f372",condition:(v)=>cv(v,["busan","daegu",...GYEONGSANG_IDS])>=10 },

  // ═══ 제주 ═══
  { id:"jeju_first",         name:"혼자옵서예",       description:"제주 혹은 서귀포 색칠",        icon:"1f33a", condition:(v)=>v.includes("jeju_jeju")||v.includes("jeju_seogwipo") },
  { id:"jeju_both",          name:"귤하르방",         description:"제주 및 서귀포 색칠",          icon:"1f34a", condition:(v)=>v.includes("jeju_jeju")&&v.includes("jeju_seogwipo") },

  // ═══ 특수 지역 ═══
  { id:"ulleung_first",      name:"울릉울릉",         description:"울릉 처음으로 색칠",           icon:"1f3dd", condition:(v)=>v.includes("gyeongbuk_ulleung") },
  { id:"four_spirits",       name:"사방신",           description:"울릉·고성·인천·서귀포 모두 색칠",icon:"1f9ed",
    condition:(v)=>v.includes("gyeongbuk_ulleung")&&v.includes("gangwon_goseong")&&v.includes("incheon")&&v.includes("jeju_seogwipo") },

  // ═══ 특정 도시 방문 ═══
  { id:"sejong_first",       name:"세종대왕",         description:"세종 처음으로 색칠",           icon:"1f4dc", condition:(v)=>v.includes("sejong") },
  { id:"daejeon_first",      name:"빵지순례",         description:"대전 처음으로 색칠",           icon:"1f956", condition:(v)=>v.includes("daejeon") },
  { id:"gyeongju_first",     name:"신라의 유적",      description:"경주 처음으로 색칠",           icon:"1f3db", condition:(v)=>v.includes("gyeongbuk_gyeongju") },
  { id:"gongju_first",       name:"공주님 어디가세요?",description:"공주 처음으로 색칠",          icon:"1f478", condition:(v)=>v.includes("chungnam_gongju") },
  { id:"buyeo_first",        name:"백제의 숨결",      description:"부여 처음으로 색칠",           icon:"1f3ef", condition:(v)=>v.includes("chungnam_buyeo") },
  { id:"nonsan_first",       name:"이등병의 편지",    description:"논산 처음으로 색칠",           icon:"1fa96", condition:(v)=>v.includes("chungnam_nonsan") },
  { id:"boryeong_first",     name:"머드맨",           description:"보령 처음으로 색칠",           icon:"1f938", condition:(v)=>v.includes("chungnam_boryeong") },
  { id:"chungju_first",      name:"충주맨",           description:"충주 처음으로 색칠",           icon:"1f351", condition:(v)=>v.includes("chungbuk_chungju") },
  { id:"gimje_first",        name:"지평선 축제",      description:"김제 처음으로 색칠",           icon:"1f33e", condition:(v)=>v.includes("jeonbuk_gimje") },
  { id:"yeosu_first",        name:"장범준",           description:"여수 처음으로 색칠",           icon:"1f3b5", condition:(v)=>v.includes("jeonnam_yeosu") },
  { id:"mokpo_first",        name:"항구의 아이",      description:"목포 처음으로 색칠",           icon:"2693",  condition:(v)=>v.includes("jeonnam_mokpo") },
  { id:"boseong_first",      name:"녹차 한잔의 여유", description:"보성 처음으로 색칠",           icon:"1f375", condition:(v)=>v.includes("jeonnam_boseong") },
  { id:"haenam_first",       name:"땅끝에 선 자",     description:"해남 처음으로 색칠",           icon:"1f30d", condition:(v)=>v.includes("jeonnam_haenam") },
  { id:"pohang_first",       name:"포항항~",          description:"포항 처음으로 색칠",           icon:"2693",  condition:(v)=>v.includes("gyeongbuk_pohang") },
  { id:"yanggu_first",       name:"국토정중앙에 가다",description:"양구 처음으로 색칠",           icon:"1f4cd", condition:(v)=>v.includes("gangwon_yanggu") },

  // ═══ 광역시 ═══
  { id:"metro_expert",       name:"광역시 전문가",    description:"모든 광역시 색칠",             icon:"1f3d9",
    condition:(v)=>["seoul","busan","daegu","incheon","gwangju","daejeon","ulsan"].every(id=>v.includes(id)) },

  // ═══ 해안·섬·바다 ═══
  { id:"coastal_5",          name:"바다의 왕자",      description:"해안 지역 5개 이상 색칠",      icon:"1f41a", condition:(v)=>cv(v,COASTAL_IDS)>=5 },
  { id:"sea_lover",          name:"바다 러버",        description:"해안 지역 10개 이상 색칠",     icon:"1f30a", condition:(v)=>cv(v,COASTAL_IDS)>=10 },
  { id:"island_7",           name:"섬 애호가",        description:"섬 지역 7개 이상 색칠",        icon:"26f5",  condition:(v)=>cv(v,ISLAND_IDS)>=7 },
  { id:"east_sea_5",         name:"동해물과 백두산이", description:"동해 접한 지역 5개 이상 색칠", icon:"1f30a", condition:(v)=>cv(v,EAST_SEA_IDS)>=5 },
  { id:"south_sea_5",        name:"남해물과 백두산이", description:"남해 접한 지역 5개 이상 색칠", icon:"1f305", condition:(v)=>cv(v,SOUTH_SEA_IDS)>=5 },
  { id:"west_sea_5",         name:"갯벌체험",         description:"서해 접한 지역 5개 이상 색칠", icon:"1f980", condition:(v)=>cv(v,WEST_SEA_IDS)>=5 },
  { id:"three_seas",         name:"삼면이 바다",      description:"동해·서해·남해 각 1개 이상 색칠",icon:"1f1f0-1f1f7",
    condition:(v)=>cv(v,EAST_SEA_IDS)>=1&&cv(v,WEST_SEA_IDS)>=1&&cv(v,SOUTH_SEA_IDS)>=1 },
  { id:"mountain_5",         name:"산악인",           description:"한라산·지리산·설악산 권역 5개 이상",icon:"26f0", condition:(v)=>cv(v,MOUNTAIN_IDS)>=5 },

  // ═══ 계절 ═══
  { id:"spring_traveler",    name:"벚꽃 여행자",      description:"봄(3~5월)에 10개 이상 기록",   icon:"1f338",
    condition:(v,r)=>r.filter(x=>{const d=toDate(x.createdAt);return d&&d.getMonth()>=2&&d.getMonth()<=4}).length>=10 },
  { id:"summer_traveler",    name:"더위사냥",         description:"여름(6~8월)에 10개 이상 기록", icon:"2600",
    condition:(v,r)=>r.filter(x=>{const d=toDate(x.createdAt);return d&&d.getMonth()>=5&&d.getMonth()<=7}).length>=10 },
  { id:"fall_traveler",      name:"단풍 헌터",        description:"가을(9~11월)에 10개 이상 기록",icon:"1f341",
    condition:(v,r)=>r.filter(x=>{const d=toDate(x.createdAt);return d&&d.getMonth()>=8&&d.getMonth()<=10}).length>=10 },
  { id:"winter_traveler",    name:"겨울 여행자",      description:"겨울(12~2월)에 10개 이상 기록",icon:"2744",
    condition:(v,r)=>r.filter(x=>{const d=toDate(x.createdAt);return d&&(d.getMonth()===11||d.getMonth()<=1)}).length>=10 },
  { id:"new_year",           name:"새해복 많이 받으세요",description:"새해 첫날 기록 생성",       icon:"1f389",
    condition:(v,r)=>r.some(x=>{const d=toDate(x.createdAt);return d&&d.getMonth()===0&&d.getDate()===1}) },
  { id:"santa",              name:"산타클로스",       description:"12월 24~25일에 기록",          icon:"1f385",
    condition:(v,r)=>r.some(x=>{const d=toDate(x.createdAt);return d&&d.getMonth()===11&&(d.getDate()===24||d.getDate()===25)}) },
  { id:"homecoming",         name:"귀향",             description:"설날 또는 추석에 기록",        icon:"1f3e0",
    condition:(v,r)=>r.some(x=>{const d=toDate(x.createdAt);return d&&SEOLLAL_CHUSEOK.has(dk(d))}) },

  // ═══ 기록 패턴 ═══
  { id:"day_tripper",        name:"당일치기 고수",    description:"하루에 3개 이상 지역 기록",    icon:"26a1",
    condition:(v,r)=>Object.values(dayCounts(r)).some(n=>n>=3) },
  { id:"color_5_in_day",     name:"색칠놀이",         description:"하루에 5개 이상 지역 기록",    icon:"1f3a8",
    condition:(v,r)=>Object.values(dayCounts(r)).some(n=>n>=5) },
  { id:"weekend_5",          name:"주말부부",         description:"주말(토·일) 기록 5회 이상",    icon:"1f4c5",
    condition:(v,r)=>r.filter(x=>{const d=toDate(x.createdAt);return d&&(d.getDay()===0||d.getDay()===6)}).length>=5 },
  { id:"weekday_10",         name:"퇴사각",           description:"평일 기록 10회 이상",          icon:"1f4bc",
    condition:(v,r)=>r.filter(x=>{const d=toDate(x.createdAt);return d&&d.getDay()>=1&&d.getDay()<=5}).length>=10 },
  { id:"monthly_5",          name:"월간 탐험가",      description:"한 달 동안 5개 이상 기록",     icon:"1f5d3",
    condition:(v,r)=>{const c={};for(const x of r){const d=toDate(x.createdAt);if(!d)continue;const k=mk(d);c[k]=(c[k]||0)+1};return Object.values(c).some(n=>n>=5)} },
  { id:"vacation_5",         name:"방학이다!",        description:"방학 시즌(1~2월·7~8월) 5회 이상",icon:"1f3d6",
    condition:(v,r)=>r.filter(x=>{const d=toDate(x.createdAt);if(!d)return false;const m=d.getMonth();return m===0||m===1||m===6||m===7}).length>=5 },
  { id:"steady_3months",     name:"꾸준한 발걸음",    description:"3개월 이상(매달 2회 이상) 기록",icon:"1f463",
    condition:(v,r)=>monthsWithMin(r,2)>=3 },
  { id:"steady_6months",     name:"여행 습관",        description:"6개월 이상(매달 2회 이상) 기록",icon:"1f504",
    condition:(v,r)=>monthsWithMin(r,2)>=6 },
  { id:"steady_12months",    name:"끝없는 여행",      description:"1년 이상(매달 2회 이상) 기록", icon:"267e",
    condition:(v,r)=>monthsWithMin(r,2)>=12 },
  { id:"two_day_trip",       name:"1박 2일",          description:"같은 지역에서 2일 이상 기록",  icon:"1f3d5",
    condition:(v,r)=>{
      const rd={}
      for(const x of r){const d=toDate(x.createdAt);if(!d||!x.regionNum)continue;if(!rd[x.regionNum])rd[x.regionNum]=new Set();rd[x.regionNum].add(dk(d))}
      return Object.values(rd).some(s=>s.size>=2)
    }},
  { id:"same_region_10",     name:"이사했어요",       description:"같은 지역 기록 10회 이상",     icon:"1f3e0",
    condition:(v,r)=>{
      const c={}
      for(const x of r){if(!x.regionNum)continue;c[x.regionNum]=(c[x.regionNum]||0)+1}
      return Object.values(c).some(n=>n>=10)
    }},
  { id:"dawn_depart",        name:"새벽 출발",        description:"오전 6시 이전 기록 생성",      icon:"1f305",
    condition:(v,r)=>r.some(x=>{const d=toDate(x.createdAt);return d&&d.getHours()<6}) },
  { id:"night_owl_10",       name:"밤도깨비",         description:"밤 10시 이후 기록 10회 이상",  icon:"1f319",
    condition:(v,r)=>r.filter(x=>{const d=toDate(x.createdAt);return d&&d.getHours()>=22}).length>=10 },
  { id:"consecutive_5days",  name:"집에 안 가?",      description:"연속 5일 이상 기록",           icon:"1f3c3",
    condition:(v,r)=>maxStreak(r)>=5 },
  { id:"hongkildong",        name:"홍길동",           description:"하루에 동해·서해 지역 각 1개 이상 기록",icon:"1f310",
    condition:(v,r)=>{
      const dm={}
      for(const x of r){const d=toDate(x.createdAt);if(!d||!x.regionNum)continue;const k=dk(d);if(!dm[k])dm[k]=[];dm[k].push(SVG_TO_REGION[x.regionNum]||'')}
      return Object.values(dm).some(ids=>ids.some(id=>EAST_SEA_IDS.includes(id))&&ids.some(id=>WEST_SEA_IDS.includes(id)))
    }},

  // ═══ 메타 배지 (획득 배지 수 기반) ═══
  { id:"ppiya_friend",    name:"삐야의 친구",    description:"배지 3개 이상 획득",    icon:"1f425", isMeta:true, condition:(v,r,n)=>n>=3 },
  { id:"ppiya_adventure", name:"삐야의 모험",    description:"배지 10개 이상 획득",   icon:"1f425", isMeta:true, condition:(v,r,n)=>n>=10 },
  { id:"ppiya_bff",       name:"삐야의 베프",    description:"배지 20개 이상 획득",   icon:"1f425", isMeta:true, condition:(v,r,n)=>n>=20 },
  { id:"ppiya_journey",   name:"삐야와 전국일주", description:"배지 50개 이상 획득",  icon:"1f425", isMeta:true, condition:(v,r,n)=>n>=50 },

  // ═══ 조합 배지 (특정 배지 보유 기반) ═══
  { id:"king_road",       name:"왕의 길",        description:"경주·공주·부여 색칠 + 세종대왕 배지", icon:"1f451", isMeta:true,
    condition:(v,r,n,ids)=>v.includes("gyeongbuk_gyeongju")&&v.includes("chungnam_gongju")&&v.includes("chungnam_buyeo")&&ids.has("sejong_first") },
  { id:"mountain_sea_island", name:"산 넘고 물 건너", description:"산악인·바다 러버·섬 애호가 배지 모두 획득", icon:"1f304", isMeta:true,
    condition:(v,r,n,ids)=>ids.has("mountain_5")&&ids.has("sea_lover")&&ids.has("island_7") },
  { id:"four_seasons",    name:"사계",           description:"봄·여름·가을·겨울 여행자 배지 모두 획득", icon:"1f340", isMeta:true,
    condition:(v,r,n,ids)=>ids.has("spring_traveler")&&ids.has("summer_traveler")&&ids.has("fall_traveler")&&ids.has("winter_traveler") },
  { id:"time_traveler",   name:"시간 여행자",    description:"주말부부·당일치기 고수 배지 획득",        icon:"23f0",  isMeta:true,
    condition:(v,r,n,ids)=>ids.has("weekend_5")&&ids.has("day_tripper") },
]

// ── 배지 계산 함수 ────────────────────────────────────────────────
export const getEarnedBadges = (visitedIds, records = []) => {
  const nonMeta = BADGES.filter(b => !b.isMeta && b.condition(visitedIds, records, 0, new Set()))
  const earnedIds = new Set(nonMeta.map(b => b.id))
  const earnedCount = nonMeta.length
  const meta = BADGES.filter(b => b.isMeta && b.condition(visitedIds, records, earnedCount, earnedIds))
  return [...nonMeta, ...meta]
}

export const getNewBadges = (prevIds, newIds, records = []) => {
  const prevSet = new Set(getEarnedBadges(prevIds, records).map(b => b.id))
  return getEarnedBadges(newIds, records).filter(b => !prevSet.has(b.id))
}
