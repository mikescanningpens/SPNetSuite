/****************************************************************************
 * Name			: Phone Call Date (phoneCallUserEvent.js)
 *
 * Script Type	: User Event
 * 
 * Client		: TJSC
 * 
 * Version		: 1.0.0		-	16/02/2018	-	Initial Development - Mike Lewis
 * 				  1.1.0		-	04/04/2018	-	Changed to using custom records (Locked records cannot have fields edited
 * 
 * Author		: Mike Lewis Scanning Pens
 * 
 * Script		: customscript_phone_call_date
 * 
 * Deploy		: customdeploy_phone_call_date
 * 
 * Purpose		: update the transactions last phone call date field.
 * 
 * Notes		:		
 *
 * Library		: Library.FHL.js
 ******************************************************************************/
/**
 * @returns {Boolean} True to continue save, false to abort save
 */

/**
 * @scope public
 * @since 1.0.0
 * @returns {Boolean} returnValue - True to save phone call, false to abort save
 */

function ueSavePhoneRecord()
{

	var status = null;
	var transactionId = null;
	var dateCompleted = null;
	var voicemail = null;
	var transactionType = null;
	var record = null;
	var customPhoneDateRecord = null;

	try
	{
		record = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
		status = record.getFieldValue('status');
		voicemail = record.getFieldValue('custevent_answer_phone');


		if(status == 'COMPLETE' && voicemail == 'F') // Checks to make sure that the phone call is complete and that is does not have the voicemail checkbox checked
		{
			transactionId = record.getFieldValue('transaction'); // Internal id of the opp
			dateCompleted = record.getFieldValue('completeddate'); // Completed date of phone call.
			transactionType = record.getFieldValue('custevent_associated_tran_type'); // Transaction type

			nlapiLogExecution('DEBUG', 'transactionType: ' + transactionType, 'transactionType: ' + transactionType);
			nlapiLogExecution('DEBUG', 'dateCompleted: ' + dateCompleted, 'dateCompleted: ' + dateCompleted);
			nlapiLogExecution('DEBUG', 'transactionId: ' + transactionId, 'transactionId: ' + transactionId);

			if(transactionType == 'Sales Order' || transactionType == 'Opportunity' || transactionType == 'Quote' || transactionType == 'Invoice') // Only update field for Sales Orders / Quotes / Opportunities / Invoices
			{

				switch (transactionType) // Formats the transaction types - e.g. Quote is known to the system as estimate etc.
				{
					case 'Quote':
						transactionType = 'estimate';
						break;
					case 'Sales Order':
						transactionType = 'salesorder';
						break;
					case 'Opportunity':
						transactionType = 'opportunity';
						break;
					case 'Invoice':
						transactionType = 'invoice';
						break;

					default:
						nlapiLogExecution('DEBUG', 'Switch statement - transactionType: ' + transactionType, 'transactionType: ' + transactionType);
					break;
				}

				if(transactionId && dateCompleted && transactionType) // Make sure no blank values
				{
					try
					{
						var filters = null;

						if(transactionType == 'opportunity') // Look up a different field for opportunity as it is not a transaction type!
						{
							filters = ["custrecord_opportunity.internalid","anyof", transactionId];
						}
						else
						{
							filters = ["custrecord_transaction.internalid","anyof", transactionId];
						}

						var columns = [ 
						               new nlobjSearchColumn('custrecord_last_phone_call_date'),
						               new nlobjSearchColumn('custrecord_transaction')
						               ];

						var results = nlapiSearchRecord('customrecord_last_phone_call', null, filters, columns);

						if (results) // If there are any results found, update it instead of creating new ones
						{
							var customRecordPhoneCallDate = results[0]; //Will only be 1 result!
							var lastPhoneCallDate = customRecordPhoneCallDate.getValue('custrecord_last_phone_call_date');
							lastPhoneCallDate = nlapiStringToDate(lastPhoneCallDate);
							nlapiLogExecution('DEBUG', lastPhoneCallDate, lastPhoneCallDate);
							var internalId = customRecordPhoneCallDate.getId();
							nlapiSubmitField('customrecord_last_phone_call', internalId, 'custrecord_last_phone_call_date', dateCompleted);
						}
						else // Create the new last phone call custom record if there are no results
						{

							customPhoneDateRecord = nlapiCreateRecord('customrecord_last_phone_call');
							customPhoneDateRecord.setFieldValue('custrecord_last_phone_call_date', nlapiStringToDate(dateCompleted));

							if(transactionType == 'opportunity')
							{
								customPhoneDateRecord.setFieldValue('custrecord_opportunity', transactionId);
							}
							else
							{
								customPhoneDateRecord.setFieldValue('custrecord_transaction', transactionId);
							}

							var submittedRecord = nlapiSubmitRecord(customPhoneDateRecord);


							nlapiLogExecution('DEBUG', 'submittedRecord : ' + submittedRecord, 'submittedRecord : ' + submittedRecord);
						}
					}
					catch(err)
					{
						nlapiLogExecution('ERROR', 'Couldn\'t create custom record or update',err.message);
					}
				}
				else
				{
					nlapiLogExecution('DEBUG', 'Blank value detected... transactionId: ' + transactionId + ' dateCompleted:' + dateCompleted, 'transactionType: ' + transactionType);
				}
			}
			else
			{
				nlapiLogExecution('DEBUG', 'No date update for: ' + transactionType, 'transactionType: ' + transactionType);
			}

		}
		else
		{
			nlapiLogExecution('DEBUG', 'status: ' + status, 'voicemail: ' + voicemail);
		}
	}
	catch(e)
	{
		Library.errorHandler('validateSalesOrder', e);
	}

	return true;
}
