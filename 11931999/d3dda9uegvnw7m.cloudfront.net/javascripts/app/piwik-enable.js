/**
 * @module app/piwik-enable.js
 */

// This script, till commit 257dec6, required prior inclusion of jQuery,
// which caused issues in more than 1 scenario (e.g. many EWF pages).
// It's much simpler to write it in pure javascript.
// As this module is called from many different services, the jquery
// code is left in parallel for a while.
// TODO - remove jquery code

// Piwik _paq variable that is used to push tracking events to Piwik
var _paq = _paq || [];


// applicationName is an identifier for the web service
function bindPiwikListener(applicationName, piwikUrl, siteId, analyticsEngine) {
  var cookieArray = document.cookie.split(';');

  for (var i = 0; i < cookieArray.length; i++) {
    if (cookieArray[i].indexOf('ch_cookie_consent') !== -1) {
      var cookieTuple = cookieArray[i].split('=');
      var cookieJson = JSON.parse(atob(cookieTuple[1]));
      if (cookieJson.userHasAllowedCookies === 'no') {
      	return;
      }
    }
  }

  if (analyticsEngine === undefined || analyticsEngine === null) {
    analyticsEngine = 'piwik';
  }

  var piwikScript = document.createElement('script');
  var pageScript  = document.getElementsByTagName('script')[0];

  piwikScript.type='text/javascript';
  piwikScript.defer=true;
  piwikScript.async=true;
  piwikScript.src=piwikUrl+'/piwik.js';

  // Include the piwik.js script preceding all other page scripts
  // This is done to ensure _paq binds with its global Piwik instance
  pageScript.parentNode.insertBefore(piwikScript, pageScript);

  setCustomUrl(applicationName);

  if (analyticsEngine === 'matomo') {
    _paq.push(['requireConsent'])
  }
  _paq.push(['setTrackerUrl', piwikUrl + '/piwik.php']);
  _paq.push(['setSiteId', siteId]);
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);

  // Applications should include a hidden div tag or similar in their base html
  // file in the following format:
  // <div id="templateName" attr="data-id={templateName}" hidden></div>
  // where {templateName} is a identifier for the html file

  var tagKeyword = 'templateName';
  // 'tagKeyword' highlights that its value must be considered a keyword
  // for all the services calling this module (they must provide an element with # = tagKeyword's value)
  // The current value ('templateName') is such a bad one anyhow, as it can clash quite easily

  if ( ! window.jQuery) {
      var tagId = document.getElementById(tagKeyword);
      if (! tagId ) {
         console.log('caller did not define an element #: '+tagKeyword);
         return;
      }
      var routeName = tagId.getAttribute("data-id");
      if (! routeName ) {
         console.log('caller did not define a "data-id" attribute for element #: '+tagKeyword);
         return;
      }
      routeName = applicationName + ' ' + routeName;

      var metadata = tagId.getAttribute("data-metadata");
      if (metadata) {
          routeName += ' (' + metadata + ')';
      }

      nojq_bindClickEvents(routeName);              // rename without 'no_jq_' when jquery code goes
      nojq_trackGlobalErrorMessages(routeName);     // ... same

  } else {
//_________________ TO REMOVE (START)
      var routeName = applicationName + ' ' + $('#templateName').data('id');
      var metadata  = $('#templateName').data('metadata');
      if (typeof metadata !== 'undefined' && metadata !== '') {
        routeName += ' (' + metadata + ')';
      }

      bindClickEvents(routeName);
      trackGlobalErrorMessages(routeName);
  }
//_________________ TO REMOVE (END)

}

function setCustomUrl(applicationName) {

  // Replace all ids with a generic token
  // This list should be appended to for all routes to disguise ids
  var path = document.location.pathname;

  path = path.replace(/company\/[^/]*\//, "company/_number/");
  path = path.replace(/transaction\/[^/]*\//,"transaction/_id/");
  path = path.replace(/company-accounts\/[^/]*\//, "company-accounts/_id/");
  path = path.replace(/protect-your-details\/.+?\//, "protect-your-details/_id/");
  path = path.replace(/protect-your-details\/.+?\/remove-evidence\/.+/, "protect-your-details/_id/remove-evidence/_fileId");
  path = path.replace(/efs-submission\/.+?\/company\/[^/]*\//, "efs-submission/_id/company/_number/");
  path = path.replace(/efs-submission\/.+?\/company\/[^/]*\/remove-document\/.+/, "efs-submission/_id/company/_number/remove-document/_fileId");
  path = path.replace(/\/penalty\/.+?\/(?!confirmation)/, "/penalty/_penaltyReference/");
  path = path.replace(/\/penalty\/.+?\/confirmation/, "/penalty/_referenceNumber/confirmation");
  path = path.replace(/\/auth-code-requests\/requests\/[^/]*\//, "/auth-code-requests/requests/_requestId/");
  path = path.replace(/orderable\/certificates\/.+?\//, "orderable/certificates/_certificateId/");
  path = path.replace(/orderable\/certified-copies\/.+?\//, "orderable/certified-copies/_certifiedCopiesId/");
  path = path.replace(/orderable\/missing-image-deliveries\/.+?\//, "orderable/missing-image-deliveries/_missingImageDeliveryId/");
  path = path.replace(/orderable\/dissolved-certificates\/.+?\//, "orderable/dissolved-certificates/_dissolvedCertificateId/");
  path = path.replace(/company\/_number\/orderable\/missing-image-deliveries\/.+/, "company/_number/orderable/missing-image-deliveries/_missingImageDeliveryId/");
  path = path.replace(/orders\/.+?\//, "orders/_orderId/");
  path = path.replace(/submit-abridged-accounts\/.*\/.*\//,"abridged_accounts/accounts_id/abridged_id/");
  path = path.replace(/submission\/.+?\//, "submission/_id/");

  if ( !document.location.origin ) {
    document.location.origin = document.location.protocol + '//' + document.location.hostname + ( document.location.port ? ':' + document.location.port : '' );
  }
  var urlParams = String(document.location.search);

  if (urlParams.includes("itemType=certificate")) {
    path = path + "?itemType=certificate";
  }

  if (urlParams.includes("itemType=dissolved-certificate")) {
    path = path + "?itemType=dissolved-certificate";
  }

  if (urlParams.includes("itemType=certified-copy")) {
    path = path + "?itemType=certified-copy";
  }

  if (urlParams.includes("itemType=missing-image-delivery")) {
    path = path + "?itemType=missing-image-delivery";
  }

  if (applicationName == 'ewf' ) {
      path += urlParams.replace (/\.dyn=[0-9a-zA-Z]+/, '.dyn=');
  }

  var newUrl = document.location.origin + path;
  _paq.push(['setCustomUrl', newUrl]);
}

//____________    JQUERY CODE (START)
function bindClickEvents(routeName) {

  // Bind click events on all elements which have the 'data-event-id' attribute to
  // register piwik events against
  $('[data-event-id]').each(function() {
    $(this).click(function() {
      _paq.push(['trackEvent', routeName, ($(this).data('event-id').toLowerCase())]);
    });
  });
}

function trackGlobalErrorMessages(routeName) {
  if ($('.govuk-error-summary__list').length > 0) {
    $(".govuk-error-summary__list li").each(function() {
      _paq.push(['trackEvent', routeName, "error: " + $(this).text().toLowerCase()] );
    });
  }
}
//____________    JQUERY CODE (END)
//____________ NO-JQUERY CODE (START)

function nojq_bindClickEvents(routeName) {

  // Bind click events on all elements which have the 'data-event-id' attribute to
  // register piwik events against
  var elms = document.querySelectorAll('[data-event-id]'),
         l = elms.length, i, e;

  for(i=0; i<l; i++) {
      e = elms[i];
      var data  = e.getAttribute('data-event-id');
      if (data) {
          e.onclick = function() {
              _paq.push(['trackEvent', routeName, data.toLowerCase()]);
          };
      }
  }
}

function nojq_trackGlobalErrorMessages(routeName) {
  var elms = document.querySelectorAll('.govuk-error-summary__list li'),
         l = elms.length, i, e;

  for(i=0; i<l; i++) {
      e = elms[i];
      var err  = e.textContent;
      if (err) {
          _paq.push(['trackEvent', routeName, 'error: ' + err.toLowerCase()]);
      }
  }
}
//____________ NO-JQUERY CODE (END)

//It was required (for EWF) to have both matomo & old piwik tracking in parallel.
// "multiTrackGoal" is then called only by EWF atm.
function multiTrackGoal (goalId) {
    _paq.push(['trackGoal', goalId]);   // this for matomo

    piwikTracker.trackGoal(goalId); // this for old piwik:
                                    // - keep till matomo & old piwik must track in parallel
                                    // - Note that "piwikTracker" is a global var defined (in EWF) at this point
}
