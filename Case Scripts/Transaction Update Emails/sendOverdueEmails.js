/***************************************************************************************************************
 * Name: 		Send Overdue Invoice Emails - {sendOverdueEmails.js} 
 * 
 * Script Type:	Scheduled Script
 * 
 * API Version: 1.0
 * 
 * Version:		1.0.0	-	19/12/2016	-	Initial Development	-	DW
 * 				1.0.1	-	25/10/2017	-	Put try catch around the field submit to account for locked records, and a check governance- LA
 * 				1.1.0   -	10/11/2017	-	deals with the Subsidiaries Scanning Pens Corp & Scanning Pens Pty Ltd - BM
 * 				1.1.1	-	21/11/2017	-	Changes the date range of the overdue invoice field search - LA
 * 				1.1.2	-	27/12/2017	-	Added deployment parameters - BM
 * 
 * Author:		FHL
 * 
 * Purpose:		Send alert emails when invoice payment is overdue 
 * 
 * Script:		customscript_sendoverdueemails
 * Deploy:		customdeploy_sendoverdueemails
 * 				
 * Notes: 
 * 
 * Library:		Library.FHL.js
 ****************************************************************************************************************/

var SendOverdueEmails = (function(Library)
{
	'use strict';
	
	var SCANNING_PENS_INC = '6';
	var E_PENS_LTD = '2';
	var SCANNING_PENS_LTD = '3';
	var SCANNING_PENS_CORP = null; // 1.1.0 BM
	var SCANNING_PENS_PTY_LTD = null; // 1.1.0 BM
	
	/**
	 * Entry Function
	 * 1.0.1 - Put a try catch around the field submit, and check 
	 * 
	 * @scope Public
	 * @param {String} type Context Types: scheduled, ondemand, userinterface, aborted, skipped
	 */
	function sendOverdueEmails(type) 
	{
		var today = null;
		var overdueInvoices = null;
		var stillOverdueInvoices = null;
		var invoices = null;
		
		try
		{
			SCANNING_PENS_CORP = Library.lookUpParameters('emailconfirmation', 'Scanning Pens Corp Id'); //1.1.2 BM
			SCANNING_PENS_PTY_LTT = Library.lookUpParameters('emailconfirmation', 'Scanning Pens Pty Ltd Id'); //1.1.2 BM
			
			overdueInvoices = getOverdueInvoices();
			stillOverdueInvoices = getStillOverdueInvoices();
			
			invoices = overdueInvoices.concat(stillOverdueInvoices);
			if (invoices)
			{
				today = new Date();
				today = nlapiDateToString(today);
				
				invoices = formatResults(invoices);

				for (var i = 0; i < invoices.length; i++)
				{
					//1.0.1
					Library.checkGovernance();
					handleOverdueEmail(invoices[i]);
					//1.0.1
					try
					{
						nlapiSubmitField('invoice', invoices[i].id, 'custbody_overdueemaildate', today);
					}
					catch(e)
					{
						Library.errorHandler('SubmitField', e);
					}
				}
			}
		}
		catch (e)
		{
			Library.errorHandler('sendOverdueEmails', e);
		}
	}
	
	/**
	 * Gets invoices that were due yesterday
	 * 
	 * @scope Private
	 * @return {Array} results
	 */
	function getOverdueInvoices()
	{
		var filters = [];
		var columns = [];
		var results = [];
		
		try
		{	
			
			filters = [
			           new nlobjSearchFilter('duedate', null, 'on', 'yesterday'),
			           new nlobjSearchFilter('type', null, 'anyof', 'CustInvc'),
			           new nlobjSearchFilter('status', null, 'noneof', 'CustInvc:B'),
			           new nlobjSearchFilter('mainline', null, 'is', 'T'),
			        ];
			
			columns = [
			           new nlobjSearchColumn('tranid'),
			           new nlobjSearchColumn('custbody_contactbuyer'),
			           new nlobjSearchColumn('entity'),
			           new nlobjSearchColumn('custbody_contactfinance'),
			           new nlobjSearchColumn('currency'),
			           new nlobjSearchColumn('subsidiary')
			        ];
			
			results = nlapiSearchRecord('transaction', null, filters, columns);
			
			if (!results)
			{
				results = [];
			}
		}
		catch (e)
		{
			Library.errorHandler('getOverdueInvoices', e);
		}
		
		return results;
	}
	
	/**
	 * Gets invoices that are due for another overdue email
	 * 
	 * @scope Private
	 * @return {Array} results
	 */
	function getStillOverdueInvoices()
	{
		var filters = [];
		var columns = [];
		var results = [];
		
		try
		{
			date = new Date();
			date.setDate(date.getDate() - 7);
			nlapiLogExecution("debug", "date", JSON.stringify(date));
			filters = [
			           new nlobjSearchFilter('custbody_overdueemaildate', null, 'within', 'previousoneweek'), // 1.1.1
			           new nlobjSearchFilter('type', null, 'anyof', 'CustInvc'),
			           new nlobjSearchFilter('status', null, 'noneof', 'CustInvc:B'),
			           new nlobjSearchFilter('mainline', null, 'is', 'T'),
			        ];
			
			columns = [
			           new nlobjSearchColumn('tranid'),
			           new nlobjSearchColumn('custbody_contactbuyer'),
			           new nlobjSearchColumn('entity'),
			           new nlobjSearchColumn('custbody_contactfinance'),
			           new nlobjSearchColumn('currency'),
			           new nlobjSearchColumn('subsidiary')
			        ];
			
			results = nlapiSearchRecord('transaction', null, filters, columns);
			
			if (!results)
			{
				results = [];
			}
		}
		catch (e)
		{
			Library.errorHandler('getStillOverdueInvoices', e);
		}
		
		return results;
	}
	
	/**
	 * formats the search results in to an easier to use object
	 * 
	 * @scope Private
	 * @param {Array} results
	 * @return {Array} invoices
	 */
	function formatResults(results)
	{
		var invoices = [];
		
		try
		{
			for (var i = 0; i < results.length; i++)
			{
				invoices[i] = {};
				
				invoices[i].id = results[i].getId();
				invoices[i].tranid = results[i].getValue('tranid');
				invoices[i].buyer = results[i].getValue('custbody_contactbuyer');
				invoices[i].customer = results[i].getValue('entity');
				invoices[i].finance = results[i].getValue('custbody_contactfinance');
				invoices[i].currency = results[i].getValue('currency');
				invoices[i].subsidiary = results[i].getValue('subsidiary');
			}
		}
		catch (e)
		{
			Library.errorHandler('formatResults', e);
		}
		
		return invoices;
	}
	
	/**
	 * Handles the creation of an Invoice Confirmation email
	 * 
	 * @scope Private
	 * @param {Object} invoice
	 */
	function handleOverdueEmail(invoice)
	{
		var emailRecipients = null;
		
		var subsidiary = null;
		
		var address = null;
		var bankDetails = null;
		var contactName = null;
		
		var emailSubject = null;
		var templateId = null;
		var emailMessage = null;
		
		try
		{
			emailRecipients = retrieveEmailRecipients(invoice);

			address = findAddress(invoice.subsidiary);
			bankDetails = findBankDetails(invoice.subsidiary, invoice.currency);
			
			emailSubject = 'Scanning Pens Overdue Invoice';
			templateId = Library.lookUpParameters('emailconfirmation', 'Overdue Email Email Template');
			emailMessage = nlapiLoadFile(templateId);
			
			if (emailMessage && address && bankDetails)
			{
				emailMessage = emailMessage.getValue();
				emailMessage = emailMessage.replace('[ADDRESS]', address);
				emailMessage = emailMessage.replace('[BANK_DETAILS]', bankDetails);
				emailMessage = emailMessage.replace('[INVOICE_NUMBER]', invoice.tranid);
				
				if (subsidiary == SCANNING_PENS_LTD)
				{
					emailMessage = emailMessage.replace('[CHEQUES]', 'checks');
				}
				else
				{
					emailMessage = emailMessage.replace('[CHEQUES]', 'cheques');
				}
				
				if (invoice.buyer)
				{
					contactName = nlapiLookupField('contact', invoice.buyer, 'firstname');
					emailMessage = emailMessage.replace('[CONTACT_FIRST_NAME]', contactName);
				}
				else 
				{
					emailMessage = emailMessage.replace('[CONTACT_FIRST_NAME]', '');
				}
				
				sendEmailToContact(emailSubject, emailMessage, emailRecipients, invoice.id);
			}
			
		}
		catch(e)
		{
			Library.errorHandler('handleOverdueEmail', e);
		}
	}
	
	/**
	 * Determines what bank details to use
	 * 
	 * 1.1.0 - deal with Scanning Pens Corp & Scanning Pens Pty Ltd - BM
	 * 
	 * @scope Private
	 * @param {Number} subsidiary 
	 * @param {Number} currency
	 * @return {String} bankDetails 
	 */
	function findBankDetails(subsidiary, currency)
	{				
		var subsidiaryName = null;
		var currencyName = null;
		
		var bankDetails = null;
		
		try
		{
			if (subsidiary == SCANNING_PENS_INC)
			{
				bankDetails = Library.lookUpParameters('emailconfirmation', 'Scanning Pens Inc Bank Details');
			}
			else if(subsidiary == SCANNING_PENS_CORP)// 1.1.0 BM
			{
				bankDetails = Library.lookUpParameters('emailconfirmation', 'Scanning Pens Corp Bank details');
			}
			else if(subsidiary == SCANNING_PENS_PTY_LTD)// 1.1.0 BM
			{
				bankDetails = Library.lookUpParameters('emailconfirmation', 'Scanning Pens Pty Ltd Bank details');
			}
			else
			{
				subsidiaryName = nlapiLookupField('subsidiary', subsidiary, 'legalname');
				currencyName = nlapiLookupField('currency', currency, 'name');

				if (subsidiaryName && currencyName)
				{
					bankDetails = Library.lookUpParameters('emailconfirmation', subsidiaryName + ' + ' + currencyName + ' Bank Details');	
				}
			}
			
			bankDetails = bankDetails.replace(/\[BRK\]/g, '<br>');
		}
		catch (e)
		{
			Library.errorHandler('findBankDetails', e);
		}
		
		return bankDetails;
	}
	
	/**
	 * Determines what address to use
	 * 
	 * 1.1.0 - deal with Scanning Pens Corp & Scanning Pens Pty Ltd - BM
	 * 
	 * @scope Private
	 * @param {String} subsidiary
	 * @return {String} address
	 */
	function findAddress(subsidiary)
	{ 	
		var address = null;
		
		try
		{			
			switch (subsidiary)
			{
				case SCANNING_PENS_INC:
					address = Library.lookUpParameters('emailconfirmation', 'Scanning Pens Inc Address');
					break;
				case E_PENS_LTD:
					address = Library.lookUpParameters('emailconfirmation', 'E-Pens Ltd Address');
					break;
				case SCANNING_PENS_LTD:
					address = Library.lookUpParameters('emailconfirmation', 'Scanning Pens Ltd Address');
					break;
				case SCANNING_PENS_CORP:// 1.1.0 BM
					address = Library.lookUpParameters('emailconfirmation', 'Scanning Pens Corp Address');
					break;
				case SCANNING_PENS_PTY_LTD:// 1.1.0 BM
					address = Library.lookUpParameters('emailconfirmation', 'Scanning Pens Pty Ltd Address');
					break;
			}

			address = address.replace(/\[BRK\]/g, '<br>');
			
		}
		catch (e)
		{
			Library.errorHandler('findAddress', e);
		}
		
		return address;
	}
	
	/**
	 * Retrieves all available email recipients
	 * 
	 * @scope Private
	 * @param {Object} invoice
	 * @return {Array} emailRecipients
	 */
	function retrieveEmailRecipients(invoice)
	{
		var emailRecipients = [];
		var customerEmail = null;
		var buyerEmail = null;
		var financeEmail = null;
		
		try
		{	
			if (invoice.buyer)
			{
				buyerEmail = nlapiLookupField('contact', invoice.buyer, 'email');
				emailRecipients.push(buyerEmail);
			}
			else
			{
				customerEmail = nlapiLookupField('customer', invoice.customer, 'email');
				emailRecipients.push(customerEmail);
			}
						
			if (invoice.finance)
			{
				financeEmail = nlapiLookupField('contact', invoice.finance, 'email');
				emailRecipients.push(financeEmail);
			}
		}
		catch(e)
		{
			Library.errorHandler('retrieveEmailRecipients', e);
		}
		
		return emailRecipients;
	}
	
	/**
	 * Send the confirmation email with the given details
	 * 
	 * @scope Private
	 * @param {String} emailSubject
	 * @param {String} emailMessage
	 * @param {Array} emailRecipients
	 * @param {Number} invoiceid
	 */
	function sendEmailToContact(emailSubject, emailMessage, emailRecipients, invoiceid)
	{
		var confirmationPDF = null;
		var author = null;
		var bccAddress = null;
		
		try
		{			
			confirmationPDF = nlapiPrintRecord('TRANSACTION', invoiceid, 'PDF');
			
			author = Library.lookUpParameters('emailconfirmation', 'Order Confirmation Emails Author');
			bccAddress = Library.lookUpParameters('emailconfirmation', 'BCC Address');
						
			// Send email using parameters passed into function using nlapiSendEmail
			nlapiSendEmail(author, emailRecipients, emailSubject, emailMessage, null, bccAddress, {transaction: invoiceid}, confirmationPDF);
		}
		catch(e)
		{
			Library.errorHandler('sendEmailToContact', e);
		}
	}
	
	return {
		scheduled : sendOverdueEmails
	};
	
})(Library);


