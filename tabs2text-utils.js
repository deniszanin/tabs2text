/************************
 ** TABS2TEXT
 **   description: Export all your opened tabs to a CSV, HTML, JSON or Markdown file.
 **   homepage_url: https://github.com/deniszanin/tabs2text
 **   license: Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)
 **
 ** FILE: tabs2text-utils.js
 ************************
 **/
"use strict";

/**
 * ====================
 * = EVENT LISTENERS  =
 * = LOCALES function =
 **
 ** Default action on loading page.
 **/
document.addEventListener("DOMContentLoaded", () => {
	for (const element of document.querySelectorAll("[data-i18n")) {
		element.innerText = chrome.i18n.getMessage(element.getAttribute("data-i18n")).replace(/&quot;/g,"\"");
	}
});

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
Date.prototype.yyyymmdd = function()
{
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
 * Function to send a message to background.js.
 * @param {string} type
 * @param {object} object
 * @param {function} callback
 * @returns {*}
 **/
function sendBackgroundMessage(type, object, callback)
{
	chrome.runtime.sendMessage({type, object}, callback);
}

/**
 * Function to format a given date.
 * @source: https://stackoverflow.com/questions/23593052/format-javascript-date-as-yyyy-mm-dd
 * @param {string} argDate
 * @returns {string} retDate
 **/
function formatDate(argDate)
{
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
 * Function to check if this browser is Firefox.
 * @source: https://github.com/EFForg/https-everywhere/blob/bcaf7bdecf147c2a46d7ed73bce64389d828d865/chromium/background-scripts/background.js
 * @param {*}
 * @returns {boolean} 
 **/
function isFirefox()
{
	if (typeof(browser) != "undefined")
	{
		// #TODO: get information about browser properly.
		/*_getBrowserInfo().then(function(info) {
			if (info == "Firefox") {
				return true;
			} else {
				return false;
			}
		});*/
		return true;
	} else {
		return false;
	}
}

/**
 * =========================
 * = GET and SET functions =
 **
 **
 * Function to get current date and format it.
 * @param {*}
 * @returns {date}
 **/
function _getDate()
{
	let tDate = new Date();

	return tDate.yyyymmdd();
}

/**
 * Function to get stored value in BrowserStorage.
 * @param {string} argKey
 * @param {object} argStorageArea
 * @returns {promise} result
 **/
function _getStoredValues(argKey, argStorageArea)
{
	return new Promise(result => argStorageArea.get([argKey], data => result(data[argKey])));
}

/**
 * Async function to get user preferences.
 * @param {string} argKey
 * @returns {promise} result
 **/
async function _getUserSettings(argKey)
{
	return await _getStoredValues(argKey, chrome.storage.local);
}

/**
 * Function to get promise browser information.
 * @param {*}
 * @returns {promise} result
 **/
function _getBrowserGenericInfo()
{
	return new Promise( resolve => {
		let result = browser.runtime.getBrowserInfo();
		resolve(result);
	});
}

/**
 * Async function to get browser information.
 * @param {*}
 * @returns {object} result
 **/
async function _getBrowserInfo()
{
	return await _getBrowserGenericInfo();
}