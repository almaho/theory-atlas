/* Shared board appearance, applied before the page paints. */
(()=>{
  'use strict';
  const key='theory-atlas-theme',root=document.documentElement;
  const valid=value=>value==='light'||value==='dark';
  const system=window.matchMedia('(prefers-color-scheme: dark)');
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
  apply(explicit?saved:system.matches?'dark':'light');
  document.addEventListener('DOMContentLoaded',()=>{
    apply(root.dataset.theme);
    document.querySelectorAll('[data-site-theme]').forEach(button=>button.addEventListener('click',()=>{
      const value=button.dataset.siteTheme;
      if(!valid(value))return;
      explicit=true;apply(value);
      try{window.localStorage.setItem(key,value);}catch{}
    }));
  });
  system.addEventListener('change',event=>{if(!explicit)apply(event.matches?'dark':'light');});
  function sync(value){explicit=valid(value);apply(explicit?value:system.matches?'dark':'light');}
  window.addEventListener('storage',event=>{if(event.key===key||event.key===null)sync(event.newValue);});
  window.addEventListener('pageshow',()=>{try{sync(window.localStorage.getItem(key));}catch{}});
})();
