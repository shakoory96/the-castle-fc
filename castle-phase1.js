
/* THE CASTLE • 7-a-side matchday, lineup builder and share cards */
/* The lineup is public content. Only a Castle admin can save to site_settings through RLS. */
var CASTLE_FORMATIONS={'2-3-1':[2,3,1],'3-2-1':[3,2,1],'2-2-2':[2,2,2],'3-1-2':[3,1,2]};
var castleLineupEditor={matchId:'',formation:'2-3-1',players:['','','','','','','']};
var castleSharedPlayerOpened=false;
function castleUpcomingMatch(){
 var today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Baghdad',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 var upcoming=state.matches.filter(function(m){return m.status==='scheduled'&&m.match_date>=today}).sort(function(a,b){return String(a.match_date).localeCompare(b.match_date)});
 return upcoming[0]||matchesSorted().find(function(m){return m.status==='completed'})||null;
}
function castleSavedLineup(matchId){
 var data=state.config&&state.config.lineups&&state.config.lineups[matchId];
 return data&&CASTLE_FORMATIONS[data.formation]&&Array.isArray(data.players)&&data.players.length===7?data:null;
}
function castleLineupPositions(formation){
 var rows=CASTLE_FORMATIONS[formation]||CASTLE_FORMATIONS['2-3-1'];
 var groups=[];var index=1;
 rows.forEach(function(count,rowIndex){
   var title=rowIndex===0?'الدفاع':rowIndex===rows.length-1?'الهجوم':'الوسط';
   var group=[];for(var i=0;i<count;i++){group.push({index:index++,title:title});}
   groups.push(group);
 });
 return [{index:0,title:'حارس المرمى'}].concat(groups.flat());
}
function castlePitch(formation,ids){
 var positions=castleLineupPositions(formation),rows=CASTLE_FORMATIONS[formation]||CASTLE_FORMATIONS['2-3-1'];
 var arr=[],idx=1;
 rows.forEach(function(count){arr.push(positions.slice(idx,idx+count));idx+=count});
 arr.reverse();arr.push([positions[0]]);
 return '<div class="seven-pitch" aria-label="تشكيلة سبعة لاعبين تشمل حارس المرمى"><div class="seven-pitch-top"></div><div class="seven-pitch-bottom"></div><div class="seven-pitch-rows">'+arr.map(function(group){
   return '<div class="seven-pitch-row">'+group.map(function(slot){
     var p=state.players.find(function(player){return player.id===ids[slot.index]});
     var photo=p&&p.photo_url&&safeUrl(p.photo_url);
     return '<div class="seven-token">'+(photo?'<img loading="lazy" src="'+photo+'" alt="'+esc(p.name)+'">':'<span class="seven-token-placeholder">♟</span>')+'<b>'+(p?esc(p.name):esc(slot.title))+'</b><small>'+(p&&p.jersey_number!=null?'#'+fmt(p.jersey_number):esc(slot.title))+'</small></div>';
   }).join('')+'</div>';
 }).join('')+'</div></div>';
}
function castleMatchTitle(m){return m.status==='completed'?'النتيجة النهائية':'المباراة القادمة'}
function castleCountdown(m){
 if(!m||m.status!=='scheduled'||!m.kickoff_time)return '';
 var ts=Date.parse(m.match_date+'T'+String(m.kickoff_time).slice(0,5)+':00+03:00');
 if(!Number.isFinite(ts))return '';
 var diff=Math.max(0,ts-Date.now()),mins=Math.floor(diff/60000);
 if(!diff)return 'انطلق موعد المباراة';
 var days=Math.floor(mins/1440),hours=Math.floor((mins%1440)/60),minutes=mins%60;
 return (days?days+' يوم · ':'')+String(hours).padStart(2,'0')+':'+String(minutes).padStart(2,'0')+' ساعة';
}
function updateCastleCountdown(){
 var el=document.getElementById('castle-countdown');if(el){var m=castleUpcomingMatch();el.textContent=castleCountdown(m);}
}
function castleMatchdaySpotlight(){
 var m=castleUpcomingMatch();if(!m)return '';
 return '<section class="matchday-spotlight"><div><small>THE CASTLE • MATCHDAY</small><strong>القلعة × '+esc(m.opponent_name)+'</strong><small>'+dateFmt(m.match_date)+' · '+esc(m.venue||'الملعب غير محدد')+'</small></div><button class="btn primary" type="button" data-view="matchday">ليلة القلعة ←</button></section>';
}
function matchday(){
 var m=castleUpcomingMatch();
 if(!m)return title('ليلة القلعة','مركز مباريات القلعة السباعية')+'<div class="panel">'+empty('ماكو مباراة مسجلة حتى نعرض ليلة القلعة. تگدر تضيف مباراة من غرفة الإدارة أولاً.')+'</div>';
 var l=castleSavedLineup(m.id),score=m.status==='completed'?fmt(m.our_score)+' - '+fmt(m.opponent_score):'VS';
 var stateLabel=m.status==='completed'?'المباراة مكتملة':'المباراة القادمة';
 var details=dateFmt(m.match_date)+(m.kickoff_time?' · '+esc(String(m.kickoff_time).slice(0,5)):'')+(m.venue?' · '+esc(m.venue):'');
 return '<div class="matchday-wrap">'+
 '<section class="matchday-hero"><div class="matchday-label">THE CASTLE • 7-A-SIDE</div><h2>'+stateLabel+'</h2>'+
 '<div class="matchday-clubs"><div class="matchday-club"><img src="'+siteLogo()+'" alt="شعار القلعة"><span>القلعة</span></div>'+
 '<div class="matchday-score">'+score+'</div><div class="matchday-club"><span style="font-size:45px;color:#86bffd">♜</span><span>'+esc(m.opponent_name)+'</span></div></div>'+
 '<div class="matchday-meta">'+details+'</div><div id="castle-countdown" class="matchday-countdown">'+castleCountdown(m)+'</div>'+
 '<p class="muted">'+esc(m.competition||'مباراة فريق القلعة')+'</p></section>'+
 '<div class="seven-layout"><section class="panel"><div class="panel-head"><h3>تشكيلة القلعة الأساسية</h3><span class="badge-status">'+(l?esc(l.formation):'7 لاعبين')+'</span></div>'+
 (l?castlePitch(l.formation,l.players):empty('التشكيلة ما اننشرت بعد. راح تظهر هنا بعد اختيار 7 لاعبين من غرفة قيادة القلعة.'))+'</section>'+
 '<aside class="seven-coach"><div class="eyebrow">THE CASTLE • STARTING SEVEN</div><h3>7 لاعبين، قلب واحد</h3>'+
 '<p class="muted">تشكيلة السباعيات تتكون من حارس مرمى وستة لاعبين داخل الملعب. يختار المدير الخطة والأسماء لكل مباراة.</p>'+
 (l?'<div class="seven-formation"><span class="badge-status">الخطة '+esc(l.formation)+'</span><span class="tiny">التشكيلة الرسمية المنشورة</span></div>':'<span class="tiny">بانتظار نشر التشكيلة الرسمية</span>')+
 (state.admin?'<div style="margin-top:17px"><button class="btn primary" data-open-lineup="1">تعديل التشكيلة</button></div>':'')+
 '</aside></div></div>';
}
function castleShareCard(p){
 var photo=p.photo_url&&safeUrl(p.photo_url);
 return '<div class="castle-share-card"><img class="card-logo" src="'+siteLogo()+'" alt="شعار القلعة">'+
 '<div class="card-top">THE CASTLE FC · OFFICIAL PLAYER</div>'+
 '<div class="card-portrait">'+(photo?'<img src="'+photo+'" alt="صورة '+esc(p.name)+'">':'<span style="font-size:70px">♟</span>')+'</div>'+
 '<div class="card-number">#'+(p.jersey_number==null?'—':fmt(p.jersey_number))+'</div>'+
 '<h2>'+esc(p.name)+'</h2><div class="card-pos">'+esc(p.position||'لاعب القلعة')+'</div></div>'+
 '<div class="castle-share-action"><button class="btn primary" data-share-player="'+esc(p.id)+'" type="button">↗ مشاركة بطاقة اللاعب</button></div>';
}
async function castleSharePlayer(id){
 var p=state.players.find(function(x){return x.id===id});if(!p)return;
 var url=new URL(location.href);url.searchParams.set('player',p.id);
 var data={title:'THE CASTLE | '+p.name,text:'بطاقة '+p.name+' الرسمية في فريق القلعة الرياضي',url:url.toString()};
 try{
   if(navigator.share){await navigator.share(data);return;}
   if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(data.url);notify('تم نسخ رابط بطاقة اللاعب');return;}
   var field=document.createElement('textarea');field.value=data.url;field.style.position='fixed';field.style.opacity='0';document.body.appendChild(field);field.select();
   var okay=document.execCommand('copy');field.remove();notify(okay?'تم نسخ رابط البطاقة':'يمكنك نسخ الرابط من شريط العنوان');
 }catch(err){if(err.name!=='AbortError')notify('تعذرت المشاركة. جرّب نسخ الرابط.');}
}
function castleMaybeOpenShareLink(){
 if(castleSharedPlayerOpened||state.loading||state.error)return;
 var id=new URL(location.href).searchParams.get('player');if(!id)return;
 castleSharedPlayerOpened=true;if(state.players.some(function(p){return p.id===id}))showPlayer(id);
}
function castleGetLineupDraft(){
 if(!castleLineupEditor.matchId&&state.matches.length)castleLoadLineupMatch(castleUpcomingMatch()?.id||state.matches[0].id);
 return castleLineupEditor;
}
function castleLoadLineupMatch(matchId){
 castleLineupEditor.matchId=matchId||'';
 var saved=castleSavedLineup(matchId);
 castleLineupEditor.formation=saved?saved.formation:'2-3-1';
 castleLineupEditor.players=saved?saved.players.slice():['','','','','','',''];
}
function lineupAdmin(){
 var draft=castleGetLineupDraft();
 if(!state.matches.length)return '<section class="panel"><h3>تشكيلة القلعة السباعية</h3>'+empty('سجّل مباراة أولاً من قسم إدارة المباريات حتى تگدر تختار التشكيلة.')+'</section>';
 var slots=castleLineupPositions(draft.formation),active=state.players.filter(function(p){return p.is_active!==false});
 var selects=slots.map(function(slot){
   return '<label class="field"><label>'+esc(slot.title)+' '+fmt(slot.index+1)+'</label><select data-castle-slot="'+slot.index+'">'+
     '<option value="">اختر لاعباً</option>'+active.map(function(p){return '<option value="'+esc(p.id)+'"'+(draft.players[slot.index]===p.id?' selected':'')+'>'+esc(p.name)+(p.jersey_number!=null?' (#'+fmt(p.jersey_number)+')':'')+'</option>'}).join('')+
   '</select></label>';
 }).join('');
 return '<section class="panel"><div class="panel-head"><h3>التشكيلة السباعية • MATCHDAY</h3><span class="badge-status">7 لاعبين بينهم الحارس</span></div>'+
 '<p class="muted">اختَر المباراة والخطة وسبعة لاعبين مختلفين، ثم احفظ التشكيلة. لن تظهر للجمهور إلا بعد حفظها.</p>'+
 '<div class="seven-layout"><div class="seven-coach"><div class="field"><label>المباراة</label><select id="castle-lineup-match">'+state.matches.map(function(m){return '<option value="'+esc(m.id)+'"'+(m.id===draft.matchId?' selected':'')+'>'+esc(m.opponent_name)+' · '+dateFmt(m.match_date)+'</option>'}).join('')+'</select></div>'+
 '<div class="field"><label>الخطة (حارس + ستة لاعبين)</label><select id="castle-lineup-formation">'+Object.keys(CASTLE_FORMATIONS).map(function(x){return '<option value="'+x+'"'+(x===draft.formation?' selected':'')+'>'+x+'</option>'}).join('')+'</select></div>'+
 '<div class="seven-slots">'+selects+'</div><div class="form-actions" style="margin-top:18px"><button class="btn primary" id="castle-save-lineup">نشر التشكيلة</button><button class="btn ghost" id="castle-delete-lineup">إلغاء نشرها</button></div>'+
 '<p class="tiny">المشاركون المسجلون: '+fmt(active.length)+' · لازم تختار 7 لاعبين مختلفين حتى تكتمل التشكيلة.</p></div>'+
 '<div><h3>معاينة الملعب</h3>'+castlePitch(draft.formation,draft.players)+'</div></div></section>';
}
async function castlePersistLineup(remove){
 if(!state.admin)throw new Error('الإجراء للمدير فقط');
 var draft=castleGetLineupDraft();
 if(!draft.matchId||!state.matches.some(function(m){return m.id===draft.matchId}))throw new Error('اختر مباراة صحيحة');
 var ids=draft.players.slice();
 if(!remove){
   if(ids.length!==7||ids.some(function(x){return !x})||new Set(ids).size!==7)throw new Error('يجب اختيار 7 لاعبين مختلفين، بينهم الحارس');
   var active=state.players.filter(function(p){return p.is_active!==false}).map(function(p){return p.id});
   if(ids.some(function(x){return !active.includes(x)}))throw new Error('أحد اللاعبين غير موجود أو غير نشط');
 }
 var config=cloneObj(state.config||DEFAULT_SITE);config.lineups=config.lineups||{};
 if(remove)delete config.lineups[draft.matchId];
 else config.lineups[draft.matchId]={formation:draft.formation,players:ids};
 var r=await client.from('site_settings').update({config:config,version:state.configVersion+1,updated_at:new Date().toISOString()}).eq('id',1).eq('version',state.configVersion).select('version').single();
 if(r.error)throw new Error('تعذر حفظ التشكيلة. ربما حدث تعديل آخر؛ حدّث البيانات وحاول مجدداً. '+r.error.message);
 state.config=normalizeSite(config);state.configVersion=r.data.version;
 if(state.draft)state.draft.lineups=cloneObj(state.config.lineups);
 if(remove)castleLoadLineupMatch(draft.matchId);
 notify(remove?'تم إلغاء نشر التشكيلة':'تم نشر التشكيلة السباعية');
 render();
}
document.addEventListener('click',function(e){
 var share=e.target.closest('[data-share-player]');if(share){castleSharePlayer(share.dataset.sharePlayer);return;}
 if(e.target.closest('[data-open-lineup]')&&state.admin){state.adminTab='lineup';go('admin');return;}
 var save=e.target.closest('#castle-save-lineup');
 if(save&&state.admin){guardedRun(save,function(){return castlePersistLineup(false)});return;}
 var remove=e.target.closest('#castle-delete-lineup');
 if(remove&&state.admin&&confirm('إلغاء نشر تشكيلة هذه المباراة؟')){guardedRun(remove,function(){return castlePersistLineup(true)});return;}
});
document.addEventListener('change',function(e){
 if(e.target.id==='castle-lineup-match'&&state.admin){castleLoadLineupMatch(e.target.value);render();return;}
 if(e.target.id==='castle-lineup-formation'&&state.admin){castleLineupEditor.formation=e.target.value;render();return;}
 var slot=e.target.closest('[data-castle-slot]');
 if(slot&&state.admin){castleLineupEditor.players[Number(slot.dataset.castleSlot)]=e.target.value;render();}
});
window.setInterval(updateCastleCountdown,30000);
