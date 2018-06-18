/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       16 Jan 2018     Mike Lewis	   This script defaults the company field
 * 											   to the current logged in user.
 * 
 * 1.01       18 Jan 2018     Mike Lewis	   Added alerts and error handling
 */

var debugMode = false; // Turns debug mode on and off (use true and false boolean) this will enable alerts and logs.

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType 
 * 
 * @param {String} type Access mode: create, copy, edit
 * @returns {Void}
 */
function clientPageInit(type)
{
	try
	{
		
		var context = nlapiGetContext(); // Get context
		var userID = context.getUser(); // Get user ID
		var userName = context.getName(); // Get users name
		
		userID = parseInt(userID); // Put the userID into numerical format
		
		if(debugMode)
			{
				alert(userID); // Show alert for what the userID is.
				alert(userName); // Show alert for what the users name is.
				
			}
		
		nlapiSetFieldValue('company', userID); // Set the company (employee named) field to the employees name as default.
		
	}
	
catch(e)
	{
		alert("Error: " + e.message);
	}

}
