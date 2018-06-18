/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       17 Jan 2018     mikelewis		   Create Trial Opportunities from Mass Update of Sales Orders
 *
 */

	var QUANTITY_VALUE = null;	//1.0.1
	/**
	 * Entry function
	 * 
	 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
	 * @returns {Void}
	 */


	function createTrialOpportunityEntry(recordType,recordId)
	{
		try
		{
					var record = null;
			
					record = nlapiLoadRecord(recordType, recordId);
					
					if (record)
					{
						oppDetails = getOpportunityDetails(record);
					}
					
					if (oppDetails)
					{
						createOpportunity(oppDetails);
					}
		}
		catch (e)
		{
			Library.errorHandler('createTrialOpportunityEntry', e);
			return true;
		}
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
			details.customer = record.getFieldValue('entity'); // Company Name
			details.leadSource = record.getFieldValue('leadsource');	//1.0.1
			details.items = getItems(record);
			
		}
		catch (e)
		{
			Library.errorHandler('getOpportunityDetails', e);
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

