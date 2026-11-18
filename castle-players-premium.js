/* THE CASTLE FC | premium player presentation.
   Decorative badges are based on real stored fields; captain is admin-selected. */
function castlePlayerRoles(p){
  const roles=[];
  const active=state.players.filter(x=>x.is_active!==false);
  const selected=state.config&&state.config.captainId;
  if(selected&&selected===p.id)roles.push({name:'كابتن القلعة',icon:'★',kind:'captain'});
  if(/حارس|goalkeeper|keeper/i.test(String(p.position||'')))roles.push({name:'حارس المرمى',icon:'✦',kind:'keeper'});
  const scored=active.filter(x=>x.goals!=null&&Number.isFinite(Number(x.goals))&&Number(x.goals)>0);
  const max=scored.length?Math.max(...scored.map(x=>Number(x.goals))):0;
  if(max>0&&p.is_active!==false&&p.goals!=null&&Number(p.goals)===max){
    roles.push({name:'هدّاف القلعة',icon:'⚽',kind:'scorer'});
  }
  return roles;
}
function castlePlayerRoleBadge(p,all=false){
  const list=castlePlayerRoles(p);
  return (all?list:list.slice(0,1)).map(x=>'<span class="castle-role castle-role-'+x.kind+'">'+x.icon+' '+x.name+'</span>').join('');
}
function castlePremiumMetric(label,val){
  return '<div class="castle-premium-stat"><strong>'+(val==null?'—':fmt(val))+'</strong><small>'+label+'</small></div>';
}
function castlePremiumListCard(p){
  const raw=p.photo_url&&safeUrl(p.photo_url);
  const photo=raw?'<img class="castle-roster-photo-backdrop" src="'+raw+'" alt="" aria-hidden="true" loading="lazy" decoding="async">'+
    '<img class="castle-roster-photo-foreground" src="'+raw+'" alt="صورة '+esc(p.name)+'" loading="lazy" decoding="async">':'<span class="castle-premium-silhouette" aria-hidden="true">♟</span>';
  const jersey=p.jersey_number==null?'—':fmt(p.jersey_number);
  return '<button class="castle-roster-card" type="button" data-player="'+esc(p.id)+'" data-player-name="'+esc(p.name)+'" aria-label="عرض بطاقة '+esc(p.name)+'">'+
    '<span class="castle-roster-visual"><span class="castle-roster-watermark" aria-hidden="true">#'+jersey+'</span>'+
    '<span class="castle-roster-image">'+photo+'</span><span class="castle-roster-jersey">#'+jersey+'</span>'+
    '<span class="castle-roster-brand">THE CASTLE FC</span></span>'+
    '<span class="castle-roster-info"><span class="castle-roster-name">'+esc(p.name)+'</span>'+
    '<span class="castle-roster-position">'+esc(p.position||'لاعب القلعة')+'</span>'+
    '<span class="castle-roster-roles">'+castlePlayerRoleBadge(p)+(p.is_active===false?'<span class="castle-role">مخفي عن الجمهور</span>':'')+'</span>'+
    '<span class="castle-roster-stats">'+castlePremiumMetric('المباريات',p.appearances)+castlePremiumMetric('الأهداف',p.goals)+
    castlePremiumMetric('الصناعات',p.assists)+castlePremiumMetric('شباك نظيفة',p.clean_sheets)+'</span>'+
    '<span class="castle-roster-link">عرض ملف اللاعب <span aria-hidden="true">←</span></span></span></button>';
}
function castlePremiumPlayerModal(p){
  const raw=p.photo_url&&safeUrl(p.photo_url);
  const photo=raw?'<img src="'+raw+'" alt="صورة '+esc(p.name)+'" decoding="async">':'<span class="castle-premium-silhouette" aria-hidden="true">♟</span>';
  const jersey=p.jersey_number==null?'—':fmt(p.jersey_number);
  return '<div class="castle-profile"><div class="castle-profile-handle" aria-hidden="true"></div>'+
    '<div class="castle-profile-hero">'+
      '<div class="castle-profile-copy"><small>THE CASTLE FC · PLAYER PROFILE</small>'+
      '<div class="castle-profile-jersey">#'+jersey+'</div>'+
      '<h2>'+esc(p.name)+'</h2><div class="castle-profile-position">'+esc(p.position||'لاعب القلعة')+'</div>'+
      '<div class="castle-profile-roles">'+castlePlayerRoleBadge(p,true)+'</div></div>'+
      '<div class="castle-profile-portrait">'+photo+'</div></div>'+
    '<div class="castle-profile-section-title">إحصائيات اللاعب</div>'+
    '<div class="castle-profile-stats">'+castlePremiumMetric('المشاركات',p.appearances)+castlePremiumMetric('الأهداف',p.goals)+
       castlePremiumMetric('الصناعات',p.assists)+castlePremiumMetric('شباك نظيفة',p.clean_sheets)+'</div>'+
    '<button class="castle-profile-share" type="button" data-share-player="'+esc(p.id)+'">'+
      '<span aria-hidden="true">↗</span> مشاركة بطاقة اللاعب</button>'+
    '</div>';
}
function castlePremiumCaptainEditor(){
  const current=state.config?.captainId||'';
  const options=state.players.filter(p=>p.is_active!==false).map(p=>
   '<option value="'+esc(p.id)+'"'+(p.id===current?' selected':'')+'>'+esc(p.name)+
   (p.jersey_number==null?'':' · #'+fmt(p.jersey_number))+'</option>').join('');
  return '<section class="panel castle-captain-editor" style="margin:18px 0">'+
    '<h3>شارة كابتن القلعة</h3><p class="muted">حدّد الكابتن من قائمة اللاعبين النشطين. ما نعرض الشارة للجمهور إلا بعد حفظ اختيارك.</p>'+
    '<div class="castle-captain-controls"><label for="castle-captain-select" class="sr-only">اختيار كابتن الفريق</label>'+
    '<select id="castle-captain-select"><option value="">بدون كابتن محدد</option>'+options+'</select>'+
    '<button class="btn primary" id="castle-save-captain" type="button">حفظ اختيار الكابتن</button></div></section>';
}
async function castlePremiumSaveCaptain(){
  if(!state.admin)throw new Error('هذا الإجراء خاص بمدير القلعة');
  const id=document.getElementById('castle-captain-select')?.value||'';
  if(id&&!state.players.some(p=>p.id===id&&p.is_active!==false))throw new Error('الكابتن المختار غير موجود ضمن اللاعبين النشطين');
  const cfg=cloneObj(state.config||DEFAULT_SITE);
  cfg.captainId=id;
  if((state.config?.captainId||'')===id){notify('اختيار الكابتن محفوظ مسبقاً');return;}
  const r=await client.from('site_settings').update({
    config:cfg,version:state.configVersion+1,updated_at:new Date().toISOString()
  }).eq('id',1).eq('version',state.configVersion).select('version').single();
  if(r.error)throw new Error('تعذر حفظ الكابتن. حدّث بيانات الموقع وجرّب مرة ثانية. '+r.error.message);
  state.config=normalizeSite(cfg);
  state.configVersion=r.data.version;
  if(state.draft)state.draft.captainId=id;
  notify(id?'تم اعتماد كابتن القلعة':'تم إلغاء شارة الكابتن');
  render();
}
document.addEventListener('click',e=>{
  const btn=e.target.closest?.('#castle-save-captain');
  if(btn&&state.admin){e.preventDefault();guardedRun(btn,castlePremiumSaveCaptain);}
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&document.querySelector('.castle-player-sheet'))closeModal();
});
