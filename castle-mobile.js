/* THE CASTLE FC — mobile-first, non-intrusive match spotlight.
   Reads real player/match records, never writes to Supabase. */
function castleMobileMatchCard(){
  const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Baghdad',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const upcoming=state.matches.filter(m=>m.status==='scheduled'&&m.match_date>=today).sort((a,b)=>String(a.match_date).localeCompare(String(b.match_date)));
  const result=state.matches.filter(m=>m.status==='completed').sort((a,b)=>String(b.match_date).localeCompare(String(a.match_date)));
  const m=upcoming[0]||result[0]||null;
  const done=m?.status==='completed';
  const opponent=m?esc(m.opponent_name):'المنافس القادم';
  const date=m?dateFmt(m.match_date):'بانتظار تسجيل المباراة';
  const when=m?.kickoff_time?' · '+esc(String(m.kickoff_time).slice(0,5)):'';
  const venue=m?.venue?' · '+esc(m.venue):'';
  const score=done&&m.our_score!=null&&m.opponent_score!=null?fmt(m.our_score)+' : '+fmt(m.opponent_score):'VS';
  const label=done?'آخر نتيجة':'المباراة القادمة';
  const action=m?(done?'تفاصيل المباراة':'ليلة القلعة'):'عرض المباريات';
  const destination=m?(done?'matches':'matchday'):'matches';
  const notes=m?'<div class="mobile-fixture-meta">'+date+when+venue+'</div>':'<div class="mobile-fixture-meta">'+date+'</div>';
  return '<section class="mobile-fixture-card" aria-label="'+label+'">'+
    '<div class="mobile-fixture-top"><span class="mobile-fixture-kicker">THE CASTLE • MATCHDAY</span><span class="mobile-fixture-status">'+label+'</span></div>'+
    '<div class="mobile-fixture-row">'+
      '<div class="mobile-fixture-team"><img src="'+siteLogo()+'" alt="شعار فريق القلعة"><strong>القلعة</strong></div>'+
      '<div class="mobile-fixture-center"><span class="mobile-fixture-score">'+score+'</span><small>'+(done?'FULL TIME':'7-A-SIDE')+'</small></div>'+
      '<div class="mobile-fixture-team"><span class="mobile-fixture-opponent-icon" aria-hidden="true">♜</span><strong>'+opponent+'</strong></div>'+
    '</div>'+notes+
    '<button class="mobile-fixture-action" type="button" data-view="'+destination+'">'+action+' <span aria-hidden="true">←</span></button>'+
    '</section>';
}
