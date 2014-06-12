<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');
class Zoomto extends DataMapper {

var $table    = 'zoomto';
var $has_one  = array();
var $has_many = array();
var $default_order_by = array('type,name');


public static function fetchZoomToOptions($includeblank=false) {
    $output = array();

    // assoc of group=>array(id,name)
    $zooms = new Zoomto();
    $zooms->get();
    foreach ($zooms as $z) {
        if (! array_key_exists($z->type,$output) ) {
            $output[$z->type] = array();
            if ($includeblank) $output[$z->type][] = "({$z->type})";
        }
        $output[$z->type][$z->id] = $z->name;
    }

    return $output;
}

public static function fetchBBOXById($id) {
    $ci = get_instance();
    $bbox = $ci->db->query("SELECT ST_XMIN(geom) AS w, ST_XMAX(geom) AS e, ST_YMIN(geom) AS s, ST_YMAX(geom) AS n FROM zoomto WHERE id=?", array($id) )->row();
    return $bbox;
}


} // end of class