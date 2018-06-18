/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       04 Apr 2018     Mike Lewis
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Sublist internal id
 * @returns {Boolean} True to save line item, false to abort save
 */
function clientValidateLine(type)
{
	var returnValue = true;
	try
	{
		var customForm = nlapiGetFieldValue('customform');
		var context = nlapiGetContext();
		var executionContext = context.getExecutionContext();
		nlapiLogExecution('AUDIT', 'executionContext',executionContext);
		if(executionContext == 'userinterface')
		{
			if(customForm == '117')
			{


				var fulfilFrom = nlapiGetCurrentLineItemValue('item', 'custcol_fulfill_from');
				var itemIsSelected = nlapiGetCurrentLineItemValue('item','item');
				if(itemIsSelected)
				{
					if(!fulfilFrom)
					{
						alert('Please enter a location to fulfil from');
						returnValue = false;
					}
				}
				else
				{
					nlapiLogExecution('AUDIT', 'This item line is empty', 'This item line is empty');
				}

			}
			else
			{
				// Does not need to do anything
			}
		}
		else
			{
				nlapiLogExecution('DEBUG', 'executionContext', executionContext);
			}
	}
	catch(e)
	{
		alert('Please send an email to support quoting this error: ' + e.message);
	}
	return returnValue;
}
