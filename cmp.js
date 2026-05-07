const injectScript = require('injectScript');
const setInWindow = require('setInWindow');
const callInWindow = require('callInWindow');
const log = require('logToConsole');

const url = data.cmpScriptUrl || 'https://cdn.jsdelivr.net/gh/draganceran/CMP@main/cmp.js?v=1.5';

injectScript(
  url,
  function () {
    log('[CMP Template] CMP script loaded');

    setInWindow('showCmpBanner', function () {
      log('[CMP Template] showCmpBanner called');
      callInWindow('joybringersShowCmpBanner');
    }, true);

    data.gtmOnSuccess();
  },
  function () {
    log('[CMP Template] CMP script failed to load: ' + url);
    data.gtmOnFailure();
  },
  url
);
