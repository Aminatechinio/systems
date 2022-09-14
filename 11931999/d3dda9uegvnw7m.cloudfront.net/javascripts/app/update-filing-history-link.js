// Due to a govuk frontend framework limitation :visited will not be triggered for the following scenarios.
// Clicking a link that downloads a document, as the user never leaves the screen, visited is not triggered.
// Mobile browsers fail to trigger visited on opening a new tab but keep the original page open
// therefore it requires a manual update of the colour

var elements = document.getElementsByClassName('link-updater-js');

require(["jquery"], function(jQuery) {

    jQuery(document).ready(function() {

        for(var i = 0; i < elements.length; i++) {
            elements[i].addEventListener('click', updateColour)
        }
    });

    function updateColour() {
        $(this).addClass("link-visited");
    }
});