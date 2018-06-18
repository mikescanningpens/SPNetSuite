/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       09 May 2018     Mike Lewis
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */

/*********
 * Variables
 *********/
var currentContext = null;
var currentNote = null;
var tranID = null;
var memo = null;
var permTran = null;
var oppRec = null;

function updateLastUserNoteUEBS(type)
{

	try
	{
		//don't try to update a deleted record
		if(type != 'delete')
		{

			//only fire on UI updates - avoid web service updates	
			currentContext = nlapiGetContext();

			if (currentContext && currentContext.getExecutionContext() != 'webservices') 
			{

				//get current note
				currentNote = nlapiGetNewRecord();

				//get the idea of the associated record
				tranID = currentNote.getFieldValue('transaction'); 
				memo = currentNote.getFieldValue('note');
				permTran = currentNote.getFieldValue('perm'); //Hack
				nlapiLogExecution('DEBUG', 'Details', 'tranID = ' + tranID + ' Memo = ' + memo);
				nlapiLogExecution('DEBUG', 'permTran', 'permTran = ' + permTran);

				if(permTran == 'TRAN_OPPRTNTY')
				{
					/****************************************************************
					 * Had to add the try catch as sometimes there would be a blank
					 * mandatory field - but not always so didnt want to overload
					 * for the exception!
					 * **************************************************************/
					try
					{
						nlapiSubmitField('opportunity', tranID, 'memo', memo);
					}
					catch(e)
					{
						oppRec = nlapiLoadRecord('opportunity', tranID);
						oppRec.setFieldValue('memo', memo);
						nlapiSubmitRecord(oppRec, false, true);
					}
				}
				else
				{
					nlapiLogExecution('DEBUG', 'Not an opportunity', 'Not an opportunity');
				}

			}
			else
			{

				nlapiLogExecution('ERROR', 'Couldn\'t get context', 'Couldn\'t get context');

			}
		}

	}
	catch(e)
	{
		Library.errorHandler('updateLastUserNoteUEBS', e);
	}
}
