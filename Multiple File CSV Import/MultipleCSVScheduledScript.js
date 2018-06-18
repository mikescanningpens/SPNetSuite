/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       11 Jul 2017     michael.lewis
 *
 */

/**
 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
 * @returns {Void}
 */
function importCSVFile(type) 
{
		try
		{
			var context = nlapiGetContext();
			var fileID = context.getSetting('SCRIPT', 'custscript_fileid');
			var mapInternalID = context.getSetting('SCRIPT', 'custscript_mapid');
			
			nlapiLogExecution('DEBUG', 'fileID = ', fileID);
			var importedFile = nlapiLoadFile(fileID);
			
			var import = nlapiCreateCSVImport();
			import.setMapping(mapInternalID);
			import.setPrimaryFile(importedFile);
			import.setOption('jobName','LeadImport');
			var importId = nlapiSubmitCSVImport(import); 
			nlapiLogExecution('debug','importId = ',importId);	
		}
		catch(err)
		{
			nlapiLogExecution('ERROR', err.name, err.message);
		}
}
