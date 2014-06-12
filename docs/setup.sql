--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

SET search_path = data, pg_catalog;

DROP INDEX data.core_polygons_idx_geom;
DROP INDEX data.core_points_idx_geom;
DROP INDEX data.core_notes_idx_geom;
ALTER TABLE ONLY data.zoomto DROP CONSTRAINT zoomto_pkey;
ALTER TABLE ONLY data.users DROP CONSTRAINT users_pkey;
ALTER TABLE ONLY data.core_polygons DROP CONSTRAINT core_polygons_pkey;
ALTER TABLE ONLY data.core_points DROP CONSTRAINT core_points_pkey;
ALTER TABLE ONLY data.core_notes DROP CONSTRAINT core_notes_pkey;
ALTER TABLE ONLY data.core_lines DROP CONSTRAINT core_lines_pkey;
ALTER TABLE data.zoomto ALTER COLUMN id DROP DEFAULT;
ALTER TABLE data.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE data.core_polygons ALTER COLUMN id DROP DEFAULT;
ALTER TABLE data.core_points ALTER COLUMN id DROP DEFAULT;
ALTER TABLE data.core_notes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE data.core_lines ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE data.zoomto_gid_seq;
DROP TABLE data.zoomto;
DROP SEQUENCE data.users_id_seq;
DROP TABLE data.users;
DROP SEQUENCE data.core_polygons_id_seq;
DROP TABLE data.core_polygons;
DROP SEQUENCE data.core_points_id_seq;
DROP TABLE data.core_points;
DROP SEQUENCE data.core_notes_id_seq;
DROP TABLE data.core_notes;
DROP SEQUENCE data.core_lines_id_seq;
DROP TABLE data.core_lines;
DROP FUNCTION data.st_geometrytype(public.geometry);
DROP SCHEMA data;
--
-- Name: data; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA data;


SET search_path = data, pg_catalog;

--
-- Name: st_geometrytype(public.geometry); Type: FUNCTION; Schema: data; Owner: -
--

CREATE FUNCTION st_geometrytype(public.geometry) RETURNS text
    LANGUAGE c IMMUTABLE STRICT
    AS '$libdir/postgis-2.0', 'geometry_geometrytype';


SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: core_lines; Type: TABLE; Schema: data; Owner: -; Tablespace: 
--

CREATE TABLE core_lines (
    id integer NOT NULL,
    name text,
    description text,
    status character varying(20) DEFAULT 'Pending'::character varying NOT NULL,
    geom public.geometry(MultiLineString,4326),
    submitted_name character varying(50),
    submitted_when date DEFAULT ('now'::text)::date,
    submitted_email character varying(50),
    submitted_org character varying(50),
    CONSTRAINT core_lines_chk_status CHECK (((status)::text = ANY (ARRAY[('Accepted'::character varying)::text, ('Declined'::character varying)::text, ('Pending'::character varying)::text]))),
    CONSTRAINT core_lines_chk_the_geom_ndims CHECK ((public.ndims(geom) = 2)),
    CONSTRAINT core_lines_chk_the_geom_srid CHECK ((public.srid(geom) = 4326)),
    CONSTRAINT core_lines_chk_the_geom_type CHECK (((geom IS NULL) OR (public.st_geometrytype(geom) = 'ST_MultiLineString'::text)))
);


--
-- Name: core_lines_id_seq; Type: SEQUENCE; Schema: data; Owner: -
--

CREATE SEQUENCE core_lines_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: core_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: data; Owner: -
--

ALTER SEQUENCE core_lines_id_seq OWNED BY core_lines.id;


--
-- Name: core_notes; Type: TABLE; Schema: data; Owner: -; Tablespace: 
--

CREATE TABLE core_notes (
    id integer NOT NULL,
    name text,
    description text,
    geom public.geometry(Point,4326),
    status character varying(20) DEFAULT 'Pending'::character varying NOT NULL,
    submitted_name character varying(50),
    submitted_when date DEFAULT ('now'::text)::date,
    submitted_email character varying(50),
    submitted_org character varying(50),
    CONSTRAINT core_notes_chk_status CHECK (((status)::text = ANY (ARRAY[('Accepted'::character varying)::text, ('Declined'::character varying)::text, ('Pending'::character varying)::text]))),
    CONSTRAINT core_notes_chk_the_geom_ndims CHECK ((public.ndims(geom) = 2)),
    CONSTRAINT core_notes_chk_the_geom_srid CHECK ((public.srid(geom) = 4326)),
    CONSTRAINT core_notes_chk_the_geom_type CHECK (((geom IS NULL) OR (public.st_geometrytype(geom) = 'ST_Point'::text)))
);


--
-- Name: core_notes_id_seq; Type: SEQUENCE; Schema: data; Owner: -
--

CREATE SEQUENCE core_notes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: core_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: data; Owner: -
--

ALTER SEQUENCE core_notes_id_seq OWNED BY core_notes.id;


--
-- Name: core_points; Type: TABLE; Schema: data; Owner: -; Tablespace: 
--

CREATE TABLE core_points (
    id integer NOT NULL,
    name text,
    description text,
    status character varying(20) DEFAULT 'Pending'::character varying NOT NULL,
    submitted_name character varying(50),
    submitted_when date DEFAULT ('now'::text)::date,
    submitted_email character varying(50),
    geom public.geometry(MultiPoint,4326),
    submitted_org character varying(50),
    CONSTRAINT core_points_chk_status CHECK (((status)::text = ANY (ARRAY[('Accepted'::character varying)::text, ('Declined'::character varying)::text, ('Pending'::character varying)::text]))),
    CONSTRAINT core_points_chk_the_geom_ndims CHECK ((public.ndims(geom) = 2)),
    CONSTRAINT core_points_chk_the_geom_srid CHECK ((public.srid(geom) = 4326)),
    CONSTRAINT core_points_chk_the_geom_type CHECK (((geom IS NULL) OR (public.st_geometrytype(geom) = 'ST_MultiPoint'::text)))
);


--
-- Name: core_points_id_seq; Type: SEQUENCE; Schema: data; Owner: -
--

CREATE SEQUENCE core_points_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: core_points_id_seq; Type: SEQUENCE OWNED BY; Schema: data; Owner: -
--

ALTER SEQUENCE core_points_id_seq OWNED BY core_points.id;


--
-- Name: core_polygons; Type: TABLE; Schema: data; Owner: -; Tablespace: 
--

CREATE TABLE core_polygons (
    id integer NOT NULL,
    name text,
    description text,
    geom public.geometry(MultiPolygon,4326),
    status character varying(20) DEFAULT 'Pending'::character varying NOT NULL,
    submitted_name character varying(50),
    submitted_when date DEFAULT ('now'::text)::date,
    submitted_email character varying(50),
    submitted_org character varying(50),
    CONSTRAINT core_polygons_chk_status CHECK (((status)::text = ANY (ARRAY[('Accepted'::character varying)::text, ('Declined'::character varying)::text, ('Pending'::character varying)::text]))),
    CONSTRAINT core_polygons_chk_the_geom_ndims CHECK ((public.ndims(geom) = 2)),
    CONSTRAINT core_polygons_chk_the_geom_srid CHECK ((public.srid(geom) = 4326)),
    CONSTRAINT core_polygons_chk_the_geom_type CHECK (((geom IS NULL) OR (public.st_geometrytype(geom) = 'ST_MultiPolygon'::text)))
);


--
-- Name: core_polygons_id_seq; Type: SEQUENCE; Schema: data; Owner: -
--

CREATE SEQUENCE core_polygons_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: core_polygons_id_seq; Type: SEQUENCE OWNED BY; Schema: data; Owner: -
--

ALTER SEQUENCE core_polygons_id_seq OWNED BY core_polygons.id;


--
-- Name: users; Type: TABLE; Schema: data; Owner: -; Tablespace: 
--

CREATE TABLE users (
    id integer NOT NULL,
    email character varying(50) NOT NULL,
    password character varying(48) DEFAULT ''::character varying NOT NULL,
    admin boolean DEFAULT false NOT NULL,
    realname character varying(50) DEFAULT ''::character varying NOT NULL,
    organization character varying(50) DEFAULT ''::character varying NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: data; Owner: -
--

CREATE SEQUENCE users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: data; Owner: -
--

ALTER SEQUENCE users_id_seq OWNED BY users.id;


--
-- Name: zoomto; Type: TABLE; Schema: data; Owner: -; Tablespace: 
--

CREATE TABLE zoomto (
    id integer NOT NULL,
    name character varying(100),
    geom public.geometry(MultiPolygon,4326),
    type character varying(100) NOT NULL
);


--
-- Name: zoomto_gid_seq; Type: SEQUENCE; Schema: data; Owner: -
--

CREATE SEQUENCE zoomto_gid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: zoomto_gid_seq; Type: SEQUENCE OWNED BY; Schema: data; Owner: -
--

ALTER SEQUENCE zoomto_gid_seq OWNED BY zoomto.id;


--
-- Name: id; Type: DEFAULT; Schema: data; Owner: -
--

ALTER TABLE ONLY core_lines ALTER COLUMN id SET DEFAULT nextval('core_lines_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: data; Owner: -
--

ALTER TABLE ONLY core_notes ALTER COLUMN id SET DEFAULT nextval('core_notes_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: data; Owner: -
--

ALTER TABLE ONLY core_points ALTER COLUMN id SET DEFAULT nextval('core_points_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: data; Owner: -
--

ALTER TABLE ONLY core_polygons ALTER COLUMN id SET DEFAULT nextval('core_polygons_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: data; Owner: -
--

ALTER TABLE ONLY users ALTER COLUMN id SET DEFAULT nextval('users_id_seq'::regclass);


--
-- Name: id; Type: DEFAULT; Schema: data; Owner: -
--

ALTER TABLE ONLY zoomto ALTER COLUMN id SET DEFAULT nextval('zoomto_gid_seq'::regclass);


--
-- Name: core_lines_pkey; Type: CONSTRAINT; Schema: data; Owner: -; Tablespace: 
--

ALTER TABLE ONLY core_lines
    ADD CONSTRAINT core_lines_pkey PRIMARY KEY (id);


--
-- Name: core_notes_pkey; Type: CONSTRAINT; Schema: data; Owner: -; Tablespace: 
--

ALTER TABLE ONLY core_notes
    ADD CONSTRAINT core_notes_pkey PRIMARY KEY (id);


--
-- Name: core_points_pkey; Type: CONSTRAINT; Schema: data; Owner: -; Tablespace: 
--

ALTER TABLE ONLY core_points
    ADD CONSTRAINT core_points_pkey PRIMARY KEY (id);


--
-- Name: core_polygons_pkey; Type: CONSTRAINT; Schema: data; Owner: -; Tablespace: 
--

ALTER TABLE ONLY core_polygons
    ADD CONSTRAINT core_polygons_pkey PRIMARY KEY (id);


--
-- Name: users_pkey; Type: CONSTRAINT; Schema: data; Owner: -; Tablespace: 
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: zoomto_pkey; Type: CONSTRAINT; Schema: data; Owner: -; Tablespace: 
--

ALTER TABLE ONLY zoomto
    ADD CONSTRAINT zoomto_pkey PRIMARY KEY (id);


--
-- Name: core_notes_idx_geom; Type: INDEX; Schema: data; Owner: -; Tablespace: 
--

CREATE INDEX core_notes_idx_geom ON core_notes USING gist (geom);


--
-- Name: core_points_idx_geom; Type: INDEX; Schema: data; Owner: -; Tablespace: 
--

CREATE INDEX core_points_idx_geom ON core_points USING gist (geom);


--
-- Name: core_polygons_idx_geom; Type: INDEX; Schema: data; Owner: -; Tablespace: 
--

CREATE INDEX core_polygons_idx_geom ON core_polygons USING gist (geom);


--
-- Name: data; Type: ACL; Schema: -; Owner: -
--

REVOKE ALL ON SCHEMA data FROM PUBLIC;
REVOKE ALL ON SCHEMA data FROM postgres;
GRANT ALL ON SCHEMA data TO postgres;
GRANT ALL ON SCHEMA data TO mapcollab_template;


--
-- PostgreSQL database dump complete
--

