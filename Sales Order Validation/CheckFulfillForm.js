/****************************************************************************
 * Name			: Check Fulfill Form (CheckFulFillForm.js)
 *
 * Script Type	: User Event Script
 * 
 * Client		: TJSC
 * 
 * Version		: 1.0.0	- 08/08/2017	- Initial release -	BT
 * 
 * Author		: FHL
 * 
 * Script		: customscript_checkfulfillform
 * 
 * Deploy		: customdeploy_checkfulfillform
 * 
 * Purpose		: Disable the Approve button if there is no Fulfill Form on any of the line items
 * 
 * Notes		:		
 *
 * Library		: Library.FHL.js
 ******************************************************************************/
var CheckFulFillForm = (function(Library)
{	
	/**
	 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
	 * @appliedtorecord recordType
	 *  
	 * @since 1.0.0 - BT
	 * @param {String} type Operation types: create, edit, view, copy, print, email
	 * @param {nlobjForm} form Current form
	 * @param {nlobjRequest} request Request object
	 * @returns {Void}
	 */
	function beforeLoad(type, form, request)
	{
		var lineCount = null;
		var fulfillForm = null;
		var disableApprove = false;
		var approveButton = null;
		
		try
		{
			lineCount = nlapiGetLineItemCount('item');
			approveButton = form.getButton('approve');
			
			for (var i = 1; i <= lineCount; i++)
			{
				fulfillForm = nlapiGetLineItemText('item', 'custcol_fulfill_from', i);
				
				if (fulfillForm === null || fulfillForm === '')
				{
					disableApprove = true;
				}
			}
			
			if (approveButton != null)
			{
				approveButton.setDisabled(disableApprove);
			}
		}
		catch(e)
		{
			Library.errorHandler('CheckFulFillForm', e)
		}
	}
	
	return {
		beforeLoad : beforeLoad
	}
})(Library);