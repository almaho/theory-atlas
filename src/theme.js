/* Shared appearance, applied before the page paints. */
(()=>{
  'use strict';
  const key='theory-atlas-appearance',root=document.documentElement;
  const valid=value=>value==='light'||value==='dark';
  let saved;
  try{saved=window.localStorage.getItem(key);}catch{}
  let explicit=valid(saved);
  function apply(value){
    root.dataset.theme=value;
    root.style.colorScheme=value;
    document.querySelectorAll('[data-site-theme]').forEach(button=>{
      button.setAttribute('aria-pressed',String(button.dataset.siteTheme===value));
    });
  }
  apply(explicit?saved:'dark');
  document.addEventListener('DOMContentLoaded',()=>{
    apply(root.dataset.theme);
    document.querySelectorAll('[data-site-theme]').forEach(button=>button.addEventListener('click',()=>{
      const value=button.dataset.siteTheme;
      if(!valid(value))return;
      explicit=true;apply(value);
      try{window.localStorage.setItem(key,value);}catch{}
    }));
  });
  function sync(value){explicit=valid(value);apply(explicit?value:'dark');}
  window.addEventListener('storage',event=>{if(event.key===key||event.key===null)sync(event.newValue);});
  window.addEventListener('pageshow',()=>{try{sync(window.localStorage.getItem(key));}catch{}});
})();
