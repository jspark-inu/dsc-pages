"""WS4 품질 게이트: 모바일 가로스크롤, 콘솔 오류, 키보드 포커스, 이미지 alt, 제목 구조, 워드마크 폭"""
import sys, threading, http.server, socketserver, functools, json
from playwright.sync_api import sync_playwright
ROOT, PORT = sys.argv[1], int(sys.argv[2])
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=socketserver.TCPServer(('127.0.0.1',PORT),functools.partial(Q,directory=ROOT)); threading.Thread(target=srv.serve_forever,daemon=True).start()
fails=[]
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h in [(1440,900),(390,844)]:
        pg=b.new_page(viewport={'width':w,'height':h}); errs=[]
        # 정적 서버에는 Worker(/api/*)가 없으므로 그 404만 제외
        pg.on('console', lambda m: errs.append(m.text) if m.type=='error' and '/api/' not in (m.location or {}).get('url','') else None)
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(f'http://127.0.0.1:{PORT}/',wait_until='networkidle'); pg.wait_for_timeout(1500)
        r=pg.evaluate('''()=>{
          const sw=document.documentElement.scrollWidth, cw=document.documentElement.clientWidth;
          const logo=document.querySelector('.mast .logo'); let lb=null, box=null; if(logo){ const rg=document.createRange(); rg.selectNodeContents(logo); lb=rg.getBoundingClientRect(); const wr=logo.closest('.wrap'); const cs=getComputedStyle(wr); const bb=wr.getBoundingClientRect(); box={width: bb.width-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)}; }
          const h1s=document.querySelectorAll('h1').length;
          const imgsNoAlt=[...document.querySelectorAll('img')].filter(i=>!i.hasAttribute('alt')).length;
          const focusables=[...document.querySelectorAll('a[href],button,input')].filter(e=>e.offsetParent!==null).length;
          return {hscroll: sw>cw+1, hasMast: !!logo, logoFill: lb? Math.round(lb.width/box.width*100):0, posters: document.querySelectorAll('#wall .p').length, h1s, imgsNoAlt, focusables};
        }''')
        pg.keyboard.press('Tab'); pg.keyboard.press('Tab')
        fo=pg.evaluate('()=>{const e=document.activeElement;const s=getComputedStyle(e);return s.outlineStyle!=="none"||s.boxShadow!=="none"}')
        tag=f'[{w}px]'
        if r['hscroll']: fails.append(f'{tag} 가로 스크롤 발생')
        # 워드마크 폭 검사는 편집형(.mast .logo) 레이아웃일 때만. 07-1 벽 디자인은 포스터가 1장 이상 그려졌는지 본다
        if r['hasMast'] and not (95<=r['logoFill']<=101): fails.append(f'{tag} 워드마크 폭 {r["logoFill"]}% (목표 95~101%)')
        if not r['hasMast'] and r['posters']<1: fails.append(f'{tag} 벽에 포스터가 없음')
        if r['h1s']!=1: fails.append(f'{tag} h1 개수 {r["h1s"]} (1개여야 함)')
        if r['imgsNoAlt']: fails.append(f'{tag} alt 없는 이미지 {r["imgsNoAlt"]}개')
        if not fo: fails.append(f'{tag} 키보드 포커스 표시 없음')
        if errs: fails.append(f'{tag} 콘솔 오류: {errs[:3]}')
        print(tag, json.dumps(r,ensure_ascii=False), 'focus_visible=',fo)
    b.close()
srv.shutdown()
print('QA 실패', len(fails), '건'); [print(' -',f) for f in fails]
sys.exit(1 if fails else 0)
