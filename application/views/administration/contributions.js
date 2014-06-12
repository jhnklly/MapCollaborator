// a dataset of the DataTables table references, so we can reload them
// this will be populated on the document.ready event handler when DataTables happens
var TABLES = {};


$(document).ready(function () {
    // One Moment Please
    $('#dialog_waiting').dialog({
        modal:true, autoOpen:false, closeOnEsc:false, draggable:false, resizable:false,
        width:'auto', height:'auto'
    });

    // Your download is ready...
    $('#dialog_download').dialog({
        modal:true, autoOpen:false, closeOnEsc:false, draggable:false, resizable:false,
        width:'auto', height:'auto'
    });

    // load up the DataTables via AJAX
    // use the simplest mode here: rows are fetched via AJAX and are simply an array of arrays, these being placed into the cells literally and sequentially
    // to customize these fields, adjust the THs in the THEAD and also see the contributions_ajax() endpint in administration.php
    // WARNING
    // cell 0 is presumed to be the ID, see also tablerowCallback()
    // cell 1 is presumed to be the status, see also appendStatusFilterToTable()

    if (CORE_LAYERS.notes) {
        var table = $('table.listing[data-type="notes"]');
        TABLES['notes']    = table.dataTable({ ajax:'contributions_ajax/notes', createdRow:tablerowCallback });

        appendStatusFilterToTable(table);
        appendDownloadLinkToTable(table);
    }
    if (CORE_LAYERS.points) {
        var table = $('table.listing[data-type="points"]');
        TABLES['points']   = table.dataTable({ ajax:'contributions_ajax/points', createdRow:tablerowCallback });

        appendStatusFilterToTable(table);
        appendDownloadLinkToTable(table);
    }
    if (CORE_LAYERS.lines) {
        var table = $('table.listing[data-type="lines"]');
        TABLES['lines']    = table.dataTable({ ajax:'contributions_ajax/lines', createdRow:tablerowCallback });

        appendStatusFilterToTable(table);
        appendDownloadLinkToTable(table);
    }
    if (CORE_LAYERS.polygons) {
        var table = $('table.listing[data-type="polygons"]');
        TABLES['polygons'] = table.dataTable({ ajax:'contributions_ajax/polygons', createdRow:tablerowCallback });

        appendStatusFilterToTable(table);
        appendDownloadLinkToTable(table);
    }

    // turn the set of tables into a set of tabs
    $('#tabs').tabs().removeClass('ui-widget-content');

    // start the map
    $('#map').resizable({
        minHeight:500, minWidth:500
    });
    initMap();

    // the popup for showing the submission details
    // it has sub-DIVs for each data type, and only one at a time will show -- see also bringUpInfoOnSubmission()
    // other magical behavior:
    // $('#dialog_contribinfo') will receive .data('submission') containing the raw info from the server, of the submission currently being reviewed
    //      this is used to populate the form inside #dialog_contribstatus
    // the form in #dialog_contribstatus is what really saves the status (type, id, status, message)
    $('#dialog_contribstatus').dialog({
        modal:true, autoOpen:false, closeOnEsc:false, draggable:false, resizable:false,
        width:'auto', height:'auto',
        buttons: {
            'Save Changes & Send Email': function () {
                saveSubmissionStatusForm();
            },
            'Cancel': function () {
                // simply close the dialog
                $(this).dialog('close');
            }
        },
    });
    $('#dialog_contribinfo').dialog({
        modal:false, autoOpen:false, closeOnEsc:false, draggable:false, resizable:false,
        width:350, height:450,
        position: { my:'left top', at:'left+45 top+10', of:'#map' },
        buttons: {
            'Accept / Decline': function () {
                // this one button just opens up #dialog_contribstatus which is the real ajaxform for saving a status
                var submission = $(this).data('submission');
                var $dialog    = $('#dialog_contribstatus').dialog('open');
                var $form      = $dialog.find('form');

                // save the type and id
                $form.find('input[name="type"]').val(submission.type);
                $form.find('input[name="id"]').val(submission.attribs.id);

                // the current status, isn't allowed as an option (change from Pending to Pending?)
                $form.find('select[name="status"] option').removeAttr('disabled').filter('[value="'+submission.attribs.status+'"]').prop('disabled','disabled');

                // load a default message from the placeholder
                var $textarea = $form.find('textarea[name="message"]');
                $textarea.val( $textarea.prop('placeholder') );

                // if the status is already Accepted or Declined, show the warning that
                if (submission.attribs.status != 'Pending') {
                    $('#contribstatus_warning').show();
                    $('#contribstatus_warning_status').text(submission.attribs.status);
                } else {
                    $('#contribstatus_warning').hide();
                }
            },
            'Cancel': function () {
                // simply close the dialog
                $(this).dialog('close');
            }
        },
        close: function () {
            // if this dialog closes, then nothing is being reviewed; enforce that
            bringUpInfoOnSubmission(null,0);
        }
    });

});



///////////////////////////////////////////////////////////////////////////////////////////////////////////
///// DATA TABLES
///////////////////////////////////////////////////////////////////////////////////////////////////////////


// See also http://datatables.net/examples/advanced_init/row_callback.html
// these callbacks are triggered when a row is drawn into the table, e.g. after ajax loading
// primary use is to turn field 0 (the ID#) into a clickable link to zoom the map, show approval UI, etc.
// data     the list of fields, in order they're received from the server, to go into the cells in that sequence, e.g. data[0] is the first datum and for the first cell in the row
// row      a DOM element, that being the TR row about to be added to the table
//              not jQuery, but DOM -- use $(row) to get a jQuery element, so you can assign attr() if you like
//          tip: use $('td',row).eq(N) to find the Nth cell of a row   (first=0)
// index    the index number of the row in the table   (first=0)
function tablerowCallback(row,data,index) {
    // cell 0 is the record ID; assign this ID and the data type into the row as attributes, so we can unambiguously link a TR to a record
    var id   = data[0];
    $(row).attr('data-id',id).attr('data-type','notes');

    // replace the content of cell 0 with a hyperlink to nowhere; that hyperlink calls bringUpInfoOnSubmission() for this row's type-and-ID
    var link = $('<a></a>').text(id).prop('href','javascript:void(0);').prop('title','Bring up more info on this submission').click(function () {
        bringUpInfoOnSubmission( $(this).closest('tr').attr('data-type') , $(this).closest('tr').attr('data-id') );
    });
    $('td',row).eq(0).empty().append(link);
}

function appendStatusFilterToTable(table) {
    // cell 1 is presumed to be the status, so that's the column offset used when the search is performed

    // append to the DataTable's filter DIV (that's non-API, sorry) a SELECT element so one can filter to show submissions in a specific status
    // select Pending by default since that's the most common immediate need
    var target   = table.siblings('div.dataTables_length');
    var selector = $('<select></select>').prop('name','status').appendTo(target);
    $('<option></option>').prop('value','').text('Status: ANY').appendTo(selector);
    $('<option></option>').prop('value','Pending').text('Status: Pending').appendTo(selector);
    $('<option></option>').prop('value','Declined').text('Status: Declined').appendTo(selector);
    $('<option></option>').prop('value','Accepted').text('Status: Accepted').appendTo(selector);

    selector.data('table',table).change(function () {
        var value = $(this).val();
        $(this).data('table').dataTable().api().column(1).search(value).draw();
    });
    selector.val('Pending').trigger('change');
}

function appendDownloadLinkToTable(table) {
    var target = table.siblings('div.dataTables_length');

    // the hyperlink has a .data('table') attribute linking to the table, so we can look it up without DOM scanning
    var link = $('<a></a>').addClass('download_link').text('Download').prop('href','javascript:void(0);').appendTo(target);
    link.data('table',table);
    link.click(function () {
        var type = $(this).data('table').attr('data-type');
        downloadTable(type);
    });
}

// given a submission type and ID# bring up more info
// this will be all fields listed in the config.php "form_fields" for this core layer, dumped as a table
// as well as the map being zoomed to the area
function bringUpInfoOnSubmission(type,id) {
    // bail condition: allow the use of bringUpInfoOnSubmission(null,0) to specifically clear the info popup, highlight nothing, etc.
    if (! type) {
        // clear the contrib info popup's own idea of what it's viewing, and clear any highlight
        $('#dialog_contribinfo').data('submission',null);
        highlightFeatureByTypeAndID(null,0);

        // and we're outta here
        return;
    }

    // start to highlight it on the map
    // this takes a few seconds so send it off as we get started
    highlightFeatureByTypeAndID(type,id);

    // fetch info
    var params = { type:type, id:id };
    $('#dialog_waiting').dialog('open');
    $.get('contribution_details', params, function (info) {
        // done waiting,. open the target dialog and then the target sub-DIV for this submission's data type
        // store "target" as a reference to the sub-DIV where we'll be loading our content
        $('#dialog_waiting').dialog('close');
        $('#dialog_contribinfo').dialog('open').data('submission',info);
        var target = $('#dialog_contribinfo > div.contribinfo').hide().filter('[data-type="'+info.type+'"]').show();

        // zoom to the area
        // joke's on you; if you have it zoom they'll hate it cuz it's disorienting; if you don't have it zoom, they'll hate it cuz they are zoomed out too far
        MAP.fitBounds([[info.bbox.n,info.bbox.e],[info.bbox.s,info.bbox.w]]);

        // load the attributes into the popup dialog
        // see the HTML for #dialog_contribinfo and the notes
        // the fields handed back in "attribs" will be matched up to #dialog_contribinfo span[data-field="FIELDNAME"] elements and filled in as-is
        // as such, showing/hiding fields should require only HTML modifications and you shouldn't need to make edits here
        var fields = target.find('span[data-field]').text('');
        for (var f in info.attribs) {
            fields.filter('[data-field="'+f+'"]').text( info.attribs[f] );
        }

        // custom post-processing based on the data type
        // you likely won't need this... oh who'm I kidding, someone will want customizations so I made it easy  :)
        switch (info.type) {
            case 'notes':
                break;
            case 'points':
                break;
            case 'lines':
                break;
            case 'polygons':
                break;
        }

        // done, info is shown, map is zoomed, admin can approve/reject/skip
    }, 'json');
}

function saveSubmissionStatusForm() {
    // grab the type and ID for potential postprocessing tasks, e.g. reloading maps and tables
    // and bail if they're not filled in
    var type = $('#dialog_contribstatus form input[name="type"]').val();
    var id   = $('#dialog_contribstatus form input[name="id"]').val();
    if (! type || ! id ) return alert("Can't submit empty form?");

    var params = $('#dialog_contribstatus form').serialize();
    $('#dialog_waiting').dialog('open');

    $.post('contribution_status', params, function (reply) {
        // if it's not "ok" then it's an error
        $('#dialog_waiting').dialog('close');
        if (reply != 'ok') return alert(reply);

        // close the popup, which implicitly un-selects the submission
        // then reload the DataTable
        // and redraw the appropriate map layer
        $('#dialog_contribstatus').dialog('close');
        $('#dialog_contribinfo').dialog('close');
        TABLES[type].dataTable().api().ajax.reload();
        MAPLAYERS[type].redraw();
    });
}

function downloadTable(type) {
    var url = 'contributions_download/' + type;

    $('#dialog_download').dialog('close');
    $('#dialog_waiting').dialog('open');

    $.get(url, {}, function (url) {
        // if the URL doesn't look like an URL, it's an error message
        $('#dialog_waiting').dialog('close');
        if (url.substr(0,4) != 'http') return alert(url);

        // fill in the URL and show the download link
        $('#dialog_download').dialog('open');
        $('#dialog_download a').prop('href',url);
    });
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////
///// MAP FUNCTIONS
///// much of this is pulled from index.js and mapconstants.js
///////////////////////////////////////////////////////////////////////////////////////////////////////////

function initMap() {
    //
    // BASIC MAP SETUP, INCL BASEMAP PICKER
    //
    MAP = L.map('map', {
        attributionControl:false,
        minZoom:MIN_ZOOM,
        maxZoom:MAX_ZOOM
    });

    var basemapbuttons = [];
    var b = {};
    for (var i=0, l=BASEMAPS.length; i<l; i++) {
        var url = BASEMAPS[i].url;
        var att = BASEMAPS[i].attrib;
        var tag = BASEMAPS[i].button;

        b[tag] = L.tileLayer(url, { attribution:att });
        basemapbuttons.push(tag);
    }
    BASEMAPS = b;
    BASEMAP_CONTROL = new L.Control.BasemapBar({ layers:basemapbuttons }).addTo(MAP);

    // select the default basemap, then zoom to the starting view
    selectBasemap(START_BASEMAP);
    zoomHome();

    var zindex = 10;
    HIGHLIGHT_LAYER = L.tileLayer.wms(WMSURL_COREHIGHLIGHT,{ layers:'highlight_notes', 'id':0, tileSize:512, format:'image/png', transparent:true, zIndex:zindex++ }).addTo(MAP);
    if (CORE_LAYERS.polygons) {
        var wmslayer = 'polygons';
        MAPLAYERS[wmslayer] = L.tileLayer.wmsWithFeatureInfoCore(WMSURL_CORE, { layers:wmslayer, tileSize:2048, format:'image/png', transparent:true, zIndex:zindex++ })
                                .on('loading', function () { layerShowSpinner(this.options.layers); })
                                .on('load', function () { layerHideSpinner(this.options.layers); });
    }
    if (CORE_LAYERS.lines) {
        var wmslayer = 'lines';
        MAPLAYERS[wmslayer] = L.tileLayer.wmsWithFeatureInfoCore(WMSURL_CORE, { layers:wmslayer, tileSize:2048, format:'image/png', transparent:true, zIndex:zindex++ })
                                .on('loading', function () { layerShowSpinner(this.options.layers); })
                                .on('load', function () { layerHideSpinner(this.options.layers); });
    }
    if (LABELS) {
        L.tileLayer(LABELS,{ zIndex:zindex++ }).addTo(MAP);
    }
    zindex++;
    if (CORE_LAYERS.points) {
        var wmslayer = 'points';
        MAPLAYERS[wmslayer] = L.tileLayer.wmsWithFeatureInfoCore(WMSURL_CORE, { layers:wmslayer, tileSize:2048, format:'image/png', transparent:true, zIndex:zindex++ })
                                .on('loading', function () { layerShowSpinner(this.options.layers); })
                                .on('load', function () { layerHideSpinner(this.options.layers); });
    }
    if (CORE_LAYERS.notes) {
        var wmslayer = 'notes';
        MAPLAYERS[wmslayer] = L.tileLayer.wmsWithFeatureInfoCore(WMSURL_CORE, { layers:wmslayer, tileSize:2048, format:'image/png', transparent:true, zIndex:zindex++ })
                                .on('loading', function () { layerShowSpinner(this.options.layers); })
                                .on('load', function () { layerHideSpinner(this.options.layers); });
    }
    for (var i=0, l=CONTEXT_LAYERS.length; i<l; i++) {
        var wmslayer   = CONTEXT_LAYERS[i].wmslayer;    // string, the WMS layer name as listed in the mapfile
        var clickquery = CONTEXT_LAYERS[i].clickquery;  // boolean, should this layer support click-query? that's a different WMS subclass
        var config     = { layers:wmslayer, tileSize:2048, format:'image/png', transparent:true, zIndex:zindex++ };

        MAPLAYERS[wmslayer] = clickquery ? L.tileLayer.wmsWithFeatureInfo(WMSURL_CONTEXT,config) : L.tileLayer.wms(WMSURL_CONTEXT,config);
        MAPLAYERS[wmslayer].on('loading', function () { layerShowSpinner(this.options.layers); })
                           .on('load', function () { layerHideSpinner(this.options.layers); });
    }

    // controls: fullscreen toggle
    L.control.fullscreen({}).addTo(MAP);

    // controls: simple scalebar
    L.control.scale().addTo(MAP);

    // controls: simple attribution but with a custom prefix so we don't just use this in the L.Map constructor
    L.control.attribution({ prefix:'' }).addTo(MAP);

    // controls: GreenInfo logo
    new L.GreeninfoCreditsControl().addTo(MAP);

    // more duct tape around a complex interaction
    // when a popup is closed, be sure to highlight Nothing
    // thus, closing the popup effectively clears the highlight. usually. if they're slow. usually.
    MAP.on('popupclose', function () {
        highlightFeatureByTypeAndID(null,0);
    });

    //
    // THE LEGEND TOGGLES LAYER VISIBILITY
    //

    // first, the legend popup dialog itself
    $('#dialog_legend').dialog({
        autoOpen:true, closeOnEsc:false, draggable:false, resizable:false,
        width:275, height:'auto', maxHeight: $(window).height() * DIALOGMAXHEIGHT['dialog_legend'],
        title:'Legend & Layers',
        position: DIALOGPOSITIONS['dialog_legend']
    });

    // the Status filter checkboxes for the core layers, simply trigger a change handler on the parent layers[] checkbox
    // that is, if you uncheck Accepted for core Polygons, that's the same as Accepted having always been unchecked but then toggling the Polygon checkbox
    // why? cuz layerOn() already has special handling for core layers, to examine the checkboxes and merge the Status filter param (any toggle of the layer effectively re-examines the checkboxes, eliminating possible de-syncs)
    $('#dialog_legend input[name="status[]"]').change(function () {
        $(this).closest('div.legend_block').find('input[name="layers[]"]').trigger('change');
    });

    // the layers[] checkboxes, which means both the core points/line/polygons and also the context layers
    // add a change handler to the checkbox, then trigger the change handler since the checkboxes will already be checked/unchecked
    // based on the 'onbydefault' setting and on Firefox's own control-state caching
    $('#dialog_legend input[name="layers[]"]').change(function () {
        var layername = $(this).closest('div.legend_block').attr('data-layer');
        var viz       = $(this).is(':checked');
        viz ? layerOn(layername) : layerOff(layername);
    }).prop('title',"Use the checkbox to toggle the layer's visibility on the map").trigger('change');

    // opacity sliders: set up each one individually, cuz they each have a different starting opacity
    $('#dialog_legend div.legend_slider').each(function () {
        var opacity  = parseInt( $(this).attr('data-opacity') );
        var maplayer = $(this).closest('div.legend_block').attr('data-layer');

        $(this).slider({
            min:0,
            max:100,
            value: opacity,
            maplayer: maplayer,
            change: function (event,ui) {
                layerOpacity( $(this).slider('option','maplayer'), ui.value);
            }
        }).slider('value',opacity);
    }).prop('title',"Slide to adjust this layer's opacity on the map");

    // and lastly, the control on the map which toggles this dialog's open/closed status
    new L.Control.DialogToggler({
        jqid: 'dialog_legend',
        tooltip:'Show the map layers & legend'
    }).addTo(MAP);
}

function zoomHome() {
    MAP.setView([START_LAT,START_LON],START_ZOOM);
}

function selectBasemap(which) {
    BASEMAP_CONTROL.selectLayer(which);
}

function layerOn(layername) {
    // find the legend block with the corresponding data-layer attribute; show/hide the legend swatch
    var $block = $('#dialog_legend [data-layer="'+layername+'"]');
    $block.find('div.legend_content').show();

    // find the corresponding map layer and add it to the MAP
    MAP.addLayer(MAPLAYERS[layername]);

    // special handling for core layers: examine the status[] checkboxes and form a new &STATUS= param to merge
    // thus, toggling the layer visibility will also force the displayed features to be in sync with the desired filters
    // and prevent any possibility of the checkboxes somehow becoming checked or unchecked (e.g. firefox caching) and the wrong features displaying
    switch (layername) {
        case 'notes':
        case 'points':
        case 'lines':
        case 'polygons':
            // status items are passed to MapServer as-is meaning they must include ' characters (sigh)
            // it's cheap but at least we know for a fact that no core layer has ' in its name
            var statuses = [];
            $('#dialog_legend div.legend_block[data-layer="'+layername+'"] input[name="status[]"]:checked').each(function () {
                statuses.push( $(this).prop('value') );
            });
            if (! statuses.length) statuses.push('None');
            statuses = statuses.map(function (i) { return "'" + i + "'" }).join(',');
            MAPLAYERS[layername].setParams({ 'STATUS':statuses });

            break;
    }
}
function layerOff(layername) {
    // find the legend block with the corresponding data-layer attribute; show/hide the legend swatch
    var $block = $('#dialog_legend [data-layer="'+layername+'"]');
    $block.find('div.legend_content').hide();

    // find the corresponding map layer and remove it from the MAP
    MAP.removeLayer(MAPLAYERS[layername]);
}

function layerOpacity(layername,opacity) {
    MAPLAYERS[layername].setOpacity( 0.01 * opacity );
}

function layerShowSpinner(layername) {
    $('#dialog_legend div.legend_block[data-layer="'+layername+'"] img.legend_spinner').show();
}
function layerHideSpinner(layername) {
    $('#dialog_legend div.legend_block[data-layer="'+layername+'"] img.legend_spinner').hide();
}

function highlightFeatureByTypeAndID(type,id) {
    // if the type is null or the ID is 0, we really want to blank out the highlight; do this by forcing point=0
    if (! type || ! id) { type = 'note'; id = 0; }

    // merge in the new layer & id to accomplish the highlight
    // also shift the Z index (hack!) so it appears below notes and points but above the labels-and-roads, or else above all of those, whatever looks best
    var z = HIGHLIGHT_LAYER_ZINDEX[type];
    HIGHLIGHT_LAYER.setParams({
        layers: 'highlight_' + type, // the type is singular and we want a plural layername, e.g. note -> notes
        id: id
    });
    HIGHLIGHT_LAYER.setZIndex(z);
}

function postprocessPopupBubble(layer) {
    var $popup = $('#map .leaflet-popup-content');

    switch (layer) {
        case 'notes':
        case 'points':
        case 'lines':
        case 'polygons':
            // start by attaching a click to the edit link, to call the bring-up-info capability same as if it had been clicked in the DataTable
            var $editlink = $popup.find('a#edit_this_feature[data-type][data-id]');
            $editlink.text('More Info');
            $editlink.click(function () {
                var type = $(this).attr('data-type') + 's';
                var id   = parseInt( $(this).attr('data-id') );
                bringUpInfoOnSubmission(type,id);
            });

            // highlight this feature
            var type = $editlink.attr('data-type') + 's';
            var id   = parseInt( $editlink.attr('data-id') );
            highlightFeatureByTypeAndID(type,id);

            break;
    }
}

