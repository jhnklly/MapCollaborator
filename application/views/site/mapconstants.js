///////////////////////////////////////////////////////////////////////////////////
///// GLOBALS YOU WILL WANT TO CONFIGURE
///////////////////////////////////////////////////////////////////////////////////

// the starting view: lon, lat, zoom, and a basemap from BASEMAPS below
var START_LON  = -118.48476;
var START_LAT  =   37.33655;
var START_ZOOM = 6;
var MIN_ZOOM   = START_ZOOM;
var MAX_ZOOM   = START_ZOOM+10;
var START_BASEMAP = 'cpad';

// the URL of the WMSs which render the core dataset layers (core.map) and the context layers (layers.map)
var WMSURL_CORE          = "/cgi-bin/mapserv?map=/maps/mapcollaborator/template/wms/core.map";
var WMSURL_CONTEXT       = "/cgi-bin/mapserv?map=/maps/mapcollaborator/template/wms/context.map";
var WMSURL_COREHIGHLIGHT = "/cgi-bin/mapserv?map=/maps/mapcollaborator/template/wms/highlight.map";

// the predefined set of basemap options, used to generate the basemap selector top-right
// in initMap() after it's used to generate the selector bar, this BASEMAPS structure is trashed, turned into an assoc of buttontext:L.TileLayer pairings
// so we can get fast random access to arbitrary layers by name
var BASEMAPS = [
    {
        button:'cpad',
        //url:'http://tilestache-cdn-1.greeninfo.org/tilestache/tilestache.py/basemap_cpadlight_nolabels/{z}/{x}/{y}.jpg',
        url:'http://tilestache-cdn-1.greeninfo.org/tilestache/tilestache.py/basemap_nolabels/{z}/{x}/{y}.jpg',
        //url:'http://tilestache-cdn-1.greeninfo.org/tilestache/tilestache.py/basemap_withlabels/{z}/{x}/{y}.jpg',
        attrib:'Map tiles and parks data by <a target="_blank" href="http://www.greeninfo.org">GreenInfo Network</a>.<br />Streets data by <a target="_blank" href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
    },
    {
        button:'photo',
        url:'http://{s}.tiles.mapbox.com/v3/greeninfo.map-zudfckcw/{z}/{x}/{y}.jpg',
        attrib:'Map tiles by <a target="_blank" href="http://www.mapbox.com">MapBox</a>.<br />Data &copy; <a target="_blank" href="http://openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>'
    },
    {
        button:'terrain',
        url:'http://{s}.tiles.mapbox.com/v3/greeninfo.map-3x7sb5iq/{z}/{x}/{y}.jpg',
        attrib:'Map tiles by <a target="_blank" href="http://www.mapbox.com">MapBox</a>.<br />Data &copy; <a target="_blank" href="http://openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>'
    },
    {
        button:'topo',
        url:'http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}.jpg',
        attrib:'&copy; <a target="_blank" href="http://esri.com/" target="_blank">ESRI</a>'
    },
    {
        button:'osm',
        url:'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attrib:'&copy; <a target="_blank" href="http://openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>'
    },
];


// a global labels layer
// the resulting L.tileLayer will be added above all others, so the labels show above everything else (well, not markers)
// you can set this to null in order to not use a labels layer at all
LABELS = 'http://{s}.tiles.mapbox.com/v3/greeninfo.map-qwnj26en/{z}/{x}/{y}.png';


///////////////////////////////////////////////////////////////////////////////////
///// GLOBALS YOU WILL PROBABLY NOT WANT TO CONFIGURE
///////////////////////////////////////////////////////////////////////////////////

// the position settings for the popup dialogs
// must be global so we can reassert them when the page resizes
// tip: these are an assoc so a diaog can automagically be mapped to a position setting by its HTML ID
// tip: listing a dialog here is optional; see handleResize()
var DIALOGPOSITIONS = {};
DIALOGPOSITIONS['dialog_accordion'] = { my:'left top', at:'left+40 top+10', of:'#map' };
DIALOGPOSITIONS['dialog_legend']    = { my:'right top', at:'right-9 top+38', of:'#map' };
DIALOGPOSITIONS['dialog_share']     = { my:'center middle', at:'center middle', of:'#map' };

// the max height settings for the popup dialogs
// must be global so we can reassert them when the page resizes
// tip: these are an assoc so a diaog can automagically be mapped to a position setting by its HTML ID
// tip: listing a dialog here is optional; see handleResize()
var DIALOGMAXHEIGHT = {};
DIALOGMAXHEIGHT['dialog_accordion'] = 0.90;
DIALOGMAXHEIGHT['dialog_legend']    = 0.75;

// assocs to look up map layers by name, e.g. toggle layer by name
// this is populated in initMap() based on the content of MORE_LAYERS and CORE_LAYERS as defined in index.phtml and as loaded from config.php
var MAPLAYERS = {};

// a highlight layer, via WMS; uses the "highlight" layer group in wms/highlight.map
// will become a L.TileLayer.WMS later on
var HIGHLIGHT_LAYER;
var HIGHLIGHT_LAYER_ZINDEX = {
    polygons : 11,
    lines    : 11,
    points   : 14,
    notes    : 14
};

// the drawing tools (Point, Line, Polygon, Note) and a L.LayerGroup to store the drawings
// only one should be active at a time, see the stopTool() and startTool() family of functions
// tip: we don't use the Control in its entirety since we only want one tool at a time and no toolbar; the DRAWCONTROL is the control sans toolbar, the rest are individual shape handlers
var DRAWINGS;
var DRAWCONTROL, EDITCONTROL, DRAWTOOL_NOTE, DRAWTOOL_POINT, DRAWTOOL_LINE, DRAWTOOL_POLYGON;
var DRAWINGS_STYLES = {};
DRAWINGS_STYLES['note']      = { };
DRAWINGS_STYLES['point']     = { };
DRAWINGS_STYLES['line']      = { color:'#FF0000', weight:4 };
DRAWINGS_STYLES['polygon']   = { color:'#FF0000', weight:2, fillColor:'#0000FF', fillOpacity:0.10 };

// the style to use when editing features
var EDITING_STYLE = { color: '#fe57a1',  opacity: 0.6, dashArray: '10, 10', fill: true, fillColor: '#fe57a1', fillOpacity: 0.1 };

///////////////////////////////////////////////////////////////////////////////////
///// JAVASCRIPT EXTENSIONS
///////////////////////////////////////////////////////////////////////////////////

// IE8 lacks the indexOf to find where/whether an item appears in an array
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(elt /*, from*/) {
    var len = this.length >>> 0;

    var from = Number(arguments[1]) || 0;
    from = (from < 0) ? Math.ceil(from) : Math.floor(from);
    if (from < 0) from += len;

    for (; from < len; from++) {
        if (from in this && this[from] === elt) return from;
    }
    return -1;
  };
}


// "hello world".capfirst() = "Hello world"
String.prototype.capfirst = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}


///////////////////////////////////////////////////////////////////////////////////
///// LEAFLET EXTENSIONS
///////////////////////////////////////////////////////////////////////////////////

// a control to form the basemap picker across the top
// reads from the given list, and generates the buttons as named; which means that the BASEMAPS entries must match the list given
L.Control.BasemapBar = L.Control.extend({
    options: {
        position: 'topright'
    },
    initialize: function(options) {
        if (! options.layers) throw "L.ControlBasemapBarDialogToggler: missing layers list  [tag, tag, ... ]";
        this.layers  = options.layers;
        this.buttons = {};
        this.map     = null;
    },
    onAdd: function (map) {
        // add a linkage to the map, since we'll be managing map layers
        this.map = map;

        // create a button for each registered layer, complete with a data attribute for the layer to get toggled, and a linkage to the parent control
        // the list of layers is simply a list of texts, which are used literally as the text of the button and as the BASEMAPS entry
        var controlDiv = L.DomUtil.create('div', 'leaflet-control-basemapbar');
        for (var i=0, l=this.layers.length; i<l; i++) {
            var tag              = this.layers[i];
            var button           = L.DomUtil.create('div', 'leaflet-control-basemapbar-option', controlDiv);
            button.control       = this;
            button.innerHTML     = tag.toUpperCase();
            button['data-layer'] = tag;

            // on a click on a button, it calls the control's selectLayer() method by name
            L.DomEvent
                .addListener(button, 'click', L.DomEvent.stopPropagation)
                .addListener(button, 'click', L.DomEvent.preventDefault)
                .addListener(button, 'click', function () {
                    // select the given basemap
                    this.control.selectLayer( this['data-layer'] );
                });

            // add the button to our internal random-access list, so we can arbitrarily fetch buttons later, e.g. to toggle one programatically
            this.buttons[tag] = button;
        }
        return controlDiv;
    },
    selectLayer: function (which) {
        // selectLayer() is *the* public method to trigger the basemap picker to select a layer, highlight appropriately, and trigger a change in the map layers
        for (var tag in this.buttons) {
            var button = this.buttons[tag];
            if (tag == which) {
                L.DomUtil.addClass(button,'leaflet-control-basemapbar-option-active');
                this.map.addLayer(BASEMAPS[tag],true);
            } else {
                L.DomUtil.removeClass(button,'leaflet-control-basemapbar-option-active');
                this.map.removeLayer(BASEMAPS[tag]);
            }
        }
    }
});

// a generic button-on-the-map which when clicked, toggles the visiblity of a JQUI dialog
// the icons are set via CSS based on the leaflet-control-dialogtoggle-JQID class
L.Control.DialogToggler = L.Control.extend({
    options: {
        position: 'topleft'
    },
    initialize: function(options) {
        if (! options.jqid)   throw "L.Control.DialogToggler: missing required option: jqid";
        if (! options.tooltip)      throw "L.Control.DialogToggler: missing required option: tooltip";

        this.jqid     = options.jqid;
        this.tooltip  = options.tooltip;
        this.dialog   = jQuery('#' + this.jqid); // a reference to the #selector jQuery element
    },
    onAdd: function (map) {
        var controlDiv     = L.DomUtil.create('div', 'leaflet-control-dialogtoggle');
        controlDiv.title   = this.tooltip;
        controlDiv.control = this;

        // add a class based on the JQID, to differentiate the buttons in CSS, e.g. leaflet-control-dialogtoggle-dialog_share can get a different background-image or color
        L.DomUtil.addClass(controlDiv, 'leaflet-control-dialogtoggle-' + this.jqid);

        // keep in mind that the event context is the DIV and not the Control, but there is a .control attribute on the DIV
        L.DomEvent
            .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
            .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
            .addListener(controlDiv, 'click', function () {
                var dialog = this.control.dialog;
                if (dialog.dialog('isOpen')) {
                    dialog.dialog('close');
                } else {
                    dialog.dialog('open');
                }
            });

        return controlDiv;
    }
});

// a simple control to display the GreenInfo logo and credits in the corner of the map
// notably, the logo image defined in CSS as a background-image, so we don't need to hardcode here (CSS tends to be in same folder as images)
L.GreeninfoCreditsControl = L.Control.extend({
    options: {
        position: 'bottomright'
    },
    onAdd: function (map) {
        this._map      = map;

        var container = L.DomUtil.create('div', 'leaflet-greeninfocredits-control', container);
        var link      = L.DomUtil.create('a', '', container);
        link.href       = 'http://www.greeninfo.org/';
        link.target     = '_blank';
        link.innerHTML  = 'Interactive mapping<br/>by GreenInfo Network';

        container.link = link;

        L.DomEvent.addListener(container,'click', function () {
            var link = this.link;
            if ( L.DomUtil.hasClass(link, 'leaflet-greeninfocredits-showlink') ) {
                L.DomUtil.removeClass(link, 'leaflet-greeninfocredits-showlink');
            } else {
                L.DomUtil.addClass(link, 'leaflet-greeninfocredits-showlink');
            }
        });

        return container;
    }
});

// an extension of the L.TileLayer.WMS to include WMS GetFeatureInfo capability when a click is made on the map
// the callback simply opens a L.Popup onto the map
L.TileLayer.WMSWithFeatureInfo = L.TileLayer.WMS.extend({
    onAdd: function (map) {
        L.TileLayer.WMS.prototype.onAdd.call(this, map);
        map.on('click', this.getFeatureInfoFromClickEvent, this);
    },
    onRemove: function (map) {
        L.TileLayer.WMS.prototype.onRemove.call(this, map);
        map.off('click', this.getFeatureInfoFromClickEvent, this);
    },
    getFeatureInfoFromClickEvent: function (evt) {
        // hack! if any of the drawing tools are in use, then we don't want to click-query at all
        // this is specific to the front-facing map (index.js) so not at all a "constant" but 99% of this functionality is same as in the Administration  UI so easiest to just hack around it like this
        if ( DRAWTOOL_NOTE    && DRAWTOOL_NOTE.enabled()    ) return;
        if ( DRAWTOOL_POINT   && DRAWTOOL_POINT.enabled()   ) return;
        if ( DRAWTOOL_LINE    && DRAWTOOL_LINE.enabled()    ) return;
        if ( DRAWTOOL_POLYGON && DRAWTOOL_POLYGON.enabled() ) return;

        // proceed
        var url         = this.composeFeatureInfoUrl(evt.latlng);
        var showResults = L.Util.bind(this.showGetFeatureInfo, this);
        $('#map').addClass('busy'); // specific to MapCollaborator; see CSS for #map.busy
        $.ajax({
            url: url,
            success: function (data, status, xhr) {
                $('#map').removeClass('busy'); // specific to MapCollaborator; see CSS for #map.busy
                var err = typeof data === 'string' ? null : data;
                showResults(err, evt.latlng, data);
            },
            error: function (xhr, status, error) {
                $('#map').removeClass('busy'); // specific to MapCollaborator; see CSS for #map.busy
                showResults(error);
            }
        });
    },
    composeFeatureInfoUrl: function (latlng) {
        var point = this._map.latLngToContainerPoint(latlng, this._map.getZoom());
        var size = this._map.getSize();
        var params = {
            request: 'GetFeatureInfo',
            service: 'WMS',
            srs: 'EPSG:4326',
            styles: this.wmsParams.styles,
            transparent: this.wmsParams.transparent,
            version: this.wmsParams.version,
            format: this.wmsParams.format,
            bbox: this._map.getBounds().toBBoxString(),
            height: size.y,
            width: size.x,
            layers: this.wmsParams.layers,
            query_layers: this.wmsParams.layers,
            info_format: 'text/html'
        };
        params[params.version === '1.3.0' ? 'i' : 'x'] = point.x;
        params[params.version === '1.3.0' ? 'j' : 'y'] = point.y;
        return this._url + L.Util.getParamString(params, this._url, true);
    },
    showGetFeatureInfo: function (err, latlng, content) {
        if (err) { console.log(err); return; } // an error, so do nothing
        if (! content) return; // no content? no bubble

        // load the bubble, then call this generic postprocessor which can do other things to the bubble content,
        // e.g. iterate over fields and look for empty fields, draw charts, whatever
        // tip: your HTML templates can include input[type="hidden"] fields and DIVs with style=display:none if you want to embed non-visible data
        L.popup({ maxWidth:800 }).setLatLng(latlng).setContent(content).openOn(this._map);
        postprocessPopupBubble(this.wmsParams.layers);
    }
});
L.tileLayer.wmsWithFeatureInfo = function (url, options) {
  return new L.TileLayer.WMSWithFeatureInfo(url, options);  
};

// extend the L.TileLayer.WMSWithFeatureInfo defined above to also include the required &STATUS= parameter for Core layers
L.TileLayer.WMSWithFeatureInfoCore = L.TileLayer.WMSWithFeatureInfo.extend({
    composeFeatureInfoUrl: function (latlng) {
        var point = this._map.latLngToContainerPoint(latlng, this._map.getZoom());
        var size = this._map.getSize();
        var params = {
            request: 'GetFeatureInfo',
            service: 'WMS',
            srs: 'EPSG:4326',
            styles: this.wmsParams.styles,
            transparent: this.wmsParams.transparent,
            version: this.wmsParams.version,
            format: this.wmsParams.format,
            bbox: this._map.getBounds().toBBoxString(),
            height: size.y,
            width: size.x,
            layers: this.wmsParams.layers,
            query_layers: this.wmsParams.layers,
            info_format: 'text/html',
            'STATUS' : this.wmsParams.STATUS // the only diff between the Core and the Context
        };
        params[params.version === '1.3.0' ? 'i' : 'x'] = point.x;
        params[params.version === '1.3.0' ? 'j' : 'y'] = point.y;
        return this._url + L.Util.getParamString(params, this._url, true);
    }
});
L.tileLayer.wmsWithFeatureInfoCore = function (url, options) {
  return new L.TileLayer.WMSWithFeatureInfoCore(url, options);  
};

