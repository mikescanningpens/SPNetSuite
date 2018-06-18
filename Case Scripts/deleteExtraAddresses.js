/***************************************************************************************************************
 * Name			: Delete Extra Addresses - {deleteExtraAddresses.js} 
 * 
 * Script Type	: Scheduled Script
 * 
 * API Version	: 1.0
 * 
 * Version		: 1.0.0	- 20/09/2016 - Initial Development - DW.	
 * 
 * Author		: FHL
 * 
 * Purpose 		: Run through all customers and delete all non-default addresses.
 * 
 * Script		: customscript_deleteextraaddresses
 * Deploy		: customdeploy_deleteextraaddresses
 * 				
 * Notes		: 
 * 
 * Library		: Library.FHL.js
 ****************************************************************************************************************/

var DeleteExtraAddresses = (function(Library) 
{
	var startValue = null;
	
	/**
	 * Checks all customers and deletes any addresses that arn't default or all but the first if there are no defaults
	 * 
	 * @scope Public
	 * @since 1.0.0
	 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
	 * @returns {Void}
	 */
	function deleteExtraAddresses(type) 
	{	
		var context = null;
		var customers = null;
		var i = null;
		var id = null;
		var defaults = null;
		
		try
		{
			context = nlapiGetContext();
			startValue = Library.lookUpParameters('Search', 'Address Delete - Start Point');
			
			customers = getAllCustomers();
			
			if (customers)
			{
				for (i = 0; i < customers.length; i++)
				{
					id = customers[i].getId();
					
					defaults = checkForDefaults(id);
					
					if (defaults)
					{
						deleteAddresses(id, defaults);
					}
					
					if (context.getRemainingUsage() < 100)
					{
						nlapiSubmitField('customrecord_deploymentparameters', 21, 'custrecord_deploymentparametervalue', id);
						nlapiYieldScript();
					}
				}
			}
		}
		catch (e)
		{
			Library.errorHandler('deleteExtraAddresses', e);
		}
	}
	
	/**
	 * Runs a search, returning all customers
	 * 
	 * @since 1.0.0
	 * @scope Private
	 * @return {Array} results - Array of all customer internal id's
	 */
	function getAllCustomers()
	{
		var search = null;
		var filters = null;
		var columns = null;
		var resultSet = null;
		var searchResults = null;
		var start = 0;
		var results = [];
		
		try
		{
			filters = [new nlobjSearchFilter('isinactive', null, 'is', 'F')
					,  new nlobjSearchFilter('internalidnumber', null, 'greaterthanorequalto', startValue)
					,  new nlobjSearchFilter('internalidnumber', null, 'lessthanorequalto', startValue + 2000)];
			
			columns = new nlobjSearchColumn('internalid').setSort();
			
			search = nlapiCreateSearch('customer', filters, columns);
			resultSet = search.runSearch();
			
			do
			{
				searchResults = resultSet.getResults(start, start + 1000); // API GOV: 10 units.
				
				if(searchResults)
				{	
					results = results.concat(searchResults);
				}
				
				start += 1000;
			}
			while(results && results.length > 0 && results.length % 1000 === 0);
			
		}
		catch (e)
		{
			Library.errorHandler('getAllCustomers', e);
		}
		
		return results;
	}
	
	/**
	 * Checks the customer for any default shipping or billing addresses
	 * 
	 * @since 1.0.0
	 * @scope Private
	 * @param {Integer} index - internal id of a customer record
	 * @return {Object} - Obj containing the default shipping and billing id
	 */
	function checkForDefaults(index)
	{
		var record = null;
		var addCount = null;
		var i = null;
		var isShipping = null;
		var isBilling = null;
		var shippingId = null;
		var billingId = null;
		
		try
		{
			if (index)
			{
				record = nlapiLoadRecord('customer', index); //API GOV: 10 units
			}
			
			addCount = record.getLineItemCount('addressbook');
			
			for (i = 1; i < addCount+1; i++)
			{
				isShipping = record.getLineItemValue('addressbook', 'defaultshipping', i);
				isBilling = record.getLineItemValue('addressbook', 'defaultbilling', i);
				
				if (isShipping == 'T')
				{
					shippingId = i;
				}
				
				if (isBilling == 'T')
				{
					billingId = i;
				}
			}

			if (!shippingId && !billingId)
			{
				shippingId = 1;
				billingId = 1;
			}
		}
		catch (e)
		{
			Library.errorHandler('checkForDefaults', e);
		}
		
		return {record : record, shippingId : shippingId, billingId : billingId};
	}
	
	/**
	 * Deletes all addresses of the given customer except the default addresses
	 * 
	 * @since 1.0.0
	 * @scope Private
	 * @param {Integer} customer - Internal id of a customer record
	 * @param {Object} defaultAdds - Obj containing the default shipping id, billing id and customer record
	 * @return {Void}
	 */
	function deleteAddresses(customer, defaultAdds)
	{
		var record = null;
		var shippingId = null;
		var billingId = null;
		var addCount = null;
		var i = null;
		var removeTotal = null;
		var firstLine = null;
		var reCalc = false;
		var label = null;
		
		try
		{
			record = defaultAdds.record;
			
			shippingId = defaultAdds.shippingId;
			billingId = defaultAdds.billingId;
			addCount = record.getLineItemCount('addressbook');

			removeTotal = calculateRemoveTotal(addCount, shippingId, billingId);

			for (i = addCount; i > 0; i--)
			{
				firstLine = record.getLineItemValue('addressbook', 'addr1', i);
				label = record.getLineItemValue('addressbook', 'label', i);
				reCalc = (removeTotal == 1) ? false : true;
				
				if (i != shippingId && i != billingId && label == firstLine)
				{
					record.removeLineItem('addressbook', i, reCalc);
					removeTotal--;
				}
			}
			
			nlapiSubmitRecord(record, false, true); // API GOV: 10 Units
		}
		catch (e)
		{
			Library.errorHandler('deleteAddresses', e);
		}
	}
	
	/**
	 * Calculates how many addresses need to be removed
	 * 
	 * @since 1.0.0
	 * @scope Private
	 * @param {Integer} addCount - Total number of addresses
	 * @param {Integer} shippingId - Id of address marked as default shipping
	 * @param {Integer} billingId - Id of address marked as default billing
	 * @return {Integer} removeTotal - Total number of addresses to be removed
	 */
	function calculateRemoveTotal(addCount, shippingId, billingId)
	{
		var removeTotal = null;
		
		try
		{
			removeTotal = addCount;
			
			if (shippingId && billingId)
			{
				if (shippingId == billingId)
				{
					removeTotal--;
				}
				else
				{
					removeTotal = removeTotal - 2;
				}
			}
			else
			{
				removeTotal--;
			}
		}
		catch (e)
		{
			Library.errorHandler('calculateRemoveTotal', e);
		}
		
		return removeTotal;
	}
	
	return {
		deleteAddresses : deleteExtraAddresses
	};

})(Library);
		
