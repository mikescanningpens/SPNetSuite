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
	var context = null;
	var deleteContacts = null;
	var deleteSubCustomers = null;

	try
	{
		context = nlapiGetContext();
		deleteContacts = context.getSetting('SCRIPT', 'custscript_delete_contacts');
		deleteSubCustomers = context.getSetting('SCRIPT', 'custscript_delete_subcustomers');

		// Delete all contacts
		if(deleteContacts == 'T')
		{

			var filters = [ new nlobjSearchFilter('company', null, 'anyof', recordId) ];
			var columns = [ new nlobjSearchColumn('internalid') ];

			var results = nlapiSearchRecord('contact', null, filters, columns);

			if (results)
			{
				for (var i = 0; i < results.length; i++)
				{
					var internalId = results[i].getId();

					nlapiLogExecution('DEBUG', 'Deleting contact record...', 'internalId: ' + internalId);
					//nlapiDeleteRecord('contact', internalId);

				}
			}


		}
		else
		{
			var filters = [ new nlobjSearchFilter('company', null, 'anyof', recordId) ];
			var columns = [ new nlobjSearchColumn('internalid') ];

			var results = nlapiSearchRecord('contact', null, filters, columns);

			if (results)
			{
				for (var i = 0; i < results.length; i++)
				{
					var internalId = results[i].getId();

					nlapiLogExecution('DEBUG', 'Detaching contact record...', 'internalId: ' + internalId);
					//nlapiSubmitField('contact', internalId, 'company', '');

				}
			}
		}

		// Delete all subcustomers
		if(deleteSubCustomers == 'T')
		{
			
			var filters = [ 
			                new nlobjSearchFilter('parent', null, 'anyof', recordId),
			                new nlobjSearchFilter('formulanumeric',null,'isnotempty').setFormula('{parentcustomer.internalid}')
			                ];
			var columns = [ new nlobjSearchColumn('internalid') ];

			var results = nlapiSearchRecord('customer', null, filters, columns);

			if (results)
			{
				nlapiLogExecution('DEBUG', 'results.length', results.length);
				for (var i = 0; i < results.length; i++)
				{
					var internalId = results[i].getId();

					nlapiLogExecution('DEBUG', 'Deleting subcustomer record...', 'internalId: ' + internalId);
					//nlapiDeleteRecord('customer', internalId);

				}
			}

		}
		else
		{
			var filters = [ 
			                new nlobjSearchFilter('parent', null, 'anyof', recordId),
			                new nlobjSearchFilter('formulanumeric: {parentcustomer.internalid}',null,'isnotempty','')
			                ];
			
			var columns = [ new nlobjSearchColumn('internalid') ];

			var results = nlapiSearchRecord('customer', null, filters, columns);

			if (results)
			{
				for (var i = 0; i < results.length; i++)
				{
					var internalId = results[i].getId();

					nlapiLogExecution('DEBUG', 'Detaching Subcustomer record...', 'internalId: ' + internalId);

					//nlapiSubmitField('customer', internalId, 'parentcustomer', '');
				}
			}
		}
		
		nlapiLogExecution('DEBUG', 'Deleting Customer record...', 'recordType: ' + recordType + ' recordId: ' + recordId);

		//nlapiDeleteRecord(recordType, recordId);

	}
	catch (e)
	{
		Library.errorHandler('deleteRecordsEntry | recordType ' + recordType + ' recordId : ' + recordId, e);
		return true;
	}
}