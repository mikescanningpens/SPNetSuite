/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       23 Apr 2018     Mike Lewis		This allows any record to be edited then saved - 
 * 												usually used to invoke scripts that run after submit etc.
 *
 */

/**
 * @param {String} recType Record type internal id
 * @param {Number} recId Record internal id
 * @returns {Void}
 */
function massUpdateEditSave(recType, recId) 
{
	try
	{
		var record = nlapiLoadRecord(recType, recId);
		nlapiSubmitRecord(record, false, true);
	}
	catch(e)
	{
		Library.errorHandler('massUpdateEditSave', e);
	}
}
