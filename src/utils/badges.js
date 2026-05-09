const GANGWON_IDS = [
  "gangwon_chuncheon", "gangwon_wonju", "gangwon_gangneung", "gangwon_donghae",
  "gangwon_taebaek", "gangwon_sokcho", "gangwon_samcheok", "gangwon_hongcheon",
  "gangwon_hoengseong", "gangwon_yeongwol", "gangwon_pyeongchang", "gangwon_jeongseon",
  "gangwon_cheorwon", "gangwon_hwacheon", "gangwon_yanggu", "gangwon_inje",
  "gangwon_goseong", "gangwon_yangyang"
]

const COASTAL_IDS = [
  "busan_jung", "busan_seo", "busan_dong", "busan_yeongdo", "busan_nam",
  "busan_haeundae", "busan_saha", "busan_gangseo", "busan_gijang",
  "incheon_jung", "incheon_ganghwa", "incheon_ongjin",
  "ulsan_dong", "ulsan_nam", "ulsan_ulju",
  "gangwon_gangneung", "gangwon_donghae", "gangwon_sokcho", "gangwon_samcheok",
  "gangwon_goseong", "gangwon_yangyang",
  "chungnam_seosan", "chungnam_taean", "chungnam_boryeong", "chungnam_dangjin",
  "jeonbuk_gunsan", "jeonbuk_buan",
  "jeonnam_mokpo", "jeonnam_yeosu", "jeonnam_gwangyang", "jeonnam_goheung",
  "jeonnam_jangheung", "jeonnam_gangjin", "jeonnam_haenam", "jeonnam_yeongam",
  "jeonnam_muan", "jeonnam_wando", "jeonnam_jindo", "jeonnam_sinan",
  "gyeongbuk_pohang", "gyeongbuk_yeongdeok", "gyeongbuk_uljin", "gyeongbuk_ulleung",
  "gyeongnam_changwon", "gyeongnam_tongyeong", "gyeongnam_sacheon",
  "gyeongnam_geoje", "gyeongnam_namhae",
  "jeju_jeju", "jeju_seogwipo",
]

const countVisited = (visited, list) =>
  list.filter(id => visited.includes(id)).length

export const BADGES = [
  {
    id: "first_step",
    name: "첫 발걸음",
    description: "첫 번째 지역 색칠 시 획득",
    icon: "👣",
    condition: (v) => v.length >= 1,
  },
  {
    id: "gangwon_conqueror",
    name: "강원도 정복자",
    description: "강원도 전 지역 색칠",
    icon: "🏔️",
    condition: (v) => countVisited(v, GANGWON_IDS) >= 18,
  },
  {
    id: "sea_lover",
    name: "바다 러버",
    description: "해안 지역 10개 이상 색칠",
    icon: "🌊",
    condition: (v) => countVisited(v, COASTAL_IDS) >= 10,
  },
  {
    id: "legend_explorer",
    name: "전설의 탐험가",
    description: "전국 모든 지역 색칠",
    icon: "🗺️",
    condition: (v) => v.length >= 229,
  },
  {
    id: "winter_traveler",
    name: "겨울 여행자",
    description: "겨울(12~2월)에 10개 이상 색칠",
    icon: "❄️",
    condition: (v) => {
      const month = new Date().getMonth() + 1
      return (month >= 12 || month <= 2) && v.length >= 10
    },
  },
  {
    id: "half_way",
    name: "반환점",
    description: "전체의 절반 이상 색칠",
    icon: "🎯",
    condition: (v) => v.length >= 115,
  },
]

export const getEarnedBadges = (visitedIds) =>
  BADGES.filter(badge => badge.condition(visitedIds))

export const getNewBadges = (prevIds, newIds) => {
  const prev = new Set(BADGES.filter(b => b.condition(prevIds)).map(b => b.id))
  return BADGES.filter(b => b.condition(newIds) && !prev.has(b.id))
}