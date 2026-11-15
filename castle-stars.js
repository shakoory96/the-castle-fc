/* THE CASTLE FC — roster carousel. Uses current Supabase-backed player records only. */
function castleStarsCarousel(){
  const roster=state.players.filter(p=>p.is_active!==false).slice().sort((a,b)=>{
    const n=p=>p.jersey_number==null?9999:Number(p.jersey_number);
    return n(a)-n(b);
  });
  if(!roster.length)return '';
  const cards=roster.map(p=>{
    const photo=p.photo_url&&safeUrl(p.photo_url);
    const jersey=p.jersey_number==null?'—':fmt(p.jersey_number);
    const portrait=photo?'<img src="'+photo+'" alt="صورة اللاعب '+esc(p.name)+'" loading="lazy" decoding="async">':'<span class="castle-star-silhouette" aria-hidden="true">♟</span>';
    return '<button class="castle-star-card" type="button" data-player="'+esc(p.id)+'" aria-label="عرض ملف اللاعب '+esc(p.name)+'">'+
      '<div class="castle-star-photo">'+portrait+'<span class="castle-star-jersey">#'+jersey+'</span></div>'+
      '<div class="castle-star-info"><span class="castle-star-name">'+esc(p.name)+'</span>'+
      '<span class="castle-star-position">'+esc(p.position||'لاعب القلعة')+'</span></div></button>';
  }).join('');
  return '<section class="castle-stars" aria-labelledby="castle-stars-title">'+
    '<header class="castle-stars-header"><div class="castle-stars-heading"><div class="castle-stars-eyebrow">THE CASTLE · OUR PLAYERS</div>'+
    '<h3 id="castle-stars-title">'+t('starsTitle')+'</h3><p>'+t('starsSubtitle')+'</p></div>'+
    '<div class="castle-stars-arrows">'+
    '<button class="castle-stars-arrow" type="button" data-castle-stars-step="-1" aria-label="اللاعب السابق" title="السابق">›</button>'+
    '<button class="castle-stars-arrow" type="button" data-castle-stars-step="1" aria-label="اللاعب التالي" title="التالي">‹</button>'+
    '</div></header>'+
    '<div id="castle-stars-rail" class="castle-stars-rail" tabindex="0" role="region" aria-roledescription="شريط أفقي" aria-label="بطاقات لاعبي القلعة، اسحب أفقياً لعرض المزيد">'+cards+'</div>'+
    '<div class="castle-stars-hint"><span>اسحب يمين ويسار لاستعراض نجوم القلعة</span><span>'+fmt(roster.length)+' لاعبين</span></div></section>';
}
/* Gentle automatic slideshow: one player every 5.2 seconds, seamless forward wrap. */
const CASTLE_STARS_AUTO_MS=5200;
let castleStarsPauseUntil=0;
function castleStarsPause(){castleStarsPauseUntil=Date.now()+12000;}
function castleStarsSetupLoop(rail){
  if(!rail||rail.dataset.castleStarsLoop)return;
  const originals=Array.from(rail.querySelectorAll('.castle-star-card'));
  if(originals.length<2){rail.dataset.castleStarsLoop='0';return;}
  const span=rail.scrollWidth,goal=span+rail.clientWidth+200;
  let copies=0;
  while(rail.scrollWidth<goal&&copies<12){
    originals.forEach(card=>{
      const copy=card.cloneNode(true);
      copy.setAttribute('aria-hidden','true');
      copy.tabIndex=-1;
      copy.dataset.castleStarsDuplicate='1';
      rail.appendChild(copy);
    });
    copies++;
  }
  rail.dataset.castleStarsLoop=String(originals.length);
}
function castleStarsAlignInstant(rail,card){
  const delta=card.getBoundingClientRect().right-rail.getBoundingClientRect().right;
  const originalSnap=rail.style.scrollSnapType;
  rail.style.scrollSnapType='none';
  rail.scrollLeft+=delta;
  rail.style.scrollSnapType=originalSnap;
}
function castleStarsMove(step){
  const rail=document.getElementById('castle-stars-rail');if(!rail)return;
  castleStarsSetupLoop(rail);
  const cards=Array.from(rail.querySelectorAll('.castle-star-card'));if(cards.length<2)return;
  const originals=Number(rail.dataset.castleStarsLoop)||cards.length;
  const right=rail.getBoundingClientRect().right;
  let nearest=0,best=Infinity;
  cards.forEach((card,i)=>{
    const dist=Math.abs(card.getBoundingClientRect().right-right);
    if(dist<best){nearest=i;best=dist;}
  });
  if(nearest>=originals){
    const firstCycle=nearest%originals;
    castleStarsAlignInstant(rail,cards[firstCycle]);
    nearest=firstCycle;
  }
  const nextIndex=step>0?nearest+1:(nearest===0?originals-1:nearest-1);
  const target=cards[nextIndex];if(!target)return;
  const delta=target.getBoundingClientRect().right-rail.getBoundingClientRect().right;
  const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  rail.scrollBy({left:delta,behavior:reduce?'instant':'smooth'});
}
function castleStarsAutoTick(){
  const rail=document.getElementById('castle-stars-rail');if(!rail)return;
  if(Date.now()<castleStarsPauseUntil||document.visibilityState==='hidden')return;
  if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
  const area=rail.closest('.castle-stars');
  if(area&&window.matchMedia?.('(hover: hover)').matches&&area.matches(':hover'))return;
  if(area&&area.contains(document.activeElement))return;
  const rect=rail.getBoundingClientRect();
  if(rect.bottom<0||rect.top>window.innerHeight)return;
  castleStarsSetupLoop(rail);
  if(Number(rail.dataset.castleStarsLoop)<2)return;
  if(rail.scrollWidth<=rail.clientWidth+8)return;
  castleStarsMove(1);
}
let castleStarsPointer=null,castleStarsSuppressClickUntil=0;
document.addEventListener('pointerdown',e=>{
  const rail=e.target.closest?.('.castle-stars-rail');
  if(!rail||e.pointerType!=='mouse'||e.button!==0)return;
  castleStarsPointer={rail,startX:e.clientX,startScroll:rail.scrollLeft,moved:false};
});
document.addEventListener('pointermove',e=>{
  const d=castleStarsPointer;if(!d)return;
  const delta=e.clientX-d.startX;
  if(Math.abs(delta)>7)d.moved=true;
  if(d.moved){
    d.rail.classList.add('is-dragging');
    d.rail.scrollLeft=d.startScroll-delta;
    e.preventDefault();
  }
});
function castleStarsEndDrag(){
  if(!castleStarsPointer)return;
  if(castleStarsPointer.moved)castleStarsSuppressClickUntil=Date.now()+240;
  castleStarsPointer.rail.classList.remove('is-dragging');
  castleStarsPointer=null;
}
document.addEventListener('pointerup',castleStarsEndDrag);
document.addEventListener('pointercancel',castleStarsEndDrag);
window.addEventListener('blur',castleStarsEndDrag);
document.addEventListener('click',e=>{
  if(e.target.closest?.('.castle-star-card')&&Date.now()<castleStarsSuppressClickUntil){
    e.preventDefault();e.stopImmediatePropagation();castleStarsSuppressClickUntil=0;
  }
},true);
document.addEventListener('click',e=>{
  const btn=e.target.closest?.('[data-castle-stars-step]');
  if(btn){castleStarsMove(Number(btn.dataset.castleStarsStep));}
});
document.addEventListener('keydown',e=>{
  if(!e.target.matches?.('#castle-stars-rail'))return;
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
    e.preventDefault();castleStarsMove(e.key==='ArrowLeft'?1:-1);
  }
});

/* Interaction always wins over automatic movement. */
document.addEventListener('pointerdown',e=>{
  if(e.target.closest?.('.castle-stars'))castleStarsPause();
},{passive:true});
document.addEventListener('wheel',e=>{
  if(e.target.closest?.('.castle-stars'))castleStarsPause();
},{passive:true});
document.addEventListener('focusin',e=>{
  if(e.target.closest?.('.castle-stars'))castleStarsPause();
});
document.addEventListener('keydown',e=>{
  if(e.target.closest?.('.castle-stars'))castleStarsPause();
});
window.setInterval(castleStarsAutoTick,CASTLE_STARS_AUTO_MS);
