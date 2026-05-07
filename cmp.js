/**
* cmp.js - Joybringers Custom Branding v1.3
* Custom Consent Management Platform
* Designed for Joybringers Charity
*/
(function () {
 'use strict';

 var cfg = window.__cmpConfig || {};

 var CONFIG = {
   cookieName          : cfg.cookieName          || 'cmp_consent',
   cookieExpiry        : cfg.cookieExpiry         || 365,
   consentVersion      : cfg.consentVersion       || '1.0',
   bannerTitle         : cfg.bannerTitle          || 'Cookie Preferences',
   bannerDesc          : cfg.bannerDesc           || 'At Joybringers, we value your privacy. Choose which cookies you allow us to use to enhance your experience.',
   acceptAllText       : cfg.acceptAllText        || 'Accept All',
   rejectAllText       : cfg.rejectAllText        || 'Reject All',
   savePrefsText       : cfg.savePrefsText        || 'Save Preferences',
   privacyUrl          : cfg.privacyUrl           || '/privacy',
   cookieUrl           : cfg.cookieUrl            || '/cookies',
   showAnalytics       : cfg.showAnalytics        !== false,
   showMarketing       : cfg.showMarketing        !== false,
   showPersonalization : cfg.showPersonalization  !== false,
   showFunctionality   : cfg.showFunctionality    !== false,
   position            : cfg.position             || 'modal',
   primaryColor        : cfg.primaryColor         || '#006526', // Joybringers Green
   accentColor         : '#FFD700',                               // Joybringers Gold
   fontFamily          : cfg.fontFamily           || 'inherit'
 };

 // ── gtag helper ──────────────────────────────────────────────────────────
 window.dataLayer = window.dataLayer || [];
 function gtag() { window.dataLayer.push(arguments); }

 // ── Cookie & Storage Utilities ──────────────────────────────────────────
 var CookieUtil = {
   set: function (name, value, days) {
     var expires = new Date();
     expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
     var secure = location.protocol === 'https:' ? ';Secure' : '';
     document.cookie = name + '=' + encodeURIComponent(value) +
       ';expires=' + expires.toUTCString() +
       ';path=/;SameSite=Lax' + secure;
   },
   get: function (name) {
     var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
     return match ? decodeURIComponent(match[2]) : null;
   }
 };

 var StorageUtil = {
   save: function (data) {
     var str = JSON.stringify(data);
     CookieUtil.set(CONFIG.cookieName, str, CONFIG.cookieExpiry);
     try { localStorage.setItem(CONFIG.cookieName, str); } catch (e) { }
   },
   load: function () {
     try {
       var c = CookieUtil.get(CONFIG.cookieName);
       if (c) return JSON.parse(c);
       var l = localStorage.getItem(CONFIG.cookieName);
       if (l) return JSON.parse(l);
     } catch (e) { }
     return null;
   }
 };

 // ── Google Consent Mode v2 Update ──────────────────────────────────────────
 function updateGoogleConsent(categories) {
   gtag('consent', 'update', {
     'ad_storage'             : categories.marketing       ? 'granted' : 'denied',
     'ad_user_data'           : categories.marketing       ? 'granted' : 'denied',
     'ad_personalization'     : categories.personalization ? 'granted' : 'denied',
     'analytics_storage'      : categories.analytics       ? 'granted' : 'denied',
     'functionality_storage'  : categories.functionality   ? 'granted' : 'denied',
     'personalization_storage': categories.personalization ? 'granted' : 'denied',
     'security_storage'       : 'granted'
   });

   window.dataLayer.push({
     'event'              : 'cmp_consent_update',
     'cmp_analytics'      : categories.analytics       ? 'granted' : 'denied',
     'cmp_marketing'      : categories.marketing       ? 'granted' : 'denied',
     'cmp_personalization': categories.personalization ? 'granted' : 'denied',
     'cmp_functionality'  : categories.functionality   ? 'granted' : 'denied'
   });
 }

 // ── Actions ──────────────────────────────────────────────────────────────
 function applyAndStore(categories) {
   StorageUtil.save({
     version   : CONFIG.consentVersion,
     timestamp : new Date().toISOString(),
     categories: categories
   });
   updateGoogleConsent(categories);
   setTimeout(function () {
     window.dataLayer.push({ 'event': 'cmp_consent_ready' });
   }, 150);
   hideBanner();
 }

 function acceptAll() { applyAndStore({ necessary:true, analytics:true, marketing:true, personalization:true, functionality:true }); }
 function rejectAll() { applyAndStore({ necessary:true, analytics:false, marketing:false, personalization:false, functionality:false }); }
 function saveCustom() {
   function isOn(id) { var el = document.getElementById(id); return el ? el.checked : false; }
   applyAndStore({
     necessary      : true,
     analytics      : isOn('cmp-toggle-analytics'),
     marketing      : isOn('cmp-toggle-marketing'),
     personalization: isOn('cmp-toggle-personalization'),
     functionality  : isOn('cmp-toggle-functionality')
   });
 }

 // ── Inject Styles ──────────────────────────────────────────────────────────
function injectStyles() {
  if (document.getElementById('cmp-styles')) return;
  var p = CONFIG.primaryColor;
  var a = CONFIG.accentColor;

  var css = [
    '#cmp-wrap{font-family:'+CONFIG.fontFamily+';position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px}',
    '#cmp-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(3px);animation:cmpFadeIn 0.3s ease}',
    '#cmp-card{position:relative;z-index:1;background:#fff;border-radius:15px;padding:25px;width:100%;max-width:500px;box-shadow:0 15px 35px rgba(0,0,0,0.2);animation:cmpZoomIn 0.3s ease}',
    '#cmp-header{text-align:center;margin-bottom:20px}',
    '#cmp-logo{width:80px;height:80px;margin:0 auto 10px;display:block;border-radius:50%;border:3px solid '+p+'}',
    '#cmp-title{font-size:1.4rem;font-weight:700;color:'+p+'}',
    '#cmp-desc{font-size:.9rem;color:#444;line-height:1.5;margin-bottom:20px;text-align:center}',
    '.cmp-categories{margin-bottom:20px}',
    '.cmp-category{display:flex;align-items:center;justify-content:space-between;padding:12px;border-bottom:1px solid #eee}',
    '.cmp-cat-info strong{font-size:.9rem;color:'+p+'}',
    '.cmp-cat-info span{font-size:.75rem;color:#777;display:block}',
    '.cmp-toggle{position:relative;width:40px;height:20px;display:inline-block}',
    '.cmp-toggle input{opacity:0;width:0;height:0}',
    '.cmp-toggle-slider{position:absolute;inset:0;background:#ccc;border-radius:20px;cursor:pointer;transition:.3s}',
    '.cmp-toggle-slider:before{content:"";position:absolute;height:16px;width:16px;left:2px;bottom:2px;background:#fff;border-radius:50%;transition:.3s}',
    '.cmp-toggle input:checked + .cmp-toggle-slider{background:'+p+'}',
    '.cmp-toggle input:checked + .cmp-toggle-slider:before{transform:translateX(20px)}',
    '.cmp-actions{display:flex;flex-direction:column;gap:10px}',
    '.cmp-btn{width:100%;padding:12px;border-radius:8px;font-size:.9rem;font-weight:700;cursor:pointer;border:none;transition:0.2s}',
    '.cmp-btn-primary{background:'+p+';color:#fff}',
    '.cmp-btn-primary:hover{background:#004d1d}',
    '.cmp-btn-outline{background:#fff;color:'+p+';border:2px solid '+p+'}',
    '.cmp-btn-ghost{background:transparent;color:#666;text-decoration:underline;font-size:.8rem}',
    '#cmp-footer{display:flex;justify-content:center;gap:15px;margin-top:15px;font-size:.75rem}',
    '#cmp-footer a{color:'+p+';text-decoration:none;font-weight:600}',
    '@keyframes cmpFadeIn{from{opacity:0}to{opacity:1}}',
    '@keyframes cmpZoomIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}'
  ].join('');

  var style = document.createElement('style');
  style.id = 'cmp-styles';
  style.textContent = css;
  document.head.appendChild(style);
}

 // ── Render ───────────────────────────────────────────────────────────────
 function renderBanner() {
   if (document.getElementById('cmp-wrap')) return;

   var cats = [
     {id:'necessary', label:'Necessary', desc:'Required for the site to function.', req:true},
     {id:'analytics', label:'Analytics', desc:'Helps us measure our impact.', req:false},
     {id:'marketing', label:'Marketing', desc:'Helps us reach more people.', req:false},
     {id:'personalization', label:'Personalization', desc:'Tailors content to you.', req:false}
   ];

   var categoriesHtml = '';
   cats.forEach(function(cat) {
     var checked = cat.req ? ' checked disabled' : '';
     categoriesHtml += '<div class="cmp-category">' +
       '<div class="cmp-cat-info"><strong>'+cat.label+'</strong><span>'+cat.desc+'</span></div>' +
       '<label class="cmp-toggle"><input type="checkbox" id="cmp-toggle-'+cat.id+'"'+checked+'><span class="cmp-toggle-slider"></span></label>' +
     '</div>';
   });

   var logoUrl = "https://raw.githubusercontent.com/draganceran/CMP/logo.jpeg"; // REPLACE WITH ACTUAL LOGO PATH

   var html =
     '<div id="cmp-overlay"></div>' +
     '<div id="cmp-card">' +
       '<div id="cmp-header">' +
         '<img id="cmp-logo" src="' src="logio.jpeg" '" alt="Joybringers Logo">' +
         '<div id="cmp-title">' + CONFIG.bannerTitle + '</div>' +
       '</div>' +
       '<p id="cmp-desc">' + CONFIG.bannerDesc + '</p>' +
       '<div class="cmp-categories">' + categoriesHtml + '</div>' +
       '<div class="cmp-actions">' +
         '<button class="cmp-btn cmp-btn-primary" id="cmp-btn-accept">' + CONFIG.acceptAllText + '</button>' +
         '<button class="cmp-btn cmp-btn-outline" id="cmp-btn-save">' + CONFIG.savePrefsText + '</button>' +
         '<button class="cmp-btn cmp-btn-ghost" id="cmp-btn-reject">' + CONFIG.rejectAllText + '</button>' +
       '</div>' +
       '<div id="cmp-footer">' +
         '<a href="'+CONFIG.privacyUrl+'">Privacy Policy</a>' +
         '<a href="'+CONFIG.cookieUrl+'">Cookie Policy</a>' +
       '</div>' +
     '</div>';

   var wrap = document.createElement('div');
   wrap.id = 'cmp-wrap';
   wrap.innerHTML = html;
   document.body.appendChild(wrap);

   document.getElementById('cmp-btn-accept').addEventListener('click', acceptAll);
   document.getElementById('cmp-btn-reject').addEventListener('click', rejectAll);
   document.getElementById('cmp-btn-save').addEventListener('click', saveCustom);
 }

 function hideBanner() {
   var wrap = document.getElementById('cmp-wrap');
   if (wrap) wrap.remove();
 }

 function init() {
   injectStyles();
   if (!StorageUtil.load()) renderBanner();
 }

 if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', init);
 } else {
   init();
 }

})();
