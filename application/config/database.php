<?php  if ( ! defined('BASEPATH')) exit('No direct script access allowed');
/*
 * DATABASE CONNECTIVITY SETTINGS
 * you only need to set the username & password here, since the username & DB name must be the same anyway
 */

$db['default']['username'] = 'mapcollab_template';
$db['default']['password'] = 'abcdefgh12345678';

////////////////////////////////////////////////////////////////////////////
// you shouldn't need to mess with any of this
////////////////////////////////////////////////////////////////////////////

$db['default']['database'] = $db['default']['username'];
$db['default']['hostname'] = 'localhost';
$db['default']['dbdriver'] = 'postgre';
$db['default']['dbprefix'] = '';
$db['default']['pconnect'] = TRUE;
$db['default']['db_debug'] = TRUE;
$db['default']['cache_on'] = FALSE;
$db['default']['cachedir'] = '';
$db['default']['char_set'] = 'utf8';
$db['default']['dbcollat'] = 'utf8_general_ci';
$db['default']['swap_pre'] = '';
$db['default']['autoinit'] = TRUE;
$db['default']['stricton'] = FALSE;

$active_group = 'default';
$active_record = TRUE;

// end of line