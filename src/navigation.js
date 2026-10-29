/* One atlas, with stable links to its enlarged settings. */
(()=>{
  'use strict';
  const api=window.AtlasFocus;
  function showRoute(){
    const route=api.routeForHash(location.hash);
    if(route){
      window.history.replaceState(null,'','#atlas/'+encodeURIComponent(route.key));
      window.dispatchEvent(new CustomEvent('atlas:open-setting',{detail:{sliceId:route.sliceId}}));
    }else{
      window.history.replaceState(null,'','#atlas');
      window.dispatchEvent(new CustomEvent('atlas:overview'));
    }
  }
  window.addEventListener('hashchange',showRoute);
  window.addEventListener('atlas:selection',event=>{
    const key=event.detail?.sliceId&&api.keyForSlice(event.detail.sliceId);
    window.history.replaceState(null,'',key?'#atlas/'+encodeURIComponent(api.canonicalKey(key)):'#atlas');
  });
  document.querySelectorAll('[data-atlas-home]').forEach(link=>link.addEventListener('click',event=>{
    event.preventDefault();window.history.replaceState(null,'','#atlas');
    window.dispatchEvent(new CustomEvent('atlas:overview'));
  }));
  showRoute();
})();
