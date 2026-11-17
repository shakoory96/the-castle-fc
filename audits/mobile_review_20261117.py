"""Read-only public-site mobile audit for THE CASTLE FC."""
import asyncio, json, os, time
from pathlib import Path
from playwright.async_api import async_playwright

URL="https://shakoory96.github.io/the-castle-fc/?audit=iphone-20261117"
OUT=Path("audits/mobile-results")
OUT.mkdir(parents=True,exist_ok=True)

async def audit():
    results=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True)
        for width in (320, 375, 390, 430, 768):
            errors=[]
            page=await browser.new_page(viewport={"width":width,"height":844},device_scale_factor=1,
                                       is_mobile=width<=430,has_touch=width<=430)
            page.on("pageerror",lambda error:errors.append(str(error)[:180]))
            response=await page.goto(URL,wait_until="domcontentloaded",timeout=40000)
            try:
                await page.locator("#screen .hero").wait_for(timeout=25000)
            except Exception:
                pass
            await page.wait_for_timeout(1500)
            data=await page.evaluate("""() => {
              const $=(sel)=>document.querySelector(sel), $$=(sel)=>[...document.querySelectorAll(sel)];
              const b=(sel)=>{let el=$(sel);if(!el)return null;let r=el.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}};
              const selectors=['.topbar','#screen .hero','#screen .castle-stars','#castle-stars-rail','#screen .castle-stats','#screen .castle-stats-strip','#screen .card-list','#screen .castle-moments-home','.mobile-bottom'];
              const beyond=$$('body *').filter(e=>{const r=e.getBoundingClientRect();const s=getComputedStyle(e);return r.width>2&&s.position!=='fixed'&&s.position!=='absolute'&&r.left < -3||r.right>document.documentElement.clientWidth+3&&r.width>2&&s.position!=='fixed'&&s.position!=='absolute';});
              const rail=$('#castle-stars-rail'), hero=$('#screen .hero');
              return {
               href:location.href,title:document.title,ready:document.readyState,
               w:innerWidth,clientW:document.documentElement.clientWidth,scrollW:document.documentElement.scrollWidth,
               bodyBg:getComputedStyle(document.body).backgroundColor,
               heroDisplay:hero?getComputedStyle(hero).display:null,
               sections:selectors.map(sel=>({sel,rect:b(sel)})),
               stats:$$('#screen .castle-stats-strip .kpi').map(el=>el.innerText.replace(/\\s+/g,' ').trim()),
               stars:$$('.castle-star-card').length,
               starScrollable:rail?rail.scrollWidth>rail.clientWidth:false,
               momentsCards:$$('.castle-moment-card').length,
               results:$$('#screen .card-list .fixture').length,
               activeNav:$$('.mobile-bottom button.active').map(el=>el.innerText.trim()),
               navLabels:$$('.mobile-bottom button').map(el=>el.innerText.replace(/\\s+/g,' ').trim()),
               overflowing:beyond.slice(0,8).map(el=>({tag:el.tagName,cls:String(el.className).slice(0,70),txt:el.textContent.slice(0,20)}))
              }
            }""")
            data.update({"http":response.status if response else None,"width":width,"errors":errors})
            if width in (320,390,430):
                await page.screenshot(path=str(OUT/f"castle-{width}.png"),full_page=(width==390))
            data["heroImages"]=await page.evaluate("""() => [...document.querySelectorAll('#screen .hero img')].map(el=>({cls:el.className,complete:el.complete,naturalWidth:el.naturalWidth,loading:el.loading,sourceDomain:(()=>{try{return new URL(el.src).hostname}catch{return ''}})()}))""")
            # Trigger actual lazy-loaded gallery photos by viewing gallery, not by using fullPage screenshot.
            if width==390 and await page.locator('#screen .castle-moments-home').count():
                await page.locator('#screen .castle-moments-home').scroll_into_view_if_needed()
                await page.wait_for_timeout(3500)
                data["galleryImages"]=await page.evaluate("""() => [...document.querySelectorAll('#screen .castle-moments-home img')].map(el=>({cls:el.className,complete:el.complete,naturalWidth:el.naturalWidth,loading:el.loading,sourceDomain:(()=>{try{return new URL(el.src).hostname}catch{return ''}})()}))""")
                await page.screenshot(path=str(OUT/"castle-gallery-390.png"),full_page=False)
            # Click-test actual public player card and close; do not write data.
            if width==390 and await page.locator('.castle-star-card').count():
                try:
                    await page.locator('.castle-star-card').first.click(timeout=6000)
                    data["playerModal"]=await page.locator('.castle-player-sheet').count()>0
                    await page.locator('#overlay button.close').first.click(timeout=4000)
                except Exception as e:data["playerModalError"]=str(e)[:160]
            # Click-test actual published album.
            if width==390 and await page.locator('.castle-moment-card').count():
                try:
                    await page.locator('.castle-moment-card').first.click(timeout=6000)
                    data["albumModal"]=await page.locator('.castle-moments-modal').count()>0
                    data["albumPhotoCount"]=await page.locator('.castle-moments-photo-grid button').count()
                    await page.locator('#overlay button.close').first.click(timeout=4000)
                except Exception as e:data["albumModalError"]=str(e)[:160]
            results.append(data)
            await page.close()
        await browser.close()
    (OUT/"report.json").write_text(json.dumps(results,ensure_ascii=False,indent=2))
    print("MOBILE_AUDIT_RESULTS_BEGIN")
    print(json.dumps(results,ensure_ascii=False,indent=2))
    print("MOBILE_AUDIT_RESULTS_END")

asyncio.run(audit())
