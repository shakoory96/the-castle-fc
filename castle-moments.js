/* THE CASTLE FC — real-photo Moments albums, no automatic movement. */
let castleMomentsFilter='الكل';
const CASTLE_MOMENT_CATEGORIES=['مباريات','تدريبات','احتفالات','كواليس'];
function castleMomentsAlbums(){
  const raw=Array.isArray(settings().moments)?settings().moments:[];
  return raw.filter(a=>a&&a.visible!==false&&String(a.title||'').trim()&&
    Array.isArray(a.photos)&&a.photos.some(p=>p&&safeUrl(p.url)))
    .slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
}
function castleMomentsPhotos(a){
  return (Array.isArray(a?.photos)?a.photos:[]).filter(p=>p&&safeUrl(p.url));
}
function castleMomentsCover(a){
  const ps=Array.isArray(a?.photos)?a.photos:[];
  const chosen=ps[Number(a?.coverIndex)||0];
  return safeUrl(chosen?.url)?chosen:ps.find(p=>safeUrl(p?.url))||null;
}
function castleMomentsCategoryName(a){
  return CASTLE_MOMENT_CATEGORIES.includes(a?.category)?a.category:'لحظات الفريق';
}
function castleMomentsCard(a,kind){
  const cover=castleMomentsCover(a),url=cover&&safeUrl(cover.url);
  if(!url)return '';
  return '<button type="button" class="castle-moment-card castle-moment-'+kind+'" data-moments-album="'+esc(a.id)+'" aria-label="عرض ألبوم '+esc(a.title)+'">'+
    '<img src="'+url+'" alt="'+esc(cover.caption||a.title)+'" loading="lazy" decoding="async">'+
    '<span class="castle-moment-shade" aria-hidden="true"></span>'+
    '<span class="castle-moment-content"><span class="castle-moment-category">'+esc(castleMomentsCategoryName(a))+'</span>'+
    '<strong>'+esc(a.title)+'</strong><span class="castle-moment-meta">'+
    (a.date?dateFmt(a.date)+' · ':'')+fmt(castleMomentsPhotos(a).length)+' صورة</span></span></button>';
}
function castleMomentsHome(){
  if(settings().sections?.moments===false)return '';
  const albums=castleMomentsAlbums();
  const heading='<header class="castle-moments-heading"><div><span class="castle-moments-eyebrow">THE CASTLE FC · MOMENTS</span>'+
    '<h3>'+t('momentsTitle')+'</h3><p>'+t('momentsSubtitle')+'</p></div>'+
    '<button type="button" class="castle-moments-more" data-view="moments">كل اللحظات ←</button></header>';
  if(!albums.length)return '<section class="castle-moments-home" aria-label="لحظات القلعة">'+heading+
    '<div class="castle-moments-empty"><span class="castle-moments-empty-icon" aria-hidden="true">▣</span>'+
    '<div><strong>لحظات القلعة قيد التوثيق</strong><p>من ننشر أول صور الفريق، راح تظهر هنا كألبومات للمباريات والتدريبات والاحتفالات.</p></div></div></section>';
  const shown=albums.slice(0,3);
  return '<section class="castle-moments-home" aria-label="لحظات القلعة">'+heading+
    '<div class="castle-moments-featured">'+castleMomentsCard(shown[0],'main')+
    (shown.length>1?'<div class="castle-moments-side">'+shown.slice(1).map(a=>castleMomentsCard(a,'small')).join('')+'</div>':'')+'</div></section>';
}
function castleMomentsPage(){
  const albums=castleMomentsAlbums(),categories=['الكل',...CASTLE_MOMENT_CATEGORIES];
  const displayed=castleMomentsFilter==='الكل'?albums:albums.filter(a=>castleMomentsCategoryName(a)===castleMomentsFilter);
  return '<section class="castle-moments-page">'+
    '<div class="castle-moments-pagehead"><span class="castle-moments-eyebrow">THE CASTLE FC · PHOTO ARCHIVE</span>'+
    '<h2>'+t('momentsTitle')+'</h2><p>'+t('momentsSubtitle')+'</p></div>'+
    '<div class="castle-moments-filters" role="group" aria-label="تصفية لحظات القلعة">'+
    categories.map(cat=>'<button type="button" class="'+(castleMomentsFilter===cat?'active':'')+
     '" data-moments-filter="'+esc(cat)+'" aria-pressed="'+(castleMomentsFilter===cat)+'">'+esc(cat)+'</button>').join('')+'</div>'+
    (displayed.length?'<div class="castle-moments-all">'+displayed.map(a=>castleMomentsCard(a,'archive')).join('')+'</div>':
    '<div class="castle-moments-empty"><span class="castle-moments-empty-icon" aria-hidden="true">▣</span>'+
    '<div><strong>ماكو ألبومات منشورة بهذا القسم حالياً</strong><p>الألبومات راح تظهر هنا بعد إضافة صور الفريق من غرفة الإدارة.</p></div></div>')+'</section>';
}
function castleMomentsAlbumModal(id){
  const a=castleMomentsAlbums().find(x=>String(x.id)===String(id));if(!a)return;
  const photos=castleMomentsPhotos(a);
  const info=(a.date?dateFmt(a.date)+' · ':'')+esc(castleMomentsCategoryName(a))+' · '+fmt(photos.length)+' صورة';
  const html='<div class="castle-moments-modal-body"><div class="castle-moments-modal-top"><span class="castle-moments-eyebrow">CASTLE ALBUM</span>'+
    '<h2>'+esc(a.title)+'</h2><p>'+info+'</p>'+(a.description?'<p class="castle-moments-desc">'+esc(a.description)+'</p>':'')+'</div>'+
    '<div class="castle-moments-photo-grid">'+photos.map((p,i)=>'<button type="button" data-moments-photo="'+esc(id)+
    '" data-photo-index="'+i+'" aria-label="عرض الصورة '+(i+1)+'"><img loading="lazy" src="'+safeUrl(p.url)+'" alt="'+esc(p.caption||a.title)+'">'+
    (p.caption?'<span>'+esc(p.caption)+'</span>':'')+'</button>').join('')+'</div></div>';
  modal(html);document.querySelector('#overlay .modal')?.classList.add('castle-moments-modal');
}
function castleMomentsImageModal(id,index){
  const a=castleMomentsAlbums().find(x=>String(x.id)===String(id));if(!a)return;
  const photos=castleMomentsPhotos(a);if(!photos.length)return;
  const i=Math.max(0,Math.min(Number(index)||0,photos.length-1)),p=photos[i];
  const html='<div class="castle-moments-lightbox">'+
    '<div class="castle-moments-lightbox-top"><button type="button" data-moments-back="'+esc(id)+'">← العودة للألبوم</button>'+
    '<span>'+fmt(i+1)+' / '+fmt(photos.length)+'</span></div>'+
    '<div class="castle-moments-lightbox-img"><img src="'+safeUrl(p.url)+'" alt="'+esc(p.caption||a.title)+'"></div>'+
    '<p>'+esc(p.caption||a.title)+'</p>'+
    '<div class="castle-moments-lightbox-actions">'+
    '<button type="button" data-moments-photo-step="-1" data-album-id="'+esc(id)+'" data-photo-index="'+i+'" '+(i===0?'disabled':'')+'>السابق</button>'+
    '<button type="button" data-moments-photo-step="1" data-album-id="'+esc(id)+'" data-photo-index="'+i+'" '+(i===photos.length-1?'disabled':'')+'>التالي</button></div></div>';
  modal(html);document.querySelector('#overlay .modal')?.classList.add('castle-moments-modal','castle-moments-lightbox-modal');
}
document.addEventListener('click',e=>{
  const el=e.target;
  const album=el.closest?.('[data-moments-album]');
  if(album){castleMomentsAlbumModal(album.dataset.momentsAlbum);return;}
  const photo=el.closest?.('[data-moments-photo]');
  if(photo){castleMomentsImageModal(photo.dataset.momentsPhoto,photo.dataset.photoIndex);return;}
  const back=el.closest?.('[data-moments-back]');
  if(back){castleMomentsAlbumModal(back.dataset.momentsBack);return;}
  const step=el.closest?.('[data-moments-photo-step]');
  if(step){castleMomentsImageModal(step.dataset.albumId,Number(step.dataset.photoIndex)+Number(step.dataset.momentsPhotoStep));return;}
  const filter=el.closest?.('[data-moments-filter]');
  if(filter){castleMomentsFilter=filter.dataset.momentsFilter;render();}
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&document.querySelector('.castle-moments-modal'))closeModal();
});
