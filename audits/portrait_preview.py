"""Visual compare of official Castle players page with the proposed uniform photo CSS.
Read-only browser test: all source photos and Supabase data stay unchanged.
"""
import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright

URL="https://shakoory96.github.io/the-castle-fc/?v=portrait-audit-20261118"
ROOT=Path("audits/portrait")
ROOT.mkdir(parents=True,exist_ok=True)

async def run():
    result=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True)
        for width in (390, 430):
            page=await browser.new_page(viewport={"width":width,"height":844},device_scale_factor=1,is_mobile=True,has_touch=True)
            errors=[]
            page.on("pageerror",lambda e:errors.append(str(e)[:160]))
            res=await page.goto(URL,wait_until="domcontentloaded",timeout=45000)
            await page.locator("#screen .hero").wait_for(timeout=25000)
            await page.evaluate("""() => document.querySelector('.mobile-bottom [data-view="players"]')?.click()""")
            await page.locator(".castle-roster-card").first.wait_for(timeout=25000)
            # Lazy-load all 9 player portraits by scrolling through the real player grid.
            await page.evaluate("""async () => {
              const nodes=[...document.querySelectorAll('.castle-roster-card')];
              for(const node of nodes){
                node.scrollIntoView({block:'center'});
                await new Promise(r=>setTimeout(r,150));
              }
            }""")
            await page.wait_for_timeout(1800)
            await page.evaluate("window.scrollTo({top:0,behavior:'instant'})")
            await page.wait_for_timeout(500)
            if width==390:
                await page.locator(".castle-roster-grid").screenshot(path=str(ROOT/"players-before.png"))
            # Apply ONLY proposed CSS and player name data-attrs to the currently live page.
            await page.evaluate("""() => document.querySelectorAll('.castle-roster-card').forEach(card => {
              card.dataset.playerName=card.querySelector('.castle-roster-name')?.textContent.trim()||'';
            })""")
            await page.add_style_tag(path="castle-player-photo-framing.css")
            await page.wait_for_timeout(350)
            await page.locator(".castle-roster-grid").screenshot(path=str(ROOT/("players-after-"+str(width)+".png")))
            items=await page.evaluate("""() => [...document.querySelectorAll('.castle-roster-card')].map(card=>{
              const img=card.querySelector('.castle-roster-image img');
              const rect=card.querySelector('.castle-roster-visual')?.getBoundingClientRect();
              return {name:card.dataset.playerName,photoWidth:img?.naturalWidth||0,
                photoHeight:img?.naturalHeight||0,zoom:getComputedStyle(card).getPropertyValue('--castle-photo-scale').trim()||'1',
                objectFit:img?getComputedStyle(img).objectFit:null,
                frameHeight:Math.round(rect?.height||0)};
            })""")
            result.append({"width":width,"http":res.status if res else None,
              "scrollOverflow":await page.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth"),
              "jsErrors":errors,"players":items})
            await page.close()
        await browser.close()
    (ROOT/"results.json").write_text(json.dumps(result,ensure_ascii=False,indent=2))
    print(json.dumps(result,ensure_ascii=False,indent=2))
asyncio.run(run())
