// SVG 그룹 번호 → 통합 지역 ID 매핑 (기존 데이터 호환용)
export const SVG_TO_REGION = {
  // 서울특별시 (227~251)
  "227":"seoul","228":"seoul","229":"seoul","230":"seoul","231":"seoul",
  "232":"seoul","233":"seoul","234":"seoul","235":"seoul","236":"seoul",
  "237":"seoul","238":"seoul","239":"seoul","240":"seoul","241":"seoul",
  "242":"seoul","243":"seoul","244":"seoul","245":"seoul","246":"seoul",
  "247":"seoul","248":"seoul","249":"seoul","250":"seoul","251":"seoul",

  // 부산광역시 (211~226)
  "211":"busan","212":"busan","213":"busan","214":"busan","215":"busan",
  "216":"busan","217":"busan","218":"busan","219":"busan","220":"busan",
  "221":"busan","222":"busan","223":"busan","224":"busan","225":"busan",
  "226":"busan",

  // 대구광역시 (203~210)
  "203":"daegu","204":"daegu","205":"daegu","206":"daegu",
  "207":"daegu","208":"daegu","209":"daegu","210":"daegu",

  // 인천광역시 (193~202)
  "193":"incheon","194":"incheon","195":"incheon","196":"incheon",
  "197":"incheon","198":"incheon","199":"incheon","200":"incheon",
  "201":"incheon","202":"incheon",

  // 광주광역시 (188~192)
  "188":"gwangju","189":"gwangju","190":"gwangju","191":"gwangju","192":"gwangju",

  // 대전광역시 (183~187)
  "183":"daejeon","184":"daejeon","185":"daejeon","186":"daejeon","187":"daejeon",

  // 울산광역시 (178, 180~182)
  "178":"ulsan","180":"ulsan","181":"ulsan","182":"ulsan",

  // 세종특별자치시
  "93":"sejong",

  // 경기도
  "174":"gyeonggi_suwon","175":"gyeonggi_suwon","176":"gyeonggi_suwon","177":"gyeonggi_suwon",
  "171":"gyeonggi_seongnam","172":"gyeonggi_seongnam","173":"gyeonggi_seongnam",
  "170":"gyeonggi_uijeongbu",
  "168":"gyeonggi_anyang","169":"gyeonggi_anyang",
  "165":"gyeonggi_bucheon","166":"gyeonggi_bucheon","167":"gyeonggi_bucheon",
  "164":"gyeonggi_gwangmyeong",
  "163":"gyeonggi_pyeongtaek",
  "162":"gyeonggi_dongducheon",
  "160":"gyeonggi_ansan","161":"gyeonggi_ansan",
  "157":"gyeonggi_goyang","158":"gyeonggi_goyang","159":"gyeonggi_goyang",
  "156":"gyeonggi_gwacheon",
  "155":"gyeonggi_guri",
  "154":"gyeonggi_namyangju",
  "153":"gyeonggi_osan",
  "152":"gyeonggi_siheung",
  "151":"gyeonggi_gunpo",
  "150":"gyeonggi_uiwang",
  "149":"gyeonggi_hanam",
  "146":"gyeonggi_yongin","147":"gyeonggi_yongin","148":"gyeonggi_yongin",
  "145":"gyeonggi_paju",
  "144":"gyeonggi_icheon",
  "143":"gyeonggi_anseong",
  "142":"gyeonggi_gimpo",
  "141":"gyeonggi_hwaseong",
  "140":"gyeonggi_gwangju",
  "139":"gyeonggi_yangju",
  "138":"gyeonggi_pocheon",
  "137":"gyeonggi_yeoju",
  "136":"gyeonggi_yeoncheon",
  "135":"gyeonggi_gapyeong",
  "134":"gyeonggi_yangpyeong",

  // 강원도
  "116":"gangwon_yangyang","117":"gangwon_goseong","118":"gangwon_inje",
  "119":"gangwon_yanggu","120":"gangwon_hwacheon","121":"gangwon_cheorwon",
  "122":"gangwon_jeongseon","123":"gangwon_pyeongchang","124":"gangwon_yeongwol",
  "125":"gangwon_hoengseong","126":"gangwon_hongcheon","127":"gangwon_samcheok",
  "128":"gangwon_sokcho","129":"gangwon_taebaek","130":"gangwon_donghae",
  "131":"gangwon_gangneung","132":"gangwon_wonju","133":"gangwon_chuncheon",

  // 충청북도
  "111":"chungbuk_cheongju","114":"chungbuk_cheongju","115":"chungbuk_cheongju",
  "113":"chungbuk_chungju","112":"chungbuk_jecheon",
  "110":"chungbuk_boeun","109":"chungbuk_okcheon","108":"chungbuk_yeongdong",
  "106":"chungbuk_goesan","105":"chungbuk_eumseong","103":"chungbuk_jeungpyeong",
  "107":"chungbuk_jincheon","104":"chungbuk_danyang",

  // 충청남도
  "101":"chungnam_cheonan","102":"chungnam_cheonan",
  "100":"chungnam_gongju",
  "99":"chungnam_boryeong",
  "98":"chungnam_asan",
  "97":"chungnam_seosan",
  "96":"chungnam_nonsan",
  "95":"chungnam_gyeryong",
  "94":"chungnam_geumsan",
  "92":"chungnam_buyeo",
  "91":"chungnam_seocheon",
  "90":"chungnam_cheongyang",
  "89":"chungnam_hongseong",
  "88":"chungnam_yesan",
  "87":"chungnam_taean",
  "86":"chungnam_dangjin",

  // 전라북도
  "84":"jeonbuk_jeonju","85":"jeonbuk_jeonju",
  "83":"jeonbuk_gunsan",
  "82":"jeonbuk_iksan",
  "81":"jeonbuk_jeongeup",
  "80":"jeonbuk_namwon",
  "79":"jeonbuk_gimje",
  "78":"jeonbuk_wanju",
  "77":"jeonbuk_jinan",
  "76":"jeonbuk_muju",
  "75":"jeonbuk_jangsu",
  "74":"jeonbuk_imsil",
  "73":"jeonbuk_sunchang",
  "72":"jeonbuk_gochang",
  "71":"jeonbuk_buan",

  // 전라남도
  "70":"jeonnam_mokpo",
  "69":"jeonnam_yeosu",
  "68":"jeonnam_suncheon",
  "67":"jeonnam_naju",
  "66":"jeonnam_gwangyang",
  "65":"jeonnam_damyang",
  "52":"jeonnam_jangseong",
  "64":"jeonnam_gokseong",
  "63":"jeonnam_gurye",
  "62":"jeonnam_goheung",
  "61":"jeonnam_boseong",
  "60":"jeonnam_hwasun",
  "59":"jeonnam_jangheung",
  "58":"jeonnam_gangjin",
  "57":"jeonnam_haenam",
  "56":"jeonnam_yeongam",
  "55":"jeonnam_muan",
  "54":"jeonnam_hampyeong",
  "53":"jeonnam_yeonggwang",
  "51":"jeonnam_wando",
  "50":"jeonnam_jindo",
  "49":"jeonnam_sinan",

  // 경상북도
  "47":"gyeongbuk_pohang","48":"gyeongbuk_pohang",
  "46":"gyeongbuk_gyeongju","179":"gyeongbuk_gyeongju",
  "45":"gyeongbuk_gimcheon",
  "44":"gyeongbuk_andong",
  "43":"gyeongbuk_gumi",
  "42":"gyeongbuk_yeongju",
  "41":"gyeongbuk_yeongcheon",
  "40":"gyeongbuk_sangju",
  "39":"gyeongbuk_mungyeong",
  "38":"gyeongbuk_gyeongsan",
  "37":"gyeongbuk_gunwi",
  "36":"gyeongbuk_uiseong",
  "35":"gyeongbuk_cheongsong",
  "34":"gyeongbuk_yeongyang",
  "33":"gyeongbuk_yeongdeok",
  "32":"gyeongbuk_cheongdo",
  "31":"gyeongbuk_goryeong",
  "30":"gyeongbuk_seongju",
  "29":"gyeongbuk_chilgok",
  "28":"gyeongbuk_yecheon",
  "27":"gyeongbuk_bonghwa",
  "26":"gyeongbuk_uljin",
  "25":"gyeongbuk_ulleung",

  // 경상남도
  "24":"gyeongnam_jinju",
  "23":"gyeongnam_tongyeong",
  "22":"gyeongnam_sacheon",
  "21":"gyeongnam_gimhae",
  "20":"gyeongnam_miryang",
  "19":"gyeongnam_geoje",
  "18":"gyeongnam_yangsan",
  "17":"gyeongnam_changwon","16":"gyeongnam_changwon","15":"gyeongnam_changwon",
  "14":"gyeongnam_changwon","13":"gyeongnam_changwon",
  "12":"gyeongnam_uiryeong",
  "11":"gyeongnam_haman",
  "10":"gyeongnam_changnyeong",
  "9":"gyeongnam_goseong",
  "8":"gyeongnam_namhae",
  "7":"gyeongnam_hadong",
  "6":"gyeongnam_sancheong",
  "5":"gyeongnam_hamyang",
  "4":"gyeongnam_geochang",
  "3":"gyeongnam_hapcheon",

  // 제주도
  "2":"jeju_jeju",
  "1":"jeju_seogwipo",

  // 독도
  "252":"dokdo",
}

export const TOTAL_REGIONS = new Set(Object.values(SVG_TO_REGION)).size

// 지역 ID → 대표 SVG 번호 (기존 Firestore 데이터 호환용 역방향 매핑)
export const REGION_TO_SVG = {}
for (const [svgNum, regionId] of Object.entries(SVG_TO_REGION)) {
  if (!REGION_TO_SVG[regionId]) REGION_TO_SVG[regionId] = svgNum
}

export const getCompletionRate = (visitedRegions) => {
  if (!visitedRegions || visitedRegions.length === 0) return '0.0'
  return ((visitedRegions.length / TOTAL_REGIONS) * 100).toFixed(1)
}

export const REGION_INFO = {
  "seoul": { name: "서울특별시", short: "서울" },
  "busan": { name: "부산광역시", short: "부산" },
  "daegu": { name: "대구광역시", short: "대구" },
  "incheon": { name: "인천광역시", short: "인천" },
  "gwangju": { name: "광주광역시", short: "광주" },
  "daejeon": { name: "대전광역시", short: "대전" },
  "ulsan": { name: "울산광역시", short: "울산" },
  "sejong": { name: "세종특별자치시", short: "세종" },
  "gyeonggi_suwon": { name: "경기 수원시", short: "수원" },
  "gyeonggi_seongnam": { name: "경기 성남시", short: "성남" },
  "gyeonggi_uijeongbu": { name: "경기 의정부시", short: "의정부" },
  "gyeonggi_anyang": { name: "경기 안양시", short: "안양" },
  "gyeonggi_bucheon": { name: "경기 부천시", short: "부천" },
  "gyeonggi_gwangmyeong": { name: "경기 광명시", short: "광명" },
  "gyeonggi_pyeongtaek": { name: "경기 평택시", short: "평택" },
  "gyeonggi_dongducheon": { name: "경기 동두천시", short: "동두천" },
  "gyeonggi_ansan": { name: "경기 안산시", short: "안산" },
  "gyeonggi_goyang": { name: "경기 고양시", short: "고양" },
  "gyeonggi_gwacheon": { name: "경기 과천시", short: "과천" },
  "gyeonggi_guri": { name: "경기 구리시", short: "구리" },
  "gyeonggi_namyangju": { name: "경기 남양주시", short: "남양주" },
  "gyeonggi_osan": { name: "경기 오산시", short: "오산" },
  "gyeonggi_siheung": { name: "경기 시흥시", short: "시흥" },
  "gyeonggi_gunpo": { name: "경기 군포시", short: "군포" },
  "gyeonggi_uiwang": { name: "경기 의왕시", short: "의왕" },
  "gyeonggi_hanam": { name: "경기 하남시", short: "하남" },
  "gyeonggi_yongin": { name: "경기 용인시", short: "용인" },
  "gyeonggi_paju": { name: "경기 파주시", short: "파주" },
  "gyeonggi_icheon": { name: "경기 이천시", short: "이천" },
  "gyeonggi_anseong": { name: "경기 안성시", short: "안성" },
  "gyeonggi_gimpo": { name: "경기 김포시", short: "김포" },
  "gyeonggi_hwaseong": { name: "경기 화성시", short: "화성" },
  "gyeonggi_gwangju": { name: "경기 광주시", short: "광주" },
  "gyeonggi_yangju": { name: "경기 양주시", short: "양주" },
  "gyeonggi_pocheon": { name: "경기 포천시", short: "포천" },
  "gyeonggi_yeoju": { name: "경기 여주시", short: "여주" },
  "gyeonggi_yeoncheon": { name: "경기 연천군", short: "연천" },
  "gyeonggi_gapyeong": { name: "경기 가평군", short: "가평" },
  "gyeonggi_yangpyeong": { name: "경기 양평군", short: "양평" },
  "gangwon_chuncheon": { name: "강원 춘천시", short: "춘천" },
  "gangwon_wonju": { name: "강원 원주시", short: "원주" },
  "gangwon_gangneung": { name: "강원 강릉시", short: "강릉" },
  "gangwon_donghae": { name: "강원 동해시", short: "동해" },
  "gangwon_taebaek": { name: "강원 태백시", short: "태백" },
  "gangwon_sokcho": { name: "강원 속초시", short: "속초" },
  "gangwon_samcheok": { name: "강원 삼척시", short: "삼척" },
  "gangwon_hongcheon": { name: "강원 홍천군", short: "홍천" },
  "gangwon_hoengseong": { name: "강원 횡성군", short: "횡성" },
  "gangwon_yeongwol": { name: "강원 영월군", short: "영월" },
  "gangwon_pyeongchang": { name: "강원 평창군", short: "평창" },
  "gangwon_jeongseon": { name: "강원 정선군", short: "정선" },
  "gangwon_cheorwon": { name: "강원 철원군", short: "철원" },
  "gangwon_hwacheon": { name: "강원 화천군", short: "화천" },
  "gangwon_yanggu": { name: "강원 양구군", short: "양구" },
  "gangwon_inje": { name: "강원 인제군", short: "인제" },
  "gangwon_goseong": { name: "강원 고성군", short: "고성" },
  "gangwon_yangyang": { name: "강원 양양군", short: "양양" },
  "chungbuk_cheongju": { name: "충북 청주시", short: "청주" },
  "chungbuk_chungju": { name: "충북 충주시", short: "충주" },
  "chungbuk_jecheon": { name: "충북 제천시", short: "제천" },
  "chungbuk_boeun": { name: "충북 보은군", short: "보은" },
  "chungbuk_okcheon": { name: "충북 옥천군", short: "옥천" },
  "chungbuk_yeongdong": { name: "충북 영동군", short: "영동" },
  "chungbuk_jeungpyeong": { name: "충북 증평군", short: "증평" },
  "chungbuk_jincheon": { name: "충북 진천군", short: "진천" },
  "chungbuk_goesan": { name: "충북 괴산군", short: "괴산" },
  "chungbuk_eumseong": { name: "충북 음성군", short: "음성" },
  "chungbuk_danyang": { name: "충북 단양군", short: "단양" },
  "chungnam_cheonan": { name: "충남 천안시", short: "천안" },
  "chungnam_gongju": { name: "충남 공주시", short: "공주" },
  "chungnam_boryeong": { name: "충남 보령시", short: "보령" },
  "chungnam_asan": { name: "충남 아산시", short: "아산" },
  "chungnam_seosan": { name: "충남 서산시", short: "서산" },
  "chungnam_nonsan": { name: "충남 논산시", short: "논산" },
  "chungnam_gyeryong": { name: "충남 계룡시", short: "계룡" },
  "chungnam_dangjin": { name: "충남 당진시", short: "당진" },
  "chungnam_geumsan": { name: "충남 금산군", short: "금산" },
  "chungnam_buyeo": { name: "충남 부여군", short: "부여" },
  "chungnam_seocheon": { name: "충남 서천군", short: "서천" },
  "chungnam_cheongyang": { name: "충남 청양군", short: "청양" },
  "chungnam_hongseong": { name: "충남 홍성군", short: "홍성" },
  "chungnam_yesan": { name: "충남 예산군", short: "예산" },
  "chungnam_taean": { name: "충남 태안군", short: "태안" },
  "jeonbuk_jeonju": { name: "전북 전주시", short: "전주" },
  "jeonbuk_gunsan": { name: "전북 군산시", short: "군산" },
  "jeonbuk_iksan": { name: "전북 익산시", short: "익산" },
  "jeonbuk_jeongeup": { name: "전북 정읍시", short: "정읍" },
  "jeonbuk_namwon": { name: "전북 남원시", short: "남원" },
  "jeonbuk_gimje": { name: "전북 김제시", short: "김제" },
  "jeonbuk_wanju": { name: "전북 완주군", short: "완주" },
  "jeonbuk_jinan": { name: "전북 진안군", short: "진안" },
  "jeonbuk_muju": { name: "전북 무주군", short: "무주" },
  "jeonbuk_jangsu": { name: "전북 장수군", short: "장수" },
  "jeonbuk_imsil": { name: "전북 임실군", short: "임실" },
  "jeonbuk_sunchang": { name: "전북 순창군", short: "순창" },
  "jeonbuk_gochang": { name: "전북 고창군", short: "고창" },
  "jeonbuk_buan": { name: "전북 부안군", short: "부안" },
  "jeonnam_mokpo": { name: "전남 목포시", short: "목포" },
  "jeonnam_yeosu": { name: "전남 여수시", short: "여수" },
  "jeonnam_suncheon": { name: "전남 순천시", short: "순천" },
  "jeonnam_naju": { name: "전남 나주시", short: "나주" },
  "jeonnam_gwangyang": { name: "전남 광양시", short: "광양" },
  "jeonnam_damyang": { name: "전남 담양군", short: "담양" },
  "jeonnam_gokseong": { name: "전남 곡성군", short: "곡성" },
  "jeonnam_gurye": { name: "전남 구례군", short: "구례" },
  "jeonnam_goheung": { name: "전남 고흥군", short: "고흥" },
  "jeonnam_boseong": { name: "전남 보성군", short: "보성" },
  "jeonnam_hwasun": { name: "전남 화순군", short: "화순" },
  "jeonnam_jangheung": { name: "전남 장흥군", short: "장흥" },
  "jeonnam_gangjin": { name: "전남 강진군", short: "강진" },
  "jeonnam_haenam": { name: "전남 해남군", short: "해남" },
  "jeonnam_yeongam": { name: "전남 영암군", short: "영암" },
  "jeonnam_muan": { name: "전남 무안군", short: "무안" },
  "jeonnam_hampyeong": { name: "전남 함평군", short: "함평" },
  "jeonnam_yeonggwang": { name: "전남 영광군", short: "영광" },
  "jeonnam_jangseong": { name: "전남 장성군", short: "장성" },
  "jeonnam_wando": { name: "전남 완도군", short: "완도" },
  "jeonnam_jindo": { name: "전남 진도군", short: "진도" },
  "jeonnam_sinan": { name: "전남 신안군", short: "신안" },
  "gyeongbuk_pohang": { name: "경북 포항시", short: "포항" },
  "gyeongbuk_gyeongju": { name: "경북 경주시", short: "경주" },
  "gyeongbuk_gimcheon": { name: "경북 김천시", short: "김천" },
  "gyeongbuk_andong": { name: "경북 안동시", short: "안동" },
  "gyeongbuk_gumi": { name: "경북 구미시", short: "구미" },
  "gyeongbuk_yeongju": { name: "경북 영주시", short: "영주" },
  "gyeongbuk_yeongcheon": { name: "경북 영천시", short: "영천" },
  "gyeongbuk_sangju": { name: "경북 상주시", short: "상주" },
  "gyeongbuk_mungyeong": { name: "경북 문경시", short: "문경" },
  "gyeongbuk_gyeongsan": { name: "경북 경산시", short: "경산" },
  "gyeongbuk_gunwi": { name: "경북 군위군", short: "군위" },
  "gyeongbuk_uiseong": { name: "경북 의성군", short: "의성" },
  "gyeongbuk_cheongsong": { name: "경북 청송군", short: "청송" },
  "gyeongbuk_yeongyang": { name: "경북 영양군", short: "영양" },
  "gyeongbuk_yeongdeok": { name: "경북 영덕군", short: "영덕" },
  "gyeongbuk_cheongdo": { name: "경북 청도군", short: "청도" },
  "gyeongbuk_goryeong": { name: "경북 고령군", short: "고령" },
  "gyeongbuk_seongju": { name: "경북 성주군", short: "성주" },
  "gyeongbuk_chilgok": { name: "경북 칠곡군", short: "칠곡" },
  "gyeongbuk_yecheon": { name: "경북 예천군", short: "예천" },
  "gyeongbuk_bonghwa": { name: "경북 봉화군", short: "봉화" },
  "gyeongbuk_uljin": { name: "경북 울진군", short: "울진" },
  "gyeongbuk_ulleung": { name: "경북 울릉군", short: "울릉" },
  "gyeongnam_changwon": { name: "경남 창원시", short: "창원" },
  "gyeongnam_jinju": { name: "경남 진주시", short: "진주" },
  "gyeongnam_tongyeong": { name: "경남 통영시", short: "통영" },
  "gyeongnam_sacheon": { name: "경남 사천시", short: "사천" },
  "gyeongnam_gimhae": { name: "경남 김해시", short: "김해" },
  "gyeongnam_miryang": { name: "경남 밀양시", short: "밀양" },
  "gyeongnam_geoje": { name: "경남 거제시", short: "거제" },
  "gyeongnam_yangsan": { name: "경남 양산시", short: "양산" },
  "gyeongnam_uiryeong": { name: "경남 의령군", short: "의령" },
  "gyeongnam_haman": { name: "경남 함안군", short: "함안" },
  "gyeongnam_changnyeong": { name: "경남 창녕군", short: "창녕" },
  "gyeongnam_goseong": { name: "경남 고성군", short: "고성" },
  "gyeongnam_namhae": { name: "경남 남해군", short: "남해" },
  "gyeongnam_hadong": { name: "경남 하동군", short: "하동" },
  "gyeongnam_sancheong": { name: "경남 산청군", short: "산청" },
  "gyeongnam_hamyang": { name: "경남 함양군", short: "함양" },
  "gyeongnam_geochang": { name: "경남 거창군", short: "거창" },
  "gyeongnam_hapcheon": { name: "경남 합천군", short: "합천" },
  "jeju_jeju": { name: "제주 제주시", short: "제주" },
  "jeju_seogwipo": { name: "제주 서귀포시", short: "서귀포" },
  "dokdo": { name: "독도", short: "독도" },
}

export const REGION_MAP = Object.fromEntries(
  Object.entries(SVG_TO_REGION).map(([svgNum, regionId]) => [
    svgNum,
    { id: regionId, name: REGION_INFO[regionId]?.name || regionId },
  ])
)

export const getRegionName = (svgNum) => {
  const regionId = SVG_TO_REGION[String(svgNum)]
  if (!regionId) return null
  return REGION_INFO[regionId] || null
}

export const getRegionId = (svgNum) => {
  return SVG_TO_REGION[String(svgNum)] || null
}

export const getGroupsBySvgNum = (svgNum) => {
  const regionId = SVG_TO_REGION[String(svgNum)]
  if (!regionId) return [String(svgNum)]
  return Object.entries(SVG_TO_REGION)
    .filter(([, id]) => id === regionId)
    .map(([num]) => num)
}

export const searchRegions = (query) => {
  const q = query.trim()
  if (!q) return []
  const seen = new Set()
  const results = []
  for (const [svgNum, regionId] of Object.entries(SVG_TO_REGION)) {
    if (seen.has(regionId)) continue
    seen.add(regionId)
    const info = REGION_INFO[regionId]
    if (!info) continue
    if (info.name.includes(q) || info.short.includes(q)) {
      results.push({ svgNum, name: info.name })
    }
  }
  return results.slice(0, 6)
}
