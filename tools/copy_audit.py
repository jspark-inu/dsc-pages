"""WS5 문구 게이트: 화면에 보이는 모든 문장을 뽑아 소개·설명·설득형 표현을 찾는다"""
import sys, re, threading, http.server, socketserver, functools
from playwright.sync_api import sync_playwright
ROOT, PORT = sys.argv[1], int(sys.argv[2])
BANNED = [r'모았습니다', r'한곳에', r'한 곳에', r'놓치지', r'지금 (신청|바로)', r'만나보세요', r'확인해 ?보세요', r'함께해', r'소개합니다',
          r'여기에', r'다양한', r'특별한', r'최고의', r'쉽고', r'편리하', r'새로운 경험', r'기대하세요', r'환영합니다', r'올라오면']
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
srv=socketserver.TCPServer(('127.0.0.1',PORT),functools.partial(Q,directory=ROOT)); threading.Thread(target=srv.serve_forever,daemon=True).start()
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1440,'height':900})
    pg.goto(f'http://127.0.0.1:{PORT}/',wait_until='networkidle'); pg.wait_for_timeout(1500)
    texts=pg.evaluate('()=>[...new Set(document.body.innerText.split("\\n").map(s=>s.trim()).filter(Boolean))]')
    texts+=pg.evaluate('()=>[...document.querySelectorAll("[placeholder],[aria-label],meta[name=description]")].map(e=>e.getAttribute("placeholder")||e.getAttribute("aria-label")||e.getAttribute("content"))')
    b.close()
srv.shutdown()
hits=[(t,pat) for t in texts for pat in BANNED if re.search(pat,t)]
print('검사한 문구', len(texts), '개'); print('\n'.join('  · '+t for t in texts))
print('문구 위반', len(hits), '건'); [print(f' - "{t}"  ← /{p}/') for t,p in hits]
sys.exit(1 if hits else 0)
