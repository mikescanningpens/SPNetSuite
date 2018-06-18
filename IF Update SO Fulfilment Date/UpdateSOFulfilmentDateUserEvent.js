/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       23 Apr 2018     Mike Lewis
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
function updateSOFulilDateEntry(type)
{
	var internalIdIF = null;
	var recordType = null;
	var SOInternalID = null;
	var fields = null;
	var date = null;
	var ifFields = null;

	try
	{
		if(type != 'delete')
		{
			// Log type of action for IF
			nlapiLogExecution('DEBUG', 'type = ' + type, 'type = ' + type);

			// Get IF information..
			internalIdIF = nlapiGetRecordId();
			recordType = nlapiGetRecordType();

			// Set the array for fields to fetch from Item Fulfilment
			ifFields = ['createdfrom', 'trandate'];

			// Lookup the fields in array
			fields = nlapiLookupField(recordType, internalIdIF, ifFields);

			// extracts the values from the lookup
			SOInternalID = fields.createdfrom;
			date = fields.trandate;

			nlapiLogExecution('DEBUG', 'SOInternalID = ' + SOInternalID, 'internalIdIF = ' + internalIdIF + '\nrecordType = ' + recordType);
			nlapiLogExecution('DEBUG', 'date', 'date = ' + date);

			if(SOInternalID != null && date != null)
			{
				// Update the fulfilment date on the sales order...
				nlapiSubmitField('salesorder', SOInternalID, 'custbody_sofulfilmentdate', date);
			}
			else
				{
					nlapiLogExecution('DEBUG', 'THIS SHOULD NOT HAPPEN \nSOInternalID = ' + SOInternalID, 'internalIdIF = ' + internalIdIF + ' recordType = ' + recordType + ' date = ' + date);
				}


		}
		else
		{
			nlapiLogExecution('DEBUG', 'Not running as type is delete', 'type = ' + type);
		}

	}
	catch(e)
	{
		Library.errorHandler('handleTransactionCreationEmail', e);
	}
}
