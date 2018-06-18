/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       08 Mar 2018     Mike Lewis
 *
 */

/**
 * @param {nlobjRequest} request Request object
 * @param {nlobjResponse} response Response object
 * @returns {Void} Any output is written via response object
 */
function suitelet(request, response)
{
	var HTML = '<!DOCTYPE html>';
	HTML += '<html>';
	HTML += '<head>';
	HTML += '<meta charset="utf-8">';
	HTML += '<title>Heatmaps</title>';
	HTML += '<style>';
	HTML += '/* Always set the map height explicitly to define the size of the div';
	HTML += '* element that contains the map. */';
	HTML += '#map {';
	HTML += 'height: 100%;';
	HTML += '}';
	HTML += '/* Optional: Makes the sample page fill the window. */';
	HTML += 'html, body {';
	HTML += 'height: 100%;';
	HTML += 'margin: 0;';
	HTML += 'padding: 0;';
	HTML += '}';
	HTML += '#floating-panel {';
	HTML += 'position: absolute;';
	HTML += 'top: 10px;';
	HTML += 'left: 25%;';
	HTML += 'z-index: 5;';   
	HTML += 'background-color: #fff;';
	HTML += 'padding: 5px;';
	HTML += 'border: 1px solid #999;';
	HTML += 'text-align: center;';
	HTML += 'font-family: \'Roboto\',\'sans-serif\';';
	HTML += 'line-height: 30px;';
	HTML += 'padding-left: 10px;';
	HTML += '}';
	HTML += '#floating-panel {';
	HTML += 'background-color: #fff;';
	HTML += 'border: 1px solid #999;';
	HTML += 'left: 25%;';
	HTML += 'padding: 5px;';
	HTML += 'position: absolute;';
	HTML += 'top: 10px;';
	HTML += 'z-index: 5;';
	HTML += '}';
	HTML += '</style>';
	HTML += '</head>';
	HTML += '';
	HTML += '<body>';
	HTML += '<div id="floating-panel">';
	HTML += '<button onclick="toggleHeatmap()">Toggle Heatmap</button>';
	HTML += '<button onclick="changeGradient()">Change gradient</button>';
	HTML += '<button onclick="changeRadius()">Change radius</button>';
	HTML += '<button onclick="changeOpacity()">Change opacity</button>';
	HTML += '</div>';
	HTML += '<div id="map"></div>';
	HTML += '<script>';
	HTML += '// This example requires the Visualization library. Include the libraries=visualization';
	HTML += '// parameter when you first load the API. For example:';
	HTML += '// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=visualization">';
	HTML += 'var map, heatmap;';
	HTML += 'function initMap() {';
	HTML += 'map = new google.maps.Map(document.getElementById(\'map\'), {';
	HTML += 'zoom: 13,';
	HTML += 'center: {lat: 37.775, lng: -122.434},';
	HTML += 'mapTypeId: \'satellite\'';
	HTML += '});';
	HTML += 'heatmap = new google.maps.visualization.HeatmapLayer({';
	HTML += 'data: getPoints(),';
	HTML += 'map: map';
	HTML += '});';
	HTML += '}';
	HTML += 'function toggleHeatmap() {';
	HTML += 'heatmap.setMap(heatmap.getMap() ? null : map);';
	HTML += '}';
	HTML += 'function changeGradient() {';
	HTML += 'var gradient = [';
	HTML += '\'rgba(0, 255, 255, 0)\',';
	HTML += '\'rgba(0, 255, 255, 1)\',';
	HTML += '\'rgba(0, 191, 255, 1)\',';
	HTML += '\'rgba(0, 127, 255, 1)\',';
	HTML += '\'rgba(0, 63, 255, 1)\',';
	HTML += '\'rgba(0, 0, 255, 1)\',';
	HTML += '\'rgba(0, 0, 223, 1)\',';
	HTML += '\'rgba(0, 0, 191, 1)\',';
	HTML += '\'rgba(0, 0, 159, 1)\',';
	HTML += '\'rgba(0, 0, 127, 1)\',';
	HTML += '\'rgba(63, 0, 91, 1)\',';
	HTML += '\'rgba(127, 0, 63, 1)\',';
	HTML += '\'rgba(191, 0, 31, 1)\',';
	HTML += '\'rgba(255, 0, 0, 1)\'';
	HTML += ']';
	HTML += 'heatmap.set(\'gradient\', heatmap.get(\'gradient\') ? null : gradient);';
	HTML += '}';
	HTML += 'function changeRadius() {';
	HTML += 'heatmap.set(\'radius\', heatmap.get(\'radius\') ? null : 20);';
	HTML += '}';
	HTML += 'function changeOpacity() {';
	HTML += 'heatmap.set(\'opacity\', heatmap.get(\'opacity\') ? null : 0.2);';
	HTML += '}';
	HTML += '// Heatmap data: 500 Points';
	HTML += 'function getPoints() {';
	HTML += 'return [';
	HTML += 'new google.maps.LatLng(37.782551, -122.445368),';	
	HTML += 'new google.maps.LatLng(37.782745, -122.444586),';
	HTML += 'new google.maps.LatLng(37.782842, -122.443688)';
	HTML += '];';
	HTML += '}';
	HTML += '</script>';
	HTML += '<script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDagUYH6w1G6tIRySm7wkREh3j3wa3Ik7Q&libraries=visualization&callback=initMap">';
	HTML += '</script>';
	HTML += '</body>';
	HTML += '</html>';

	var form = nlapiCreateForm('Google Maps Heat Map', true);
	form.addField('custpage_googlemapsheatmaps', 'inlinehtml').setDefaultValue(HTML);
	
	response.writePage(form);

}
