/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       22 Mar 2018     Mike Lewis
 *
 */

/**
 * @param {String} recType Record type internal id
 * @param {Number} recId Record internal id
 * @returns {Void}
 */
	function updateContactOnOpportunityEntry(recordType,recordId)
	{
		try
		{
			nlapiLogExecution('DEBUG', 'updateContactOnOpportunityEntry', 'updateContactOnOpportunityEntry');
					var record = null;
			
					record = nlapiLoadRecord(recordType, recordId);
					
					var filters = ["company.internalid","anyof",recordId];
					var columns = [ new nlobjSearchColumn('internalid') ];
					
					var results = nlapiSearchRecord('contact', null, filters, columns);
					if (results)
					{
						for (var i = 0, len = results.length; i < len; i++)
						{
							var contactInternalId = results[i];
							nlapiAttachRecord('contact', contactInternalId, 'opportunity', recordId);
						}
					}
		}
		catch (e)
		{
			Library.errorHandler('createTrialOpportunityEntry', e);
			return true;
		}
	}