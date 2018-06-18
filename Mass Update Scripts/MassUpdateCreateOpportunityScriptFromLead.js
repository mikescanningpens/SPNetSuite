/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       17 Jan 2018     mikelewis		   Create Trial Opportunities from Mass Update of Sales Orders
 *
 */

	var QUANTITY_VALUE = null;	//1.0.1
	var context = null;
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
					context = nlapiGetContext();
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
			details.internalId = record.getId();
			details.leadSource = context.getSetting('SCRIPT', 'custscript_lead_source');
			details.title = context.getSetting('SCRIPT', 'custscript_opportunity_title');
			
		}
		catch (e)
		{
			Library.errorHandler('getOpportunityDetails', e);
		}
		
		return details;
	}
	
	/**
	 * Creates the Opportunity
	 * @scope Private
	 * @param {Object} details
	 */
	
	function createOpportunity(details)
	{		
		var opportunity = null;
		
		try
		{
			opportunity = nlapiCreateRecord('opportunity');
			
			opportunity.setFieldValue('entity', details.internalId);
			opportunity.setFieldValue('leadsource', details.leadSource); // Updated for script parameter
			opportunity.setFieldValue('title', details.title);
			opportunity.setFieldValue('custbody_project_opportunity_cb', 'T'); // Segmentation to find out which are project opportunities.
			
			nlapiSubmitRecord(opportunity);
		}
		catch (e)
		{
			Library.errorHandler('createOpportunity', e);
		}
	}

