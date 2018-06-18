/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       15 May 2018     Mike Lewis
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
function autoBillPayPal(type)
{
	try
	{
		if(type == 'create')
		{
			var valueArray = [41,36,37,40]; 

			/*** Values ***
			 * 
			 * {"value":"41","text":"PayPal (website) - SP Corp"}
			 * {"value":"36","text":"PayPal (website) - SP Inc"}
			 * {"value":"37","text":"PayPal (website) - SP Ltd"}
			 * {"value":"40","text":"PayPal (website) - SP Pty Ltd"}
			 * 
			 */ 

			var recId = nlapiGetRecordId();
			var recType = nlapiGetRecordType();
			var record = nlapiLoadRecord(recType, recId);

			var paymentMethod = record.getFieldValue('paymentmethod');

			if(contains(valueArray, paymentMethod))
			{
				nlapiLogExecution('debug', 'paymentMethod', 'paymentMethod = ' + paymentMethod);
				var InvRecord = nlapiTransformRecord(recType, recId, 'cashsale'); //Transform record
				var submittedRecord = nlapiSubmitRecord(InvRecord); // Save the transformed record.

				nlapiLogExecution('debug', 'submittedRecord', 'submittedRecord = ' + submittedRecord);
			}
			else
			{
				nlapiLogExecution('debug', 'Not PayPal paymentMethod', 'paymentMethod = ' + paymentMethod);
			}

		}
	}
	catch(e)
	{
		Library.errorHandler('autoBillPayPal', e);
	}
}

function contains(a, obj) 
{
	try
	{
		for (var i = 0; i < a.length; i++) 
		{
			if (a[i] === obj) 
			{
				return true;
			}
		}
		return false;
	}
	catch(e)
	{
		Library.errorHandler('containsFunction', e);
	}
}
