/**
 * 데이터과학인의 밤 서비스 공모전 — 실시간 경쟁률 현황판
 * 구글폼 응답 시트에 붙여서 웹앱으로 배포합니다.
 * 아래 CONFIG만 수정하면 됩니다.
 */
const CONFIG = {
  PRIZES: [100000, 70000, 50000, 30000, 30000], // 순위별 상금(원). 개수 = 수상 수. 금액 확정되면 수정
  UNIT: '명',                // 집계 단위: '명' 또는 '팀'
  EVENT_DATE: '2026-11-12',  // 행사일 (YYYY-MM-DD)
  DEADLINE: '',              // 신청 마감일 (YYYY-MM-DD). 비워 두면 행사일 기준 D-day
  FORM_URL: '',              // 구글폼 응답 링크 (https://forms.gle/...). 넣으면 화면에 QR 표시
  SHEET_NAME: '',            // 응답 시트 탭 이름. 비워 두면 첫 번째 탭
  DEDUP_HEADER: '학번',      // 이 질문 기준으로 중복 제출 제거. 해당 질문이 없으면 전체 행 수로 셈
};

function doGet(e) {
  // ?format=json 이면 숫자만 JSON으로 반환 (외부 정적 페이지용)
  if (e && e.parameter && e.parameter.format === 'json') {
    return ContentService.createTextOutput(JSON.stringify(getStats()))
      .setMimeType(ContentService.MimeType.JSON);
  }
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('서비스 공모전 신청 현황')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * '설정' 탭이 있으면 그 값을 CONFIG보다 우선 적용합니다. (재배포 불필요)
 * '설정' 탭 형식: A열 항목명, B열 값
 *   상금      | 100000,70000,50000,30000,30000
 *   마감일    | 2026-10-31
 *   행사일    | 2026-11-12
 *   단위      | 명
 */
function readSettings_(ss) {
  const conf = Object.assign({}, CONFIG);
  const sh = ss.getSheetByName('설정');
  if (!sh || sh.getLastRow() < 1) return conf;
  const tz = ss.getSpreadsheetTimeZone();
  const toDate = v => v instanceof Date ? Utilities.formatDate(v, tz, 'yyyy-MM-dd') : String(v).trim();
  sh.getRange(1, 1, sh.getLastRow(), 2).getValues().forEach(([k, v]) => {
    k = String(k).trim();
    if (v === '' || v === null) return;
    if (k === '상금') {
      const arr = String(v).split(/[,\s]+/).map(x => Number(x.replace(/[^0-9]/g, ''))).filter(x => x > 0);
      if (arr.length) conf.PRIZES = arr;
    }
    if (k === '마감일') conf.DEADLINE = toDate(v);
    if (k === '행사일') conf.EVENT_DATE = toDate(v);
    if (k === '단위') conf.UNIT = String(v).trim();
  });
  return conf;
}

/** 화면에서 15초마다 호출. 응답 내용은 내보내지 않고 숫자만 반환합니다. */
function getStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const C = readSettings_(ss);
  const sheet = CONFIG.SHEET_NAME ? ss.getSheetByName(CONFIG.SHEET_NAME) : ss.getSheets()[0];
  let n = 0;

  if (sheet && sheet.getLastRow() > 1) {
    const values = sheet.getDataRange().getValues();
    const header = values[0].map(h => String(h).trim());
    const rows = values.slice(1).filter(r => r.some(c => c !== '' && c !== null));
    const col = CONFIG.DEDUP_HEADER ? header.indexOf(CONFIG.DEDUP_HEADER) : -1;
    if (col >= 0) {
      const seen = new Set();
      rows.forEach(r => {
        const key = String(r[col]).replace(/\s/g, '');
        if (key) seen.add(key);
      });
      n = seen.size;
    } else {
      n = rows.length;
    }
  }

  return {
    n: n,
    awards: C.PRIZES.length,
    prizes: C.PRIZES,
    unit: C.UNIT,
    eventDate: C.EVENT_DATE,
    deadline: C.DEADLINE,
    formUrl: C.FORM_URL,
    updatedAt: Utilities.formatDate(new Date(), 'Asia/Seoul', 'M/d HH:mm:ss'),
  };
}
