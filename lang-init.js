/* Runs in <head> before first paint: picks the language so there is no flash of the wrong one.
   Priority: ?lang= in the URL, then the visitor's saved choice, then the browser language. */
(function () {
  var lang = 'en';
  try {
    var q = new URLSearchParams(location.search).get('lang');
    var saved = localStorage.getItem('aventum-lang');
    if (q) lang = /^(zh|cn)/i.test(q) ? 'cn' : 'en';
    else if (saved === 'cn' || saved === 'en') lang = saved;
    else if (/^zh/i.test(navigator.language || '')) lang = 'cn';
  } catch (e) {}
  document.documentElement.lang = lang === 'cn' ? 'zh-CN' : 'en';
  document.documentElement.className += ' js';

  // Apply the Google Fonts stylesheet once loaded (it is requested with media="print" so it never blocks rendering)
  var f = document.getElementById('font-css');
  if (f) {
    if (f.sheet) f.media = 'all';
    else f.addEventListener('load', function () { f.media = 'all'; });
  }
})();
