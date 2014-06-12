<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
class User extends DataMapper {

var $table    = 'users';
var $has_one  = array();
var $has_many = array();
var $default_order_by = array('email');



/************************************************
 * LOGIN & LOGOUT, SETTING PASSWORDS
 ************************************************/

public static function attemptLogin($username,$password) {
    if (! $username) return null; // both required, else immediate failure
    if (! $password) return null; // both required, else immediate failure

    // fetch the user
    $u = new User();
    $u->where('email',$username)->get();
    if (! $u->password) return null; // user not found (or blank password in the database), automatic failure

    // check the password field, a MD5 with 16-byte salt
    $salt  = substr($u->password,0,16);
    $crypt = $salt . md5($salt . $password);

    // if it matched, hand back the User; if not, hand back a null
    if ($crypt != $u->password) return null;
    return $u;
}

public static function encryptPassword($password) {
    $salt  = substr(md5(mt_rand()),0,16); // generate 8 random bytes for a salt, well not entirely random but very good
    $crypt = $salt . md5($salt . $password);
    return $crypt;
}


/************************************************
 * SOME OTHER USEFUL UTILITY FUCNCTIONS
 ************************************************/

public static function validateEmailAddress($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}


/************************************************
 * NOW REAL CLASS INSTANCE METHODS
 ************************************************/




} // end of class