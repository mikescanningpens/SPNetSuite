/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       23 Jan 2018     mikelewis		   Mass Update for Mass Deleting Records
 *
 */


	/**
	 * Entry function
	 * 
	 * @param {String} type Context Types: mass update
	 * @returns {Void}
	 */


	function deleteRecordsEntry(recordType,recordId)
	{
		try
		{
			nlapiDeleteRecord(recordType,recordId);
			nlapiLogExecution('DEBUG','deleteRecordsEntry', 'recordType : ' + recordType + ' recordId : ' + recordId);
			
			//Check for contacts deleting
			
			//Check for sub customers deleting
		}
		catch (e)
		{
			Library.errorHandler('deleteRecordsEntry | recordType ' + recordType + ' recordId : ' + recordId, e);
			return true;
		}
	}