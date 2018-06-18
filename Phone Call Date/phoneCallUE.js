/****************************************************************************
 * Name			: Phone Call Date (phoneCallUserEvent.js)
 *
 * Script Type	: User Event
 * 
 * Client		: TJSC
 * 
 * Version		: 1.0.0		-	16/02/2018	-	Initial Development - Mike Lewis
 * 
 * Author		: Mike Lewis Scanning Pens
 * 
 * Script		: customscript_phone_call_date
 * 
 * Deploy		: customdeploy_phone_call_date
 * 
 * Purpose		: update the opportunity last phone call date field.
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
	try
	{
		status = nlapiGetFieldValue('status');
		voicemail = nlapiGetFieldValue('custevent_answer_phone');


		if(status == 'COMPLETE' && voicemail == 'F')
		{
			transactionId = nlapiGetFieldValue('transaction'); // Internal id of the opp
			dateCompleted = nlapiGetFieldValue('completeddate'); // Completed date of phone call.
			transactionType = nlapiGetFieldValue('custevent_associated_tran_type'); // Transaction type

			nlapiLogExecution('DEBUG', 'transactionType: ' + transactionType, 'transactionType: ' + transactionType);
			nlapiLogExecution('DEBUG', 'dateCompleted: ' + dateCompleted, 'dateCompleted: ' + dateCompleted);
			nlapiLogExecution('DEBUG', 'transactionId: ' + transactionId, 'transactionId: ' + transactionId);

			if(transactionType == 'Sales Order' || transactionType == 'Opportunity' || transactionType == 'Quote' || transactionType == 'Invoice') // Only update field for Sales Orders / Quotes / Opportunities / Invoices
			{

				switch (transactionType)
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
						nlapiSubmitField(transactionType, transactionId, 'custbody_last_phone_call_date', dateCompleted);
					}
					catch(e)
					{
						// Will log everytime its not an opportunity record that it is trying to update.
						nlapiLogExecution('ERROR', 'Couldn\'t submit field... transactionType: ' + transactionType + ' transactionId: ' + transactionId + ' dateCompleted: ' + dateCompleted, e.message);
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
