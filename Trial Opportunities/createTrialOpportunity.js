/***************************************************************************************************************
 * Name: 		Create Trial Opportunity - {createTrialOpportunity.js} 
 * 
 * Script Type:	Scheduled Script
 * 
 * API Version: 1.0
 * 
 * Version:		1.0.0	-	21/12/2016	-	Initial Development	-	DW
 * 				1.0.1	-	11/10/2017	-	Changed the Quantity of the opportunity -	LA		
 * 
 * Author:		FHL
 * 
 * Purpose:		Create opportunity 30 days after a trial sales order is created 
 * 
 * Script:		customscript_createtrialopportunity
 * Deploy:		customdeploy_createtrialopportunity
 * 				
 * Notes: 
 * 
 * Library:		Library.FHL.js
 ****************************************************************************************************************/

var CreateTrialOpportunity = (function()
{
	var QUANTITY_VALUE = null;	//1.0.1
	/**
	 * Entry function
	 * 
	 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
	 * @returns {Void}
	 */
	function createTrialOpportunity(type)
	{
		var orders = [];
		
		var record = null;
		var oppDetails = {};
		
		try
		{
			orders = getSalesOrders();
			
			if (orders && orders.length > 0)
			{
				for (var i = 0; i < orders.length; i++)
				{
					record = nlapiLoadRecord('salesorder', orders[i]);
					
					if (record)
					{
						oppDetails = getOpportunityDetails(record);
					}
					
					if (oppDetails)
					{
						createOpportunity(oppDetails);
					}
				}
			}
		}
		catch (e)
		{
			Library.errorHandler('createTrialOpportunity', e);
		}
	}
	
	/**
	 * Get the trial Sales Orders
	 * 
	 * @scope Private
	 * @return {Array} orders
	 */
	function getSalesOrders()
	{			
		var today = null;
		var createPeriod = null;
		var oppDate = null;
		var filters = [];
		var columns = [];
		var results = [];
		
		var orders = [];
		
		try
		{
			createPeriod = Library.lookUpParameters('salesorder', 'Auto-Create Opportunity (Days)');

			today = new Date();
			oppDate = nlapiAddDays(today, -createPeriod);

			filters = [
			           new nlobjSearchFilter('trandate',null, 'on', nlapiDateToString(oppDate)),
			           new nlobjSearchFilter('mainline', null, 'is', 'T'),
			           new nlobjSearchFilter('type', null, 'anyof', 'SalesOrd'),
			           new nlobjSearchFilter('custbody_opportunity', null, 'is', 'T')
			        ];
			
			columns = [
			           new nlobjSearchColumn('custbody_opportunity')
			        ];
			
			results = nlapiSearchRecord('transaction', null, filters, columns);
			
			if (results)
			{
				for (var i = 0; i < results.length; i++)
				{
					orders[i] = results[i].getId();
				}
			}
		}
		catch (e)
		{
			Library.errorHandler('getSalesOrder', e);
		}
		
		return orders;
	}
	
	/**
	 * Get details for the new Opportunity
	 * 1.0.1 - added leadSource to the information loaded from sales order 
	 *
	 * @scope Private
	 * @param {nlobjRecord} record
	 * @return {Object} details
	 */
	function getOpportunityDetails(record)
	{
		var details = {};
		
		try
		{
			details.salesorder = record.getId();
			details.customer = record.getFieldValue('entity');
			details.leadSource = record.getFieldValue('leadsource');	//1.0.1
			details.items = getItems(record);
			
		}
		catch (e)
		{
			Library.errorHandler('getopportunityDetails', e);
		}
		
		return details;
	}
	
	/**
	 * Gets items off of the Sales Order
	 * 
	 * @scope Private
	 * @param {nlobjRecord} record
	 * @return {Object} items
	 */
	function getItems(record)
	{
		var itemCount = null;
		
		var items = [];
		
		try
		{
			itemCount = record.getLineItemCount('item');
			
			for (var i = 1; i < itemCount + 1; i++)
			{
				record.selectLineItem('item', i);
			
				items[i-1] = {};
				items[i-1].item = record.getCurrentLineItemValue('item', 'item');
				items[i-1].quantity = record.getCurrentLineItemValue('item', 'quantity');
			}
		}
		catch (e)
		{
			Library.errorHandler('getItems', e);
		}
		
		return items;
	}
	
	/**
	 * Creates the Opportunity
	 * 1.0.1 - Added a deployment parameter for the quantity
	 * 		 - leadSource added to the new opportunity
	 * @scope Private
	 * @param {Object} details
	 */
	function createOpportunity(details)
	{		
		var opportunity = null;
		var quantity = 0;
		var lines = null;
		
		try
		{
			QUANTITY_VALUE = Number(Library.lookUpParameters('Search', 'Quantity Value'));	//1.0.1
			lines = details.items;	
			opportunity = nlapiCreateRecord('opportunity');
			
			opportunity.setFieldValue('entity', details.customer);
			opportunity.setFieldValue('custbody_createdfromopp', details.salesorder);
			opportunity.setFieldValue('leadsource', details.leadSource);	//1.0.1
			opportunity.setFieldValue('title', '30 day trial');
			
			for (var i = 0; i < lines.length; i++)
			{
				quantity = lines[i].quantity;
				quantity = quantity * QUANTITY_VALUE;
		
				opportunity.selectNewLineItem('item');
				opportunity.setCurrentLineItemValue('item', 'item', lines[i].item);
				opportunity.setCurrentLineItemValue('item', 'quantity', quantity);
				opportunity.commitLineItem('item');
			}
			
			nlapiSubmitRecord(opportunity);
		}
		catch (e)
		{
			Library.errorHandler('createOpportunity', e);
		}
	}
	
	return {
		scheduled : createTrialOpportunity
	};
	
})(Library);


