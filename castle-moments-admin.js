/* Castle Moments admin controls: draft-first, publish through existing CMS. */
function castleMomentsEditor(){
  const albums=state.draft?.moments||[];
  let html='<div class="castle-moments-admin-intro"><h3>إدارة لحظات القلعة</h3>'+
    '<p>أنشئ ألبوماً لكل مباراة أو تدريب أو احتفال. ارفع صور الفريق الأصلية، واختَر الغلاف، ثم اضغط «نشر التغييرات للجميع» بالأسفل.</p>'+
    '<p>الصور تُرفع إلى مساحة النادي (حتى 3MB لكل صورة)، وما تظهر للزوار إلا بعد النشر. الحد الأقصى 18 ألبوماً و16 صورة للألبوم.</p>'+
    '<button type="button" class="btn primary" data-moments-add-album>+ إضافة ألبوم</button></div><div class="cms-stack">';
  html+=albums.map((album,i)=>{
    const ps=Array.isArray(album.photos)?album.photos:[];
    const cats=CASTLE_MOMENT_CATEGORIES.map(cat=>'<option value="'+esc(cat)+'"'+(album.category===cat?' selected':'')+'>'+esc(cat)+'</option>').join('');
    return '<section class="cms-item castle-moments-editor-album">'+
      '<div class="cms-item-bar"><strong>ألبوم '+(i+1)+' — '+esc(album.title||'بدون عنوان')+'</strong>'+
      '<button type="button" class="btn sm danger" data-moments-remove-album="'+i+'">حذف الألبوم</button></div>'+
      '<div class="cms-grid">'+
      cmsField('عنوان الألبوم','moments.'+i+'.title',album.title,{max:110})+
      cmsField('الوصف','moments.'+i+'.description',album.description,{max:600,type:'textarea'})+
      '<label class="cms-field"><span>التصنيف</span><select data-cms-path="moments.'+i+'.category">'+cats+'</select></label>'+
      '<label class="cms-field"><span>تاريخ اللحظة (اختياري)</span><input type="date" data-cms-path="moments.'+i+'.date" value="'+esc(album.date||'')+'"></label>'+
      cmsField('نشر الألبوم','moments.'+i+'.visible',album.visible!==false,{type:'checkbox'})+'</div>'+
      '<div class="castle-moments-photo-admin-header"><strong>صور الألبوم ('+ps.length+')</strong>'+
      '<button type="button" class="btn sm" data-moments-add-photo="'+i+'" '+(ps.length>=16?'disabled':'')+'>+ إضافة صورة</button></div>'+
      '<div class="castle-moments-photo-admin-grid">'+ps.map((p,j)=>
       '<div class="castle-moments-photo-admin">'+
       '<div class="castle-moments-photo-admin-buttons">'+
       '<span>'+((Number(album.coverIndex)||0)===j?'★ صورة الغلاف':'صورة '+(j+1))+'</span>'+
       '<button type="button" class="btn sm" data-moments-set-cover="'+i+'" data-photo-index="'+j+'">اعتماد غلافاً</button>'+
       '<button type="button" class="btn sm danger" data-moments-remove-photo="'+i+'" data-photo-index="'+j+'">حذف</button></div>'+
       cmsUpload('رفع الصورة','moments.'+i+'.photos.'+j+'.url',p.url)+
       cmsField('وصف الصورة','moments.'+i+'.photos.'+j+'.caption',p.caption,{max:200})+
       '</div>').join('')+'</div></section>';
  }).join('');
  return html+'</div>';
}
document.addEventListener('click',e=>{
  if(!state.admin||!state.draft)return;
  const el=e.target;
  if(el.closest?.('[data-moments-add-album]')){
    if(state.draft.moments.length>=18){notify('الحد الأقصى 18 ألبوماً');return;}
    state.draft.moments.unshift({id:'moments-'+crypto.randomUUID(),title:'ألبوم جديد',category:'مباريات',description:'',date:'',coverIndex:0,visible:true,photos:[{url:'',caption:''}]});
    rerenderCms();return;
  }
  const delAlbum=el.closest?.('[data-moments-remove-album]');
  if(delAlbum){
    const i=Number(delAlbum.dataset.momentsRemoveAlbum);
    if(state.draft.moments[i]&&confirm('حذف الألبوم من المسودة وكل صوره؟ الصور المرفوعة لا تُحذف من التخزين.')){
      state.draft.moments.splice(i,1);rerenderCms();
    }return;
  }
  const addPhoto=el.closest?.('[data-moments-add-photo]');
  if(addPhoto){
    const a=state.draft.moments[Number(addPhoto.dataset.momentsAddPhoto)];
    if(a){if(a.photos.length>=16){notify('الحد الأقصى 16 صورة للألبوم');return;}a.photos.push({url:'',caption:''});rerenderCms();}
    return;
  }
  const delPhoto=el.closest?.('[data-moments-remove-photo]');
  if(delPhoto){
    const a=state.draft.moments[Number(delPhoto.dataset.momentsRemovePhoto)],j=Number(delPhoto.dataset.photoIndex);
    if(a&&a.photos[j]&&confirm('حذف الصورة من الألبوم؟')){
      a.photos.splice(j,1);
      a.coverIndex=Math.min(Number(a.coverIndex)||0,Math.max(0,a.photos.length-1));
      rerenderCms();
    }return;
  }
  const cover=el.closest?.('[data-moments-set-cover]');
  if(cover){
    const a=state.draft.moments[Number(cover.dataset.momentsSetCover)],j=Number(cover.dataset.photoIndex);
    if(a&&a.photos[j]){a.coverIndex=j;rerenderCms();notify('تم اختيار صورة الغلاف في المسودة');}
  }
});
