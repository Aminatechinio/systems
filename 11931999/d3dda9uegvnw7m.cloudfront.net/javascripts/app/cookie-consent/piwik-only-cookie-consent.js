function startPiwik() {
  bindPiwikListener(SERVICE_NAME, PIWIK_URL, PIWIK_SITE_ID, 'piwik');
};

function stopAnalytics() {
  var cookies = document.cookie.split(';');
  for (var i = 0; i < cookies.length; i++) {
   var tempCookie = cookies[i].split('=')[0];
   var cookieName = tempCookie.replace(/^\s+|\s+$/g, '');
   var domainArray = document.domain.split('.');
   if (cookieName.match(/_pk_.+/) || cookieName.match(/_ga/) || cookieName.match(/_gid/)) {
      document.cookie = cookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      for (var j = 0; j < domainArray.length; j++) {
         var tempDomain = '.' + domainArray.slice(j, domainArray.length).join('.');
         document.cookie = cookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + tempDomain + ';';
     }
   }
  }
};

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('accept-cookies-button').addEventListener('click', function() {CookieConsent.acceptCookies(startPiwik)})
  document.getElementById('reject-cookies-button').addEventListener('click', function() {CookieConsent.rejectCookies(stopAnalytics)})
  document.getElementById('hide-accepted-message-button').addEventListener('click', CookieConsent.hideCookieBanners)
  document.getElementById('hide-rejected-message-button').addEventListener('click', CookieConsent.hideCookieBanners)
});

CookieConsent.start(startPiwik, stopAnalytics);