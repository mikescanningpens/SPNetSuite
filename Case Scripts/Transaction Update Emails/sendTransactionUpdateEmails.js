/***************************************************************************************************************
 * Name: 		Send Transaction Update Emails - {sendTransactionUpdateEmails.js} 
 * 
 * Script Type:	User Event
 * 
 * API Version: 1.0
 * 
 * Version:		1.0.0	-	12/10/2016	-	Initial Development	-	DW
 * 				1.0.1 	- 	12/12/2016	-	If buyer id has content do not send to default customer address - AT
 * 				1.1.0 	-	19/12/2016	-	Removed hard coded values and re-formatted findBankDetails - DW
 *				1.1.1	-	02/02/2017	-	Added isTrial check for Sales Order emails - DW 
 *				1.2.0	-	14/03/2017	-	Added sendTrialEmail and getRecipientName - Dw
 *				1.3.0	-	07/11/2017	-	Added Send email upon creation of Credit Memo, Quote & Return Authorisation - LA
 *				1.4.0	-	10/11/2017 	-	deals with the Subsidiaries Scanning Pens Corp & Scanning Pens Pty Ltd - BM
 *				1.5.0	-	17/11/2017 	-	Added sendTrialInvoiceEmail for when Trial is checked on an invoice - JG
 *				1.5.1   -   04/12/2017  -   reverted changes made in 1.5.0 and added check for trial - BM
 *				1.5.2 	-  	22/12/2017	- 	Added separate templates for Quote, RMA and credit - AS
 *				1.5.3	-	27/12/2017	-	Added deployment parameters - BM
 *				1.6.0	-	09/04/2018	-	Added check box to override the automatic emails. ML
 *				1.6.1	-	12/04/2018	-	Excluded this running on delete ML
 *
 * Author:		FHL + Mike Lewis Scanning Pens LTD
 * 
 * Purpose:		Send Confirmation emails when specific transactions are sent 
 * 
 * Script:		customscript_sendtransactionemails
 * Deploy:		customdeploy_sendtransactionemails
 * 				
 * Notes: 		Check that the emails send out from this script as it looks like they dont...
 * 
 * Library:		Library.FHL.js
 ****************************************************************************************************************/

var AutomatedTransactionEmails = (function(Library) 
		{

	'use strict';

	var SCANNING_PEN_INC = '6';
	var E_PENS_LTD = '2';
	var SCANNING_PENS_LTD = '3'; 
	var SCANNING_PENS_CORP = null; // 1.4.0 BM
	var SCANNING_PENS_PTY_LTD = null; // 1.4.0 BM

	/**
	 * Entry Function
	 * 
	 * 1.3.0 - Cases added for the new transaction types
	 * 
	 * @param {String} type Operation types: create, edit, delete, xedit,
	 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
	 *                      pack, ship (IF only)
	 *                      dropship, specialorder, orderitems (PO only) 
	 *                      paybills (vendor payments)
	 * @returns {Void}
	 */
	function sendTransactionUpdateEmails(type)
	{
		var transactionType = null;
		var internalId = null;
		var doNotSendEmail = null;
		var needsApproval = null;
		var transactionRecord = null;
		try
		{
			if(type == 'delete')
			{
				// Do nothing
				nlapiLogExecution('DEBUG', 'type = ' + type, 'type = ' + type);
			}
			else
			{
				transactionType = nlapiGetRecordType();
				internalId = nlapiGetRecordId();

				transactionRecord = nlapiLoadRecord(transactionType, internalId);

				doNotSendEmail = transactionRecord.getFieldValue('custbody_do_not_send_email');

				if(transactionType == 'salesorder')
				{
					needsApproval = transactionRecord.getFieldText('orderstatus');
					nlapiLogExecution('DEBUG', 'needsApproval == ', needsApproval);
				}

				if(doNotSendEmail == 'T') //If the do not send email check box is checked, do not send emails.
				{
					// DO NOT SEND EMAILS
					nlapiLogExecution('DEBUG', 'No emails to be sent for ' + transactionType, 'No emails to be sent for: ' + transactionType + ' Internal ID of : ' + internalId);

					if(needsApproval == 'Pending Approval' && transactionType == 'salesorder')
					{
						// Change nothing as it is just pending approval..
						nlapiLogExecution('DEBUG', 'Sales Order is not approved nothing has been initiated...', 'do nothing..');
					}
					else
					{
						// Change the transaction field to false
						transactionRecord.setFieldValue('custbody_do_not_send_email', 'F');
						
						// submit the record
						var submittedRecord = nlapiSubmitRecord(transactionRecord);
						
						//Log the submitted record id and type
						nlapiLogExecution('AUDIT', 'submittedRecord = ' + submittedRecord, 'submittedRecord = ' + submittedRecord + ' Transaction Type = ' + transactionType);
					}

				}
				else
				{

					SCANNING_PENS_CORP = Library.lookUpParameters('emailconfirmation', 'Scanning Pens Corp Id'); //1.5.3 BM
					SCANNING_PENS_PTY_LTD = Library.lookUpParameters('emailconfirmation', 'Scanning Pens Pty Ltd Id'); //1.5.3 BM

					if (type == 'create')
					{				
						switch(transactionType)
						{		
							case "cashsale": // Teste
								handleCashSaleBillEmail();
								break;

							case "invoice": // Teste
								handleInvoiceBillEmail();
								break;

							case "itemfulfillment": // Teste
								handleItemFulfilmentEmail();
								break;
							case "estimate": // Tested
							case "creditmemo": // Teste
							case "returnauthorization": // Teste
								handleTransactionCreationEmail(transactionType);
								break;
						}
					}
					else if (type == 'approve' && transactionType == 'salesorder') // Teste
					{
						handleOrderCreationEmail();
					}
				}

			}

		}
		catch(e)
		{
			Library.errorHandler('sendTransactionUpdateEmails', e);
		}
	}

	/** 
	 * version 1.5.2
	 * 
	 * since 1.3.0
	 * 
	 * @scope Private
	 */
	function handleTransactionCreationEmail(transactionType)
	{
		var convertedTransactionType = '';
		var emailRecipients = null;
		var tranId = null;
		var customerName = null;
		var templateId = null;
		var emailTemplate = null;
		var emailMessage = null;
		var emailSubject = null;
		var mergeResult = null;

		try
		{
			if(transactionType == 'estimate')
			{
				convertedTransactionType = 'Quote';
				templateId = Library.lookUpParameters('emailconfirmation', 'Quote Confirmation Email Template');		//1.5.2 // -- Added in LTD, CORP, PTY LTD, INC Deployment Params
			}
			else if(transactionType == 'creditmemo')
			{
				convertedTransactionType = 'Credit';
				templateId = Library.lookUpParameters('emailconfirmation', 'Credits Confirmation Email Template');		//1.5.2 // -- Added in LTD, CORP, PTY LTD, INC Deployment Params
			}
			else if(transactionType == 'returnauthorization')
			{
				convertedTransactionType = 'Return';
				templateId = Library.lookUpParameters('emailconfirmation', 'RMA Confirmation Email Template');			//1.5.2 // -- Added in LTD, CORP, PTY LTD, INC Deployment Params
			}

			emailRecipients = retrieveEmailRecipients(transactionType);
			tranId = nlapiLookupField('transaction', nlapiGetRecordId(), 'tranid');
			customerName = getRecipientName();

			emailTemplate = nlapiCreateEmailMerger(templateId);
			mergeResult = emailTemplate.merge();

			emailMessage = mergeResult.getBody();
			//emailMessage = emailMessage.replace('[TRANSACTION_NUMBER]', tranId);
			emailMessage = emailMessage.split('[TRANSACTION_NUMBER]').join(tranId);
			emailMessage = emailMessage.replace('[CUSTOMER_NAME]', customerName);
			emailSubject = mergeResult.getSubject();
			emailSubject = emailSubject.replace('[TRANSACTION_TYPE]', convertedTransactionType);

			sendEmailToContact(emailSubject, emailMessage, emailRecipients);
		}
		catch(e)
		{
			Library.errorHandler('handleTransactionCreationEmail', e);
		}
	}

	/**
	 * Handles the creation of a Sales Order Confirmation email
	 * 
	 * 1.1.0 - Removed hard coded values
	 * 1.1.1 - Added isTrial check
	 * 
	 * @scope Private
	 */
	function handleOrderCreationEmail()
	{
		var emailRecipients = null;
		var tranId = null;
		var customerName = null;
		var isTrial = null;
		var templateId = null;
		var emailTemplate = null;
		var emailMessage = null;
		var emailSubject = null;
		var mergeResult = null;

		try
		{

			emailRecipients = retrieveEmailRecipients('salesorder');
			tranId = nlapiLookupField('transaction', nlapiGetRecordId(), 'tranid');
			customerName = getRecipientName();

			// 1.1.1
			isTrial = nlapiGetFieldValue('custbody_opportunity');

			if (isTrial == 'T')
			{
				templateId = Library.lookUpParameters('emailconfirmation', 'Sales Order Trial Email Template'); // TODO This does not exist in the system???

				// Send different Trial email to Buyer/Customer
				sendTrialEmail(emailRecipients[0], tranId);

				// Remove Buyer/Customer from recipients so they arn't sent two emails
				emailRecipients.splice(0, 1);
			}
			else 
			{
				templateId = Library.lookUpParameters('emailconfirmation', 'Sales Order Email Template');
			}

			emailTemplate = nlapiCreateEmailMerger(templateId); // TODO The templateId (Sales Order Trial Email Template) above does not exist
			mergeResult = emailTemplate.merge();

			emailMessage = mergeResult.getBody();
			emailMessage = emailMessage.replace('[TRANSACTION_NUMBER]', tranId);
			emailMessage = emailMessage.replace('[CUSTOMER_NAME]', customerName);
			emailSubject = mergeResult.getSubject();

			sendEmailToContact(emailSubject, emailMessage, emailRecipients);
		}
		catch(e)
		{
			Library.errorHandler('handleOrderCreationEmail', e);
		}
	}

	/**
	 * Sends a different email to the Buyer/Customer
	 * 
	 * @since 1.2.0
	 * @scope Private
	 * @param {String} recipient
	 * @param {String} tranId
	 * @return {Void}
	 */
	function sendTrialEmail(recipient, tranId)
	{
		var templateId = null;
		var emailTemplate = null;
		var mergeResult = null;
		var emailMessage = null;
		var emailSubject = null;
		var recipientName = null;
		var itemName = null;

		try
		{
			templateId = Library.lookUpParameters('emailconfirmation', 'Buyer Trial Email Template'); // --
			recipientName = getRecipientName();
			itemName = nlapiGetLineItemText('item', 'item', 1);

			if (templateId)
			{
				emailTemplate = nlapiCreateEmailMerger(templateId);
				mergeResult = emailTemplate.merge();
			}

			if (emailTemplate)
			{
				emailMessage = mergeResult.getBody();
				emailMessage = emailMessage.replace('[CUSTOMER_NAME]', recipientName);
				emailMessage = emailMessage.replace('[ITEM_NAME]', itemName);
				emailMessage = emailMessage.replace('[TRANSACTION_NUMBER]', tranId);
				emailSubject = mergeResult.getSubject();

				sendEmailToContact(emailSubject, emailMessage, recipient);
			}
		}
		catch (e)
		{
			Library.errorHandler('sendTrailEmail', e);
		}
	}

	/**
	 * Gets a recipient name to put at the beginning of an email
	 * 
	 * @since 1.2.0
	 * @scope Private
	 * 
	 * @return {String} recipientName
	 */
	function getRecipientName()
	{
		var recipientId = null;		
		var recipientName = null;

		try
		{
			recipientId = nlapiGetFieldValue('custbody_contactbuyer');

			if (!recipientId)
			{
				recipientId = nlapiGetFieldValue('entity');
				recipientName = nlapiLookupField('customer', recipientId, 'companyname');
			}
			else 
			{
				recipientName = nlapiLookupField('contact', recipientId, 'firstname');
			}

		}
		catch (e)
		{
			Library.errorHandler('getRecipientName', e);
		}

		return recipientName;
	}

	/**
	 * Handles the creation of a Cash Sale Confirmation email
	 * 
	 * 1.1.0 - Removed hard coded values
	 * 
	 * @scope Private
	 */
	function handleCashSaleBillEmail()
	{
		var emailRecipients = null;
		var tranId = null;
		var customerName = null;
		var templateId = null;
		var emailTemplate = null;
		var emailMessage = null;
		var emailSubject = null;
		var mergeResult = null;

		try
		{
			emailRecipients = retrieveEmailRecipients('cashsale');
			tranId = nlapiLookupField('transaction', nlapiGetRecordId(), 'tranid');
			customerName = getRecipientName();

			templateId = Library.lookUpParameters('emailconfirmation', 'Cash Sale Email Template'); // --
			emailTemplate = nlapiCreateEmailMerger(templateId);
			mergeResult = emailTemplate.merge();

			emailMessage = mergeResult.getBody();
			emailMessage = emailMessage.replace('[TRANSACTION_NUMBER]', tranId);
			emailMessage = emailMessage.replace('[CUSTOMER_NAME]', customerName);
			emailSubject = mergeResult.getSubject();

			sendEmailToContact(emailSubject, emailMessage, emailRecipients);
		}
		catch(e)
		{
			Library.errorHandler('handleCashSaleBillEmail', e);
		}
	}

	/**
	 * Handles the creation of an Invoice Confirmation email
	 * 
	 * 1.1.0 - Now use subsidiary/currency id rather than name
	 * 		   Removed hard coded values
	 * 
	 * 1.5.1 - added function call on trial checkbox
	 * 
	 * @scope Private
	 */
	function handleInvoiceBillEmail()
	{
		var emailRecipients = null;
		var tranId = null;
		var customerName = null;
		var record = null;

		var currencyUsed = null;
		var subsidiary = null;

		var address = null;
		var bankDetails = null;
		var contactName = null;

		var emailSubject = null;
		var templateId = null;
		var emailMessage = null;


		var isTrial = null;

		try
		{
			emailRecipients = retrieveEmailRecipients('invoice');
			tranId = nlapiLookupField('transaction', nlapiGetRecordId(), 'tranid');
			customerName = getRecipientName();

			record = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
			currencyUsed = record.getFieldValue("currency");
			subsidiary = record.getFieldValue("subsidiary");

			address = findAddress(subsidiary);
			bankDetails = findBankDetails(subsidiary, currencyUsed);
			contactName = getRecipientName();

			emailSubject = 'Scanning Pens Invoice';

			//1.5.1 - BM	
			isTrial = nlapiGetFieldValue('custbody_opportunity');
			if (isTrial == 'T')
			{
				templateId = Library.lookUpParameters('emailconfirmation', 'Invoice Trial Email Template'); // -- Added in LTD, CORP, PTY LTD, INC Deployment Params
			}
			else
			{
				templateId = Library.lookUpParameters('emailconfirmation', 'Invoice Email Template'); // -- Added in LTD, CORP, PTY LTD, INC Deployment Params
			}

			emailMessage = nlapiLoadFile(templateId);

			if (emailMessage && address && bankDetails)
			{
				emailMessage = emailMessage.getValue();
				emailMessage = emailMessage.replace('[ADDRESS]', address);
				emailMessage = emailMessage.replace('[BANK_DETAILS]', bankDetails);
				emailMessage = emailMessage.replace('[TRANSACTION_NUMBER]', tranId);

				if (subsidiary == SCANNING_PENS_LTD)
				{
					emailMessage = emailMessage.replace('[CHEQUES]', 'checks');
				}
				else
				{
					emailMessage = emailMessage.replace('[CHEQUES]', 'cheques');
				}

				if (contactName)
				{
					emailMessage = emailMessage.replace('[CONTACT_FIRST_NAME]', contactName);
				}
				else 
				{
					emailMessage = emailMessage.replace('[CONTACT_FIRST_NAME]', '');
				}

				sendEmailToContact(emailSubject, emailMessage, emailRecipients);
			}
		}
		catch(e)
		{
			Library.errorHandler('handleInvoiceBillEmail', e);
		}
	}

	/**
	 * Determines what bank details to use
	 * 
	 * 1.1.0 - Now use subsidiary/currency id rather than name
	 * 1.4.0 - deal with Scanning Pens Corp & Scanning Pens Pty Ltd - BM
	 * 
	 * @scope Private
	 * @param {Number} subsidiary 
	 * @param {Number} currency
	 * @return {String} bankDetails 
	 */
	function findBankDetails(subsidiary, currency)
	{		
		var SCANNING_PENS_LTD = 6;

		var subsidiaryName = null;
		var currencyName = null;

		var bankDetails = null;

		try
		{
			if (subsidiary == SCANNING_PENS_LTD)
			{
				bankDetails = Library.lookUpParameters('emailconfirmation', 'Scanning Pens Inc Bank Details');
			}
			else if(subsidiary == SCANNING_PENS_CORP)// 1.4.0 BM
			{
				bankDetails = Library.lookUpParameters('emailconfirmation', 'Scanning Pens Corp Bank details');
			}
			else if(subsidiary == SCANNING_PENS_PTY_LTD)// 1.4.0 BM
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
	 * 1.1.0 - Now use subsidiary id rather than name
	 * 1.4.0 - deal with Scanning Pens Corp & Scanning Pens Pty Ltd - BM
	 * 
	 * @scope Private
	 * @param {Number} subsidiary
	 * @return {String} address
	 */
	function findAddress(subsidiary)
	{	
		var address = null;

		try
		{			
			switch (subsidiary)
			{
				case SCANNING_PEN_INC:
					address = Library.lookUpParameters('emailconfirmation', 'Scanning Pens Inc Address');
					break;
				case E_PENS_LTD:
					address = Library.lookUpParameters('emailconfirmation', 'E-Pens Ltd Address');
					break;
				case SCANNING_PENS_LTD:
					address = Library.lookUpParameters('emailconfirmation', 'Scanning Pens Ltd Address');
					break;
				case SCANNING_PENS_CORP:// 1.4.0 BM
					address = Library.lookUpParameters('emailconfirmation', 'Scanning Pens Corp Address');
					break;
				case SCANNING_PENS_PTY_LTD:// 1.4.0 BM
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
	 * Handles the creation of a Item Fulfillment Confirmation email
	 * 
	 * @scope Private
	 */
	function handleItemFulfilmentEmail()
	{
		var emailRecipients = null;
		var customerName = null;
		var tranId = null;
		var templateId = null;
		var emailTemplate = null;
		var emailMessage = null;
		var emailSubject = null;
		var mergeResult = null;

		try
		{
			emailRecipients = retrieveEmailRecipients('fulfill');
			tranId = nlapiLookupField('transaction', nlapiGetRecordId(), 'tranid');
			customerName = getRecipientName();

			templateId = Library.lookUpParameters('emailconfirmation', 'Item Fulfilment Email Template'); // -- Added in LTD, CORP, PTY LTD, INC Deployment Params
			emailTemplate = nlapiCreateEmailMerger(templateId);
			mergeResult = emailTemplate.merge();

			emailMessage = mergeResult.getBody();
			emailMessage = emailMessage.replace('[TRANSACTION_NUMBER]', tranId);
			emailMessage = emailMessage.replace('[CUSTOMER_NAME]', customerName);
			emailSubject = mergeResult.getSubject();

			sendEmailToContact(emailSubject, emailMessage, emailRecipients);
		}
		catch(e)
		{
			Library.errorHandler('handleItemFulfilmentEmail', e);
		}
	}

	/**
	 * Retrieves all available email recipients
	 * 1.0.1 - If buyer id has content do not send to default customer address.
	 * 1.3.0 - Added new Transaction types
	 * @scope Private
	 * @param {String} type - Record type
	 */
	function retrieveEmailRecipients(type)
	{
		var emailRecipients = [];
		var buyerId = null;
		var customerEmail = null;
		var buyerEmail = null;
		var financeId = null;
		var financeEmail = null;
		var warehouseId = null;
		var warehouseEmail = null;
		var customerId = null;

		try
		{
			customerId = nlapiGetFieldValue('entity');
			buyerId = nlapiGetFieldValue('custbody_contactbuyer');

			if (buyerId)
			{
				buyerEmail = nlapiLookupField('contact', buyerId, 'email');
				emailRecipients.push(buyerEmail);
			}
			else //1.0.1 - If buyer id has content do not send to default customer address.
			{
				customerEmail = nlapiLookupField('customer', customerId, 'email');
				emailRecipients.push(customerEmail);
			}


			if (type == 'invoice' || type == 'cashsale' || type == 'salesorder' || type == 'estimate' || type == 'creditmemo')
			{
				financeId = nlapiGetFieldValue('custbody_contactfinance');
				if (financeId)
				{
					financeEmail = nlapiLookupField('contact', financeId, 'email');
					emailRecipients.push(financeEmail);
				}
			}

			if (type == 'fulfill' || type == 'salesorder' || type == 'returnauthorization')
			{
				warehouseId = nlapiGetFieldValue('custbody_contactwarehouse');
				if (warehouseId)
				{
					warehouseEmail = nlapiLookupField('contact', warehouseId, 'email');
					emailRecipients.push(warehouseEmail);
				}
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
	 * 1.1.0 - Removed hard coded author id
	 * 
	 * @scope Private
	 * @param {String} emailSubject
	 * @param {String} emailMessage
	 * @param {Array} emailRecipients
	 */
	function sendEmailToContact(emailSubject, emailMessage, emailRecipients)
	{
		var confirmationPDF = null;
		var recordId = null;
		var author = null;
		var bccAddress = null;

		try
		{			
			confirmationPDF = nlapiPrintRecord('TRANSACTION', nlapiGetRecordId(), 'PDF');
			recordId = nlapiGetRecordId();

			author = Library.lookUpParameters('emailconfirmation', 'Order Confirmation Emails Author');
			bccAddress = Library.lookUpParameters('emailconfirmation', 'BCC Address');

			// Send email using parameters passed into function using nlapiSendEmail
			nlapiSendEmail(author, emailRecipients, emailSubject, emailMessage, null, bccAddress, {transaction: recordId}, confirmationPDF); //TODO Errors here - no email address in contact?
		}
		catch(e)
		{
			Library.errorHandler('sendEmailToContact', e);
		}
	}

	return {
		afterSubmit: sendTransactionUpdateEmails
	};
		})(Library);