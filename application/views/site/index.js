///////////////////////////////////////////////////////////////////////////////////////////////////////////
///// SEE ALSO:  mapconstants.js
///////////////////////////////////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////////////////////////////////
///// WINDOW RESIZING
///////////////////////////////////////////////////////////////////////////////////////////////////////////


function handleResize() {
    // go over all dialogs
    // if they have an entry in DIALOGPOSITIONS then their position should be re-asserted
    // if they have an entry in DIALOGMAXHEIGHT then their maxHeight should be updated to the new window height

    var winh = $('#map').height();

    $('div.dialog').each(function () {
        var $this = $(this);
        // not a dialog yet, not yet initialized? skip it
        if (! $this.hasClass('ui-dialog-content') ) return;

        // fetch the position setting for this dialog, if it exists
        var pos = DIALOGPOSITIONS[ $(this).prop('id') ];
        if (pos) {
            $this.dialog('option','position',pos);
        }

        // find a max-height setting for this dialog, if it exists
        var maxht = DIALOGMAXHEIGHT[ $(this).prop('id') ];
        if (maxht) {
            $this.dialog('option','maxHeight', winh * maxht);
        }
    });
}

$(window).resize(function () {
    handleResize();
});


///////////////////////////////////////////////////////////////////////////////////
///// INIT
///////////////////////////////////////////////////////////////////////////////////

$(document).ready(function () {
    initMap();
    initAccordion();
    initMapLegend();
    initShareDialog();
    initMiscDialogsAndButtons();
    initLoadSharedState();
});

function initMap() {
    MAP = L.map('map', {
        attributionControl:false,
        minZoom:MIN_ZOOM,
        maxZoom:MAX_ZOOM
    });

    // create the basemaps and replace BASEMAPS with this new random-access assoc
    // also populate the list used in the basemap toggle control below
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

    // start populating MAPLAYERS from the CORE_LAYERS and CONTEXT_LAYERS configuration (see index.phtml)
    // we instantiate these L.TileLayer instances, but don't load them into the map until initMapLegend() when we generate the checkboxes which toggle them
    // tip: be sure to explicitly set zIndex on these so the stacking order is retained when layers are toggled (which means added/removed from the MAP)
    // tip: the HIGHLIGHT_LAYER has its "layers" and "id" swapped out by highlightFeatureByTypeAndID() to achieve highlighting   see wms/highlight.map for more info
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

    // drawing and editing: a LayerGroup for the drawing being edited (all data types) and the master control
    // but perhaps most importantly, the individual drawing tools for the 4 data types
    // the draw:created callback simply moves the drawn feature into the DRAWINGS layer, and the tools' own submission process (ajaxForm in initAccordion()) is expected to check that drawings in fact exist

    DRAWINGS            = new L.FeatureGroup([]).addTo(MAP);
    DRAWCONTROL         = new L.Control.Draw({ draw: false, edit: { edit: false, remove: false, featureGroup: DRAWINGS, selectedPathOptions: EDITING_STYLE } }).addTo(MAP);
    EDITCONTROL         = new L.EditToolbar.Edit(MAP, { featureGroup: DRAWINGS, selectedPathOptions: DRAWCONTROL.options.edit.selectedPathOptions });
    DRAWTOOL_NOTE       = new L.Draw.Marker(MAP,   { repeatMode:true, allowIntersection:false });
    DRAWTOOL_POINT      = new L.Draw.Marker(MAP,   { repeatMode:true, allowIntersection:false });
    DRAWTOOL_LINE       = new L.Draw.Polyline(MAP, { repeatMode:true, allowIntersection:false, metric:false, shapeOptions:DRAWINGS_STYLES['line'] });
    DRAWTOOL_POLYGON    = new L.Draw.Polygon(MAP,  { repeatMode:true, allowIntersection:false, metric:false, shapeOptions:DRAWINGS_STYLES['polygon'] });

    MAP.on('draw:created', function(e) {
        DRAWINGS.clearLayers().addLayer(e.layer);
    });
    MAP.on('draw:edited', function(e) {
        DRAWINGS.clearLayers().addLayer(e.layer);
    });

    // more duct tape around a complex interaction
    // when a popup is closed, be sure to highlight Nothing
    // thus, closing the popup effectively clears the highlight. usually. if they're slow. usually.
    MAP.on('popupclose', function () {
        highlightFeatureByTypeAndID(null,0);
    });
}

function initMiscDialogsAndButtons() {
    // Welcome!
    $('#dialog_welcome').dialog({
        modal:true, autoOpen:true, closeOnEsc:false, draggable:false, resizable:false,
        width:'auto', height:'auto'
    });

    // One Moment Please
    $('#dialog_waiting').dialog({
        modal:true, autoOpen:false, closeOnEsc:false, draggable:false, resizable:false,
        width:'auto', height:'auto'
    });
}


function initAccordion() {
    $('#dialog_accordion').dialog({
        /*jmk set draggable true*/
        autoOpen:true, closeOnEsc:false, draggable:true, resizable:false,
        width:325, height:'auto', maxHeight: $(window).height() * DIALOGMAXHEIGHT['dialog_accordion'],
        title: 'MapCollaborator Menu',
        position: DIALOGPOSITIONS['dialog_accordion'],
        close: function () {
            // if this dialog gets closed, also terminate any tools that may have been running
            // e.g. someone in the middle of drawing a shape for submission
            stopTool();
        }
    });

    // the control on the map which toggles this dialog's open/closed status
    new L.Control.DialogToggler({
        jqid: 'dialog_accordion',
        tooltip:'Show or hide the MapCollaborator Menu panel'
    }).addTo(MAP);

    // set up the accordion-like behavior; we don't use JQUI accordion since we specifically want to allow multiple tabs simultaneously
    // the H1 are contrived to have a DIV as next() so the click effect works
    // and each H1 has a data-tabname and data-exclusive -- see also accordionOpen() et al
    $('#dialog_accordion h1').click(function () {
        var tabname = $(this).attr('data-tabname');
        accordionToggle(tabname);
    });

    // the geocoder
    $('#geocode_text').keydown(function (evt) {
        if (evt.keyCode == 13) $('#geocode_go').click();
    });
    $('#geocode_go').click(function () {
        var address = $('#geocode_text').val();
        if (! address) return;
        geocodeAndZoom(address);
    });

    // the non-geocoder zoomtos: one for each Type of zoomto found, and a set of links to select which one is available
    $('#dialog_accordion select.geocode_zoomto').change(function () {
        var placeid = $(this).val();
        if (! placeid) return;
        zoomToPlace(placeid);
    });
    $('#dialog_accordion span.geocode_zoomto_link').click(function () {
        var type = $(this).attr('data-zoomtype');
        $('#dialog_accordion span.geocode_zoomto_link').removeClass('geocode_zoomto_link_active');
        $(this).addClass('geocode_zoomto_link_active');
        $('#dialog_accordion select.geocode_zoomto').hide().filter('[data-zoomtype="'+type+'"]').show();
    }).first().click();

    // the various drawing tools (point, line, polygon, note) have the same interface: a button, a form, and a callback listed in startTool()
    // not all of them are DRAWING tools per se; one can upload points/lines/polygons so startTool() and showTool() accept "mode" parameter
    $('#dialog_accordion input.drawtool_cancel').click(function () {
        stopTool();
    });
    $('#dialog_accordion input.drawshp_button').click(function () {
        var tool = $(this).attr('data-tool');
        startTool(tool,'upload');
    });
    $('#dialog_accordion input.drawtool_button').click(function () {
        var tool = $(this).attr('data-tool');
        startTool(tool,'draw');
    });
    $('#dialog_accordion form.drawtool_form').ajaxForm({
        beforeSubmit: function(fields,$form, options) {
            // first off make sure we have data
            // this is kinda tedious cuz the data may be either of two things: a drawing or else a file upload
            // depends on which mode we're in: that bis, whether the upload field is visible or the drawing tool enabled
            // warning: the best check we have is whether the upload box is VISIBLE; it would not be if the accordion is closed
            //          though in that case they shouldn't be able to submit the form anyway, so that's really only possible if they're hacking around anyway
            var $upload    = $form.find('input[name="upload"]');
            var uploadmode = $upload.is(':visible');
            var empty      = null;
            if (uploadmode) {
                if (! $upload.val() ) empty = "Select a GIS file for upload.";
            } else {
                if (! DRAWINGS.getLayers().length) empty = "Draw on the map to indicate the location, path, or area.";
            }
            if (empty) { alert(empty); return false; }

            // second: check for blank fields that are required
            // any field tagged as "data-required" must have a non-empty value, or else we bail
            // this check is repeated server-side in case this fails or is bypassed, but if we do it here then we don't have to suffer through a file upload nor a round-trip with potentially-large WKT
            var empty = null;
            $form.find('input[type="text"][data-required],select[data-required],textarea[data-required]').each(function () {
                if ( $(this).val() ) return;
                // no value? then collect the error message, and bail on this loop since we've now found an error
                empty = $(this).attr('data-required');
                return false;
            });
            if (! empty) {
                $form.find('span[data-required]').each(function () {
                    var has_any = $(this).find('input:checked').length;
                    if (has_any) return;
                    empty = $(this).attr('data-required');
                    return false;
                });
            }
            if (empty) { alert(empty); return false; }

            // data massaging
            // add two fields:
            // tool         this specifies the dataype being saved, e.g. note, point, line, polygon   Useful as a hint to the server
            // wkts         a list of WKT representations of drawn geometries (unless uploading)   why a list? cuz they may be editing a multi geometry
            //              unfortunately ajaxForm automagically collapses fields by commas, and WKT won't readily split by commas since they're OK, so we invent a | delimited "transfer format"
            var tooltype  = $form.attr('data-tool');
            var wkts      = [];
            if (uploadmode) {
                // nothing to do in upload mode...
            } else {
                try {
                    var drawings = DRAWINGS.getLayers();

                    for (var i=0, l=drawings.length; i<l; i++) {
                        var wkt = new Wkt.Wkt().fromObject(drawings[i]).write();
                        wkts.push(wkt);
                    }
                } catch (e) {
                    alert("Please finish drawing the feature or location onto the map.");
                    return false;
                }
            }
            fields.push({ name:'tool', value:tooltype });
            fields.push({ name:'wkts', value:wkts.join('|') });

            // Please Wait as we submit the form...
            $('#dialog_waiting').dialog('open');
        },
        success: function (responseText,statusText,xhr,$form) {
            $('#dialog_waiting').dialog('close');

            // if the response is "ok" then it went okay; otherwise it's an error message
            // in that caser we don't clear the drawing, clear the form, etc. cuz they likely want to fix it and try again
            if (responseText != 'ok') return alert(responseText);

            // uploaded fine: stop the tool, acknowledge, refresh the visualization WMS layer
            stopTool();

            var tooltype = $form.attr('data-tool') + 's';
            MAPLAYERS[tooltype].setParams({ rand:Math.random().toFixed(3) });

            alert("Thank you for your submission.");
        },
        error: function (error) {
            $('#dialog_waiting').dialog('close');
            alert("Something went wrong trying to save your edit.\nPlease try again.\n" + error.status + " " + error.statusText);
        }
    });
}

function initMapLegend() {
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

function initShareDialog() {
    // the Share dialog is toggled via the DialogToggler
    $('#dialog_share').dialog({
        autoOpen:false, closeOnEsc:true, draggable:false, resizable:false, modal:true,
        width:'auto', height:'auto',
        title:'Share This Map',
        position: DIALOGPOSITIONS['dialog_share'],
        open: function () {
            // when this dialog opens, fetch the map state URL param string and fill in the text box
            var params = compileMapStateParams();
            var url    = BASE_URL + '?' + $.param(params);
            $('#dialog_share textarea').val(url).focus();
        }
    });

    // afterthought: when the textarea is focused, select the text; one less click to copy and paste
    $('#dialog_share textarea').focus(function () {
        $(this).select();
    });

    // and lastly, the control on the map which toggles this dialog's open/closed status
    new L.Control.DialogToggler({
        jqid: 'dialog_share',
        tooltip:'Share this map with others'
    }).addTo(MAP);
}

function initLoadSharedState() {
    var params = $.url();

    // basemap choice
    var option = params.param('base');
    if (option) {
        selectBasemap(option);
    }

    // XYZ location choice
    var x = params.param('x');
    var y = params.param('y');
    var z = params.param('z');
    if (x && y && z) {
        MAP.setView([ parseFloat(y), parseFloat(x) ], parseInt(z) );
    }

    // layers and opacities are processed in tandem; both lists must be of equal length, and we iterate over the legend blocks based on the 'layers'
    var layers = params.param('layers') ? params.param('layers').split(',') : [];
    var opacs  = params.param('opacs')  ? params.param('opacs').split(',')  : [];
    if (layers.length && opacs.length == layers.length) {
        // prep: uncheck all layer toggle checkboxes, presume they're not on the list
        $('#dialog_legend input[name="layers[]"]').removeAttr('checked').trigger('change');

        // go over the two lists and set opacity & checkbox
        for (var i=0, l=layers.length; i<l; i++) {
            var layer = layers[i];
            var opac  = parseInt(opacs[i]);

            // fetch the legend $block for this layer; gracefully handle someone using a bad layer name, as layers may change and share links become outdated
            var $block = $('#dialog_legend div.legend_$block[data-layer="'+layer+'"]');
            if (! $block.length) continue;

            // check the box for them
            $block.find('input[name="layers[]"]').prop('checked','checked').trigger('change');

            // set the opacity slider
            $block.find('div.legend_slider').slider('value',opac);
        }
    }
}


///////////////////////////////////////////////////////////////////////////////////
///// FUNCTIONS
///////////////////////////////////////////////////////////////////////////////////

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
    type = type + 's';
    if (! type || ! id) { type = 'notes'; id = 0; }

    // merge in the new layer & id to accomplish the highlight
    // also shift the Z index (hack!) so it appears below notes and points but above the labels-and-roads, or else above all of those, whatever looks best
    var z = HIGHLIGHT_LAYER_ZINDEX[type];
    HIGHLIGHT_LAYER.setParams({
        layers: 'highlight_' + type, // the type is singular and we want a plural layername, e.g. note -> notes
        id: id
    });
    HIGHLIGHT_LAYER.setZIndex(z);
}

function compileMapStateParams() {
    // make up a set of params regarding the map's current basemap, center and zoom, etc. and hand back the object
    // typical use will be for serializing to an URL string for use with initLoadSharedState()
    var params = {};

    // the base map
    for (var i in BASEMAPS) {
        if (MAP.hasLayer(BASEMAPS[i])) { params.base = i; break; }
    }

    // the XYZ view
    params.y = MAP.getCenter().lat.toFixed(5);
    params.x = MAP.getCenter().lng.toFixed(5);
    params.z = MAP.getZoom();

    // the list of layers and opacities, only for layers which are turned on
    params.layers = [];
    params.opacs  = [];
    $('#dialog_legend input[name="layers[]"]:checked').each(function () {
        var block = $(this).closest('div.legend_block')
        var layer = block.attr('data-layer');
        var opac  = block.find('div.legend_slider').slider('value');
        params.layers.push(layer);
        params.opacs.push(opac);
    });
    params.layers = params.layers.join(',');
    params.opacs  = params.opacs.join(',');

    // all set!
    return params;
}

function accordionOpen(tabname) {
    var $button = $('#dialog_accordion h1[data-tabname="'+tabname+'"]');
    var $div    = $button.next();

    $div.show('fast');
    $button.addClass('accordion_active');

    // if this H1 is tagged as data-exclusive="true" then close all other accordion tabs
    if ( $button.attr('data-exclusive') ) {
        $('#dialog_accordion h1').not($button).each(function () {
            var closeme = $(this).attr('data-tabname');
            accordionClose(closeme);
        });
    }

    // in any case, call stopTool() sin ce we can't possibly be continuing to use a drawing or upload tool, as we just "walked away" from it
    // doing this here prevents wonky possible behaviors, such as being in the middle of drawing, changing tabs to a duifferent geom type, etc.
    stopTool();
}

function accordionClose(tabname) {
    var $button = $('#dialog_accordion h1[data-tabname="'+tabname+'"]');
    var $div    = $button.next();

    $div.hide('fast');
    $button.removeClass('accordion_active');
}

function accordionToggle(tabname) {
    var $div = $('#dialog_accordion h1[data-tabname="'+tabname+'"]').next();
    $div.is(':visible') ? accordionClose(tabname) : accordionOpen(tabname);
}

function geocodeAndZoom(address) {
    var url    = BASE_URL + 'site/geocode';
    var params = { address:address };
    $.get(url, params, function (reply) {
        // no reply is bad, as is a reply with an error message
        if (! reply) return alert("No response from server. Weird.");
        if (reply.error) return alert(reply.error);

        // put the resulting corrected address into the box, so the user knows what they really got back
        $('#geocode_text').val(reply.address);

        // zoom the map to the extent
        MAP.fitBounds( L.latLngBounds([[reply.s,reply.w],[reply.n,reply.e]]) );
    },'json');
}

function zoomToPlace(placeid) {
    var url    = BASE_URL + 'site/zoomto';
    var params = { id:placeid };
    $.get(url, params, function (reply) {
        // zoom the map to the extent
        MAP.fitBounds( L.latLngBounds([[reply.s,reply.w],[reply.n,reply.e]]) );
    },'json');
}

// this fanmily of functions handlers the UI components for posting form data and geometry, in the form of notes, points, lines, polygons
// these forms are defined in #dialog_accordion and initAccordion()
// processing of these forms when the Save button is clicked, takes place via ajaxForm in initAccordion()  This does the validation of data, ensures that a shape was drawn, etc.
// showTool()  startTool()   stopTool()  etc handle the UI components, showing and hiding the forms, the submit buttons, instruction text, and so on
// there's a disconnect here between SHOWING a tool (revealing the editing form, showing/hiding the file upload widget) versus STARTING a tool (calling enable() on the draw/edit control)
// so one can (for example) reveal the polygon upload form, in drawing mode, but not in fact start the draw tool, e.g. because you're about to populate the tool with an existing shape

function showTool(which,mode) {
    // show the attribute form, hide the Start buttons, explanatory, text, etc
    var $form   = $('#dialog_accordion form.drawtool_form[data-tool="'+which+'"]').show();
    $form[0].reset();
    $form.siblings().hide();

    // mode show the upload widget and the button that says "Upload"  -or-  hide those in favor of the Save button
    // depends on whether we're in upload mode or draw mode
    if (mode == 'upload') {
        $form.find('input.drawtool_submit').hide();
        $form.find('input.drawshp_submit').show();
        $form.find('input[type="file"][name="upload"]').parent().show();
    } else {
        $form.find('input.drawtool_submit').show();
        $form.find('input.drawshp_submit').hide();
        $form.find('input[type="file"][name="upload"]').parent().hide();
    }
}
function hideTool() {
    // hide the attribute forms, show the Start buttons
    // this goes for ALL tool forms
    var $forms = $('#dialog_accordion form.drawtool_form').hide();
    $forms.siblings().show();
}
function stopTool() {
    // clear all drawings that have been finished but not yet uploaded and erased
    DRAWINGS.clearLayers();

    // disable the drawing and editing tools
    DRAWTOOL_NOTE.disable();
    DRAWTOOL_POINT.disable();
    DRAWTOOL_LINE.disable();
    DRAWTOOL_POLYGON.disable();
    EDITCONTROL.disable();

    // hide the attribute forms, show the Start buttons
    hideTool();
}
function startTool(which,mode) {
    // which    see the switch below as to which draw tool would be activated, and the showTool() call as to which tool will be revealed
    // mode     any of (draw,upload)  draw enables the drawing tool, upload enables the upload box via showTool()

    // for starters, terminate any existing tools that may be running
    stopTool();

    // show the attribute form, hide the Start button, etc.
    showTool(which,mode);

    // now start whichever drawing tool was requested (if any)
    if (mode == 'draw') {
        switch (which) {
            case 'note':
                DRAWTOOL_NOTE.enable();
                break;
            case 'point':
                DRAWTOOL_POINT.enable();
                break;
            case 'line':
                DRAWTOOL_LINE.enable();
                break;
            case 'polygon':
                DRAWTOOL_POLYGON.enable();
                break;
        }
    }
}

// this tool accepts a feature type and a feature ID, and fetches from the server the existing core datum (note, point, line, polygon)
// then loads up the appropriate tool, fills in the submission fields, etc. so the current user can modify the info and re-submit it
function loadToolFromFeature(type,id) {
    // clear any current highlight; we're about to overwrite it with a vector drawing
    stopTool();
    highlightFeatureByTypeAndID(null,0);
    $('#dialog_waiting').dialog('open');

    var params = { type:type, id:id };
    var url    = BASE_URL + 'site/fetch_edit';
    $.get(url, params, function (info) {
        // info is not GeoJSON: it's a WKT geometry and a set of attributes
        $('#dialog_waiting').dialog('close');
        if (! info) return alert("Could not fetch this submission from the server. Please report this.");

        // select the accordion to show the editing tool for this type of shape
        var tabname = info.type + 's';
        accordionOpen(tabname);

        // start the vector editor for this type of shape; this implicitly resets the entry form, so do this BEFORE filling in attributes below
        MAP.closePopup();
        showTool(info.type,'draw');

        // lay down the vector features for editing  (may be a multi, right?)
        // while we're at it collect the bounding box, cuz we might want to zoom to it (see below)
        var wkt = new Wkt.Wkt();
        wkt.read(info.geom);

        var bounds  = null;
        var vectors = wkt.toObject().getLayers();
        for (var i=0, l=vectors.length; i<l; i++) {
            // add it to the drawings, yo

            switch (info.type) {
                case 'point':
                    vectors[i].addTo(DRAWINGS);

                    // either define or expand the bbox to accommodate this shape
                    var b = vectors[i].getLatLng();
                    if (bounds) bounds.extend(b);
                    else        bounds = L.latLngBounds([[b.lat-0.0001,b.lng-0.0001],[b.lat+0.0001,b.lng+0.0001]]);

                    break;
                case 'line':
                case 'polygon':
                    vectors[i].setStyle( DRAWINGS_STYLES[info.type] ).addTo(DRAWINGS);

                    // either define or expand the bbox to accommodate this shape
                    var b = vectors[i].getBounds();
                    if (bounds) bounds.extend(b);
                    else        bounds = b;

                    break;
            }

        }
        EDITCONTROL.enable();

        // phase 2
        // tip: startTool() is the most parsimonious way to enable the form, but it also clears/resets it; as such, selecting the form above MUST be done before this step
        // fill in the inputs in that editing tool form
        // this really just means compiling the previous fields into a lengthy text field for the description, and adding some preamble, e.g. "On July 4 2013, Bob Smith said:"
        var textfield = $('#dialog_accordion form.drawtool_form[data-tool="'+info.type+'"] textarea[name="description"]');

        var text = "";
        text += "I would like to submit an edit to a prior edit.";
        text += "\n\n" + "ENTER YOUR COMMENTS HERE" + "\n\n";
        text += "The prior edit on which I am commenting (#"+ info.attributes.id +") reads as follows:\n\n";

        text += "Submitted on:\n" + info.attributes.submitted_when + "\n\n";
        text += "Submitted by:\n" + info.attributes.submitted_by + "\n\n";
        text += "Title:\n" + info.attributes.name + "\n\n";
        text += "Description:\n" + info.attributes.description + "\n\n";

        // go ahead and load up that description
        textfield.val(text);

        // lastly, zoom to the area of the shapes (possibly plural!) so they get a good view
        // tip: because it zooms, they will want it not to zoom -- if you comment this out so it doesn't zoom, they will want it to zoom   either way, the joke's on you  :)
        MAP.fitBounds(bounds);
    }, 'json');
}

// given a layername, look over the popup  (the only .leaflet-popup-content in the DOM) and examine and manipulate it
// this is your chance to postprocess it, adding and hiding fields, adding DIVs and rendering charts within them, and so on
// this should have a few switches to act depending on the "layer" given
function postprocessPopupBubble(layer) {
    var $popup = $('#map .leaflet-popup-content');

    // if there are any #edit_this_feature hyperlinks activate them now
    // as documented in the HOWTO.TXT these will load up the specified feature and submission tool, ready for the current user
    // to complain, dispute, or expand upon the previous note/point/line/polygon submission
    switch (layer) {
        case 'notes':
        case 'points':
        case 'lines':
        case 'polygons':
            // start by attaching a click to the edit link, to call the fetch-and-reedit capability
            var $editlink = $popup.find('a#edit_this_feature[data-type][data-id]');
            $editlink.click(function () {
                var type = $(this).attr('data-type');
                var id   = parseInt( $(this).attr('data-id') );
                loadToolFromFeature(type,id);
            });

            // go the extra step and highlight this feature
            var type = $editlink.attr('data-type');
            var id   = parseInt( $editlink.attr('data-id') );
            highlightFeatureByTypeAndID(type,id);

            break;
    }
}
