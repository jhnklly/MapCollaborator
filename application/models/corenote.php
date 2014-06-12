<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
class CoreNote extends DataMapper {

var $table    = 'core_notes';
var $has_one  = array();
var $has_many = array();
var $default_order_by = array('submitted_when');


// accept WKT as a parameter, convert and store in the DB, and fetch back the geometry in WKT format
// DataMapper ORM won't handle this smoothly so we had to write our own wrappers here
public function setWKT($wkt) {
    $this->db->query("UPDATE {$this->table} SET geom=ST_GeomFromText(?,4326) WHERE id=?", array($this->db->escape_str($wkt), $this->id) );
}
public function getWKT() {
    $wkt = $this->db->query("SELECT ST_AsText(geom) AS wkt FROM {$this->table} WHERE id=?", array($this->id) );
    $wkt = $wkt->row()->wkt;
    return $wkt;
}

// return this feature's bbox, an assocarray with 4 keys:  w  s  e  n
// actually there is no bbox for a point: we just buffer by 30 feet (ish, at USA latitudes)
public function fetchBBOX() {
    $row = $this->db->query("SELECT ST_X(geom)-0.0001 AS w, ST_X(geom)+0.0001 AS e, ST_YMIN(geom)-0.0001 AS s, ST_YMAX(geom)+0.0001 AS n FROM {$this->table} WHERE id=?", array($this->id) )->row();
    $row->w = (float) $row->w;
    $row->s = (float) $row->s;
    $row->e = (float) $row->e;
    $row->n = (float) $row->n;
    return $row;
}



// a function to fetch back the whole set of info for this edit: the id, all fields, and WKT-encoded geometry
public function FetchFullInfo($params) {
    // $params
    // wkt          if TRUE then the "wkt" geometry will be included
    //              otherwise, the attribute will still exist but is NULL

    if (@$params['wkt'])   $geom = "ST_AsText(geom) ";
    else                   $geom = "NULL";

    // eins, zwei, drei, aust!
    $row = $this->db->query("SELECT *, $geom AS wkt FROM {$this->table} WHERE id=?", array($this->id) )->row();
    return $row;
}


} // end of class