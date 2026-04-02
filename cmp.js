/**
* cmp.js
* Custom Consent Management Platform
* Works with GTM Custom Template - Consent Mode v2
* 
* Loaded by GTM Template via injectScript()
* Config passed via window.__cmpConfig
*/
(function () {
 'use strict';

 // ── Read config from GTM template ─────────────────────────────────────────
 var cfg = window.__cmpConfig || {};

 var CONFIG = {
   cookieName         : cfg.cookieName          || 'cmp_consent',
   cookieExpiry       : cfg.cookieExpiry         || 365,
   consentVersion     : cfg.consentVersion       || '1.0',
   bannerTitle        : cfg.bannerTitle          || 'Cookie Preferences',
   bannerDesc         : cfg.bannerDesc           || 'We use cookies to enhance your experience. Choose which cookies you allow.',
   acceptAllText      : cfg.acceptAllText        || 'Accept All',
   rejectAllText      : cfg.rejectAllText        || 'Reject All',
   savePrefsText      : cfg.savePrefsText        || 'Save Preferences',
   privacyUrl         : cfg.privacyUrl           || '/privacy-policy',
   cookieUrl          : cfg.cookieUrl            || '/cookie-policy',
   showAnalytics      : cfg.showAnalytics        !== false,
   showMarketing      : cfg.showMarketing        !== false,
   showPersonalization: cfg.showPersonalization  !== false,
   showFunctionality  : cfg.showFunctionality    !== false,
   position           : cfg.position             || 'bottom',
   primaryColor       : cfg.primaryColor         || '#4f46e5',
   fontFamily         : cfg.fontFamily           || 'system-ui, sans-serif'
 };

 // ── Cookie Utilities ───────────────────────────────────────────────────────
 var CookieUtil = {
   set: function(name, value, days) {
     var expires = new Date();
     expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
     var secure = location.protocol === 'https:' ? ';Secure' : '';
     document.cookie = name + '=' + encodeURIComponent(value) +
       ';expires=' + expires.toUTCString() +
       ';path=/;SameSite=Lax' + secure;
   },
   get: function(name) {
     var match = document.cookie.match(
       new RegExp('(^| )' + name + '=([^;]+)')
     );
     return match ? decodeURIComponent(match[2]) : null;
   }
 };

 // ── Storage Utilities ──────────────────────────────────────────────────────
 var StorageUtil = {
   save: function(data) {
     var str = JSON.stringify(data);
     CookieUtil.set(CONFIG.cookieName, str, CONFIG.cookieExpiry);
     try { localStorage.setItem(CONFIG.cookieName, str); } catch(e) {}
   },
   load: function() {
     try {
       var c = CookieUtil.get(CONFIG.cookieName);
       if (c) return JSON.parse(c);
       var l = localStorage.getItem(CONFIG.cookieName);
       if (l) return JSON.parse(l);
     } catch(e) {}
     return null;
   }
 };

 // ── Google Consent Mode v2 Update ──────────────────────────────────────────
 function updateGoogleConsent(categories) {
   window.dataLayer = window.dataLayer || [];

   // Update consent via dataLayer
   window.dataLayer.push(['consent', 'update', {
     'ad_storage'             : categories.marketing       ? 'granted' : 'denied',
     'ad_user_data'           : categories.marketing       ? 'granted' : 'denied',
     'ad_personalization'     : categories.personalization ? 'granted' : 'denied',
     'analytics_storage'      : categories.analytics       ? 'granted' : 'denied',
     'functionality_storage'  : categories.functionality   ? 'granted' : 'denied',
     'personalization_storage': categories.personalization ? 'granted' : 'denied',
     'security_storage'       : 'granted'
   }]);

   // Push custom GTM event
   window.dataLayer.push({
     'event'              : 'cmp_consent_update',
     'cmp_version'        : CONFIG.consentVersion,
     'cmp_analytics'      : categories.analytics       ? 'granted' : 'denied',
     'cmp_marketing'      : categories.marketing       ? 'granted' : 'denied',
     'cmp_personalization': categories.personalization ? 'granted' : 'denied',
     'cmp_functionality'  : categories.functionality   ? 'granted' : 'denied'
   });

   // Dispatch DOM event for other integrations
   try {
     window.dispatchEvent(new CustomEvent('cmpConsentUpdated', {
       detail: { categories: categories }
     }));
   } catch(e) {}
 }

 // ── Apply and Store Consent ────────────────────────────────────────────────
 function applyAndStore(categories) {
   var consentData = {
     version   : CONFIG.consentVersion,
     timestamp : new Date().toISOString(),
     categories: categories
   };
   StorageUtil.save(consentData);
   updateGoogleConsent(categories);
   hideBanner();
 }

 // ── Consent Actions ────────────────────────────────────────────────────────
 function acceptAll() {
   applyAndStore({
     necessary      : true,
     analytics      : true,
     marketing      : true,
     personalization: true,
     functionality  : true
   });
 }

 function rejectAll() {
   applyAndStore({
     necessary      : true,
     analytics      : false,
     marketing      : false,
     personalization: false,
     functionality  : false
   });
 }

 function saveCustom() {
   var getChecked = function(id) {
     var el = document.getElementById(id);
     return el ? el.checked : false;
   };
   applyAndStore({
     necessary      : true,
     analytics      : getChecked('cmp-cat-analytics'),
     marketing      : getChecked('cmp-cat-marketing'),
     personalization: getChecked('cmp-cat-personalization'),
     functionality  : getChecked('cmp-cat-functionality')
   });
 }

 // ── Inject CSS ─────────────────────────────────────────────────────────────
 function injectStyles() {
   if (document.getElementById('cmp-styles')) return;

   var p   = CONFIG.primaryColor;
   var pos = CONFIG.position;

   var positionCss = '';
   if (pos === 'top') {
     positionCss = 'top:0;left:0;right:0;border-radius:0 0 12px 12px;';
   } else if (pos === 'modal') {
     positionCss = 'top:50%;left:50%;transform:translate(-50%,-50%);' +
                   'width:90%;max-width:560px;border-radius:16px;';
   } else {
     // bottom (default)
     positionCss = 'bottom:0;left:0;right:0;border-radius:12px 12px 0 0;';
   }

   var css = [
     '#cmp-wrap *{box-sizing:border-box;margin:0;padding:0;font-family:' + CONFIG.fontFamily + '}',
     '#cmp-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:99998}',
     '#cmp-banner{',
       'position:fixed;' + positionCss,
       'background:#ffffff;z-index:99999;',
       'padding:24px 28px;',
       'box-shadow:0 -4px 32px rgba(0,0,0,0.15);',
       'max-height:90vh;overflow-y:auto;',
     '}',
     '#cmp-banner h2{font-size:1.1rem;font-weight:700;color:#111;margin-bottom:8px}',
     '#cmp-banner .cmp-desc{font-size:.875rem;color:#555;line-height:1.6;margin-bottom:16px}',
     '.cmp-categories{display:flex;flex-direction:column;gap:8px;margin-bottom:20px}',
     '.cmp-category{',
       'display:flex;align-items:flex-start;gap:12px;',
       'padding:12px;border:1px solid #e5e7eb;border-radius:8px;',
       'background:#fafafa;',
     '}',
     '.cmp-category input[type=checkbox]{',
       'width:16px;height:16px;margin-top:2px;flex-shrink:0;',
       'accent-color:' + p + ';cursor:pointer;',
     '}',
     '.cmp-category input[type=checkbox]:disabled{cursor:not-allowed;opacity:0.6}',
     '.cmp-cat-info strong{display:block;font-size:.875rem;font-weight:600;color:#111;margin-bottom:2px}',
     '.cmp-cat-info span{font-size:.8rem;color:#777;line-height:1.4}',
     '.cmp-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end;margin-bottom:12px}',
     '.cmp-btn{',
       'padding:10px 20px;border-radius:8px;',
       'font-size:.875rem;font-weight:600;',
       'cursor:pointer;border:2px solid ' + p + ';',
       'transition:all 0.15s ease;white-space:nowrap;',
     '}',
     '.cmp-btn-primary{background:' + p + ';color:#fff}',
     '.cmp-btn-primary:hover{filter:brightness(1.08)}',
     '.cmp-btn-secondary{background:transparent;color:' + p + '}',
     '.cmp-btn-secondary:hover{background:' + p + '18}',
     '.cmp-links{text-align:center;font-size:.775rem;color:#aaa}',
     '.cmp-links a{color:' + p + ';text-decoration:none}',
     '.cmp-links a:hover{text-decoration:underline}',
     '@media(max-width:500px){',
       '.cmp-actions{flex-direction:column}',
       '.cmp-btn{width:100%;text-align:center}',
       '#cmp-banner{padding:16px}',
     '}'
   ].join('');

   var style = document.createElement('style');
   style.id = 'cmp-styles';
   style.textContent = css;
   document.head.appendChild(style);
 }

 // ── Build Category Row HTML ────────────────────────────────────────────────
 function buildCategory(id, label, description, disabled) {
   var disabledAttr  = disabled ? ' disabled checked' : '';
   var labelText     = disabled ? label + ' — Always Active' : label;
   return '<div class="cmp-category">' +
     '<input type="checkbox" id="cmp-cat-' + id + '"' + disabledAttr + '>' +
     '<div class="cmp-cat-info">' +
       '<strong>' + labelText + '</strong>' +
       '<span>' + description + '</span>' +
     '</div>' +
   '</div>';
 }

 // ── Build & Inject Banner HTML ─────────────────────────────────────────────
 function renderBanner() {
   if (document.getElementById('cmp-wrap')) return;

   var overlay = CONFIG.position === 'modal'
     ? '<div id="cmp-overlay"></div>'
     : '';

   var categories = '';

   // Necessary — always shown, always disabled
   categories += buildCategory(
     'necessary',
     'Necessary',
     'Essential for the website to function. Cannot be disabled.',
     true
   );

   if (CONFIG.showAnalytics) {
     categories += buildCategory(
       'analytics',
       'Analytics',
       'Help us understand how visitors use our site (e.g. Google Analytics).',
       false
     );
   }

   if (CONFIG.showMarketing) {
     categories += buildCategory(
       'marketing',
       'Marketing',
       'Used for targeted advertising and remarketing (e.g. Google Ads, Meta).',
       false
     );
   }

   if (CONFIG.showPersonalization) {
     categories += buildCategory(
       'personalization',
       'Personalization',
       'Remember your preferences and personalise content for you.',
       false
     );
   }

   if (CONFIG.showFunctionality) {
     categories += buildCategory(
       'functionality',
       'Functionality',
       'Enhanced features like live chat, maps and embedded content.',
       false
     );
   }

   var html = overlay +
     '<div id="cmp-banner" role="dialog" aria-modal="true" aria-label="Cookie preferences">' +
       '<h2>🍪 ' + CONFIG.bannerTitle + '</h2>' +
       '<p class="cmp-desc">' + CONFIG.bannerDesc + '</p>' +
       '<div class="cmp-categories">' + categories + '</div>' +
       '<div class="cmp-actions">' +
         '<button class="cmp-btn cmp-btn-secondary" id="cmp-btn-reject">' +
           CONFIG.rejectAllText +
         '</button>' +
         '<button class="cmp-btn cmp-btn-secondary" id="cmp-btn-save">' +
           CONFIG.savePrefsText +
         '</button>' +
         '<button class="cmp-btn cmp-btn-primary" id="cmp-btn-accept">' +
           CONFIG.acceptAllText +
         '</button>' +
       '</div>' +
       '<div class="cmp-links">' +
         '<a href="' + CONFIG.privacyUrl + '" target="_blank" rel="noopener">Privacy Policy</a>' +
         ' &nbsp;·&nbsp; ' +
         '<a href="' + CONFIG.cookieUrl + '" target="_blank" rel="noopener">Cookie Policy</a>' +
       '</div>' +
     '</div>';

   var wrap = document.createElement('div');
   wrap.id = 'cmp-wrap';
   wrap.innerHTML = html;
   document.body.appendChild(wrap);

   // Bind button events
   document.getElementById('cmp-btn-accept')
     .addEventListener('click', acceptAll);
   document.getElementById('cmp-btn-reject')
     .addEventListener('click', rejectAll);
   document.getElementById('cmp-btn-save')
     .addEventListener('click', saveCustom);
 }

 // ── Hide Banner ────────────────────────────────────────────────────────────
 function hideBanner() {
   var wrap = document.getElementById('cmp-wrap');
   if (wrap) {
     wrap.style.opacity = '0';
     wrap.style.transition = 'opacity 0.2s ease';
     setTimeout(function() {
       if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
     }, 200);
   }
 }

 // ── Public API ─────────────────────────────────────────────────────────────
 window.CMP = {

   // Re-open preferences panel
   showPreferences: function() {
     injectStyles();
     renderBanner();
   },

   // Get full stored consent object
   getConsent: function() {
     return StorageUtil.load();
   },

   // Check single category  e.g. CMP.hasConsent('analytics')
   hasConsent: function(category) {
     var stored = StorageUtil.load();
     return stored && stored.categories
       ? stored.categories[category] === true
       : false;
   },

   // Programmatically accept all
   acceptAll: acceptAll,

   // Programmatically reject all
   rejectAll: rejectAll
 };

 // ── Init ───────────────────────────────────────────────────────────────────
 function init() {
   injectStyles();
   renderBanner();
 }

 if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', init);
 } else {
   init();
 }

})();
