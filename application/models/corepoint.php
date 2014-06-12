<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
class CorePoint extends DataMapper {

var $table    = 'core_points';
var $has_one  = array();
var $has_many = array();
var $default_order_by = array('submitted_when');


// return this feature's geometry in WKT format
public function getWKT() {
    $wkt = $this->db->query("SELECT ST_AsText(geom) AS wkt FROM {$this->table} WHERE id=?", array($this->id) );
    $wkt = $wkt->row()->wkt;
    return $wkt;
}


// return this feature's bbox, an assocarray with 4 keys:  w  s  e  n
// actually there is no bbox for a point: we just buffer by 30 feet (ish, at USA latitudes)
public function fetchBBOX() {
    $row = $this->db->query("SELECT ST_XMIN(geom) AS w, ST_XMAX(geom) AS e, ST_YMIN(geom) AS s, ST_YMAX(geom) AS n FROM {$this->table} WHERE id=?", array($this->id) )->row();
    $row->w = (float) $row->w;
    $row->s = (float) $row->s;
    $row->e = (float) $row->e;
    $row->n = (float) $row->n;
    return $row;
}



// accept a list of geometries in WKT format, bounce them off PostGIS to get a text-binary string
//      e.g. POINT(0 0) in 4326 is 0101000020E610000000000000000000000000000000000000
// the resulting string can be assigned like any normal text field, e.g. using the DataMapper ORM as usual
//
// this function checks the geometries to make sure they're POINT or MULTIPOINT and if any are not, it throws an exception for the caller to handle
public function WKTListToWKB($wktgeoms) {
    // go over the list and verify that each one fits the required geomtype
    // while we're at it, wrap it in ST_GEOMFROMTEXT() so we have a list of geometry-construction clauses suitable for forming a geom array
    $geom_array = array();
    foreach ($wktgeoms as $geom) {
        if (! preg_match('/^(POINT|MULTIPOINT)\s*\([\d\.\-\s]+\)$/', $geom) ) throw new Exception("Invalid geometry: expected a POINT");
        $geom_array[] = sprintf("ST_GEOMFROMTEXT('%s',4326)", $geom);
    }

    $wkb = sprintf("SELECT MULTI(ST_FORCE_2D(ST_UNION(ARRAY[%s]))) AS wkb", implode(",", $geom_array) );
    $wkb = $this->db->query($wkb)->row()->wkb;
    return $wkb;
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