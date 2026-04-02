/**
* cmp.js - Modern Design v1.2
* Custom Consent Management Platform
* Works with GTM Custom Template - Consent Mode v2
* Fixed: proper gtag() consent update syntax
* Fixed: SPA support via cmp_consent_ready event
*/
(function () {
 'use strict';

 var cfg = window.__cmpConfig || {};

 var CONFIG = {
   cookieName          : cfg.cookieName          || 'cmp_consent',
   cookieExpiry        : cfg.cookieExpiry         || 365,
   consentVersion      : cfg.consentVersion       || '1.0',
   bannerTitle         : cfg.bannerTitle          || 'Cookie Preferences',
   bannerDesc          : cfg.bannerDesc           || 'We use cookies to enhance your experience. Choose which cookies you allow.',
   acceptAllText       : cfg.acceptAllText        || 'Accept All',
   rejectAllText       : cfg.rejectAllText        || 'Reject All',
   savePrefsText       : cfg.savePrefsText        || 'Save Preferences',
   privacyUrl          : cfg.privacyUrl           || '/privacy-policy',
   cookieUrl           : cfg.cookieUrl            || '/cookie-policy',
   showAnalytics       : cfg.showAnalytics        !== false,
   showMarketing       : cfg.showMarketing        !== false,
   showPersonalization : cfg.showPersonalization  !== false,
   showFunctionality   : cfg.showFunctionality    !== false,
   position            : cfg.position             || 'bottom',
   primaryColor        : cfg.primaryColor         || '#4f46e5',
   fontFamily          : cfg.fontFamily           || '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif'
 };

 // ── gtag helper (MUST use arguments object, not array) ────────────────────
 window.dataLayer = window.dataLayer || [];
 function gtag() { window.dataLayer.push(arguments); }

 // ── Cookie Utilities ───────────────────────────────────────────────────────
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

 // ── Storage Utilities ──────────────────────────────────────────────────────
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

   // ✅ CORRECT: use gtag() with arguments object
   gtag('consent', 'update', {
     'ad_storage'             : categories.marketing       ? 'granted' : 'denied',
     'ad_user_data'           : categories.marketing       ? 'granted' : 'denied',
     'ad_personalization'     : categories.personalization ? 'granted' : 'denied',
     'analytics_storage'      : categories.analytics       ? 'granted' : 'denied',
     'functionality_storage'  : categories.functionality   ? 'granted' : 'denied',
     'personalization_storage': categories.personalization ? 'granted' : 'denied',
     'security_storage'       : 'granted'
   });

   // Push custom GTM event with consent details
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
   } catch (e) { }
 }

 // ── Apply, Store & Re-trigger for SPA ─────────────────────────────────────
 function applyAndStore(categories) {

   // 1. Save to cookie + localStorage
   StorageUtil.save({
     version   : CONFIG.consentVersion,
     timestamp : new Date().toISOString(),
     categories: categories
   });

   // 2. Update Google Consent Mode
   updateGoogleConsent(categories);

   // 3. SPA Fix — re-trigger page view after consent is processed
   setTimeout(function () {
     window.dataLayer.push({
       'event'        : 'cmp_consent_ready',
       'page_location': window.location.href,
       'page_title'   : document.title,
       'page_path'    : window.location.pathname
     });
   }, 150);

   // 4. Hide banner
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
   function isOn(id) {
     var el = document.getElementById(id);
     return el ? el.checked : false;
   }
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

   var css = [
     /* Base */
     '#cmp-wrap{font-family:' + CONFIG.fontFamily + ';position:fixed;inset:0;z-index:999999;display:flex;align-items:flex-end;justify-content:center;padding:16px}',

     /* Overlay */
     '#cmp-overlay{position:fixed;inset:0;background:rgba(15,15,25,0.6);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);animation:cmpFadeIn 0.3s ease}',

     /* Card */
     '#cmp-card{',
       'position:relative;z-index:1;',
       'background:#fff;',
       'border-radius:20px;',
       'padding:32px;',
       'width:100%;max-width:520px;',
       'box-shadow:0 24px 64px rgba(0,0,0,0.18),0 4px 16px rgba(0,0,0,0.08);',
       'animation:cmpSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1);',
       'margin-bottom:8px;',
     '}',

     /* Header */
     '#cmp-header{display:flex;align-items:center;gap:12px;margin-bottom:12px}',
     '#cmp-icon{width:40px;height:40px;background:linear-gradient(135deg,' + p + ',#818cf8);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:20px}',
     '#cmp-title{font-size:1.15rem;font-weight:700;color:#0f172a;letter-spacing:-0.01em}',
     '#cmp-desc{font-size:.875rem;color:#64748b;line-height:1.6;margin-bottom:20px}',

     /* Categories */
     '.cmp-categories{display:flex;flex-direction:column;gap:8px;margin-bottom:24px}',
     '.cmp-category{',
       'display:flex;align-items:center;justify-content:space-between;',
       'padding:14px 16px;',
       'border:1.5px solid #f1f5f9;',
       'border-radius:12px;',
       'background:#fafafa;',
       'transition:border-color 0.2s,background 0.2s;',
       'cursor:pointer;',
     '}',
     '.cmp-category:hover{border-color:' + p + '40;background:#f8f7ff}',
     '.cmp-category.is-required{cursor:default}',
     '.cmp-category.is-required:hover{border-color:#f1f5f9;background:#fafafa}',
     '.cmp-cat-left{display:flex;align-items:center;gap:12px}',
     '.cmp-cat-emoji{font-size:1.1rem;width:28px;text-align:center}',
     '.cmp-cat-info strong{display:block;font-size:.875rem;font-weight:600;color:#1e293b}',
     '.cmp-cat-info span{font-size:.775rem;color:#94a3b8;line-height:1.4}',

     /* Toggle Switch */
     '.cmp-toggle-wrap{flex-shrink:0;margin-left:12px}',
     '.cmp-toggle{position:relative;width:44px;height:24px;display:inline-block}',
     '.cmp-toggle input{opacity:0;width:0;height:0;position:absolute}',
     '.cmp-toggle-slider{',
       'position:absolute;inset:0;',
       'background:#e2e8f0;',
       'border-radius:999px;',
       'transition:background 0.2s;',
       'cursor:pointer;',
     '}',
     '.cmp-toggle-slider:before{',
       'content:"";position:absolute;',
       'width:18px;height:18px;',
       'left:3px;bottom:3px;',
       'background:#fff;',
       'border-radius:50%;',
       'transition:transform 0.2s;',
       'box-shadow:0 1px 4px rgba(0,0,0,0.15);',
     '}',
     '.cmp-toggle input:checked + .cmp-toggle-slider{background:' + p + '}',
     '.cmp-toggle input:checked + .cmp-toggle-slider:before{transform:translateX(20px)}',
     '.cmp-toggle input:disabled + .cmp-toggle-slider{background:' + p + ';opacity:0.5;cursor:not-allowed}',
     '.cmp-toggle input:disabled + .cmp-toggle-slider:before{transform:translateX(20px)}',

     /* Buttons */
     '.cmp-actions{display:flex;gap:8px;flex-wrap:wrap}',
     '.cmp-btn{',
       'flex:1;min-width:100px;',
       'padding:12px 16px;',
       'border-radius:10px;',
       'font-size:.875rem;font-weight:600;',
       'cursor:pointer;border:none;',
       'transition:all 0.15s ease;',
       'white-space:nowrap;text-align:center;',
     '}',
     '.cmp-btn-ghost{background:#f1f5f9;color:#475569}',
     '.cmp-btn-ghost:hover{background:#e2e8f0;color:#1e293b}',
     '.cmp-btn-outline{background:transparent;color:' + p + ';border:1.5px solid ' + p + '40}',
     '.cmp-btn-outline:hover{background:' + p + '10;border-color:' + p + '}',
     '.cmp-btn-primary{',
       'background:linear-gradient(135deg,' + p + ',#818cf8);',
       'color:#fff;',
       'box-shadow:0 4px 12px ' + p + '40;',
     '}',
     '.cmp-btn-primary:hover{filter:brightness(1.08);transform:translateY(-1px);box-shadow:0 6px 16px ' + p + '50}',
     '.cmp-btn-primary:active{transform:translateY(0)}',

     /* Footer */
     '#cmp-footer{display:flex;justify-content:center;gap:16px;margin-top:16px}',
     '#cmp-footer a{font-size:.775rem;color:#94a3b8;text-decoration:none;transition:color 0.15s}',
     '#cmp-footer a:hover{color:' + p + '}',

     /* Badge */
     '#cmp-badge{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:12px;font-size:.7rem;color:#cbd5e1}',
     '#cmp-badge span{display:inline-flex;align-items:center;gap:4px;background:#f8fafc;border:1px solid #e2e8f0;padding:3px 8px;border-radius:999px}',

     /* Animations */
     '@keyframes cmpFadeIn{from{opacity:0}to{opacity:1}}',
     '@keyframes cmpSlideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}',

     /* Mobile */
     '@media(max-width:480px){',
       '#cmp-wrap{padding:12px;align-items:flex-end}',
       '#cmp-card{padding:20px;border-radius:16px}',
       '.cmp-actions{flex-direction:column}',
       '.cmp-btn{width:100%}',
     '}'
   ].join('');

   var style = document.createElement('style');
   style.id = 'cmp-styles';
   style.textContent = css;
   document.head.appendChild(style);
 }

 // ── Category Config ────────────────────────────────────────────────────────
 var CATEGORIES = [
   {
     id         : 'necessary',
     label      : 'Necessary',
     description: 'Core website functions. Cannot be disabled.',
     icon       : '🔒',
     required   : true
   },
   {
     id         : 'analytics',
     label      : 'Analytics',
     description: 'Help us understand how visitors use our site.',
     icon       : '📊',
     required   : false,
     configKey  : 'showAnalytics'
   },
   {
     id         : 'marketing',
     label      : 'Marketing',
     description: 'Targeted advertising and remarketing.',
     icon       : '🎯',
     required   : false,
     configKey  : 'showMarketing'
   },
   {
     id         : 'personalization',
     label      : 'Personalization',
     description: 'Remember preferences and personalise content.',
     icon       : '✨',
     required   : false,
     configKey  : 'showPersonalization'
   },
   {
     id         : 'functionality',
     label      : 'Functionality',
     description: 'Live chat, maps and enhanced features.',
     icon       : '⚙️',
     required   : false,
     configKey  : 'showFunctionality'
   }
 ];

 // ── Build Toggle HTML ──────────────────────────────────────────────────────
 function buildToggle(cat) {
   var toggleId     = 'cmp-toggle-' + cat.id;
   var checkedAttr  = cat.required ? ' checked' : '';
   var disabledAttr = cat.required ? ' disabled' : '';
   var labelHtml    = cat.required
     ? cat.label + ' <span style="font-size:.7rem;background:#e0e7ff;color:#4f46e5;padding:2px 7px;border-radius:999px;font-weight:600;vertical-align:middle">Always On</span>'
     : cat.label;

   return '<div class="cmp-category' + (cat.required ? ' is-required' : '') + '">' +
     '<div class="cmp-cat-left">' +
       '<div class="cmp-cat-emoji">' + cat.icon + '</div>' +
       '<div class="cmp-cat-info">' +
         '<strong>' + labelHtml + '</strong>' +
         '<span>' + cat.description + '</span>' +
       '</div>' +
     '</div>' +
     '<div class="cmp-toggle-wrap">' +
       '<label class="cmp-toggle">' +
         '<input type="checkbox" id="' + toggleId + '"' + checkedAttr + disabledAttr + '>' +
         '<span class="cmp-toggle-slider"></span>' +
       '</label>' +
     '</div>' +
   '</div>';
 }

 // ── Render Banner ──────────────────────────────────────────────────────────
 function renderBanner() {
   if (document.getElementById('cmp-wrap')) return;

   var categoriesHtml = '';
   for (var i = 0; i < CATEGORIES.length; i++) {
     var cat = CATEGORIES[i];
     // Skip if disabled in config
     if (!cat.required && cat.configKey && !CONFIG[cat.configKey]) continue;
     categoriesHtml += buildToggle(cat);
   }

   var html =
     '<div id="cmp-overlay"></div>' +
     '<div id="cmp-card" role="dialog" aria-modal="true" aria-label="Cookie preferences">' +

       '<div id="cmp-header">' +
         '<div id="cmp-icon">🍪</div>' +
         '<div id="cmp-title">' + CONFIG.bannerTitle + '</div>' +
       '</div>' +

       '<p id="cmp-desc">' + CONFIG.bannerDesc + '</p>' +

       '<div class="cmp-categories">' + categoriesHtml + '</div>' +

       '<div class="cmp-actions">' +
         '<button class="cmp-btn cmp-btn-ghost"   id="cmp-btn-reject">'  + CONFIG.rejectAllText  + '</button>' +
         '<button class="cmp-btn cmp-btn-outline"  id="cmp-btn-save">'   + CONFIG.savePrefsText  + '</button>' +
         '<button class="cmp-btn cmp-btn-primary"  id="cmp-btn-accept">' + CONFIG.acceptAllText  + '</button>' +
       '</div>' +

       '<div id="cmp-footer">' +
         '<a href="' + CONFIG.privacyUrl + '" target="_blank" rel="noopener">Privacy Policy</a>' +
         '<span style="color:#e2e8f0">·</span>' +
         '<a href="' + CONFIG.cookieUrl  + '" target="_blank" rel="noopener">Cookie Policy</a>' +
       '</div>' +

       '<div id="cmp-badge">' +
         '<span>🛡️ Privacy Protected</span>' +
         '<span>🔒 GDPR Compliant</span>' +
       '</div>' +

     '</div>';

   var wrap = document.createElement('div');
   wrap.id = 'cmp-wrap';
   wrap.innerHTML = html;
   document.body.appendChild(wrap);

   // Bind events
   document.getElementById('cmp-btn-accept').addEventListener('click', acceptAll);
   document.getElementById('cmp-btn-reject').addEventListener('click', rejectAll);
   document.getElementById('cmp-btn-save').addEventListener('click', saveCustom);
 }

 // ── Hide Banner ────────────────────────────────────────────────────────────
 function hideBanner() {
   var wrap = document.getElementById('cmp-wrap');
   if (wrap) {
     wrap.style.opacity = '0';
     wrap.style.transition = 'opacity 0.25s ease';
     setTimeout(function () {
       if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
     }, 250);
   }
 }

 // ── Public API ─────────────────────────────────────────────────────────────
 window.CMP = {
   showPreferences: function () {
     injectStyles();
     renderBanner();
   },
   getConsent: function () {
     return StorageUtil.load();
   },
   hasConsent: function (category) {
     var stored = StorageUtil.load();
     return stored && stored.categories
       ? stored.categories[category] === true
       : false;
   },
   acceptAll: acceptAll,
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
