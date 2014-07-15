<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');

/*
 * The URL and name of this MapCollaborator instance
 */

//
// the title and URL of this app
//
$config['htmltitle']    = "MapCollaborator Template and Demo";
$config['sitename']     = "Template Edition";
$config['base_url']     = 'http://websites.greeninfo.org/greeninfo/staff/jk/mapcollabs/git/mapcollab_template_jk/MapCollaborator/';

// style configs (jmk)
/*
config here or just in css?
fix jquery section so custom/themeroller jquery ui css can be used
$config['style']        = array(
    'font-family'       => "Gotham Narrow Book', sans-serif",
    'color1'       => "rgba(128,105,165,1.0)", // purple
    'color2'       => "rgba(181,209,124,1.0)", // green
    'border-radius'       => "3px", // green
);
*/

//
// when emails are sent from the system such as notices, acceptances, or rejections
// these form the name & address on the email received by the user
// tip: make it a real one so people can simply Reply if they have questions
//
$config['email_fromaddr']     = "john@greeninfo.org";
$config['email_fromname']     = "GreenInfo Network";

//
// enter a random string here
// a good place to go is http://randomkeygen.com/
//
$config['encryption_key'] = '84t50R2Ko2d9Yg4rw4Y54tOpe3mvKg29';

//
// the name for the session cookie
// this should be unique and brief; I find that an abbreviated name of the app works nicely
//
$config['sess_cookie_name'] = 'mapcollab_template';

//
// Bing Maps API key; used for geocoding
//
$config['bing_api_key'] = 'AjBuYw8goYn_CWiqk65Rbf_Cm-j1QFPH-gGfOxjBipxuEB2N3n9yACKu5s8Dl18N';

//
// which jQuery UI theme to use as the base?
// PICK ONLY ONE
// this uses a stock JQUI theme file at Google's CDN, and you'd put your own overrides into some local CSS files
// tip: your own CSS overrides may or may not look good if you later change themes; those JQUI themes do have a lot of unpredictable variations, and you may need to make numerous adjustments to styling
//
//$config['jqueryui_theme'] = 'black-tie';
//$config['jqueryui_theme'] = 'south-street';
$config['jqueryui_theme'] = 'start';
//$config['jqueryui_theme'] = 'sunny';
//$config['jqueryui_theme'] = 'ui-darkness';
//$config['jqueryui_theme'] = 'ui-lightness';
//$config['jqueryui_theme'] = 'vader';
// jmk; new config option for themeroller jquery ui; needs to be ref'd in index.phtml
// TODO: minify css
$config['jqueryui_theme_full_url'] = $config['base_url'] . 'application/views/site/jquery-ui-1.10.4.custom.css';

//
// the core map layers, the ones actually being collaborated
// the WMS rendering is specified in wms/datasets.map, including labels and all
// but this config defines additional map UI features, such as whether to even show that layer
//
// Options per layer:
//      enabled         Should this layer be displayed in the UI and handled at all?
//                      if not, all functionality is disabled and all other settings are effectively ignored
//      onbydefault     Should this layer be checked and made visible when the application first loads?
//      opacity         The default opacity for this layer, from 0 to 100
//      title           In the map UI, this is the title shown in the layer-toggler legend
//      tooltip         In the map UI, this tooltip will be displayed when one mouses over the layer's name in the layer-toggler legend
//      form_fields     A list of the fields to be presented in the editing form, specifying the type of input to use, available options, etc.
//                      Each entry in the list has the following properties:
//                          fieldname   The field name as it appears in the database, e.g. "description"
//                          type        One of these: text  textarea  select  radio  checkbox  custom
//                                      If this is a checkbox or radio, see also "options" to specify the selectable options, and read the warning about acceptable separator strings
//                                      If this is "custom" then a HTML template will be loaded, named application/views/site/editform/LAYERTYPE/custom_FIELDNAME.phtml
//                                      e.g. editform/lines/custom_landvalue.phtml
//                          label       The text to appear above the field
//                                      HTML will not be escaped, and thus may be used, e.g. "Your <b>most recent</b> opinion"
//                          placeholder This will form the placeholder attribute, which browsers use to show default text prompting the user as to expected inputs, e.g. "your name here"
//                                      Only effective for text and textarea, or perhaps custom. Definitely not for checkboxes and selectors.
//                          default     The default value for this input. Optional.
//                                      HTML will be escaped, as HTML should not be part of submissions.
//                          required    Either FALSE or else a string.
//                                      If it's a string, the field must be filled in or else the submission will be rejected with that message, e.g. "Please fill in the title"
//                          options     Only effective for checkbox, radio, and select.
//                                      An assocarray of the options to be laid out: keys are the values for the widget, values are the text labels.
//                                      e.g. array( '1'=>"Yes, Open", '0'=>"No, Closed")
//                                      See also the required option; this would match to the option value (the key of the assocarray), e.g. default to '0 'and not to "No, Closed"
//                                      The labels (assoc values) may contain HTML but keys (option values) may not, e.g.  'closed'=>'<span color="red">Closed</span>'
//                                      Naturally HTML labels are only effective for checkboxes and radioes and not for selectors.
//                                      TIP: Checkboxes allow multiple answers; the selected responses will be joined together with | characters when saved to the database.
//                                          It is up to your processing phase (and also in the admin facility) to split on | characters for presentation.
//                                          Do not use | characters in your values (assoc keys) for checkboxes as they will confuse the splitting-up of values.
// Within the UI, the legend image is hardcoded; see wms/datasets.map for details,
//      which you should be visiting anyway to adjust the collors, etc. for the WMS rendering.
$config['core_layers'] = array();
$config['core_layers']['notes'] = array(
    'enabled'       => TRUE,
    'onbydefault'   => TRUE,
    'opacity'       => 100,
    'title'         => "Notes",
    'tooltip'       => "Notes posted by contributors",
    'edittitle'     => "Post a note on the map",
    'form_fields' => array(
        array('fieldname' =>'name', 'type'=>'text', 'label'=>'A title for this note:', 'default'=>"raquie", 'required'=>"Please fill in the title", 'placeholder'=>"a brief title or subject" ),
        array('fieldname' =>'description', 'type'=>'textarea', 'label'=>'Description:', 'default'=>"", 'required'=>"Please fill in the description", 'placeholder'=>"a title for this note", ),
    ),
);
$config['core_layers']['points'] = array(
    'enabled'       => TRUE,
    'onbydefault'   => TRUE,
    'opacity'       => 100,
    'title'         => "Points",
    'tooltip'       => "Points in the database",
    'edittitle'     => "Add a point",
    'form_fields' => array(
        array('fieldname' =>'name', 'type'=>'text', 'label'=>'A title for this location:', 'default'=>"Lisa", 'required'=>"Please fill in the title", 'placeholder'=>"a brief title or subject" ),
        array('fieldname' =>'description', 'type'=>'textarea', 'label'=>'Description:', 'default'=>"", 'required'=>"Please fill in the description", 'placeholder'=>"describe the location", ),
    ),
);
$config['core_layers']['lines'] = array(
    'enabled'       => TRUE,
    'onbydefault'   => FALSE,
    'opacity'       => 50,
    'title'         => "Lines",
    'tooltip'       => "Lines in the database",
    'edittitle'     => "Add a line",
    'form_fields' => array(
        array('fieldname' =>'name', 'type'=>'text', 'label'=>'A title for this line or path:', 'default'=>"robvie", 'required'=>"Please fill in the title", 'placeholder'=>"a brief title or subject" ),
        array('fieldname' =>'description', 'type'=>'textarea', 'label'=>'Description:', 'default'=>"", 'required'=>"Please fill in the description", 'placeholder'=>"describe this path or route", ),
    ),
);
$config['core_layers']['polygons'] = array(
    'enabled'       => TRUE,
    'onbydefault'   => FALSE,
    'opacity'       => 25,
    'title'         => "Areas",
    'tooltip'       => "Areas in the database",
    'edittitle'     => "Add an area",
    'form_fields' => array(
        array('fieldname' =>'name', 'type'=>'text', 'label'=>'A title for this area:', 'default'=>"nebz", 'required'=>"Please fill in the title", 'placeholder'=>"a brief title or subject" ),
        array('fieldname' =>'description', 'type'=>'textarea', 'label'=>'Description:', 'default'=>"", 'required'=>"Please fill in the description", 'placeholder'=>"describe this area", ),
    ),
);

//
// additional WMS layers
// the WMS rendering is specified in wms/otherlayers.map including labels and their database settings, as well as click-query templates
// this config defines the map UI regarding them, e.g. the list of them, their tooltips in the layer picker, etc.
//
// each layer gets these config variables:
//      wmslayer        The name of the LAYER in wms/context.map
//                      The wmslayer is the primary key for the layer, used to uniquely identify it: the layer in the WMS, the filename for the legend, the layer's internal name within the app.
//                      This is used for rendering, click-query behavior, and other WMS capabilities.
//                      The wmslayer is also used to define the legend, hardcoded as wms/legends/{wmslayer}.png
//                      WARNING: The following names are reserved since they conflict with other functionality
//                          notes     points      lines       polygons
//      title           In the map UI, this is the title shown in the layer-toggler legend
//      onbydefault     Should this layer be checked and made visible when the application first loads?
//      tooltip         In the map UI, this tooltip will be displayed when one mouses over the layer's name in the layer-toggler legend
//      opacity         When the UI first loads, set the opacity slider to this value (0-100 %). This does not require the layer to be onbydefault
//      clickquery      When a click-query is done, is this layer a candidate for fetching info WMS GetFeaturwInfo ?
//                      If not, then clicking one of these features will have no effect.
//                      If so, then see also wms/context.map and define a TEMPLATE for query response. (see mapserver.org for more info)
//                      Clickquery is performed as a simple WMS GetFeatureInfo to MapServer, followed by a callback function which make a popup, could do DOM manipulation/jQuery/etc on the popup content, etc.
//                      The clickquery output would be defined by MapServer's TEMPLATE keyword within each LAYER block and then by the template file's contents.
//      tinylegend      If true, then the legend is presumed to be a single, tiny icon (about 16x16) and will be inserted
//                      into the legend panel after the checkbox and before the layer name. Otherwise, the legend is presumed to be larger
//                      and will appear in a dedicated area beneath the layer's name and opacity slider
$config['context_layers'] = array();
$config['context_layers'][] = array(
    'title'        => 'Towns & Cities',
    'onbydefault'  => TRUE,
    'tooltip'      => "City and town boundaries (UGBs) as of 2010",
    'wmslayer'     => 'towns',
    'opacity'      => 25,
    'clickquery'   => TRUE,
    'tinylegend'   => FALSE,
);

$config['context_layers'][] = array(
    'title'        => 'Schools',
    'onbydefault'  => FALSE,
    'tooltip'      => "California schools as of 2010",
    'wmslayer'     => 'schools',
    'opacity'      => 80,
    'clickquery'   => TRUE,
    'tinylegend'   => TRUE,
);


//
// login and logout capability
// users are stored in the 'users' table in the DB and access via the User model, and are managed via the admin UI
// see the SETUP.TXT for the default admin password, which you should use ASAP to create new accounts specific to this project
//
// login_required
// should the map collaboration UI be restricted only to logged-in users? if so, say TRUE here
// typical behavior (FALSE) allows the general public to use the map collaboration UI, but of course admin capabilities require an admin login
$config['login_required'] = FALSE;
// allow_registration
// should users be allowed to self-register? if TRUE then the login page will have a link allowing them to sign up, and they will be required to validate their email address before they can log in
// that would be most useful for a system which is open to the public, but where we'd like to collect their email/identity
// if this is FALSE then only way to create accounts is via the admin facility
// this is mostly effective if 'login_required' is TRUE; otherwise they will have no need to log in
$config['allow_registration'] = FALSE;


////////////////////////////////////////////////////////////////////////////////
// You shouldn't need to make any changes below here
////////////////////////////////////////////////////////////////////////////////


/*
|--------------------------------------------------------------------------
| GIS COMMAND LINE TOOLS
| pgsql2shp for exporting a PostGIS table to shapefile
| ogrinfo for analyzing shapefiles and KMLs
|--------------------------------------------------------------------------
*/
$config['pgsql2shp'] = "/usr/lib/postgresql/9.2/bin/pgsql2shp";
$config['ogrinfo']   = "/usr/bin/ogrinfo";


/*
|--------------------------------------------------------------------------
| TEMP DIRECTORY AND URL
| for storing temp files, the dirname and the URL of that directory
| very important if you'll be generating downloadable files
| or will be accepting uploaded files and want them stowed someplace
|--------------------------------------------------------------------------
*/
$config['temp_dir'] = "/maps/images.tmp";
$config['temp_url'] = "http://websites.greeninfo.org/images.tmp";


/*
|--------------------------------------------------------------------------
| URI PROTOCOL
|--------------------------------------------------------------------------
| 'AUTO'			Default - auto detects
| 'PATH_INFO'		Uses the PATH_INFO
| 'QUERY_STRING'	Uses the QUERY_STRING
| 'REQUEST_URI'		Uses the REQUEST_URI
| 'ORIG_PATH_INFO'	Uses the ORIG_PATH_INFO
*/
$config['index_page'] = '';
$config['uri_protocol']	= 'AUTO';
$config['url_suffix'] = '';



/*
|--------------------------------------------------------------------------
| Default Language
|--------------------------------------------------------------------------
*/
$config['language']	= 'english';
$config['charset'] = 'UTF-8';

/*
|--------------------------------------------------------------------------
| Enable/Disable System Hooks
|--------------------------------------------------------------------------
|
| If you would like to use the 'hooks' feature you must enable it by
| setting this variable to TRUE (boolean).  See the user guide for details.
|
*/
$config['enable_hooks'] = FALSE;


/*
|--------------------------------------------------------------------------
| Class Extension Prefix
|--------------------------------------------------------------------------
|
| This item allows you to set the filename/classname prefix when extending
| native libraries.  For more information please see the user guide:
|
| http://codeigniter.com/user_guide/general/core_classes.html
| http://codeigniter.com/user_guide/general/creating_libraries.html
|
*/
$config['subclass_prefix'] = 'MY_';


/*
|--------------------------------------------------------------------------
| Allowed URL Characters
|--------------------------------------------------------------------------
|
| This lets you specify with a regular expression which characters are permitted
| within your URLs.  When someone tries to submit a URL with disallowed
| characters they will get a warning message.
|
| As a security measure you are STRONGLY encouraged to restrict URLs to
| as few characters as possible.  By default only these are allowed: a-z 0-9~%.:_-
|
| Leave blank to allow all characters -- but only if you are insane.
|
| DO NOT CHANGE THIS UNLESS YOU FULLY UNDERSTAND THE REPERCUSSIONS!!
|
*/
$config['permitted_uri_chars'] = 'a-z 0-9~%.:_\-';


/*
|--------------------------------------------------------------------------
| Enable Query Strings
|--------------------------------------------------------------------------
|
| By default CodeIgniter uses search-engine friendly segment based URLs:
| example.com/who/what/where/
|
| By default CodeIgniter enables access to the $_GET array.  If for some
| reason you would like to disable it, set 'allow_get_array' to FALSE.
|
| You can optionally enable standard query string based URLs:
| example.com?who=me&what=something&where=here
|
| Options are: TRUE or FALSE (boolean)
|
| The other items let you set the query string 'words' that will
| invoke your controllers and its functions:
| example.com/index.php?c=controller&m=function
|
| Please note that some of the helpers won't work as expected when
| this feature is enabled, since CodeIgniter is designed primarily to
| use segment based URLs.
|
*/
$config['allow_get_array']		= TRUE;
$config['enable_query_strings'] = FALSE;
$config['controller_trigger']	= 'c';
$config['function_trigger']		= 'm';
$config['directory_trigger']	= 'd'; // experimental not currently in use

/*
|--------------------------------------------------------------------------
| Error Logging Threshold
|--------------------------------------------------------------------------
|
| If you have enabled error logging, you can set an error threshold to
| determine what gets logged. Threshold options are:
| You can enable error logging by setting a threshold over zero. The
| threshold determines what gets logged. Threshold options are:
|
|	0 = Disables logging, Error logging TURNED OFF
|	1 = Error Messages (including PHP errors)
|	2 = Debug Messages
|	3 = Informational Messages
|	4 = All Messages
|
| For a live site you'll usually only enable Errors (1) to be logged otherwise
| your log files will fill up very fast.
|
*/
$config['log_threshold'] = 0;

/*
|--------------------------------------------------------------------------
| Error Logging Directory Path
|--------------------------------------------------------------------------
|
| Leave this BLANK unless you would like to set something other than the default
| application/logs/ folder. Use a full server path with trailing slash.
|
*/
$config['log_path'] = '';

/*
|--------------------------------------------------------------------------
| Date Format for Logs
|--------------------------------------------------------------------------
|
| Each item that is logged has an associated date. You can use PHP date
| codes to set your own date formatting
|
*/
$config['log_date_format'] = 'Y-m-d H:i:s';

/*
|--------------------------------------------------------------------------
| Cache Directory Path
|--------------------------------------------------------------------------
|
| Leave this BLANK unless you would like to set something other than the default
| system/cache/ folder.  Use a full server path with trailing slash.
|
*/
$config['cache_path'] = '';

/*
|--------------------------------------------------------------------------
| Encryption Key
|--------------------------------------------------------------------------
|
| If you use the Encryption class or the Session class you
| MUST set an encryption key.  See the user guide for info.
|
*/


/*
|--------------------------------------------------------------------------
| Session Variables
|--------------------------------------------------------------------------
|
| 'sess_cookie_name'		= the name you want for the cookie
| 'sess_expiration'			= the number of SECONDS you want the session to last. Set to zero for no expiration.
| 'sess_expire_on_close'	= Whether to cause the session to expire automatically when the browser window is closed
| 'sess_encrypt_cookie'		= Whether to encrypt the cookie
| 'sess_use_database'		= Whether to save the session data to a database
| 'sess_table_name'			= The name of the session database table
| 'sess_match_ip'			= Whether to match the user's IP address when reading the session data
| 'sess_match_useragent'	= Whether to match the User Agent when reading the session data
| 'sess_time_to_update'		= how many seconds between CI refreshing Session Information
|
*/
// see up top // $config['sess_cookie_name']		= 'mapcollab_session';
$config['sess_expiration']		= 86400;
$config['sess_expire_on_close']	= FALSE;
$config['sess_encrypt_cookie']	= TRUE;
$config['sess_use_database']	= FALSE;
$config['sess_table_name']		= 'sessions';
$config['sess_match_ip']		= FALSE;
$config['sess_match_useragent']	= TRUE;
$config['sess_time_to_update']	= 86400;

/*
|--------------------------------------------------------------------------
| Cookie Related Variables
|--------------------------------------------------------------------------
|
| 'cookie_prefix' = Set a prefix if you need to avoid collisions
| 'cookie_domain' = Set to .your-domain.com for site-wide cookies
| 'cookie_path'   =  Typically will be a forward slash
| 'cookie_secure' =  Cookies will only be set if a secure HTTPS connection exists.
|
*/
$config['cookie_prefix']	= "";
$config['cookie_domain']	= "";
$config['cookie_path']		= "/";
$config['cookie_secure']	= FALSE;

/*
|--------------------------------------------------------------------------
| Global XSS Filtering
|--------------------------------------------------------------------------
|
| Determines whether the XSS filter is always active when GET, POST or
| COOKIE data is encountered
|
*/
$config['global_xss_filtering'] = FALSE;

/*
|--------------------------------------------------------------------------
| Cross Site Request Forgery
|--------------------------------------------------------------------------
| Enables a CSRF cookie token to be set. When set to TRUE, token will be
| checked on a submitted form. If you are accepting user data, it is strongly
| recommended CSRF protection be enabled.
|
| 'csrf_token_name' = The token name
| 'csrf_cookie_name' = The cookie name
| 'csrf_expire' = The number in seconds the token should expire.
*/
$config['csrf_protection'] = FALSE;
$config['csrf_token_name'] = 'csrf_test_name';
$config['csrf_cookie_name'] = 'csrf_cookie_name';
$config['csrf_expire'] = 7200;

/*
|--------------------------------------------------------------------------
| Output Compression
|--------------------------------------------------------------------------
|
| Enables Gzip output compression for faster page loads.  When enabled,
| the output class will test whether your server supports Gzip.
| Even if it does, however, not all browsers support compression
| so enable only if you are reasonably sure your visitors can handle it.
|
| VERY IMPORTANT:  If you are getting a blank page when compression is enabled it
| means you are prematurely outputting something to your browser. It could
| even be a line of whitespace at the end of one of your scripts.  For
| compression to work, nothing can be sent before the output buffer is called
| by the output class.  Do not 'echo' any values with compression enabled.
|
*/
$config['compress_output'] = FALSE;

/*
|--------------------------------------------------------------------------
| Master Time Reference
|--------------------------------------------------------------------------
|
| Options are 'local' or 'gmt'.  This pref tells the system whether to use
| your server's local time as the master 'now' reference, or convert it to
| GMT.  See the 'date helper' page of the user guide for information
| regarding date handling.
|
*/
$config['time_reference'] = 'local';


/*
|--------------------------------------------------------------------------
| Rewrite PHP Short Tags
|--------------------------------------------------------------------------
|
| If your PHP installation does not have short tag support enabled CI
| can rewrite the tags on-the-fly, enabling you to utilize that syntax
| in your view files.  Options are TRUE or FALSE (boolean)
|
*/
$config['rewrite_short_tags'] = FALSE;


/*
|--------------------------------------------------------------------------
| Reverse Proxy IPs
|--------------------------------------------------------------------------
|
| If your server is behind a reverse proxy, you must whitelist the proxy IP
| addresses from which CodeIgniter should trust the HTTP_X_FORWARDED_FOR
| header in order to properly identify the visitor's IP address.
| Comma-delimited, e.g. '10.0.1.200,10.0.1.201'
|
*/
$config['proxy_ips'] = '';


/* End of file config.php */
/* Location: ./application/config/config.php */
