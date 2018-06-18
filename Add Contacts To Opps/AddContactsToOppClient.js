/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       22 Mar 2018     Mike Lewis
 *
 */

function updateContactOnOpportunityEntry()
{
	try
	{
		var recordId = nlapiGetFieldValue('entity');
		//alert(recordId);
		var filters = ["company.internalid","anyof",recordId];
		var columns = [ new nlobjSearchColumn('internalid') ];

		var results = nlapiSearchRecord('contact', null, filters, columns);
		document.getElementById('hddn_contacts_contact_fs').type = 'normal';
		
		
		
		if (results)
		{
			
			for (var i = 0; i < results.length; i++)
			{
					var contactInternalId = results[i].getId();
					document.forms['contacts_main_form'].elements.hddn_contacts_contact_fs.value = contactInternalId;
					alert();
					add_contact();
			}
		}
		else
		{
			alert('No contacts found...');
		}
	}
	catch (e)
	{
		Library.errorHandler('createTrialOpportunityEntry', e);
		return true;
	}
}


