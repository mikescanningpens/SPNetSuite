/****************************************************************************
 * Name			: Validate Sales Order (validatesalesorder.js)
 *
 * Script Type	: Client Script
 * 
 * Client		: TJSC
 * 
 * Version		: 1.0.0	-	05/10/2016	- Initial Development -	AS
 * 				  1.0.1 - 	13/10/2016 	- Changed the valid variable default value to true - DW
 * 				  1.0.2	-	18/01/2017 	- included ExportAction warehouse (Case S11967) - AS
 * 				  1.0.3 -   13/07/2017  - included Telford Fulfill From option (Case S14518) - BY
 * 				  1.1.0 -	15/08/2017	- Toggle the mandatory setting on the 'Fulfill From' column - AH
 * 				  1.1.1 -	19/09/2017	- Removed params lineNumber on (Case S14506) - LS
 * 				  1.1.2 -   24/10/2017  - Added Corp and Pty warehouses (Case S15427) - TW
 * 				  1.1.3 -   30/10/2017  - Fixed webstore issue (Case S15516) - TW
 *				  1.1.4 -	09/02/2018	- Added in functionality for Parkes
 * 
 * Author		: FHL
 * 
 * Script		: customscript_validatesalesorder
 * 
 * Deploy		: customdeploy_validatesalesorder
 * 
 * Purpose		: validate the fulfill from item column and pop up a message
 * 
 * Notes		:		
 *
 * Library		: Library.FHL.js
 ******************************************************************************/
/**
 * @returns {Boolean} True to continue save, false to abort save
 */
var ValidateSalesOrder = function(Library)
{
	var E_PENS_LTD_SUBSIDIARY = 0;
	var SCANNING_PENS_INC_SUBSIDIARY = 0;
	var SCANNING_PENS_LTD_SUBSIDIARY = 0;
	var SCANNING_PENS_CORP_SUBSIDIARY = 0; //1.1.2
	var SCANNING_PENS_PTY_SUBSIDIARY = 0; //1.1.2
	var SHIPWIRE_SP_LTD_FULFILL = 0;
	var SHIPWIRE_SP_INC_FULFILL = 0;
	var SHIPWIRE_SP_CORP_FULFILL = 0; //1.1.2
	var SHIPWIRE_SP_PTY_FULFILL = 0; //1.1.2
	var PARKES_FULFILL = 0; // 1.1.4
	var CPM_FULFILL = 0;
	var BROOMHAYES_FULFILL = 0;
	var EXPORTACTION_FULFILL = 0;	//1.0.2
	var TELFORD_FULFILL = 0;        //1.0.3
	var CONTEXT = {}; // 1.1.3
	var EXECUTION_CONTEXT = null; //1.1.3


	/**
	 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
	 * 
	 * @appliedtorecord recordType
	 * 
	 * @scope public
	 * @since 1.0.0
	 * @param {String} type - Sublist internal id
	 * @returns {Boolean} returnValue - True to save line item, false to abort save
	 */
	function validateSalesOrder(type)
	{
		var orderDetails = {};
		var valid = true; // 1.0.1

		try
		{
			if(type == 'item')
			{
				initialise();
				orderDetails = getOrderDetails(); //removed params lineNumber 1.1.1
				valid = validateItemLines(orderDetails);
			}
		}
		catch(e)
		{
			errorHandler('validateSalesOrder', e);
		}

		return valid;
	}


	/**
	 * initialise the static variables
	 * 1.0.2 - included ExportAction warehouse
	 * 1.1.2 - Initialise the Cort and Pty variables
	 * 1.1.3 - Added execution context
	 */
	function initialise()
	{
		try
		{
			E_PENS_LTD_SUBSIDIARY = Library.lookUpParameters('salesordervalidatiion','E Pens Ltd Subsidiary');
			SCANNING_PENS_INC_SUBSIDIARY = Library.lookUpParameters('salesordervalidatiion','Scanning Pens Inc Subsidiary'); 
			SCANNING_PENS_LTD_SUBSIDIARY = Library.lookUpParameters('salesordervalidatiion','Scanning Pens Ltd Subsidiary');
			SCANNING_PENS_CORP_SUBSIDIARY = Library.lookUpParameters('salesordervalidatiion','Scanning Pens Corp Subsidiary'); //1.1.2
			SCANNING_PENS_PTY_SUBSIDIARY = Library.lookUpParameters('salesordervalidatiion','Scanning Pens Pty Subsidiary'); //1.1.2

			SHIPWIRE_SP_LTD_FULFILL =  Library.lookUpParameters('salesordervalidatiion','Shipwire SP Ltd Fulfill');
			SHIPWIRE_SP_INC_FULFILL = Library.lookUpParameters('salesordervalidatiion','Shipwire SP Inc Fulfill'); 
			SHIPWIRE_SP_CORP_FULFILL = Library.lookUpParameters('salesordervalidatiion','Shipwire SP Corp Fulfill'); //1.1.2
			SHIPWIRE_SP_PTY_FULFILL = Library.lookUpParameters('salesordervalidatiion','Shipwire SP Pty Fulfill'); //1.1.2
			PARKES_FULFILL = Library.lookUpParameters('salesordervalidatiion','Parkes Fulfill'); // 1.1.4
			CPM_FULFILL = Library.lookUpParameters('salesordervalidatiion','CPM Fulfill');
			BROOMHAYES_FULFILL = Library.lookUpParameters('salesordervalidatiion','Broomhayes Fulfill');
			EXPORTACTION_FULFILL = Library.lookUpParameters('salesordervalidatiion','ExportAction Fulfill'); //1.0.2

			TELFORD_FULFILL = Library.lookUpParameters('salesordervalidatiion','Telford Fulfill');           //1.0.3

			CONTEXT = nlapiGetContext(); //1.1.3
			EXECUTION_CONTEXT = CONTEXT.getExecutionContext(); //1.1.3

		}
		catch(e)
		{
			console.error('initialise', e.message);
		}
	}


	/**
	 * getOrderDetails - get the order details
	 * 
	 * @since 1.1.0
	 * @scope private
	 * @return {Object} salesOrderDetails
	 */
	function getOrderDetails()//removed params lineNumber 1.1.1
	{
		var salesOrderDetails = {};

		try
		{
			salesOrderDetails.subsidiary = nlapiGetFieldValue('subsidiary');
			salesOrderDetails.fulfillFrom = nlapiGetCurrentLineItemValue('item','custcol_fulfill_from');
		}
		catch(e)
		{
			console.error('initialise', e.message);
		}

		return salesOrderDetails;
	}

	/**
	 * validate the line items
	 * 
	 * 1.0.2 - - included ExportAction warehouse
	 * 1.0.3 - - included Telford warehouse
	 * 1.1.2 - - included Corp and Pty warehouse
	 * 1.1.3 - - Fixed issue where validation was working on website S15516
	 * 
	 * @param orderDetails {Object} - the field values in the order record
	 * @returns	validFulfillFrom {Boolean} -  whether the FUlfill From is valid or not
	 */
	function validateItemLines(orderDetails)
	{
		var validFulfillFrom = true;	
		try
		{

			if(EXECUTION_CONTEXT == "userinterface") //1.1.3
			{
				switch(orderDetails.subsidiary)
				{

				case SCANNING_PENS_INC_SUBSIDIARY:
					if(orderDetails.fulfillFrom == SHIPWIRE_SP_LTD_FULFILL || orderDetails.fulfillFrom == CPM_FULFILL
							|| orderDetails.fulfillFrom == BROOMHAYES_FULFILL || orderDetails.fulfillFrom == TELFORD_FULFILL || orderDetails.fulfillFrom == PARKES_FULFILL
							|| orderDetails.fulfillFrom == SHIPWIRE_SP_CORP_FULFILL || orderDetails.fulfillFrom == SHIPWIRE_SP_PTY_FULFILL) //1.0.3 //1.1.2
					{
						validFulfillFrom = false;
						//1.0.2
						alert("Please select Shipwire - SP Inc or ExportAction in the Fulfill From column");
					}
					break;

				case SCANNING_PENS_LTD_SUBSIDIARY:
					if(orderDetails.fulfillFrom == SHIPWIRE_SP_INC_FULFILL || orderDetails.fulfillFrom == SHIPWIRE_SP_CORP_FULFILL || orderDetails.fulfillFrom == PARKES_FULFILL || orderDetails.fulfillFrom == SHIPWIRE_SP_PTY_FULFILL)
					{
						validFulfillFrom = false;
						//1.0.2
						alert("Please select Shipwire - SP Ltd, CPM, Broomhayes, ExportAction or Telford in the Fulfill From column"); //1.0.3 //1.1.2
					}

					break;

				case E_PENS_LTD_SUBSIDIARY:

					//1.0.2
					if(orderDetails.fulfillFrom == SHIPWIRE_SP_LTD_FULFILL|| orderDetails.fulfillFrom == SHIPWIRE_SP_INC_FULFILL 
							|| orderDetails.fulfillFrom == EXPORTACTION_FULFILL || orderDetails.fulfillFrom == PARKES_FULFILL || orderDetails.fulfillFrom == TELFORD_FULFILL
							|| orderDetails.fulfillFrom == SHIPWIRE_SP_CORP_FULFILL || orderDetails.fulfillFrom == SHIPWIRE_SP_PTY_FULFILL) //1.0.3 //1.1.2
					{
						validFulfillFrom = false;
						alert("Please select CPM or Broomhayes in the Fulfill From column");
					}
					break;

				case SCANNING_PENS_CORP_SUBSIDIARY: //1.1.2
					if(orderDetails.fulfillFrom == SHIPWIRE_SP_CORP_FULFILL || orderDetails.fulfillFrom == PARKES_FULFILL) // 1.1.4
					{
						// Carry on as normal
					}
					else // 1.1.4
					{
						validFulfillFrom = false;
						alert("Please select Shipwire - SP Corp or Parkes in the Fulfill From column"); // 1.1.4
					}
					break;

				case SCANNING_PENS_PTY_SUBSIDIARY: //1.1.2
					if(orderDetails.fulfillFrom != SHIPWIRE_SP_PTY_FULFILL)
					{
						validFulfillFrom = false;
						alert("Please select Shipwire - SP Pty in the Fulfill From column");
					}
					break;		
				}
			}	
		}
		catch(e)
		{
			console.error('initialise', e.message);
		}

		return validFulfillFrom;
	}

	/**
	 * Test whether 'fulfill from' column should be mandatory 
	 * 
	 * @since 1.1.0
	 * @scope private
	 * @returns {Boolean} mandatory
	 */
	function isFulfillFromMandatory()
	{
		var mandatory = false;
		var customer = null;
		var representsSubsidiary = '';

		try
		{
			customer = nlapiGetFieldValue('entity');

			if (customer)
			{
				representsSubsidiary = nlapiLookupField('customer', customer, 'representingsubsidiary');

				if (!representsSubsidiary || representsSubsidiary.length === 0)
				{
					mandatory = true;
				}
			}
		}
		catch (e)
		{
			Library.errorHandler('fieldChanged', e);
		}

		return mandatory;
	}

	/**
	 * Test whether 'fulfill from' column is fully populated
	 * 
	 * @since 1.1.0
	 * @scope private
	 * @returns {Boolean} populated
	 */
	function isFulfillFromColumnPopulated()
	{
		var populated = false;
		var i = 0;
		var length = 0;
		var fulfillFrom = '';

		try
		{
			populated = true;
			length = nlapiGetLineItemCount('item');

			for (i = 1; i <= length; i++)
			{
				fulfillFrom = nlapiGetLineItemValue('item', 'custcol_fulfill_from', i);

				if (!fulfillFrom || fulfillFrom.length === 0)
				{
					populated = false;
					break;
				}
			}
		}
		catch (e)
		{
			Library.errorHandler('isFulfillFromColumnPopulated', e);
		}

		return populated;
	}

	/**
	 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment.
	 * 
	 * @appliedtorecord recordType
	 * 
	 * @scope public
	 * @since 1.0.0
	 * @returns {Boolean} returnValue - True to continue save, false to abort save
	 */
	function saveRecord()
	{
		var returnValue = false;

		try
		{
			if (isFulfillFromMandatory() && !isFulfillFromColumnPopulated())
			{
				alert('The item sublist is required to have values for \'Fulfill From\' column.');
			}
			else
			{
				returnValue = true;
			}
		}
		catch (e)
		{
			Library.errorHandler('saveRecord', e);
		}

		return returnValue;
	}

	return {

		validateLine: validateSalesOrder,
		saveRecord: saveRecord
	};
}(Library);