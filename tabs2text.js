/************************
 ** TABS2TEXT
 **   description: Export all your opened tabs to a CSV, JSON or Markdown file.
 **   homepage_url: https://github.com/deniszanin/tabs2text
 **
 ** FILE: tabs2text.js
 ************************
 *
 * =====================
 * = GLOBALS VARIABLES =
 **/
const DEFAULT_FILE_PREFIX = 'tabs2text';
const DEFAULT_GITHUB_PAGE = 'https://github.com/deniszanin/tabs2text';
const DEFAULT_CURRENT_WINDOW_TABS_ONLY = false;
const DEFAULT_FILE_TYPE = "CSV";

let g_fileExtension = "txt";
let g_fileFormat;
let g_isCurrentWindow;
let g_objJSONContent = [];

/**
 * =======================
 * = PROTOTYPE functions =
 **
 **
 * Function to format Date object to a specific string.
 * @source: https://stackoverflow.com/questions/3066586/get-string-in-yyyymmdd-format-from-js-date-object
 * @param {*}
 * @returns {string} strDate
 **/
Date.prototype.yyyymmdd = function() {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();

  return [this.getFullYear(),
          (mm>9 ? '' : '0') + mm,
          (dd>9 ? '' : '0') + dd
         ].join('');
};

/**
 * =============
 * = FUNCTIONS =
 **
 * Function to load addon settings and add event listeners.
 * @param {*}
 * @return {*}
 **/
function loadSettings() {
  // Add an event listener 'click' to GENERATE button.
  let h_btnGenerate = document.getElementById('tabs-generateCSV');
  h_btnGenerate.addEventListener('click', function() {
    exportFile(_getUIFormat(), _getUIALLTabs());
  }, false);

  // Add an event listener 'click' to ABOUT button.
  let h_btnAbout = document.getElementById('tabs-aboutEXT');
  h_btnAbout.addEventListener('click', function() {
    let tabAbout = browser.tabs.create({
      url:DEFAULT_GITHUB_PAGE
    });
    tabAbout.then();
  }, false);

  // Add an event listener 'onChange' to EXPORT ALLTABS RADIO.
  let h_rdioExport = document.getElementById('export_allTabs_yes');
  h_rdioExport.addEventListener("RadioStateChange", function(radioEvent) {
    let thisRadio = event.target;

    if (thisRadio.checked)
      g_isCurrentWindow = true;
    else
      g_isCurrentWindow = false;
  }, false);

  //////
    /////// 
      ////////
  ////// LOADING SETTINGS

  // User preferences to global variables.
  g_fileFormat = _getUIFormat() || DEFAULT_FILE_TYPE;
  g_isCurrentWindow = _getUIALLTabs() || DEFAULT_CURRENT_WINDOW_TABS_ONLY;

  // Update user interface version.
  _setUIVersion();
  _setUIIcon();

  if (g_isCurrentWindow)
    document.getElementById('export_allTabs_yes').checked = true;
  else
    document.getElementById('export_allTabs_yes').checked = false;
}

/**
 * Function to export tabs information to a file.
 * @param {string} argFileFormat
 * @param {boolean} argCurrentWindow
 * @returns {*}
 **/
function exportFile(argFileFormat, argCurrentWindow) {
  if (argFileFormat == "") throw new Error ("Error: invalid exportFile parameter.");

  _setFileExtension(argFileFormat);
  _getBrowserTabs(argCurrentWindow).then((objALLTabs) => {
    let idWindow = "ALL";
    let tmpContent = "";
    let tmpCounter = 1;

    for (let currentTab of objALLTabs) {
      tmpContent = tmpContent + formatContent(argFileFormat, tmpCounter, currentTab.title, currentTab.url, formatDate(currentTab.lastAccessed));
      tmpCounter += 1;

      if (argCurrentWindow) idWindow = currentTab.windowId;
    }

    let fileContent = formatHeader(argFileFormat);
    fileContent = fileContent + tmpContent;

    if (argFileFormat == "JSON") {
      fileContent = JSON.stringify(g_objJSONContent, null, 4);
    }

    let fileBlob = new Blob([fileContent], { type: 'text/plain;charset=utf=8' });
    let tmpURL = (window.webkitURL || window.URL).createObjectURL(fileBlob);

    let nowDate = _getDate();
    let expFilename = DEFAULT_FILE_PREFIX + "-" + nowDate + "-" + idWindow + "." + g_fileExtension;
    ext_NotifyDownloader(tmpURL, expFilename, fileBlob);
  });
}

/**
 * Function to format a given date.
 * @source: https://stackoverflow.com/questions/23593052/format-javascript-date-as-yyyy-mm-dd
 * @param {string} argDate
 * @returns {string} retDate
 **/
function formatDate(argDate) {
  let tDate = new Date(argDate),
    month = '' + (tDate.getMonth() + 1),
    day = '' + tDate.getDate(),
    year = tDate.getFullYear(),
    hours = '' + tDate.getHours(),
    minutes = '' + tDate.getMinutes();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    if (hours.length < 2) hours = '0' + hours;
    if (minutes.length < 2) minutes = '0' + minutes;

    return [month, day, year, hours, minutes].join('-');
}

/**
 * Function to format the header of the file.
 * @param {string} argFormat
 * @returns {string} returnContent
 **/
function formatHeader(argFormat) {
  let returnContent = "";

  if (argFormat == 'CSV') {
    returnContent = "id;title;url;last acessed\n";
  } else if (argFormat == 'MD') {
    returnContent = "TABS2TEXT LINKS\n";
    returnContent = returnContent + "================\n";
    returnContent = returnContent + "# LINKS\n\n";
    returnContent = returnContent + "## Generated by [Tabs2Text](" + DEFAULT_GITHUB_PAGE + ")\n\n";
  } else if (argFormat == 'JSON') {
    returnContent = "";
  }

  return returnContent;
}

/**
 * Function to format the content of tabs, which will be exported to the file.
 * @param {string} argFormat
 * @param {int} argID
 * @param {string} argTitle
 * @param {string} argURL
 * @param {string} argLastAccessed
 **/
function formatContent(argFormat, argID, argTitle, argURL, argLastAccessed) {
  let returnContent = "";
  let t_objContent = {};

  if (argFormat == 'CSV') {
    returnContent = argID + ";" + argTitle + ";" + argURL + ";" + argLastAccessed + "\n";
  } else if (argFormat == 'MD') {
    returnContent = "### " + argID + ". [" + argTitle + "](" + argURL + "), last accessed: " + argLastAccessed + "\n";
  } else if (argFormat == 'JSON') {
    t_objContent.id = argID;
    t_objContent.title = argTitle;
    t_objContent.url = argURL;
    t_objContent.last = argLastAccessed;

    g_objJSONContent.push(t_objContent);
  }

  return returnContent;
}

/**
 * =========================
 * = GET and SET functions =
 **
 **
 * Function to retrieve information about browser tabs.
 * @param {boolean} argCurrentWindow
 * @returns {object} retTabs
 **/
function _getBrowserTabs(argCurrentWindow) {
  if (argCurrentWindow) return browser.tabs.query({currentWindow: true});
  if (!argCurrentWindow) return browser.tabs.query({});
}

/**
 * Function to get current date and format it.
 * @param {*}
 * @returns {*}
 **/
function _getDate() {
  let tDate = new Date();
  return tDate.yyyymmdd();
}

/**
 * Function to get User Interface (UI) "file format" option.
 * @param {*}
 * @returns {string} retFormat
 **/
function _getUIFormat() {
  let objOptions = document.getElementsByName('format_file_radio');
  let intOptions = objOptions.length;
  let retFormat = "";

  for (let c=0;c < intOptions; c++) {
    if (objOptions[c].checked == true) retFormat = objOptions[c].value;
  }

  return retFormat;
}

/** 
 * Function to get User Interface (UI) "ALL tabs" option (checked or not).
 * @param {*}
 * @returns {boolean} retCurrentWindow
 **/
function _getUIALLTabs() {
  let objALLTabs = document.getElementsByName('export_allTabs_radio');
  let intALLTabs = objALLTabs.length;
  let retCurrentWindow = DEFAULT_CURRENT_WINDOW_TABS_ONLY;

  for (let c=0;c < intALLTabs; c++) {
    if (objALLTabs[c].checked == true) {
      retCurrentWindow = (objALLTabs[c].value === "true");
    } 
  }

  return retCurrentWindow;
}

/**
 * Function to set the current version of this extension (addon) in UI.
 * @param {*}
 * @returns {*}
 **/
function _setUIVersion() {
  let locManifest = browser.runtime.getManifest();
  let spnVersion = document.getElementById("v-current-version");
  spnVersion.innerText = locManifest.version;
}

/**
 * Function to set the icon of this extension (addon) in UI.
 * @param {*}
 * @returns {*}
 **/
function _setUIIcon() {
  let locManifest = browser.runtime.getManifest();
  let srcIcon = document.getElementById("ico-tabs2text");
  srcIcon.src = locManifest.icons["48"];
}

/**
 * Function to set file extension.
 * @param {string} argFormat
 * @returns {*}
 **/
function _setFileExtension(argFormat) {
  if (argFormat == 'CSV') {
    g_fileExtension = "csv";
  } else if (argFormat == 'MD') {
    g_fileExtension = "md";
  } else if (argFormat == 'JSON') {
    g_fileExtension = "json";
  } else {
    g_fileExtension = "txt";
  }
}

/**
 * ===================
 * = EXTERNAL NOTIFY =
 **
 **
 * Function to notify and send commands to 'background.js'.
 * @param {string} argURL
 * @param {string} argFilename
 * @param {blog} argBlob
 * @returns {*}
 */
function ext_NotifyDownloader(argURL, argFilename, argBlob) {
  browser.runtime.sendMessage({"url": argURL, "filename": argFilename, "blob": argBlob});
}

/**
 * ===================
 * = EVENT LISTENERS =
 **/
 // Default action on loading.
 document.addEventListener("DOMContentLoaded", loadSettings);

 //EOF
