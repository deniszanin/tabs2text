/************************
 ** TABS2TEXT
 **   description: Export all your opened tabs to a CSV, HTML, JSON or Markdown file.
 **   homepage_url: https://github.com/deniszanin/tabs2text
 **   license: Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)
 **
 ** FILE: background.js
 ************************
 *
 **/
"use strict";

/**
 * =====================
 * = GLOBALS VARIABLES =
 **/
const DEFAULT_STORAGE_OBJECT = chrome.storage.local;
const DEFAULT_CURRENT_WINDOW_TABS_ONLY = false;
const DEFAULT_FILE_TYPE = "HTML";

// For debugging application
const DEBUG_MODE = false; // Change it to "true", for debug mode.
if (DEBUG_MODE) console.log("DEBUG: TABS2TEXT DEBUG is ON.");

// Refreshing the tabs badge counter
updateBadgeCount();

/**
 * =============
 * = FUNCTIONS =
 **
 **
 * Function to refresh the tabs badge counter.
 * @source: https://github.com/mdn/webextensions-examples/blob/master/tabs-tabs-tabs/tabs.js
 * @param {} tabId
 * @returns {*}
 **/
function updateBadgeCount(tabId)
{
	chrome.tabs.query({}, function(objTabs) {
		let length = objTabs.length;

		chrome.browserAction.setBadgeText( {text: length.toString()} );
		chrome.browserAction.setBadgeBackgroundColor({"color": "blue"});
	});
}

/**
 * Function to receive an file content and save it to the local file system.
 * @param {string} argURL
 * @param {string} argFilename
 * @param {blob} argBlob
 * @returns {*}
 **/
function downloadFileAndSaveAs(argURL, argFilename, argBlob)
{
	let sanURL = argURL;

	// Firefox bug fix: create an URL again, based on argBlob.
	if (typeof(browser) != "undefined") sanURL = (window.webkitURL || window.URL).createObjectURL(argBlob);

	let downloadOptions = {
		url: sanURL,
		filename : argFilename,
		conflictAction : "uniquify",
		saveAs : true
	};

	chrome.downloads.download(downloadOptions, downloadID => {
		if (DEBUG_MODE) console.log(`DEBUG: Started downloading, id ${downloadID}, ok.`);
	});
}

 /**
  * Function to get external notifications (signals) and messages from tabs2text.js file.
  * @param {object} argEXTMessages
  * @returns {*}
  **/
function receiveFileContentMessage(argMessage) {
	if (DEBUG_MODE) console.log(`DEBUG: Message/notification received, message ${JSON.stringify(argMessage)}.`);

	downloadFileAndSaveAs(argMessage.url, argMessage.filename, argMessage.blob);
}

/**
 * ===================
 * = EVENT LISTENERS =
 *
 ** Default action on tabs creation or destruction.
 ** Default action when receiveing messages from pages.
 ** Default action on extension install.
 **/
chrome.tabs.onRemoved.addListener( (tabId) => { updateBadgeCount(tabId); });
chrome.tabs.onCreated.addListener( (tabId) => { updateBadgeCount(tabId); });
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
	const responses = {
		debug_log_on: () => {
			if (DEBUG_MODE) console.log("DEBUG-EXT: " + message.object);
		},
		debug_warn_on: () => {
			if (DEBUG_MODE) console.warn("DEBUG-EXT: " + message.object);
		},
		to_downloader: () => {
			receiveFileContentMessage(message.object);
		}
	};

	if (message.type in responses) {
		return responses[message.type]();
	}
});

// Fill BrowserStorage with default values.
chrome.runtime.onInstalled.addListener(function() {
	const defaultSettings = {
		storCurrentWindow: DEFAULT_CURRENT_WINDOW_TABS_ONLY,
		storFileFormat: DEFAULT_FILE_TYPE
	};

	// Store initial values in BrowserStorage.
	DEFAULT_STORAGE_OBJECT.set(defaultSettings, () => {
		if (DEBUG_MODE) console.log(`DEBUG: Initial values set in BrowserStorage.`);
	});
});

// #TODO
chrome.commands.onCommand.addListener(function(command)
{
	if (command == "t2t-export") {
		if (DEBUG_MODE) console.log("DEBUG: #TODO: Shortcut, exporting file.");
	}
});

// EOF