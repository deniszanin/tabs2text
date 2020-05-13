/************************
 ** TABS2TEXT
 **   description: Export all your opened tabs to a CSV, JSON or Markdown file.
 **   homepage_url: https://github.com/deniszanin/tabs2text
 **
 ** FILE: background.js
 ************************
 *
 * =====================`
 * = GLOBALS VARIABLES =
 **/
const DEBUG_MODE = false; // Change it to 'true', for debug mode.

/**
 * =============
 * = FUNCTIONS =
 **
 **
 * Function to refresh the tabs badge counter.
 * @source: https://github.com/mdn/webextensions-examples/blob/master/tabs-tabs-tabs/tabs.js
 * @param {} tabId
 * @param {boolean} isOnRemoved
 * @returns {*}
 **/
function updateBadgeCount(tabId, isOnRemoved) {
  browser.tabs.query({})
  .then((tabs) => {
    let length = tabs.length;

    // onRemoved fires too early and the count is one too many.
    // see https://bugzilla.mozilla.org/show_bug.cgi?id=1396758
    if (isOnRemoved && tabId && tabs.map((t) => { return t.id; }).includes(tabId)) {
      length--;
    }

    browser.browserAction.setBadgeText({text: length.toString()});
    browser.browserAction.setBadgeBackgroundColor({'color': 'green'});
  });
}

/**
 * Function to receive a file BLOB and save it to the local file system.
 * @param {string} argURL
 * @param {string} argFilename
 * @param {blob} argBlob
 * @returns {*}
 **/
function downloadSaveAs(argURL, argFilename, argBlob) {
  const sanURL = (window.webkitURL || window.URL).createObjectURL(argBlob);

  let options = {
    url: sanURL,
    filename : argFilename,
    conflictAction : 'uniquify'
  };

  browser.downloads.download(options).then(function(id){
      if (DEBUG_MODE) console.log(`DEBUG: Started downloading, id ${id}, ok.`);
    }, 
    function(error){
      if (DEBUG_MODE) console.log(`DEBUG: Download failed, error ${error}.`);
    }
  );
}

 /**
  * Function to get external notifications (signals) and messages from tabs2text.js file.
  * @param {object} argEXTMessages
  * @returns {*}
  **/
function ext_listenRequest(argEXTMessage) {
  if (DEBUG_MODE) console.log(`DEBUG: Message/notification received, message ${argEXTMessage}.`);

  let tempURL = (window.webkitURL || window.URL).createObjectURL(argEXTMessage.blob);
  downloadSaveAs(tempURL, argEXTMessage.filename, argEXTMessage.blob);
}

/**
 * ===================
 * = EVENT LISTENERS =
 **/
browser.tabs.onRemoved.addListener(
  (tabId) => { updateBadgeCount(tabId, true);
});

browser.tabs.onCreated.addListener(
  (tabId) => { updateBadgeCount(tabId, false);
});

// #TODO
browser.commands.onCommand.addListener(function(command) {
  if (command == "tabs2text-export") {
    if (DEBUG_MODE) console.log("DEBUG: #TODO: Shortcut, exporting file.");
  }
});

/**
 * =============
 * =  RUNTIME  =
 **/
browser.runtime.onMessage.addListener(ext_listenRequest);
updateBadgeCount();

// EOF
