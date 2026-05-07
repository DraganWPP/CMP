
/**
* cmp.js - Joybringers Custom Branding v1.4
* Custom Consent Management Platform
*/
(function () {
  'use strict';

  window.dataLayer = window.dataLayer || [];

  var cfg = window.__cmpConfig || {};

  var CONFIG = {
    cookieName          : cfg.cookieName          || 'cmp_consent',
    cookieExpiry        : cfg.cookieExpiry        || 365,
    consentVersion      : cfg.consentVersion      || '1.0',
    bannerTitle         : cfg.bannerTitle         || 'Cookie Preferences',
    bannerDesc          : cfg.bannerDesc          || 'At Joybringers, we value your privacy. Choose which cookies you allow us to use to enhance your experience.',
    acceptAllText       : cfg.acceptAllText       || 'Accept All',
    rejectAllText       : cfg.rejectAllText       || 'Reject All',
    savePrefsText       : cfg.savePrefsText       || 'Save Preferences',
    privacyUrl          : cfg.privacyUrl          || '/privacy',
    cookieUrl           : cfg.cookieUrl           || '/cookies',
    primaryColor        : cfg.primaryColor        || '#006526',
    accentColor         : cfg.accentColor         || '#FFD700',
    fontFamily          : cfg.fontFamily          || 'inherit',
    logoUrl             : cfg.logoUrl             || 'https://raw.githubusercontent.com/draganceran/CMP/main/logo.jpeg'
  };

  function gtag() {
    window.dataLayer.push(arguments);
  }

  var CookieUtil = {
    set: function (name, value, days) {
      var expires = new Date();
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));

      var secure = location.protocol === 'https:' ? ';Secure' : '';

      document.cookie =
        name + '=' + encodeURIComponent(value) +
        ';expires=' + expires.toUTCString() +
        ';path=/' +
        ';SameSite=Lax' +
        secure;
    },

    get: function (name) {
      var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
      return match ? decodeURIComponent(match[2]) : null;
    },

    remove: function (name) {
      document.cookie =
        name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax';
    }
  };

  var StorageUtil = {
    save: function (data) {
      var str = JSON.stringify(data);
      CookieUtil.set(CONFIG.cookieName, str, CONFIG.cookieExpiry);

      try {
        localStorage.setItem(CONFIG.cookieName, str);
      } catch (e) {}
    },

    load: function () {
      try {
        var cookieValue = CookieUtil.get(CONFIG.cookieName);
        if (cookieValue) {
          return JSON.parse(cookieValue);
        }

        var localValue = localStorage.getItem(CONFIG.cookieName);
        if (localValue) {
          return JSON.parse(localValue);
        }
      } catch (e) {
        console.warn('[CMP] Could not load stored consent', e);
      }

      return null;
    },

    clear: function () {
      CookieUtil.remove(CONFIG.cookieName);

      try {
        localStorage.removeItem(CONFIG.cookieName);
      } catch (e) {}
    }
  };

  function normaliseCategories(categories) {
    categories = categories || {};

    return {
      necessary      : true,
      analytics      : categories.analytics === true,
      marketing      : categories.marketing === true,
      personalization: categories.personalization === true,
      functionality  : categories.functionality === true
    };
  }

  function getConsentValues(categories) {
    categories = normaliseCategories(categories);

    return {
      cmp_analytics      : categories.analytics ? 'granted' : 'denied',
      cmp_marketing      : categories.marketing ? 'granted' : 'denied',
      cmp_personalization: categories.personalization ? 'granted' : 'denied',
      cmp_functionality  : categories.functionality ? 'granted' : 'denied',

      ad_storage             : categories.marketing ? 'granted' : 'denied',
      ad_user_data           : categories.marketing ? 'granted' : 'denied',
      ad_personalization     : categories.personalization ? 'granted' : 'denied',
      analytics_storage      : categories.analytics ? 'granted' : 'denied',
      functionality_storage  : categories.functionality ? 'granted' : 'denied',
      personalization_storage: categories.personalization ? 'granted' : 'denied',
      security_storage       : 'granted'
    };
  }

  function updateGoogleConsent(categories, source) {
    var consent = getConsentValues(categories);

    console.log('[CMP] Updating consent from:', source || 'unknown', consent);

    gtag('consent', 'update', {
      ad_storage             : consent.ad_storage,
      ad_user_data           : consent.ad_user_data,
      ad_personalization     : consent.ad_personalization,
      analytics_storage      : consent.analytics_storage,
      functionality_storage  : consent.functionality_storage,
      personalization_storage: consent.personalization_storage,
      security_storage       : consent.security_storage
    });

    window.dataLayer.push({
      event: 'cmp_consent_update',
      cmp_source: source || 'unknown',

      cmp_analytics      : consent.cmp_analytics,
      cmp_marketing      : consent.cmp_marketing,
      cmp_personalization: consent.cmp_personalization,
      cmp_functionality  : consent.cmp_functionality,

      ad_storage             : consent.ad_storage,
      ad_user_data           : consent.ad_user_data,
      ad_personalization     : consent.ad_personalization,
      analytics_storage      : consent.analytics_storage,
      functionality_storage  : consent.functionality_storage,
      personalization_storage: consent.personalization_storage,
      security_storage       : consent.security_storage
    });

    window.dataLayer.push({
      event: 'cmp_consent_ready',
      cmp_source: source || 'unknown',

      cmp_analytics      : consent.cmp_analytics,
      cmp_marketing      : consent.cmp_marketing,
      cmp_personalization: consent.cmp_personalization,
      cmp_functionality  : consent.cmp_functionality
    });

    console.log('[CMP] Events pushed: cmp_consent_update and cmp_consent_ready');
  }

  function applyAndStore(categories) {
    categories = normaliseCategories(categories);

    StorageUtil.save({
      version   : CONFIG.consentVersion,
      timestamp : new Date().toISOString(),
      categories: categories
    });

    updateGoogleConsent(categories, 'user_choice');

    hideBanner();
  }

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

  function injectStyles() {
    if (document.getElementById('cmp-styles')) return;

    var p = CONFIG.primaryColor;

    var css = [
      '#cmp-wrap{font-family:' + CONFIG.fontFamily + ';position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px}',
      '#cmp-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(3px);animation:cmpFadeIn .3s ease}',
      '#cmp-card{position:relative;z-index:1;background:#fff;border-radius:15px;padding:25px;width:100%;max-width:500px;box-shadow:0 15px 35px rgba(0,0,0,.2);animation:cmpZoomIn .3s ease}',
      '#cmp-header{text-align:center;margin-bottom:20px}',
      '#cmp-logo{width:80px;height:80px;margin:0 auto 10px;display:block;border-radius:50%;border:3px solid ' + p + ';object-fit:cover}',
      '#cmp-title{font-size:1.4rem;font-weight:700;color:' + p + '}',
      '#cmp-desc{font-size:.9rem;color:#444;line-height:1.5;margin-bottom:20px;text-align:center}',
      '.cmp-categories{margin-bottom:20px}',
      '.cmp-category{display:flex;align-items:center;justify-content:space-between;padding:12px;border-bottom:1px solid #eee;gap:16px}',
      '.cmp-cat-info strong{font-size:.9rem;color:' + p + '}',
      '.cmp-cat-info span{font-size:.75rem;color:#777;display:block;line-height:1.35}',
      '.cmp-toggle{position:relative;width:40px;height:20px;display:inline-block;flex:0 0 auto}',
      '.cmp-toggle input{opacity:0;width:0;height:0}',
      '.cmp-toggle-slider{position:absolute;inset:0;background:#ccc;border-radius:20px;cursor:pointer;transition:.3s}',
      '.cmp-toggle-slider:before{content:"";position:absolute;height:16px;width:16px;left:2px;bottom:2px;background:#fff;border-radius:50%;transition:.3s}',
      '.cmp-toggle input:checked + .cmp-toggle-slider{background:' + p + '}',
      '.cmp-toggle input:checked + .cmp-toggle-slider:before{transform:translateX(20px)}',
      '.cmp-toggle input:disabled + .cmp-toggle-slider{opacity:.65;cursor:not-allowed}',
      '.cmp-actions{display:flex;flex-direction:column;gap:10px}',
      '.cmp-btn{width:100%;padding:12px;border-radius:8px;font-size:.9rem;font-weight:700;cursor:pointer;border:none;transition:.2s}',
      '.cmp-btn-primary{background:' + p + ';color:#fff}',
      '.cmp-btn-primary:hover{background:#004d1d}',
      '.cmp-btn-outline{background:#fff;color:' + p + ';border:2px solid ' + p + '}',
      '.cmp-btn-ghost{background:transparent;color:#666;text-decoration:underline;font-size:.8rem}',
      '#cmp-footer{display:flex;justify-content:center;gap:15px;margin-top:15px;font-size:.75rem}',
      '#cmp-footer a{color:' + p + ';text-decoration:none;font-weight:600}',
      '@keyframes cmpFadeIn{from{opacity:0}to{opacity:1}}',
      '@keyframes cmpZoomIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}'
    ].join('');

    var style = document.createElement('style');
    style.id = 'cmp-styles';
    style.textContent = css;

    document.head.appendChild(style);
  }

  function renderBanner() {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', renderBanner);
      return;
    }

    if (document.getElementById('cmp-wrap')) return;

    injectStyles();

    var cats = [
      {
        id: 'necessary',
        label: 'Necessary',
        desc: 'Required for the site to function.',
        req: true
      },
      {
        id: 'analytics',
        label: 'Analytics',
        desc: 'Helps us measure our impact.',
        req: false
      },
      {
        id: 'marketing',
        label: 'Marketing',
        desc: 'Helps us reach more people.',
        req: false
      },
      {
        id: 'personalization',
        label: 'Personalization',
        desc: 'Tailors content to you.',
        req: false
      },
      {
        id: 'functionality',
        label: 'Functionality',
        desc: 'Enables enhanced site features.',
        req: false
      }
    ];

    var categoriesHtml = '';

    cats.forEach(function (cat) {
      var checked = cat.req ? ' checked disabled' : '';

      categoriesHtml +=
        '<div class="cmp-category">' +
          '<div class="cmp-cat-info">' +
            '<strong>' + cat.label + '</strong>' +
            '<span>' + cat.desc + '</span>' +
          '</div>' +
          '<label class="cmp-toggle">' +
            '<input type="checkbox" id="cmp-toggle-' + cat.id + '"' + checked + '>' +
            '<span class="cmp-toggle-slider"></span>' +
          '</label>' +
        '</div>';
    });

    var html =
      '<div id="cmp-overlay"></div>' +
      '<div id="cmp-card">' +
        '<div id="cmp-header">' +
          '<img id="cmp-logo" src="' + CONFIG.logoUrl + '" alt="Joybringers Logo">' +
          '<div id="cmp-title">' + CONFIG.bannerTitle + '</div>' +
        '</div>' +
        '<p id="cmp-desc">' + CONFIG.bannerDesc + '</p>' +
        '<div class="cmp-categories">' + categoriesHtml + '</div>' +
        '<div class="cmp-actions">' +
          '<button type="button" class="cmp-btn cmp-btn-primary" id="cmp-btn-accept">' + CONFIG.acceptAllText + '</button>' +
          '<button type="button" class="cmp-btn cmp-btn-outline" id="cmp-btn-save">' + CONFIG.savePrefsText + '</button>' +
          '<button type="button" class="cmp-btn cmp-btn-ghost" id="cmp-btn-reject">' + CONFIG.rejectAllText + '</button>' +
        '</div>' +
        '<div id="cmp-footer">' +
          '<a href="' + CONFIG.privacyUrl + '">Privacy Policy</a>' +
          '<a href="' + CONFIG.cookieUrl + '">Cookie Policy</a>' +
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
    console.log('[CMP] init running');

    var stored = StorageUtil.load();

    console.log('[CMP] stored consent:', stored);

    if (stored && stored.categories) {
      updateGoogleConsent(stored.categories, 'stored_consent');
      return;
    }

    console.log('[CMP] no stored consent, rendering banner');

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', renderBanner);
    } else {
      renderBanner();
    }
  }

  window.showCmpBanner = function () {
    StorageUtil.clear();
    renderBanner();
  };

  window.clearCmpConsent = function () {
    StorageUtil.clear();
    console.log('[CMP] Consent cleared');
  };

  init();

})();
