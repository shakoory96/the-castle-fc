
/* THE CASTLE • non-blocking interactive entrance for the homepage */
var castleGateOpened=false;
function castleGateFeature(){
  var match=typeof castleUpcomingMatch==='function'?castleUpcomingMatch():null;
  if(match&&match.status==='scheduled'){
    var date=typeof dateFmt==='function'?dateFmt(match.match_date):match.match_date;
    var info=date+(match.venue?' · '+esc(match.venue):'');
    return '<div class="castle-gate-feature"><span aria-hidden="true" style="font-size:31px">⚽</span><div class="castle-gate-feature-text"><small>المباراة القادمة</small><strong>القلعة × '+esc(match.opponent_name)+'</strong><small>'+info+'</small></div></div><button class="btn sm primary" type="button" data-view="matchday">شاهد ليلة القلعة</button>';
  }
  var active=state.players.filter(function(x){return x.is_active!==false});
  if(active.length){
    var player=active[Math.floor(Date.now()/86400000)%active.length], photo=player.photo_url&&safeUrl(player.photo_url);
    return '<div class="castle-gate-feature">'+(photo?'<img src="'+photo+'" alt="صورة '+esc(player.name)+'" loading="lazy">':'<span aria-hidden="true" style="font-size:34px">♟</span>')+
      '<div class="castle-gate-feature-text"><small>تعرّف على لاعب من القلعة</small><strong>'+esc(player.name)+'</strong><small>'+esc(player.position||'لاعب القلعة')+'</small></div></div>'+
      '<button class="btn sm primary" type="button" data-gate-player="'+esc(player.id)+'">شاهد بطاقة اللاعب</button>';
  }
  return '<div class="castle-gate-feature"><span aria-hidden="true" style="font-size:29px">🏰</span><div class="castle-gate-feature-text"><strong>حياك في بيت القلعة</strong><small>تابع مبارياتنا وقصص فريقنا</small></div></div><button class="btn sm primary" type="button" data-view="players">تصفح اللاعبين</button>';
}
function castleGateSection(){
  var on=castleGateOpened;
  return '<section class="castle-gate'+(on?' is-open':'')+'" id="castle-gate" aria-label="بوابة فريق القلعة">'+
    '<div class="castle-gate-stage" aria-hidden="true"><div class="castle-gate-halo"></div>'+
    '<div class="castle-gate-arch"><div class="castle-gate-door left"></div><div class="castle-gate-door right"></div></div>'+
    '<img class="castle-gate-crest" src="'+siteLogo()+'" alt=""></div>'+
    '<div class="castle-gate-content"><div class="castle-gate-eyebrow">✦ THE CASTLE EXPERIENCE</div>'+
    '<h2>'+t('gateTitle')+' <span>'+t('gateHighlight')+'</span></h2>'+
    '<p>'+t('gateDescription')+'</p>'+
    '<div class="castle-gate-actions"><button id="castle-gate-enter" class="btn primary" type="button" aria-controls="castle-gate-reveal" aria-expanded="'+on+'">'+(on?'أغلق البوابة':'🏰 افتح بوابة القلعة')+'</button>'+
    '<button class="btn ghost" type="button" data-view="matchday">⚡ ليلة القلعة</button></div>'+
    '<div class="castle-gate-reveal" id="castle-gate-reveal"'+(on?'':' hidden')+'>'+castleGateFeature()+
    '<div class="castle-gate-actions"><button class="btn sm ghost" type="button" id="castle-gate-cheer">💙 شجّع القلعة</button>'+
    '<button class="btn sm ghost" type="button" id="castle-gate-share">↗ ادعُ صديقاً</button></div></div></div>'+
    '<span class="castle-gate-spark" aria-hidden="true">✦</span></section>';
}
async function castleGateShare(){
  var url=location.origin+location.pathname;
  try{
    if(navigator.share){await navigator.share({title:'THE CASTLE FC | القلعة',text:'ادخل عالم القلعة الرياضي 🏰💙',url:url});return;}
    if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);notify('تم نسخ رابط القلعة لمشاركته');return;}
    var field=document.createElement('textarea');field.value=url;document.body.appendChild(field);field.select();
    var ok=document.execCommand('copy');field.remove();notify(ok?'تم نسخ رابط الموقع':'انسخ رابط الموقع من شريط العنوان');
  }catch(err){if(err.name!=='AbortError')notify('تعذرت المشاركة، يمكن نسخ رابط الموقع');}
}
document.addEventListener('click',function(e){
  var enter=e.target.closest('#castle-gate-enter');
  if(enter){
    castleGateOpened=!castleGateOpened;
    var gate=document.getElementById('castle-gate'),reveal=document.getElementById('castle-gate-reveal');
    if(gate&&reveal){gate.classList.toggle('is-open',castleGateOpened);reveal.hidden=!castleGateOpened;
      enter.setAttribute('aria-expanded',String(castleGateOpened));enter.textContent=castleGateOpened?'أغلق البوابة':'🏰 افتح بوابة القلعة';}
    return;
  }
  var star=e.target.closest('[data-gate-player]');
  if(star){showPlayer(star.dataset.gatePlayer);return;}
  if(e.target.closest('#castle-gate-share')){castleGateShare();return;}
  if(e.target.closest('#castle-gate-cheer')){
    var gate=document.getElementById('castle-gate');if(!gate)return;
    gate.classList.remove('is-cheering');void gate.offsetWidth;gate.classList.add('is-cheering');
    notify('هنا القلعة… وهنا يبدأ المجد! 💙🏰');
    setTimeout(function(){gate.classList.remove('is-cheering')},950);
  }
});
