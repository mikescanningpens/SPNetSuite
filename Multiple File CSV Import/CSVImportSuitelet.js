/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       11 Jul 2017     michael.lewis
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
{
	var CONFIG = {
			
			amount : 10,
			ScheduleScriptscriptId1 : 'customscript_mcsvimporter',
			ScheduleScriptdeployId1 : 'customdeploy_mcsvimporter1',
			ScheduleScriptscriptId2 : 'customscript_mcsvimporter2',
			ScheduleScriptdeployId2 : 'customdeploy_mcsvimporter2',
			ScheduleScriptscriptId3 : 'customscript_mcsvimporter3',
			ScheduleScriptdeployId3 : 'customdeploy_mcsvimporter3',
			ScheduleScriptscriptId4 : 'customscript_mcsvimporter4',
			ScheduleScriptdeployId4 : 'customdeploy_mcsvimporter4',
			ScheduleScriptscriptId5 : 'customscript_mcsvimporter5',
			ScheduleScriptdeployId5 : 'customdeploy_mcsvimporter5',
			ScheduleScriptscriptId6 : 'customscript_mcsvimporter6',
			ScheduleScriptdeployId6 : 'customdeploy_mcsvimporter6',
			ScheduleScriptscriptId7 : 'customscript_mcsvimporter7',
			ScheduleScriptdeployId7 : 'customdeploy_mcsvimporter7',
			ScheduleScriptscriptId8 : 'customscript_mcsvimporter8',
			ScheduleScriptdeployId8 : 'customdeploy_mcsvimporter8',
			ScheduleScriptscriptId9 : 'customscript_mcsvimporter9',
			ScheduleScriptdeployId9 : 'customdeploy_mcsvimporter9',
			ScheduleScriptscriptId10 : 'customscript_mcsvimporter10',
			ScheduleScriptdeployId10 : 'customdeploy_mcsvimporter10'
	};
}
function multipleFileImportCSVSuitelet(request, response)
{
	var form;
	var amount = 10;
	
	if (request.getMethod()=='GET') 
	{
		
		
		form = nlapiCreateForm('Multiple CSV Upload');
		
		for(var i = 1;i <= CONFIG.amount;i++)
			{
				form.addField('custpage_myfile' + i,'file','Select File ' + 1);
			}
		
//		form.addField('custpage_myfile2','file','Select File 2');
//		form.addField('custpage_myfile3','file','Select File 3');
//		form.addField('custpage_myfile4','file','Select File 4');
//		form.addField('custpage_myfile5','file','Select File 5');
//		form.addField('custpage_myfile6','file','Select File 6');
//		form.addField('custpage_myfile7','file','Select File 7');
//		form.addField('custpage_myfile8','file','Select File 8');
//		form.addField('custpage_myfile9','file','Select File 9');
//		form.addField('custpage_myfile10','file','Select File 10');
		
		form.addSubmitButton('Submit');
		response.writePage(form);

	} 
	else 
	{
		var file = [];
		for(var i = 1;i <= amount;i++)
		{
			file[i] = request.getFile('custpage_myfile' + i); //Addds file into the array
			
			if(file[i] != null) //Makes sure that there is a file in this part of the array
				{
					file[i] = nlapiCreateFile('Test' + i, 'CSV', file[i].getValue());
					file[i].setFolder(-4);
					file[i] = nlapiSubmitFile(file[i]);
				}
			else
				{
					nlapiLogExecution('DEBUG', 'Null Value in File[' + i + ']' , 'Null Value in File[' + i + ']');
				}
		}

//		// read the file from the request object
//		var file1 = request.getFile('custpage_myfile');
//		var file2 = request.getFile('custpage_myfile2');
//		var file3 = request.getFile('custpage_myfile3');

		
		
		
//		if(file1 != null)
//		{
//			file1 = nlapiCreateFile('TestCSVImport', 'CSV', file1.getValue());
//			file1.setFolder(-4);
//			file1 = nlapiSubmitFile(file1);
//		}
//
//		if(file2 != null)
//		{
//			file2 = nlapiCreateFile('TestCSVImport2', 'CSV', file2.getValue());
//			file2.setFolder(-4);
//			file2 = nlapiSubmitFile(file2);
//		}
//
//		if(file3 != null)
//		{
//			file3 = nlapiCreateFile('TestCSVImport3', 'CSV', file3.getValue());
//			file3.setFolder(-4);
//			file3 = nlapiSubmitFile(file3);
//		}
		
		var params = [];
		for(var i = 1;i <= amount;i++)
		{
			params[i] = {
					custscript_fileid : file[i]
			};		

		}

//		var params1 = {
//				custscript_fileid : file1
//		};
//		var params2 = {
//				custscript_fileid : file2
//		};
//		var params3 = {
//				custscript_fileid : file3
//		};
//
//		nlapiLogExecution('AUDIT','Reading in file', 'file1 = ' + file1 + '\nfile2 = ' + file2 + '\nfile3 = ' + file3);

		try 
		{ 
			
			for(var i = 1;i <= amount;i++)
			{
				if(file[i] != null)
					{
						nlapiScheduleScript(CONFIG.ScheduleScriptscriptId1, CONFIG.ScheduleScriptdeployId1, params[i]);
					}

			}

			if(file1 || file2 || file3)
			{
				if(file1 != null)
				{
					nlapiScheduleScript(CONFIG.ScheduleScriptscriptId1, CONFIG.ScheduleScriptdeployId1, params1);
				}

				if(file2 != null)
				{
					nlapiScheduleScript(CONFIG.ScheduleScriptscriptId1, CONFIG.ScheduleScriptdeployId2, params2);
				}

				if(file3 != null)
				{
					nlapiScheduleScript(CONFIG.ScheduleScriptscriptId1, CONFIG.ScheduleScriptdeployId3, params3);
				}

				form = nlapiCreateForm('Upload complete.');
				form.addField('custpage_inlinehtmlfield','inlinehtml').setDefaultValue('<p>Please navigate to this page to see the status of the import <a href="/app/setup/upload/csv/csvstatus.nl">Status Page</a></p>');
				response.writePage(form);
			}
			else
			{
				form = nlapiCreateForm('No files Uploaded...');
				response.writePage(form);
			}
		}
		catch(e) 
		{
			nlapiLogExecution('ERROR', 'Import didnt work..', 'Import error');
		}	
	}
}

function wait(ms)
{
	var start = new Date().getTime();
	var end = start;
	while(end < start + ms) 
	{
		end = new Date().getTime();
	}
}

function resourceAllocation() 
{
	 var loadedInvoiceFile = nlapiLoadFile(invoiceFileId); //load the file
	 var loadedInvoiceString = loadedInvoiceFile.getValue(); //read its contents
	 var invoiceLines = loadedInvoiceString.split('\n'); //split on newlines

	 for (var i = 0; i < invoiceLines.length; i++) //for each line do: 
	 { 
	     var cols = invoiceLines[i].split('\t'); //change delimeter here
	 }
}


