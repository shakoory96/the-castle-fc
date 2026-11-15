/* THE CASTLE FC • Reliable continuously moving player cards. */
let castleStarsManuallyPaused=false;
let castleStarsResumeTimer=null;
let castleStarsMouseDrag=null;
let castleStarsSuppressClickUntil=0;
function castleStarsCarousel(){
  const roster=state.players.filter(p=>p.is_active!==false).slice().sort((a,b)=>{
    const num=p=>p.jersey_number==null?9999:Number(p.jersey_number);
    return num(a)-num(b);
  });
  if(!roster.length)return '';
  const playerCard=(p,isDuplicate)=>{
    const photo=p.photo_url&&safeUrl(p.photo_url);
    const portrait=photo?'<img src="'+photo+'" alt="صورة اللاعب '+esc(p.name)+'" loading="lazy" decoding="async">':'<span class="castle-star-silhouette" aria-hidden="true">♟</span>';
    const jersey=p.jersey_number==null?'—':fmt(p.jersey_number);
    return '<button class="castle-star-card" type="button" data-player="'+esc(p.id)+'"'+(isDuplicate?' tabindex="-1"':'')+' aria-label="عرض ملف اللاعب '+esc(p.name)+'">'+
      '<span class="castle-star-photo">'+portrait+'<span class="castle-star-jersey">#'+jersey+'</span></span>'+
      '<span class="castle-star-info"><span class="castle-star-name">'+esc(p.name)+'</span>'+
      '<span class="castle-star-position">'+esc(p.position||'لاعب القلعة')+'</span></span></button>';
  };
  // Five identical sets make the one-set CSS translation perfectly seamless.
  const groups=Array.from({length:roster.length>1?5:1},(_,i)=>
    '<div class="castle-stars-set"'+(i?' aria-hidden="true"':'')+'>'+roster.map(p=>playerCard(p,i>0)).join('')+'</div>').join('');
  const duration=Math.max(11,roster.length*4.2);
  return '<section class="castle-stars" aria-labelledby="castle-stars-title">'+
    '<header class="castle-stars-header"><div class="castle-stars-heading"><div class="castle-stars-eyebrow">THE CASTLE · OUR PLAYERS</div>'+
    '<h3 id="castle-stars-title">'+t('starsTitle')+'</h3><p>'+t('starsSubtitle')+'</p></div>'+
    '<div class="castle-stars-arrows">'+
    (roster.length>1?'<button class="castle-stars-arrow castle-stars-pause" type="button" id="castle-stars-toggle" aria-pressed="'+castleStarsManuallyPaused+'" aria-label="'+(castleStarsManuallyPaused?'تشغيل الحركة':'إيقاف الحركة')+'" title="'+(castleStarsManuallyPaused?'تشغيل الحركة':'إيقاف الحركة')+'">'+(castleStarsManuallyPaused?'▶':'Ⅱ')+'</button>':'')+
    '<button class="castle-stars-arrow" type="button" data-castle-stars-step="-1" aria-label="اللاعب السابق" title="السابق">›</button>'+
    '<button class="castle-stars-arrow" type="button" data-castle-stars-step="1" aria-label="اللاعب التالي" title="التالي">‹</button>'+
    '</div></header>'+
    '<div id="castle-stars-rail" class="castle-stars-rail" dir="ltr" tabindex="0" role="region" aria-label="شريط أفقي لبطاقات لاعبي القلعة. اسحب يميناً ويساراً">'+
    '<div class="castle-stars-motion'+(castleStarsManuallyPaused?' is-paused':'')+'" style="--castle-stars-duration:'+duration+'s">'+groups+'</div></div>'+
    '<div class="castle-stars-hint"><span>اسحب يمين ويسار لاستعراض نجوم القلعة</span><span>'+fmt(roster.length)+' لاعبين</span></div></section>';
}
function castleStarsPauseForInteraction(delay=2800){
  const rail=document.getElementById('castle-stars-rail');if(!rail)return;
  const motion=rail.querySelector('.castle-stars-motion');if(!motion)return;
  motion.classList.add('is-interacting');
  clearTimeout(castleStarsResumeTimer);
  castleStarsResumeTimer=setTimeout(()=>motion.isConnected&&motion.classList.remove('is-interacting'),delay);
}
/* Seek the CSS timeline instead of scrolling an already-animated element out of view. */
function castleStarsSeek(pixels){
  const rail=document.getElementById('castle-stars-rail');
  const motion=rail?.querySelector('.castle-stars-motion');
  const firstSet=motion?.querySelector('.castle-stars-set');
  const animation=motion?.getAnimations?.().find(a=>a.playState!=='finished');
  const cycle=firstSet?.getBoundingClientRect().width;
  if(!animation||!cycle)return false;
  const duration=(parseFloat(getComputedStyle(motion).animationDuration)||25)*1000;
  const time=Number(animation.currentTime)||0;
  animation.currentTime=((time+(pixels/cycle)*duration)%duration+duration)%duration;
  return true;
}
function castleStarsMove(step){
  const rail=document.getElementById('castle-stars-rail');if(!rail)return;
  const card=rail.querySelector('.castle-star-card');if(!card)return;
  castleStarsPauseForInteraction(2600);
  const px=card.getBoundingClientRect().width+13;
  if(!castleStarsSeek(Math.sign(step)*px)){
    rail.scrollBy({left:Math.sign(step)*px,behavior:'smooth'});
  }
}
function castleStarsSetManualPaused(paused){
  castleStarsManuallyPaused=paused;
  const toggle=document.getElementById('castle-stars-toggle');
  const motion=document.querySelector('#castle-stars-rail .castle-stars-motion');
  if(motion)motion.classList.toggle('is-paused',paused);
  if(toggle){
    toggle.textContent=paused?'▶':'Ⅱ';
    toggle.setAttribute('aria-pressed',String(paused));
    toggle.setAttribute('aria-label',paused?'تشغيل الحركة':'إيقاف الحركة');
    toggle.title=paused?'تشغيل الحركة':'إيقاف الحركة';
  }
}
document.addEventListener('click',e=>{
  const toggle=e.target.closest?.('#castle-stars-toggle');
  if(toggle){castleStarsSetManualPaused(!castleStarsManuallyPaused);return;}
  const step=e.target.closest?.('[data-castle-stars-step]');
  if(step)castleStarsMove(Number(step.dataset.castleStarsStep));
});
document.addEventListener('pointerdown',e=>{
  const rail=e.target.closest?.('.castle-stars-rail');if(!rail)return;
  if(e.pointerType==='mouse'&&e.button!==0)return;
  castleStarsPauseForInteraction(5000);
  castleStarsMouseDrag={rail,x:e.clientX,moved:false};
});
document.addEventListener('pointermove',e=>{
  const d=castleStarsMouseDrag;if(!d)return;
  const dx=e.clientX-d.x;
  if(Math.abs(dx)>5)d.moved=true;
  if(d.moved){
    castleStarsSeek(-dx);
    d.x=e.clientX;
    d.rail.classList.add('is-dragging');
    if(e.pointerType==='mouse')e.preventDefault();
  }
});
function castleStarsEndDrag(){
  if(!castleStarsMouseDrag)return;
  if(castleStarsMouseDrag.moved)castleStarsSuppressClickUntil=Date.now()+350;
  castleStarsMouseDrag.rail.classList.remove('is-dragging');
  castleStarsMouseDrag=null;
}
document.addEventListener('pointerup',castleStarsEndDrag);
document.addEventListener('pointercancel',castleStarsEndDrag);
window.addEventListener('blur',castleStarsEndDrag);
document.addEventListener('click',e=>{
  if(e.target.closest?.('.castle-star-card')&&Date.now()<castleStarsSuppressClickUntil){
    e.preventDefault();e.stopImmediatePropagation();castleStarsSuppressClickUntil=0;
  }
},true);
document.addEventListener('keydown',e=>{
  if(!e.target.matches?.('#castle-stars-rail'))return;
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
    e.preventDefault();castleStarsMove(e.key==='ArrowLeft'?1:-1);
  }
});
document.addEventListener('touchstart',e=>{
  if(e.target.closest?.('.castle-stars-rail'))castleStarsPauseForInteraction(5500);
},{passive:true});
