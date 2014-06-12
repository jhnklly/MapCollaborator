<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
class Administration extends CI_Controller {

/*********************
 * CONSTRUCTOR
 * fetch the User ID from the session, make sure it's exactly 1 (the admin account)
 * and set $this->user which is very handy since we often refer to the currently-logged-in User
 * (because in your fleshed-out app, userid==1 may not be your Administration criteria; maybe there are multiple admins)
 */
function __construct() {
    parent::__construct();

    // if we're not logged in as an admin, we need to bail right now
    $admin = $this->session->userdata('useradmin');
    if (! $admin) die(redirect(site_url('site/login')));
}


/**************************************************************
 * FRONT PAGE
 **************************************************************/

public function index() {
    redirect(site_url('administration/contributions'));
}



/**************************************************************
 * EDITING PAGES: USER ACCOUNTS
 **************************************************************/

public function users() {
    // all righty then, get started collecting UI components
    // basics like the title and which jQueryUI theme to use
    $data = array();
    $data['htmltitle'] = $this->config->item('htmltitle');
    $data['sitename']  = $this->config->item('sitename');
    $data['jqueryui_theme'] = $this->config->item('jqueryui_theme');

    // simply the list of users
    $data['users'] = new User();
    $data['users']->get();

    $this->load->view('administration/users.phtml',$data);
}


public function user($id) {
    // if they specified a User ID, fetch them and make sure they're real
    // we make use of DataMapper here, to both CREATE and UPDATE a User with the same program code:
    // if no valid ID was given, we're creating
    // all righty then, get started collecting UI components
    // basics like the title and which jQueryUI theme to use
    $data = array();
    $data['htmltitle'] = $this->config->item('htmltitle');
    $data['sitename']  = $this->config->item('sitename');
    $data['jqueryui_theme'] = $this->config->item('jqueryui_theme');

    $data['user'] = new User();
    if ($id) {
        $data['user']->where('id',$id)->get();
        if (! $data['user']->id) return redirect(site_url('administration/users'));
    }

    // not saving? send them to the form
    if (! @$_POST['save']) return $this->load->view('administration/user.phtml',$data);

    // validation: check the name & email and make sure they're not blank
    $error = null;
    if (! User::validateEmailAddress($_POST['email']) ) $error = "The email address is not valid.";

    // validation: if this is a new user, they must have given a password
    if (! $id and ! $_POST['password']) $error = "A password is required for a new user account.";

    // validation: fetch a user with the given email; if there is one, it better be this same user we're already editing
    $already = new User();
    $already->where('email', $_POST['email'])->get();
    if ($already->id !== null and $already->id != $id) $error = "That email is already in use.";

    // validation: done!
    if ($error) {
        $data['error'] = $error;
        return $this->load->view('administration/user_error.phtml',$data);
    }

    // save the fields, simple except for the password which we must encrypt
    $data['user']->email        = $_POST['email'];
    $data['user']->organization = $_POST['organization'];
    $data['user']->realname     = $_POST['realname'];
    if ($_POST['password']) $data['user']->password = User::encryptPassword($_POST['password']);
    $data['user']->save();

    // done!
    return redirect(site_url('administration/users'));
}


public function user_delete() {
    // fetch the specified User, make sure they exist
    $user = new User();
    $user->where('id',$_POST['id'])->get();
    if (! $user->id) return redirect(site_url('administration/users'));

    // SPECIAL RULE: do not delete User #1, the admin
    if ($user->id == 1) return redirect(site_url('administration/users'));

    // go ahead and delete them
    $user->delete();
    return redirect(site_url('administration/users'));
}

/**************************************************************
 * EDITING PAGES: CONTRIBUTIONS
 **************************************************************/

public function contributions() {
    // all righty then, get started collecting UI components
    // basics like the title and which jQueryUI theme to use
    $data = array();
    $data['htmltitle'] = $this->config->item('htmltitle');
    $data['sitename']  = $this->config->item('sitename');
    $data['jqueryui_theme'] = $this->config->item('jqueryui_theme');

    // layer configurations, so the template can iterate over them and generate their legend entries (or not)
    // used for the map
    $data['core_layers'] = $this->config->item('core_layers');
    $data['context_layers'] = $this->config->item('context_layers');

    // data contributions will load via AJAX, so they can dynamically reload and filter
    // so look for contributions_ajax() instead

    $this->load->view('administration/contributions.phtml',$data);
}

public function contribution_details() {
    $output = array();

    // first off, fetch the ORM object for this shape or die trying
    // expected params are "type" and "id" which is all we need
    switch (@$_GET['type']) {
        case 'notes':
            $feature   = new CoreNote();
            break;
        case 'points':
            $feature   = new CorePoint();
            break;
        case 'lines':
            $feature   = new CoreLine();
            break;
        case 'polygons':
            $feature   = new CorePolygon();
            break;
        default:
            return print "Bad type";
    }
    $feature->where('id',$_GET['id'])->get();
    if (! $feature->id) return print "No such contribution. Reload and try again.";

    // the type which is exactly what they sent us
    // more so they can receive this without any "memory" of their own request, as a standalone record, entiendes?
    $output['type'] = $_GET['type'];

    // the bounding box, so we can zoom the map
    $output['bbox'] = $feature->fetchBBOX();

    // the rest of the info via FetchFullInfo()
    $output['attribs'] = $feature->FetchFullInfo(array());

    // go!
    print json_encode($output);
}

public function contributions_ajax($type='') {
    // collect the data contributions OF THE SPECIFIED TYPE dfor display on the Contributions page
    // to edit what fields are shown in the table, see two places:
    // - the contributions_ajax() endpoint in administration.php
    // - the administration/contributions.js and DataTables

    // the fields here are simple barrays of field values in sequence
    // the fields should be the same length and sequence as the headings in your THEAD cuz they'll just be used as-is
    // IMPORTANT:   the first field should always be the ID# of the submission, as cell 0 will be the one targeted to convert the ID# into an edit link (fetch info, show on map, etc)
    //              if you change this to some other field in sequence, make appropriate fixes in contributions.js

    $listing = array();
    switch ($type) {
        case 'notes':
            $items = new CoreNote();
            $items->get();
            foreach ($items as $item) {
                $listing[] = array(
                    $item->id,
                    $item->status,
                    $item->submitted_name,
                    $item->submitted_org,
                    $item->submitted_when,
                    $item->name,
                );
            }
            break;
        case 'points':
            $items = new CorePoint();
            $items->get();
            foreach ($items as $item) {
                $listing[] = array(
                    $item->id,
                    $item->status,
                    $item->submitted_name,
                    $item->submitted_org,
                    $item->submitted_when,
                    $item->name,
                );
            }
            break;
        case 'lines':
            $items = new CoreLine();
            $items->get();
            foreach ($items as $item) {
                $listing[] = array(
                    $item->id,
                    $item->status,
                    $item->submitted_name,
                    $item->submitted_org,
                    $item->submitted_when,
                    $item->name,
                );
            }
            break;
        case 'polygons':
            $items = new CorePolygon();
            $items->get();
            foreach ($items as $item) {
                $listing[] = array(
                    $item->id,
                    $item->status,
                    $item->submitted_name,
                    $item->submitted_org,
                    $item->submitted_when,
                    $item->name,
                );
            }

            break;
    }

    // massage into shape for DataTables and spit it out
    print json_encode(array(
        'data' => $listing
    ));
}

public function contribution_status() {
    // check the status and make sure it's on the list
    if (! in_array($_POST['status'], array('Pending','Accepted','Declined')) ) return print "Bad status";

    // fetch the Contribution, whatever its data type
    switch ($_POST['type']) {
        case 'notes':
            $feature = new CoreNote();
            break;
        case 'points':
            $feature = new CorePoint();
            break;
        case 'lines':
            $feature = new CoreLine();
            break;
        case 'polygons':
            $feature = new CorePolygon();
            break;
        default:
            return print "Bad type";
            break;
    }
    $feature->where('id',@$_POST['id'])->get();
    if (! $feature->id) return print "Could not find that submission. Reload the page and try again.";

    // based on the new status, compose an email
    // they get one in every case, that it's been declined or accepted, or changed to a pending state for review
    // this is an elegant place to also catch that a status is not in fact changing
    switch ($_POST['status']) {
        case $feature->status:
            return print "This submission is already {$feature->status} so no action was taken.";
            break;
        case 'Accepted':
            $template = "status_accepted_email";
            break;
        case 'Declined':
            $template = "status_declined_email";
            break;
        case 'Pending':
            $template = "status_pending_email";
            break;
    }
    $data = array(
        'feature'       =>$feature,
        'message'       =>$_POST['message'],
        'sitename'      => $this->config->item('sitename'),
        'admin_email'   => $this->config->item('email_fromaddr'),
        'admin_name'    => $this->config->item('email_fromname'),
    );
    $body = $this->load->view("administration/$template.phtml", $data, TRUE);

    // we're golden
    // go ahead and save the status
    $feature->status = $_POST['status'];
    $feature->save();

    // and send that email
    $subject = sprintf("[%s] Submission %s: %s", $this->config->item('sitename'), $feature->status, substr($feature->name,0,20) );
    $this->email->initialize( array('mailtype'=>'html') );
    $this->email->from( $this->config->item('email_fromaddr') , $this->config->item('email_fromname') );
    $this->email->to($feature->submitted_email);
    $this->email->subject($subject);
    $this->email->message($body);
    $this->email->send();

    // that's it!
    return print 'ok';
}


public function contributions_download($type='') {
    // from the given $type figure out some params, e.g. the table to download  ... or that we got as bunk type and should bail
    switch ($type) {
        case 'notes':
            $table = new CoreNote();
            $table = $table->table;
            break;
        case 'points':
            $table = new CorePoint();
            $table = $table->table;
            break;
        case 'lines':
            $table = new CoreLine();
            $table = $table->table;
            break;
        case 'polygons':
            $table = new CorePolygon();
            $table = $table->table;
            break;
        default:
            return print "Bad type";
            break;
    }

    // make up filenames and a temp directory, for the shapefile
    $random    = md5(mt_rand() . microtime());
    $temp_dir  = sprintf("%s/%s", $this->config->item('temp_dir'), $random );
    $shp       = sprintf("%s/%s.shp", $temp_dir, $type );
    $shx       = sprintf("%s/%s.shx", $temp_dir, $type );
    $dbf       = sprintf("%s/%s.dbf", $temp_dir, $type );
    $prj       = sprintf("%s/%s.prj", $temp_dir, $type );
    $zipout    = sprintf("%s/%s.zip", $temp_dir, $type );
    $final_url = sprintf("%s/%s/%s.zip", $this->config->item('temp_url'), $random, $type );
    mkdir($temp_dir);

    // shp2pgsql is awesome
    $command = sprintf("%s -f %s -r -u %s -P %s %s %s",
        $this->config->item('pgsql2shp'),
        escapeshellarg($shp),
        escapeshellarg($this->db->username), escapeshellarg($this->db->password),
        escapeshellarg($this->db->database), escapeshellarg($table)
    );
    `$command`;

    // ZIP it up
    $zip = new ZipArchive();
    if ($zip->open($zipout, ZipArchive::CREATE)!==TRUE) die("cannot create ZIP file $zipout\n");
    $zip->addFile($shp, basename($shp) );
    $zip->addFile($shx, basename($shx) );
    $zip->addFile($dbf, basename($dbf) );
    $zip->addFile($prj, basename($prj) );
    $zip->close();

    // ready!
    return print $final_url;
}


} // end of class