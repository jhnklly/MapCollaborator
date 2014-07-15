<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
class Site extends CI_Controller {

/*********************************************************************
 * FRONT-FACING MAP
 * this consists of 2 immediate parts: the HTML and the JavaScript
 *********************************************************************/

public function index() {
    // if we're not logged in but we should be, bail
    if (! $this->session_is_valid() ) return redirect('site/login');

    // all righty then, get started collecting UI components
    // basics like the title and which jQueryUI theme to use
    $data = array();
    $data['htmltitle'] = $this->config->item('htmltitle');
    $data['sitename']  = $this->config->item('sitename');
    $data['jqueryui_theme'] = $this->config->item('jqueryui_theme');
    $data['jqueryui_theme_full_url'] = $this->config->item('jqueryui_theme_full_url');


    // layer configurations, so the template can iterate over them and generate their legend entries (or not)
    $data['core_layers'] = $this->config->item('core_layers');
    $data['context_layers'] = $this->config->item('context_layers');

    // the year, for copyright info
    $data['year'] = date('Y');

    // the Zoom To option to go to a specific predefined location
    $data['zoomto_options'] = Zoomto::fetchZoomToOptions(TRUE);

    // the user info from the session, if any
    $data['userid']     = $this->session->userdata('userid');
    $data['useradmin']  = $this->session->userdata('useradmin');

    // ready!
    $this->load->view('site/index.phtml', $data);
}

public function zoomto() {
    // validation can be rude here; a blank address should never happen
    // but people can include a & and we must fix that
    if (! $this->session_is_valid() ) return print "Not logged in.";
    if (! @$_GET['id']) return print "No place ID";

    // fetch it and spit it out
    $bbox = Zoomto::fetchBBOXById($_GET['id']);
    header('Content-type: application/json');
    print json_encode($bbox);
}

public function geocode() {
    // validation can be rude here; a blank address should never happen
    // but people can include a & and we must fix that
    if (! $this->session_is_valid() ) return print "Not logged in.";
    $_GET['address'] = trim(@$_GET['address']);
    if (! @$_GET['address']) return print print json_encode(array('error'=>'No address given?'));

    // make up the URL to Bing
    $url = sprintf("http://dev.virtualearth.net/REST/v1/Locations/%s?fomat=json&key=%s", rawurlencode($_GET['address']), $this->config->item('bing_api_key') );
    $info = json_decode(file_get_contents($url));
    $info = $info->resourceSets[0]->resources[0];
    if (! $info) return print json_encode(array('error'=>'Could not find that address.'));
    //print_r($info);

    // the bbox and point are simple
    $output['s']   = $info->bbox[0];
    $output['w']   = $info->bbox[1];
    $output['n']   = $info->bbox[2];
    $output['e']   = $info->bbox[3];
    $output['lat'] = $info->point->coordinates[0];
    $output['lng'] = $info->point->coordinates[1];

    // the corrected address, we sorta ad lib based on what we got back
    // the goal here is to clarify what specific result was found, e.g. correcting a street address from ST to AVE
    if (@$info->address->locality and @$info->address->landmark) {
        $output['address'] = sprintf("%s, %s, %s", $info->address->landmark, $info->address->locality, $info->address->adminDistrict );
    } else {
        $output['address'] = sprintf("%s, %s", $info->address->formattedAddress, $info->address->adminDistrict );
    }

    // done!
    return print json_encode($output);
}


public function fetch_edit() {
    switch (@$_GET['type']) {
        case 'note':
            $info   = new CoreNote();
            $params = array('wkt'=>TRUE);
            $params = null;
            break;
        case 'point':
            $info   = new CorePoint();
            $params = array('wkt'=>TRUE);
            $params = null;
            break;
        case 'line':
            $info   = new CoreLine();
            $params = array('wkt'=>TRUE);
            break;
        case 'polygon':
            $info   = new CorePolygon();
            $params = array('wkt'=>TRUE, 'simplify'=>TRUE);
            break;
        default:
            return print "Bad type";
    }

    // swap out this DataMapper object for the Full Info for this edit submission
    $info->where('id',@$_GET['id'])->get();
    $info = $info->FetchFullInfo($params);
    if (! $info->id) return print "Bad id ({$_GET['type']})";

    // split out the attributes from the geom, since the client handles it more easily that way
    $output = new stdClass();
    $output->type       = $_GET['type'];
    $output->attributes = $info;
    $output->geom       = $info->wkt;
    unset($output->attributes->geom);
    unset($output->attributes->wkt);

    print json_encode($output);
}

public function save_edit() {
    // this big switch handles the 4 different data types that can accept submissions
    // basically we use DataMapper to save all field/value pairs to the database, and you can adjust this field handling as needed for your deployment

    // universal validation: you may want to set up additional validation based on the data type and the fields you added to the 
    if (! filter_var(@$_POST['submitted_email'], FILTER_VALIDATE_EMAIL) ) return print "Please fill in your e-mail address.";
    if (! @$_POST['submitted_name']) return print "Please fill in your name.";
    if (! @$_POST['submitted_org'])  return print "Please fill in your organization.";
    if (! @$_POST['name'])           return print "Please fill in a brief name or title for your edit.";
    if (! @$_POST['description'])    return print "Please fill the description of your edit.";

    // field validation, in a switch for the submission geom type
    // this is in two conceptual parts:
    // - config.php field validation, which is basically limited to "required"
    // - custom validation and processing that config.php couldn't out-guess

    // config.php validation on required fields
    // if the field is required and the value supplied is blank, bail with the "required" errror message
    // if the field is a checkbox type it allows multiple answers and we join these values with a | character

    $specified_fields = $this->config->item('core_layers');
    $specified_fields = @$specified_fields["{$_POST['tool']}s"]['form_fields'];
    if (! $specified_fields) return print "Bad data type: {$_POST['tool']} not a known geometry type.";
    foreach ($specified_fields as $fieldspec) {
        if ($fieldspec['required'] and !@$_POST[$fieldspec['fieldname']]) return print $fieldspec['required'];

        if ($fieldspec['type'] == 'checkbox') {
            $_POST[$fieldspec['fieldname']] = implode("|",$_POST[$fieldspec['fieldname']]);
        }
    }

    // insert custom validation here, in a switch or whatever suits your need

    // almost there!
    // remove these fields since they absolutely should not be editable fields
    unset($_POST['id']);
    unset($_POST['geom']);
    unset($_POST['status']);

    // finally onward to geometry!
    // if there's a shapefile or KML upload, massage it into a list of geometries in WKT format
    // this will match the expected format for $_POST['wkts']  that being a list of WKT geoms
    if ( is_uploaded_file(@$_FILES['upload']['tmp_name']) ) {
        try {
            $_POST['wkts'] = $this->_handleFileUploadAndReturnWKT($_FILES['upload']);
        } catch (Exception $e) {
            return print $e->getMessage();
        }
    } else if (@$_POST['wkts']) {
        // WKT are joined together with | characters, an ad-hoc transfer format since ajaxForm won't preserve [] arrays
        $_POST['wkts'] = explode("|", $_POST['wkts'] );
    } else {
        return print "No upload and no drawings? That's not good.";
    }

    switch (@$_POST['tool']) {
        case 'note':
            // geometry validation: WKT must indicate a POINT
            // Notes are a bit different from the rest; they can never be a MULTIPOINT while points certainly could be
            if (! preg_match('/^(POINT|MULTIPOINT)\([\d\.\,(\)\-\s]+\)$/', $_POST['wkts'][0]) ) return print "Invalid geometry: expected a POINT";

            // okie doke: save those fields!
            $feature = new CoreNote();
            foreach ($_POST as $field=>$value) {
                $feature->{$field} = $value;
            }
            $feature->save();
            $feature->setWKT(@$_POST['wkts'][0]);
            break;
        case 'point':
            // okie doke: save those fields!
            // convert the supplied list of geometries (perhaps only 1) into a WKB string, implicitly validating that the geometry types are right
            // this is done here so we can simply assign the "geom" attribute as WKB ... or else catch an exception and die without creating the stub record
            $feature = new CorePoint();
            try {
                $_POST['geom'] = $feature->WKTListToWKB($_POST['wkts']);
            } catch (Exception $e) {
                return print $e->getMessage();
            }
            foreach ($_POST as $field=>$value) {
                $feature->{$field} = $value;
            }
            $feature->save();
            break;
        case 'line':
            // okie doke: save those fields!
            // convert the supplied list of geometries (perhaps only 1) into a WKB string, implicitly validating that the geometry types are right
            // this is done here so we can simply assign the "geom" attribute as WKB ... or else catch an exception and die without creating the stub record
            $feature = new CoreLine();
            try {
                $_POST['geom'] = $feature->WKTListToWKB($_POST['wkts']);
            } catch (Exception $e) {
                return print $e->getMessage();
            }
            foreach ($_POST as $field=>$value) {
                $feature->{$field} = $value;
            }
            $feature->save();
            break;
        case 'polygon':
            // okie doke: save those fields!
            // convert the supplied list of geometries (perhaps only 1) into a WKB string, implicitly validating that the geometry types are right
            // this is done here so we can simply assign the "geom" attribute as WKB ... or else catch an exception and die without creating the stub record
            $feature = new CorePolygon();
            try {
                $_POST['geom'] = $feature->WKTListToWKB($_POST['wkts']);
            } catch (Exception $e) {
                return print $e->getMessage();
            }
            foreach ($_POST as $field=>$value) {
                $feature->{$field} = $value;
            }
            $feature->save();
            break;
        default:
            return print "Invalid data type";
            break;
    }

    // guess we're golden; simply acknowledge that it's OK
    return print 'ok';
}

// this utility function is called by save_edit()
// it processes a PHP file upload from $_FILES and attempts to generate a single WKT geometry from the uploaded content, that being a multi-point/line/polygon
// this is then suitable to pass to setWKT() or whatever
// this is broken into a function since it's fairly complex, and since it itself breaks into sub-handlers to process KML vs SHP (or other future formats)
private function _handleFileUploadAndReturnWKT($fileupload) {
    $ext = substr(strtolower($fileupload['name']),-4);
    switch ($ext) {
        case '.zip':
            // ZIP file presumably containing a shapefile
            // move the temp file into position
            $random  = md5( mt_rand() . microtime() );
            $dir     = $this->config->item('temp_dir');
            $upfile  = sprintf("%s/%s.zip", $dir, $random );
            move_uploaded_file($fileupload['tmp_name'],$upfile);

            return $this->_handleFileUploadAndReturnWKT_ZIPSHP($upfile);
            break;
        case '.kml':
            // KML file (XML dialect)
            // move the temp file into position
            $random  = md5( mt_rand() . microtime() );
            $dir     = $this->config->item('temp_dir');
            $upfile  = sprintf("%s/%s.kml", $dir, $random );
            move_uploaded_file($fileupload['tmp_name'],$upfile);

            return $this->_handleFileUploadAndReturnWKT_KML($upfile);
            break;
        case '.kmz':
            // KMZ is a ZIP file containing a KML file
            // move the temp file into position
            $random  = md5( mt_rand() . microtime() );
            $dir     = $this->config->item('temp_dir');
            $upfile  = sprintf("%s/%s.kmz", $dir, $random );
            move_uploaded_file($fileupload['tmp_name'],$upfile);

            return $this->_handleFileUploadAndReturnWKT_KMZ($upfile);
            break;
        default:
            // not supported, so bail and let the caller handle the lack of WKT
            throw new Exception("Unsupported file upload type. Must be a .kmz or .kml, or a .zip file containing a shapefile.");
            break;
    }
}

private function _handleFileUploadAndReturnWKT_ZIPSHP($filename) {
    // this will be a ZIP archive with some arbitrary number of files and folders
    // and the capitalization may not match, e.g. roads.DBF and Roads.shp
    // but we have tricks for that below, by ignoring their uploaded filenames

    // create some filenames for the zip/shp/shx/dfb/prj target files
    // these go into a folder together
    $random   = md5(mt_rand() . microtime());
    $temp_dir = sprintf("%s/%s", $this->config->item('temp_dir'), $random );
    $shp      = sprintf("%s/upload.shp", $temp_dir );
    $shx      = sprintf("%s/upload.shx", $temp_dir );
    $dbf      = sprintf("%s/upload.dbf", $temp_dir );
    $prj      = sprintf("%s/upload.prj", $temp_dir );
    mkdir($temp_dir);

    // use case-insensitive checking and just grab the first shp, shx, dbf, and prj that we find
    // go through the ZIP and extract the first SHP, first SHX, and first DBF we find
    $zip      = new ZipArchive;
    $have_shp = false;
    $have_shx = false;
    $have_dbf = false;
    $have_prj = false;
    if (! $zip->open($filename)) throw new Exception("The ZIP file could not be opened.");
    for ($fileindex=0; $fileindex<$zip->numFiles; $fileindex++) {
        $fileinfo  = $zip->statIndex($fileindex);
        $extension = strtolower(substr( $fileinfo['name'],-4));
        switch ($extension) {
            case '.shp':
                file_put_contents($shp, $zip->getFromIndex($fileindex) );
                $have_shp = true;
                break;
            case '.shx':
                file_put_contents($shx, $zip->getFromIndex($fileindex) );
                $have_shx = true;
                break;
            case '.dbf':
                file_put_contents($dbf, $zip->getFromIndex($fileindex) );
                $have_dbf = true;
                break;
            case '.prj':
                file_put_contents($prj, $zip->getFromIndex($fileindex) );
                $have_prj = true;
                break;
        }
    }
    if (! $have_shp or ! $have_shx or ! $have_dbf or ! $have_prj) throw new Exception("Could not find the SHP, SHX, PRJ, and DBF file. All four are required.");

    // reproject it to WGS84 then swap $shp, $shx, $dbf etc to that new copy
    // a bit wasteful if our data are already in WGS84 but we can't readily detect it (even if there's a PRJ, multiple ways to specify WGS84)
    // at any rate we end up with upload_wgs84.shp which is ready to load
    `ogr2ogr -t_srs EPSG:4326 $temp_dir/upload_wgs84.shp $temp_dir/upload.shp`;
    $shp = sprintf("%s/upload_wgs84.shp", $temp_dir );
    $shx = sprintf("%s/upload_wgs84.shx", $temp_dir );
    $dbf = sprintf("%s/upload_wgs84.dbf", $temp_dir );
    $prj = sprintf("%s/upload_wgs84.prj", $temp_dir );
    if (! file_exists($shp) ) throw new Exception("Reprojection failed. Try again with WGS84?");
    if (! file_exists($shx) ) throw new Exception("Reprojection failed. Try again with WGS84?");
    if (! file_exists($dbf) ) throw new Exception("Reprojection failed. Try again with WGS84?");
    if (! file_exists($prj) ) throw new Exception("Reprojection failed. Try again with WGS84?");

    // ready to run ogrinfo to get the polygons
    $command = sprintf("%s -ro -q -al -fields=NO %s", $this->config->item('ogrinfo'), $shp );
    $geoms = `$command`;
    $geoms = explode("\n",$geoms);

    $array_geoms = array();
    foreach ($geoms as $geom) {
        $geom = trim($geom);
        if (! preg_match('/^(POINT|LINESTRING|POLYGON|MULTIPOINT|MULTILINESTRING|MULTIPOLYGON)\s+\([\d\.\-\,\s\(\)]+\)/', $geom)) continue;
        $array_geoms[] = $geom;
    }

    return $array_geoms;
}

private function _handleFileUploadAndReturnWKT_KML($filename) {
    // one great thing about KML: we can presume that it's in WGS84 SRS (EPSG:4326) so we don't need to reproject

    $command = sprintf("%s -ro -q -al -fields=NO %s", $this->config->item('ogrinfo'), $filename );
    $geoms = `$command`;
    $geoms = explode("\n",$geoms);

    $array_geoms = array();
    foreach ($geoms as $geom) {
        $geom = trim($geom);
        if (! preg_match('/^(POINT|LINESTRING|POLYGON|MULTIPOINT|MULTILINESTRING|MULTIPOLYGON)\s+\([\d\.\-\,\s\(\)]+\)/', $geom)) continue;
        $array_geoms[] = $geom;
    }

    return $array_geoms;
}

private function _handleFileUploadAndReturnWKT_KMZ($filename) {
    // open the ZIP file, look for a single document named doc.kml
    $zip = new ZipArchive;
    if (! $zip->open($filename)) throw new Exception("The KMZ file could not be unzipped");

    for ($fileindex=0; $fileindex<$zip->numFiles; $fileindex++) {
        $fileinfo = $zip->statIndex($fileindex);
        $filename = $fileinfo['name'];
        if ($filename != 'doc.kml') continue;

        // okay, so it IS the doc.kml
        // extract it to the filesystem then bail... parsing that doc.kml as a regular KML upload

        $random   = md5( mt_rand() . microtime() );
        $dir      = $this->config->item('temp_dir');
        $kmlfile  = sprintf("%s/%s.kml", $dir, $random );
        file_put_contents($kmlfile, $zip->getFromIndex($fileindex) );

        return $this->_handleFileUploadAndReturnWKT_KML($kmlfile);
    }

    // if we got here then we exhausted the ZIP file and there was no doc.kml
    // so we pitch a fit and let the caller handle it
    throw new Exception("No doc.kml inside that IKMZ file.");
}


/*********************************************************************
 * LOGIN / LOGOUT / ACCOUNT SELF-MANAGEMENT
 * see config.php to determine whether these settings are relevant to you
 *********************************************************************/

// a general wrapper to determine whether we're logged in properly, or else not required to do so
private function session_is_valid() {
    // if we don't require login at all, then I guess we're fine
    if (! $this->config->item('login_required') ) return true;

    // okay, we DO require login; do we have a userID in the session?
    $userid = $this->session->userdata('userid');
    if ($userid) return true;

    // got here then we're not logged in... but we should have been
    return false;
}

public function login() {
    // if they're accessing the login page, destroy their existing session info
    // so no credential-swapping shenanigans are even remotely possible
    $this->session->unset_userdata('userid');
    $this->session->unset_userdata('useradmin');

    // if they sent a username & password, try it and we may just bail right now
    if (@$_POST['email'] and @$_POST['password']) {
        $user = User::attemptLogin($_POST['email'],@$_POST['password']);
        if ($user) {
            $this->session->set_userdata('userid', $user->id);
            $this->session->set_userdata('useradmin', $user->admin == 't');
            return redirect(site_url($user->admin=='t' ? 'administration' : 'site'));
        }
    }

    // basics like the title and which jQueryUI theme to use
    $data = array();
    $data['htmltitle'] = $this->config->item('htmltitle');
    $data['sitename']  = $this->config->item('sitename');
    $data['jqueryui_theme'] = $this->config->item('jqueryui_theme');
    $data['allow_registration'] = $this->config->item('allow_registration');

    $this->load->view('site/login.phtml',$data);
}

public function logout() {
    $this->session->unset_userdata('userid');
    $this->session->unset_userdata('useradmin');
    redirect(site_url());
}

public function signup() {
    // foremost: if we're not allowing self-signup then bail now
    if (! $this->config->item('allow_registration') ) return redirect(site_url());

    // two distinct calling modes:
    // if $_POST is given we act in AJAX mode: validate their signup, and simply reply yes/no
    // if not, then they're hitting this page and want to see the signup form  (which will POST their email to this same controller method)
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        $data = array();
        $data['htmltitle'] = $this->config->item('htmltitle');
        $data['sitename']  = $this->config->item('sitename');
        $data['jqueryui_theme'] = $this->config->item('jqueryui_theme');

        return $this->load->view('site/signup.phtml',$data);
    }

    // okay, they POSTed an email; validate that it looks real and doesn't already exist
    // validation failure can be rude here, simply spitting out the error message as the response body
    if (! User::validateEmailAddress(@$_POST['email']) ) return print "That email address does not look valid.";
    $user = new User();
    $user->where('email',$_POST['email'])->get();
    if ($user->id) return print "That email address is already registered.";

    // other required non-validated fields
    if (! @$_POST['realname'])      return print "All fields are required.";
    if (! @$_POST['organization'])  return print "All fields are required.";

    // okay so we're good to go
    // generate a random password and create their account...
    $password = substr(md5(mt_rand() . microtime()),0,8);
    $user->password     = User::encryptPassword($password);
    $user->email        = $_POST['email'];
    $user->realname     = strip_tags($_POST['realname']);
    $user->organization = strip_tags($_POST['organization']);
    $user->save();

    // ...email them the good news...
    $data = array(
        'user'      => $user,
        'password'  => $password,
        'sitename'  => $this->config->item('sitename'),
        'url'       => site_url(),
    );
    $subject = sprintf("[%s] Thank you for registering", $this->config->item('sitename') );
    $message = $this->load->view('site/signup_email.phtml', $data, TRUE);
    $this->email->initialize( array('mailtype'=>'html') );
    $this->email->from( $this->config->item('email_fromaddr') , $this->config->item('email_fromname') );
    $this->email->to($user->email);
    $this->email->subject($subject);
    $this->email->message($message);
    $this->email->send();

    // and we're done!
    print "Your account has been created. You should receive an email in a few minutes with your password. Remember to check your Spam/Trash folder.";
}

public function forgot() {
    // two distinct calling modes:
    // if $_POST is given we act in AJAX mode: validate their signup, and simply reply yes/no
    // if not, then they're hitting this page and want to see the signup form  (which will POST their email to this same controller method)
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        $data = array();
        $data['htmltitle'] = $this->config->item('htmltitle');
        $data['sitename']  = $this->config->item('sitename');
        $data['jqueryui_theme'] = $this->config->item('jqueryui_theme');

        return $this->load->view('site/forgot.phtml',$data);
    }

    // okay, they POSTed an email; validate that it looks real and that they're really registered
    if (! User::validateEmailAddress(@$_POST['email']) ) return print "That email address does not look valid.";
    $user = new User();
    $user->where('email',$_POST['email'])->get();
    if (! $user->id) return print "That email address is not registered.";

    // guess they're legit: generate a new random password, and email them
    $password = substr(md5(mt_rand() . microtime()),0,8);
    $user->password = User::encryptPassword($password);
    $user->save();

    // ...email them the good news...
    $data = array(
        'user'      => $user,
        'password'  => $password,
        'sitename'  => $this->config->item('sitename'),
        'url'       => site_url(),
    );
    $subject = sprintf("[%s] Password changed", $this->config->item('sitename') );
    $message = $this->load->view('site/forgot_email.phtml', $data, TRUE);
    $this->email->initialize( array('mailtype'=>'html') );
    $this->email->from( $this->config->item('email_fromaddr') , $this->config->item('email_fromname') );
    $this->email->to($user->email);
    $this->email->subject($subject);
    $this->email->message($message);
    $this->email->send();

    // and we're done!
    print "Your password has been changed, and has been emailed to you. Remember to check your Spam/Trash folder.";
}



} // end of class