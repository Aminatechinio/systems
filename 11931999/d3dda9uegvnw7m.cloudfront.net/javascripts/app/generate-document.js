/**
 *
 *  @ module app/generate-document
 */
/** @requires vendor/jquery
 */

// timeout configuration
 var config = {
   widgetTimeout : 12000,
   generalTimeout : 60000
 };

require(["jquery"], function(jQuery) {

    jQuery(document).ready(function() {
        $(".render-document").click(viewButton);
    });

    function viewButton(e) {

        if ($(".render-document").attr('disabled') == "disabled") {
          return false;
        }

        e.preventDefault();

        $('.render-document').attr('disabled','disabled');

        var widget = $(this).parent();
        var documentData = widget.find('#document-data')

        var jsonBody = {
          resource: documentData.attr("data-resource-url"),
          resource_id: documentData.attr("data-resource-id"),
          content_type: documentData.attr("data-content-type"),
          document_type: documentData.attr("data-document-type")
        }

        $.ajax({
            url: '/document-generate',
            type: 'post',
            success: function(data) {
                var request = new Request();
                var json = JSON.parse(data);
                var documentId = json["id"];
                request.activatePoll(widget, documentId);
            },
            error: function(jxXHR, texterror, error) {
                console.log("error: " + error);
                displayFailure(widget);
            },
            headers: {},
            data: JSON.stringify(jsonBody)
        });
    }

    function Request() {
        this.poll = false;

        this.activatePoll = function(widget, documentId) {
            this.poll = true;
            this.widget = widget;
            // get the time when button clicked
            var startPollTime = new Date();
            this.runPoll(widget, documentId, startPollTime);
        };

        this.disablePoll = function() {
            this.poll = false;
        };

        // Download the available document
        this.handleAvailable = function(id, size, name, widget) {
            var statusWidget = widget.find('#status-widget');
            statusWidget.addClass("visually-hidden");

            var fileDeliveryUrl = "/file-delivery/" + id + "/file";
            if ($('#template-type').hasClass("dialogue")) {
                fileDeliveryUrl = "/dialogue";
            }

            var btn = $('<a></a>');
            btn.attr('href', fileDeliveryUrl);
            btn.attr('download', name + '.html');
            btn.attr('id','generate-document-button');
            $('#download-button').append(btn);
            if ($("#template-type").hasClass("manual-click")) {
                size = size/1024;
            	$("#generate-document-button").html("View PDF (" + size.toFixed(1) + " kb)");
                return;
            }
            document.getElementById("generate-document-button").click()
            btn.remove();
        }

        this.runPoll = function(widget, documentId, startPollTime) {
            var self = this;
            var statusWidget = widget.find('#status-widget');
            statusWidget.removeClass("visually-hidden");

            var spinner = widget.find('#process-spinner');
            spinner.removeClass("visually-hidden");

            // We want the status to be in progress asap so that
            // users are not tempted to click the button again
            var status = widget.find('#process-status');
            status.html("Status: in progress");

            var poll = window.setTimeout(function() {
                // get the current time as poll begins
                var currentPollTime = new Date();
                $.ajax({
                    url: '/file-delivery/' + documentId,
                    dataType: "json",
                    // set ajax timeout
                    timeout: config.generalTimeout,
                    success: function(data) {
                        var status = data.status;
                        if (status == "available") {
                            self.disablePoll();
                            self.handleAvailable(data.id, data.file.size, data.description_identifier, widget);
                        }
                        if (status == "failed") {
                            self.disablePoll();
                            displayFailure(widget);
                        }
                    },
                    error: function(jxXHR, texterror, error) {
                      switch (texterror) {
                          case "timeout":
                            self.disablePoll();
                            displayFailure(widget);
                            break;
                          default:
                            console.log("error: " + error);
                        }
                    },
                    headers: {},
                    complete: function() {
                        if (self.poll == false) {
                            clearTimeout(poll);
                            $('.render-document').removeAttr('disabled');
                        } else if (pollExceedsTimeout(startPollTime, currentPollTime)) {
                            self.disablePoll();
                            displayFailure(widget);
                        } else {
                            self.runPoll(widget, documentId, startPollTime);
                        }
                    },
                    cache: false
                })
            }, config.widgetTimeout, widget);
        };
    }

    // check if the differene between current time and when then button was clicked exceeds config.generalTimeout
    function pollExceedsTimeout(startPollTime, currentPollTime) {
      var difference = (currentPollTime - startPollTime);
      return !!(difference > config.generalTimeout);
    }

    function displayFailure(widget) {
      widget.find('#process-spinner').addClass("visually-hidden");
      widget.find('#status-widget').removeClass("visually-hidden");
      widget.find('#process-status').html("Failed to generate document, please try again");
      $('.render-document').removeAttr('disabled');
    }
});
