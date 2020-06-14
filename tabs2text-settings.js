/************************
 ** TABS2TEXT
 **   description: Export all your opened tabs to a CSV, HTML, JSON or Markdown file.
 **   homepage_url: https://github.com/deniszanin/tabs2text
 **   license: Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)
 **
 ** FILE: tabs2text-settings.js
 ************************
 **/
"use strict";

/**
 * ===================
 * = EVENT LISTENERS =
 *
 ** Default action on loading page.
 **/
document.addEventListener("DOMContentLoaded", () => {
	// Add an event listener "click" to SAVE PREFERENCES button.
	let h_btnSave = document.getElementById("tabs-saveSettings");
	h_btnSave.addEventListener("click", clickSavePreferences);

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
 * Function to save user preferences to BrowserStorage.
 * @param {*}
 * @return {*}
 **/
function clickSavePreferences()
{
	// Preference options to be saved.
	const userPreferences = {
		storCurrentWindow: _getUICurrentWindow(),
		storFileFormat: _getUIFileFormat()
	};

	chrome.storage.local.set(userPreferences, function() {
		document.getElementById("spn_save_status").innerText = chrome.i18n.getMessage("lbl_save_preferences_action");
		sendBackgroundMessage("debug_log_on", `User preferences: ${JSON.stringify(userPreferences)}.`);
	});
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

//EOF