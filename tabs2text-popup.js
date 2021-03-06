/************************
 ** TABS2TEXT
 **   description: Export all your opened tabs to a CSV, HTML, JSON or Markdown file.
 **   homepage_url: https://github.com/deniszanin/tabs2text
 **   license: Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)
 **
 ** FILE: tabs2text-popup.js
 ************************
 **/
"use strict";

/**
 * =====================
 * = GLOBALS VARIABLES =
 **/
const DEFAULT_FILE_PREFIX = "tabs2text";
const DEFAULT_GITHUB_PAGE = "https://github.com/deniszanin/tabs2text";

// Default values
let g_isFirefox = false;
let g_fileExtension = "html";
let g_fileMimetype = "text/html;charset=utf=8";
let g_objJSONContent = [];

/**
 * ===================
 * = EVENT LISTENERS =
 *
 ** Default action on loading page.
 **/
document.addEventListener("DOMContentLoaded", () => {
	// Add an event listener "click" to GENERATE button.
	let h_btnGenerate = document.getElementById("tabs-generateFile");
	h_btnGenerate.addEventListener("click", function() {
		exportFileContent(_getUIFileFormat(), _getUICurrentWindow());
	}, false);

	// Add an event listener "click" to PREFERENCES button.
	let h_btnPreferences = document.getElementById("tabs-openPreferences");
	h_btnPreferences.addEventListener("click", function() {
		let tabPreferences = chrome.tabs.create({
			url: chrome.extension.getURL("tabs2text-settings.html")
		});
	}, false);

	//////
	////// LOADING SETTINGS

	// Update user interface version and icon.
	_setUIVersion();
	_setUIIcon();

	// Get which browser is running.
	g_isFirefox = isFirefox();

	// Get stored values when loading settings page:
	_getUserSettings("storCurrentWindow").then(function(resCurrentWindow) {
		if (typeof resCurrentWindow != "undefined") {
			if (resCurrentWindow) 
				document.getElementById("export_allTabs_no").checked = true;
			else
				document.getElementById("export_allTabs_yes").checked = true;
		} else {
			document.getElementById("export_allTabs_no").checked = true;
			sendBackgroundMessage("debug_log_on", "User settings (storCurrentWindow) is empty (setting default values).");
		}
	});

	_getUserSettings("storFileFormat").then(function(resFileFormat) {
		if (resFileFormat) {
			_setUIFileFormat(resFileFormat);
		} else {
			sendBackgroundMessage("debug_log_on", `User settings (storFileFormat) is empty (setting default values).`);
		}
	});
});

/**
 * =============
 * = FUNCTIONS =
 **
 * Function to export tab information to a file.
 * @param {string} argFileFormat
 * @param {boolean} argCurrentWindow
 * @returns {*}
 **/
function exportFileContent(argFileFormat, argCurrentWindow)
{
	let queryOptions;

	if (argFileFormat == "") throw new Error ("Error: invalid exportFile parameter.");

	_setFileMIMEExtension(argFileFormat);

	if (argCurrentWindow) {
		queryOptions = {
			currentWindow: true
		};
	} else {
		queryOptions = {};
	}

	chrome.tabs.query(queryOptions, objALLTabs => {
		let idWindow = "allwindows";
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
		} else if (argFileFormat == "HTML") {
			fileContent = fileContent + "</DL><p>";
		}

		// Create a BLOB file with MIME type (Chrome doesn't understand without it).
		let fileBlob = new Blob([fileContent], { type: g_fileMimetype });
		let tmpURL = (window.webkitURL || window.URL).createObjectURL(fileBlob);

		let nowDate = _getDate();
		let expFilename = DEFAULT_FILE_PREFIX + "-" + nowDate + "-" + idWindow + "." + g_fileExtension;

		// Send temporary file blob URL to "background.js".
		sendFileContentToDownloader(tmpURL, expFilename, fileBlob);
	});
}

/**
 * Function to format the header of the file.
 * @param {string} argFormat
 * @returns {string} returnContent
 **/
function formatHeader(argFormat)
{
	let returnContent = "";

	if (argFormat == "CSV") {
		returnContent = "id;title;url";
		if (g_isFirefox) returnContent = returnContent + ";last access";
		returnContent = returnContent + "\n";
	} else if (argFormat == "HTML") {
		returnContent = "<!DOCTYPE NETSCAPE-Bookmark-file-1>\n";
		returnContent = returnContent + "<!-- This is an automatically generated file.\n";
		returnContent = returnContent + "Generated by Tabs2Text (" + DEFAULT_GITHUB_PAGE + ") ! -->\n";
		returnContent = returnContent + "<META HTTP-EQUIV=\"Content-Type\" CONTENT=\"text/html; charset=UTF-8\">\n";
		returnContent = returnContent + "<TITLE>Tabs2Text links</TITLE>\n";
		returnContent = returnContent + "<H1>Tabs2Text links</H1>\n";
		returnContent = returnContent + "<DL><p>\n";
	} else if (argFormat == "MD") {
		returnContent = "TABS2TEXT LINKS\n";
		returnContent = returnContent + "================\n";
		returnContent = returnContent + "# LINKS\n\n";
		returnContent = returnContent + "## Generated by [Tabs2Text](" + DEFAULT_GITHUB_PAGE + ")\n\n";
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
function formatContent(argFormat, argID, argTitle, argURL, argLastAccessed)
{
	let returnContent = "";
	let t_objContent = {};

	if (argFormat == "CSV") {
		//returnContent = argID + ";" + argTitle + ";" + argURL + ";" + argLastAccessed + "\n";
		returnContent = argID + ";";
		returnContent = returnContent + argTitle + ";";
		returnContent = returnContent + argURL;
		if (g_isFirefox) returnContent = returnContent + ";" + argLastAccessed;
		returnContent = returnContent + "\n";
	} else if (argFormat == "HTML") {
		returnContent = "\t<DT><A HREF=\"" + argURL + "\">" + argID + ". " + argTitle;
		if (g_isFirefox) returnContent = returnContent + " (last access: " + argLastAccessed + ")";
		returnContent = returnContent + "</A>\n";
	} else if (argFormat == "MD") {
		returnContent = "### " + argID + ". [" + argTitle + "](" + argURL + ")";
		if (g_isFirefox) returnContent = returnContent + ", last access: " + argLastAccessed;
		returnContent = returnContent + "\n";
	} else if (argFormat == "JSON") {
		t_objContent.id = argID;
		t_objContent.title = argTitle;
		t_objContent.url = argURL;
		if (g_isFirefox) t_objContent.last_access = argLastAccessed;

		g_objJSONContent.push(t_objContent);
	}

	return returnContent;
}

/**
 * ===================
 * = EXTERNAL NOTIFY =
 **
 **
 * Function to send file content information to "background.js".
 * @param {string} argURL
 * @param {string} argFilename
 * @param {blob} argBlob
 * @returns {*}
 */
function sendFileContentToDownloader(argURL, argFilename, argBlob)
{
	sendBackgroundMessage("to_downloader", {"url": argURL, "filename": argFilename, "blob": argBlob});
}

/**
 * =========================
 * = GET and SET functions =
 **
 * Function to get UI file format options.
 * @param {*}
 * @returns {string} retFormat
 **/
function _getUIFileFormat()
{
	let objOptions = document.getElementsByName("format_file_radio");
	let intOptions = objOptions.length;
	let retFormat;

	for (let c=0;c < intOptions; c++) {
		if (objOptions[c].checked == true) retFormat = objOptions[c].value;
	}

	return retFormat;
}

/** 
 * Function to get UI option for current window.
 * @param {*}
 * @returns {boolean} retCurrentWindow
 **/
function _getUICurrentWindow()
{
	let objALLTabs = document.getElementsByName("export_allTabs_radio");
	let intALLTabs = objALLTabs.length;
	let retCurrentWindow;

	for (let c=0;c < intALLTabs; c++) {
		if (objALLTabs[c].checked == true) {
			retCurrentWindow = (objALLTabs[c].value === "true");
		} 
	}

	return retCurrentWindow;
}

/**
 * Function to set UI file format options.
 * @param {string} argFileFormat
 * @returns {*}
 **/
function _setUIFileFormat(argFileFormat)
{
	let objOptions = document.getElementsByName("format_file_radio");
	let intOptions = objOptions.length;

	for (let c=0;c < intOptions; c++) {
		if (objOptions[c].value == argFileFormat) objOptions[c].checked = true;
	}
}

/**
 * Function to set the current version of this extension (addon) in UI.
 * @param {*}
 * @returns {*}
 **/
function _setUIVersion()
{
	let locManifest = chrome.runtime.getManifest();
	let spnVersion = document.getElementById("v-current-version");
	spnVersion.innerText = locManifest.version;
}

/**
 * Function to set the icon of this extension (addon) in UI.
 * @param {*}
 * @returns {*}
 **/
function _setUIIcon()
{
	let locManifest = chrome.runtime.getManifest();
	let srcIcon = document.getElementById("ico-tabs2text");
	srcIcon.src = locManifest.icons["48"];
}

/**
 * Function to set file extension and MIME type.
 * @source https://www.iana.org/assignments/media-types/media-types.xhtml
 * @param {string} argFormat
 * @returns {*}
 **/
function _setFileMIMEExtension(argFormat)
{
	if (argFormat == "CSV") {
		g_fileExtension = "csv";
		g_fileMimetype = "text/csv;charset=utf=8";
	} else if (argFormat == "HTML") {
		g_fileExtension = "html";
		g_fileMimetype = "text/html;charset=utf=8";
	} else if (argFormat == "MD") {
		g_fileExtension = "md";
		g_fileMimetype = "text/markdown;charset=utf=8";
	} else if (argFormat == "JSON") {
		g_fileExtension = "json";
		g_fileMimetype = "application/json;charset=utf=8";
	} else {
		g_fileExtension = "txt";
		g_fileMimetype = "text/plain;charset=utf=8";
	}
}

 //EOF