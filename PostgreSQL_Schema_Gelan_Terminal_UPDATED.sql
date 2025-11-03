--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (165f042)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: approvals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.approvals (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    approval_type text NOT NULL,
    reference_id character varying NOT NULL,
    reference_number text,
    requested_by_id character varying NOT NULL,
    assigned_to_id character varying NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    amount numeric(12,2),
    description text NOT NULL,
    request_notes text,
    response_notes text,
    responded_at timestamp without time zone,
    escalated_to_id character varying,
    escalated_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: attendance_device_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_device_settings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    device_name text NOT NULL,
    device_model text,
    serial_number text,
    ip_address text NOT NULL,
    port integer DEFAULT 4370 NOT NULL,
    timeout integer DEFAULT 5000,
    is_active boolean DEFAULT true,
    last_sync_at timestamp without time zone,
    last_import_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: d365_items_preview; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d365_items_preview (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    sync_id character varying NOT NULL,
    item_no character varying NOT NULL,
    description text NOT NULL,
    description2 text,
    type text,
    base_unit_of_measure text,
    unit_price numeric,
    unit_cost numeric,
    inventory numeric,
    vendor_no text,
    vendor_item_no text,
    already_exists boolean DEFAULT false,
    last_date_modified timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: d365_sync_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.d365_sync_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    sync_type character varying NOT NULL,
    status character varying NOT NULL,
    prefix character varying,
    records_imported integer DEFAULT 0,
    records_updated integer DEFAULT 0,
    records_skipped integer DEFAULT 0,
    total_records integer DEFAULT 0,
    error_message text,
    import_data text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: damage_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.damage_reports (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    reception_id character varying NOT NULL,
    view_angle text NOT NULL,
    coordinate_x numeric(5,4),
    coordinate_y numeric(5,4),
    severity text NOT NULL,
    damage_type text,
    description text NOT NULL,
    photo_url text,
    estimated_cost numeric(10,2),
    marked_by_id character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: device_import_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device_import_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    device_id character varying NOT NULL,
    operation_type text NOT NULL,
    status text NOT NULL,
    users_imported integer DEFAULT 0,
    users_updated integer DEFAULT 0,
    users_skipped integer DEFAULT 0,
    error_message text,
    import_data text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: dynamics365_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dynamics365_settings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    bc_url text NOT NULL,
    bc_company text NOT NULL,
    bc_username text NOT NULL,
    bc_password text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_test_date timestamp without time zone,
    last_test_status text,
    last_test_message text,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_by character varying,
    item_prefix text,
    equipment_prefix text,
    sync_interval_hours integer DEFAULT 24,
    last_sync_date timestamp without time zone
);


--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    employee_id text NOT NULL,
    full_name text NOT NULL,
    role text NOT NULL,
    specialty text,
    phone_number text,
    email text,
    garage_id character varying,
    is_active boolean DEFAULT true NOT NULL,
    hire_date timestamp without time zone,
    certifications text[],
    language text DEFAULT 'en'::text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    profile_picture text,
    department text,
    can_approve boolean DEFAULT false,
    approval_limit numeric(12,2),
    supervisor_id character varying,
    device_user_id character varying,
    username text,
    password text
);


--
-- Name: equipment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipment (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    equipment_type text NOT NULL,
    make text NOT NULL,
    model text NOT NULL,
    plate_no text,
    asset_no text,
    new_asset_no text,
    machine_serial text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    remarks text,
    category_id character varying,
    price numeric(12,2),
    plant_number text,
    project_area text,
    assigned_driver_id character varying
);


--
-- Name: equipment_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipment_categories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    background_image text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: equipment_inspections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipment_inspections (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    inspection_number text NOT NULL,
    reception_id character varying NOT NULL,
    service_type text NOT NULL,
    inspector_id character varying NOT NULL,
    inspection_date timestamp without time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'in_progress'::text NOT NULL,
    overall_condition text,
    findings text,
    recommendations text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    approver_id character varying
);


--
-- Name: equipment_locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipment_locations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    equipment_id character varying NOT NULL,
    garage_id character varying,
    location_status text DEFAULT 'in_field'::text NOT NULL,
    arrived_at timestamp without time zone DEFAULT now() NOT NULL,
    departed_at timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    workshop_id character varying
);


--
-- Name: equipment_parts_compatibility; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipment_parts_compatibility (
    equipment_id character varying NOT NULL,
    part_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: equipment_receptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipment_receptions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    reception_number text NOT NULL,
    equipment_id character varying NOT NULL,
    fuel_level text,
    issues_reported text,
    driver_signature text,
    mechanic_id character varying,
    status text DEFAULT 'driver_submitted'::text NOT NULL,
    work_order_id character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    plant_number text,
    project_area text,
    arrival_date timestamp without time zone NOT NULL,
    kilometre_riding numeric(10,2),
    reason_of_maintenance text NOT NULL,
    driver_id character varying NOT NULL,
    service_type text,
    admin_issues_reported text,
    inspection_officer_id character varying
);


--
-- Name: garages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.garages (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    location text NOT NULL,
    type text NOT NULL,
    capacity integer,
    contact_person text,
    phone_number text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: inspection_checklist_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inspection_checklist_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    inspection_id character varying NOT NULL,
    item_number integer NOT NULL,
    item_description text NOT NULL,
    has_item boolean,
    does_not_have boolean,
    is_working boolean,
    not_working boolean,
    is_broken boolean,
    is_cracked boolean,
    additional_comments text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    item_no text NOT NULL,
    description text NOT NULL,
    description_2 text,
    type text,
    base_unit_of_measure text,
    unit_price numeric(12,2),
    unit_cost numeric(12,2),
    inventory numeric(12,2),
    vendor_no text,
    vendor_item_no text,
    last_date_modified text,
    synced_at timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: maintenance_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.maintenance_records (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    equipment_id character varying NOT NULL,
    mechanic_id character varying,
    maintenance_type text NOT NULL,
    description text NOT NULL,
    operating_hours integer,
    labor_hours numeric(5,2),
    cost numeric(10,2),
    status text DEFAULT 'completed'::text NOT NULL,
    maintenance_date timestamp without time zone NOT NULL,
    completed_date timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: mechanics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mechanics (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    full_name text NOT NULL,
    specialty text,
    phone_number text,
    email text,
    employee_id text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: operating_behavior_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.operating_behavior_reports (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    equipment_id character varying NOT NULL,
    report_date timestamp without time zone NOT NULL,
    operating_hours integer NOT NULL,
    fuel_consumption numeric(10,2),
    productivity text,
    issues_reported text,
    operator_notes text,
    performance_rating integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: part_compatibility; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.part_compatibility (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    part_id character varying NOT NULL,
    make text NOT NULL,
    model text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: parts_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parts_requests (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    request_number text NOT NULL,
    work_order_id character varying,
    reception_id character varying,
    requested_by_id character varying NOT NULL,
    parts_data text NOT NULL,
    total_cost numeric(12,2),
    urgency text DEFAULT 'normal'::text NOT NULL,
    justification text,
    status text DEFAULT 'pending'::text NOT NULL,
    approval_status text DEFAULT 'pending'::text,
    approved_by_id character varying,
    approved_at timestamp without time zone,
    approval_notes text,
    fulfilled_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: parts_storage_locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parts_storage_locations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    part_id character varying NOT NULL,
    garage_id character varying,
    location text NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    min_quantity integer DEFAULT 0,
    notes text,
    last_restocked timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: parts_usage_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parts_usage_history (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    maintenance_record_id character varying NOT NULL,
    part_id character varying NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_cost numeric(10,2),
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: reception_checklists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reception_checklists (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    equipment_type text NOT NULL,
    role text NOT NULL,
    category text NOT NULL,
    sort_order integer DEFAULT 0,
    item_description text NOT NULL,
    default_severity text DEFAULT 'ok'::text,
    requires_photo boolean DEFAULT false,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: reception_inspection_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reception_inspection_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    reception_id character varying NOT NULL,
    checklist_item_id character varying,
    status text NOT NULL,
    severity text DEFAULT 'ok'::text NOT NULL,
    notes text,
    requires_parts boolean DEFAULT false,
    parts_suggested text,
    photo_url text,
    recorded_by_id character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: reorder_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reorder_rules (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    part_id character varying NOT NULL,
    warehouse_id character varying,
    min_quantity integer NOT NULL,
    reorder_quantity integer NOT NULL,
    max_quantity integer,
    lead_time_days integer DEFAULT 7,
    supplier_name text,
    supplier_contact text,
    preferred_supplier text,
    last_order_date timestamp without time zone,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: repair_estimates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.repair_estimates (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    reception_id character varying NOT NULL,
    labor_hours numeric(5,2),
    labor_cost numeric(10,2),
    parts_cost numeric(10,2),
    total_cost numeric(10,2),
    recommendation text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    estimated_completion_days integer,
    generated_by_id character varying,
    approved_by_id character varying,
    approved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: spare_parts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.spare_parts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    part_number text NOT NULL,
    part_name text NOT NULL,
    description text,
    category text NOT NULL,
    price numeric(10,2),
    stock_quantity integer DEFAULT 0,
    stock_status text DEFAULT 'in_stock'::text NOT NULL,
    model_3d_path text,
    specifications text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    image_urls text[],
    location_instructions text,
    tutorial_video_url text,
    required_tools text[],
    install_time_minutes integer,
    install_time_estimates text,
    manufacturing_specs text,
    tutorial_animation_url text
);


--
-- Name: standard_operating_procedures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.standard_operating_procedures (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    sop_code text NOT NULL,
    title text NOT NULL,
    category text NOT NULL,
    target_role text NOT NULL,
    description text NOT NULL,
    steps text NOT NULL,
    required_equipment text[],
    estimated_time_minutes integer,
    safety_requirements text[],
    video_url text,
    document_url text,
    language text DEFAULT 'en'::text,
    version text DEFAULT '1.0'::text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: stock_ledger; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_ledger (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    transaction_type text NOT NULL,
    part_id character varying NOT NULL,
    from_warehouse_id character varying,
    from_zone_id character varying,
    to_warehouse_id character varying,
    to_zone_id character varying,
    quantity integer NOT NULL,
    unit_cost numeric(10,2),
    total_cost numeric(10,2),
    reference_type text,
    reference_id character varying,
    work_order_id character varying,
    performed_by_id character varying,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: stock_reservations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_reservations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    work_order_id character varying NOT NULL,
    part_id character varying NOT NULL,
    warehouse_id character varying,
    zone_id character varying,
    quantity_reserved integer NOT NULL,
    quantity_issued integer DEFAULT 0,
    status text DEFAULT 'reserved'::text NOT NULL,
    reserved_by_id character varying,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_settings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    server_host text DEFAULT '0.0.0.0'::text NOT NULL,
    server_port integer DEFAULT 3000 NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_by character varying
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    full_name text NOT NULL,
    role text DEFAULT 'user'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    language text DEFAULT 'en'::text NOT NULL
);


--
-- Name: warehouse_zones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.warehouse_zones (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    warehouse_id character varying NOT NULL,
    zone_code text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    "row" text,
    "column" text,
    level integer,
    capacity integer,
    current_load integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: warehouses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.warehouses (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    location text NOT NULL,
    type text DEFAULT 'main'::text NOT NULL,
    capacity integer,
    manager_id character varying,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: work_order_required_parts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_order_required_parts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    work_order_id character varying NOT NULL,
    spare_part_id character varying,
    part_name text NOT NULL,
    part_number text NOT NULL,
    stock_status text,
    quantity integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: work_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.work_orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    work_order_number text NOT NULL,
    equipment_id character varying NOT NULL,
    garage_id character varying,
    priority text DEFAULT 'medium'::text NOT NULL,
    work_type text NOT NULL,
    description text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    estimated_hours numeric(5,2),
    actual_hours numeric(5,2),
    notes text,
    created_by_id character varying,
    scheduled_date timestamp without time zone,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    estimated_cost numeric(12,2),
    actual_cost numeric(12,2),
    approval_status text DEFAULT 'not_required'::text,
    approved_by_id character varying,
    approved_at timestamp without time zone,
    approval_notes text,
    completion_approval_status text DEFAULT 'not_required'::text,
    completion_approved_by_id character varying,
    completion_approved_at timestamp without time zone,
    completion_approval_notes text,
    assigned_to_ids text[],
    inspection_id character varying,
    reception_id character varying,
    workshop_id character varying,
    direct_maintenance_cost numeric(12,2),
    overtime_cost numeric(12,2),
    outsource_cost numeric(12,2),
    overhead_cost numeric(12,2),
    is_outsourced boolean DEFAULT false
);


--
-- Name: workshop_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workshop_members (
    workshop_id character varying NOT NULL,
    employee_id character varying NOT NULL,
    role text,
    assigned_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: workshops; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workshops (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    garage_id character varying NOT NULL,
    name text NOT NULL,
    foreman_id character varying,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    monthly_target integer,
    q1_target integer,
    q2_target integer,
    q3_target integer,
    q4_target integer,
    annual_target integer
);


--
-- Name: approvals approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_pkey PRIMARY KEY (id);


--
-- Name: attendance_device_settings attendance_device_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_device_settings
    ADD CONSTRAINT attendance_device_settings_pkey PRIMARY KEY (id);


--
-- Name: d365_items_preview d365_items_preview_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d365_items_preview
    ADD CONSTRAINT d365_items_preview_pkey PRIMARY KEY (id);


--
-- Name: d365_sync_logs d365_sync_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.d365_sync_logs
    ADD CONSTRAINT d365_sync_logs_pkey PRIMARY KEY (id);


--
-- Name: damage_reports damage_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_pkey PRIMARY KEY (id);


--
-- Name: device_import_logs device_import_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_import_logs
    ADD CONSTRAINT device_import_logs_pkey PRIMARY KEY (id);


--
-- Name: dynamics365_settings dynamics365_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dynamics365_settings
    ADD CONSTRAINT dynamics365_settings_pkey PRIMARY KEY (id);


--
-- Name: employees employees_device_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_device_user_id_key UNIQUE (device_user_id);


--
-- Name: employees employees_employee_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_employee_id_unique UNIQUE (employee_id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: employees employees_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_username_key UNIQUE (username);


--
-- Name: equipment_categories equipment_categories_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_categories
    ADD CONSTRAINT equipment_categories_name_unique UNIQUE (name);


--
-- Name: equipment_categories equipment_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_categories
    ADD CONSTRAINT equipment_categories_pkey PRIMARY KEY (id);


--
-- Name: equipment_inspections equipment_inspections_inspection_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_inspections
    ADD CONSTRAINT equipment_inspections_inspection_number_key UNIQUE (inspection_number);


--
-- Name: equipment_inspections equipment_inspections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_inspections
    ADD CONSTRAINT equipment_inspections_pkey PRIMARY KEY (id);


--
-- Name: equipment_locations equipment_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_locations
    ADD CONSTRAINT equipment_locations_pkey PRIMARY KEY (id);


--
-- Name: equipment_parts_compatibility equipment_parts_compatibility_equipment_id_part_id_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_parts_compatibility
    ADD CONSTRAINT equipment_parts_compatibility_equipment_id_part_id_pk PRIMARY KEY (equipment_id, part_id);


--
-- Name: equipment equipment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_pkey PRIMARY KEY (id);


--
-- Name: equipment_receptions equipment_receptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_receptions
    ADD CONSTRAINT equipment_receptions_pkey PRIMARY KEY (id);


--
-- Name: equipment_receptions equipment_receptions_reception_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_receptions
    ADD CONSTRAINT equipment_receptions_reception_number_unique UNIQUE (reception_number);


--
-- Name: garages garages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.garages
    ADD CONSTRAINT garages_pkey PRIMARY KEY (id);


--
-- Name: inspection_checklist_items inspection_checklist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inspection_checklist_items
    ADD CONSTRAINT inspection_checklist_items_pkey PRIMARY KEY (id);


--
-- Name: items items_item_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_item_no_key UNIQUE (item_no);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: maintenance_records maintenance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_records
    ADD CONSTRAINT maintenance_records_pkey PRIMARY KEY (id);


--
-- Name: mechanics mechanics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mechanics
    ADD CONSTRAINT mechanics_pkey PRIMARY KEY (id);


--
-- Name: operating_behavior_reports operating_behavior_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operating_behavior_reports
    ADD CONSTRAINT operating_behavior_reports_pkey PRIMARY KEY (id);


--
-- Name: part_compatibility part_compatibility_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.part_compatibility
    ADD CONSTRAINT part_compatibility_pkey PRIMARY KEY (id);


--
-- Name: parts_requests parts_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_requests
    ADD CONSTRAINT parts_requests_pkey PRIMARY KEY (id);


--
-- Name: parts_requests parts_requests_request_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_requests
    ADD CONSTRAINT parts_requests_request_number_unique UNIQUE (request_number);


--
-- Name: parts_storage_locations parts_storage_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_storage_locations
    ADD CONSTRAINT parts_storage_locations_pkey PRIMARY KEY (id);


--
-- Name: parts_usage_history parts_usage_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_usage_history
    ADD CONSTRAINT parts_usage_history_pkey PRIMARY KEY (id);


--
-- Name: reception_checklists reception_checklists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reception_checklists
    ADD CONSTRAINT reception_checklists_pkey PRIMARY KEY (id);


--
-- Name: reception_inspection_items reception_inspection_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reception_inspection_items
    ADD CONSTRAINT reception_inspection_items_pkey PRIMARY KEY (id);


--
-- Name: reorder_rules reorder_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reorder_rules
    ADD CONSTRAINT reorder_rules_pkey PRIMARY KEY (id);


--
-- Name: repair_estimates repair_estimates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_estimates
    ADD CONSTRAINT repair_estimates_pkey PRIMARY KEY (id);


--
-- Name: spare_parts spare_parts_part_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spare_parts
    ADD CONSTRAINT spare_parts_part_number_unique UNIQUE (part_number);


--
-- Name: spare_parts spare_parts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spare_parts
    ADD CONSTRAINT spare_parts_pkey PRIMARY KEY (id);


--
-- Name: standard_operating_procedures standard_operating_procedures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.standard_operating_procedures
    ADD CONSTRAINT standard_operating_procedures_pkey PRIMARY KEY (id);


--
-- Name: standard_operating_procedures standard_operating_procedures_sop_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.standard_operating_procedures
    ADD CONSTRAINT standard_operating_procedures_sop_code_unique UNIQUE (sop_code);


--
-- Name: stock_ledger stock_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_ledger
    ADD CONSTRAINT stock_ledger_pkey PRIMARY KEY (id);


--
-- Name: stock_reservations stock_reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_reservations
    ADD CONSTRAINT stock_reservations_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: warehouse_zones warehouse_zones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouse_zones
    ADD CONSTRAINT warehouse_zones_pkey PRIMARY KEY (id);


--
-- Name: warehouses warehouses_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_code_unique UNIQUE (code);


--
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- Name: work_order_required_parts work_order_required_parts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_required_parts
    ADD CONSTRAINT work_order_required_parts_pkey PRIMARY KEY (id);


--
-- Name: work_orders work_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_pkey PRIMARY KEY (id);


--
-- Name: work_orders work_orders_work_order_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_work_order_number_unique UNIQUE (work_order_number);


--
-- Name: workshop_members workshop_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshop_members
    ADD CONSTRAINT workshop_members_pkey PRIMARY KEY (workshop_id, employee_id);


--
-- Name: workshops workshops_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshops
    ADD CONSTRAINT workshops_pkey PRIMARY KEY (id);


--
-- Name: approvals approvals_assigned_to_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_assigned_to_id_employees_id_fk FOREIGN KEY (assigned_to_id) REFERENCES public.employees(id);


--
-- Name: approvals approvals_escalated_to_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_escalated_to_id_employees_id_fk FOREIGN KEY (escalated_to_id) REFERENCES public.employees(id);


--
-- Name: approvals approvals_requested_by_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.approvals
    ADD CONSTRAINT approvals_requested_by_id_employees_id_fk FOREIGN KEY (requested_by_id) REFERENCES public.employees(id);


--
-- Name: damage_reports damage_reports_marked_by_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_marked_by_id_employees_id_fk FOREIGN KEY (marked_by_id) REFERENCES public.employees(id);


--
-- Name: damage_reports damage_reports_reception_id_equipment_receptions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damage_reports
    ADD CONSTRAINT damage_reports_reception_id_equipment_receptions_id_fk FOREIGN KEY (reception_id) REFERENCES public.equipment_receptions(id) ON DELETE CASCADE;


--
-- Name: device_import_logs device_import_logs_device_id_attendance_device_settings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_import_logs
    ADD CONSTRAINT device_import_logs_device_id_attendance_device_settings_id_fk FOREIGN KEY (device_id) REFERENCES public.attendance_device_settings(id) ON DELETE CASCADE;


--
-- Name: dynamics365_settings dynamics365_settings_updated_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dynamics365_settings
    ADD CONSTRAINT dynamics365_settings_updated_by_users_id_fk FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: employees employees_garage_id_garages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_garage_id_garages_id_fk FOREIGN KEY (garage_id) REFERENCES public.garages(id);


--
-- Name: employees employees_supervisor_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_supervisor_id_employees_id_fk FOREIGN KEY (supervisor_id) REFERENCES public.employees(id);


--
-- Name: equipment equipment_assigned_driver_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_assigned_driver_id_employees_id_fk FOREIGN KEY (assigned_driver_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: equipment equipment_category_id_equipment_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_category_id_equipment_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.equipment_categories(id) ON DELETE SET NULL;


--
-- Name: equipment_inspections equipment_inspections_approver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_inspections
    ADD CONSTRAINT equipment_inspections_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES public.employees(id);


--
-- Name: equipment_inspections equipment_inspections_inspector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_inspections
    ADD CONSTRAINT equipment_inspections_inspector_id_fkey FOREIGN KEY (inspector_id) REFERENCES public.employees(id);


--
-- Name: equipment_inspections equipment_inspections_reception_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_inspections
    ADD CONSTRAINT equipment_inspections_reception_id_fkey FOREIGN KEY (reception_id) REFERENCES public.equipment_receptions(id) ON DELETE CASCADE;


--
-- Name: equipment_locations equipment_locations_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_locations
    ADD CONSTRAINT equipment_locations_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE;


--
-- Name: equipment_locations equipment_locations_garage_id_garages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_locations
    ADD CONSTRAINT equipment_locations_garage_id_garages_id_fk FOREIGN KEY (garage_id) REFERENCES public.garages(id);


--
-- Name: equipment_locations equipment_locations_workshop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_locations
    ADD CONSTRAINT equipment_locations_workshop_id_fkey FOREIGN KEY (workshop_id) REFERENCES public.workshops(id);


--
-- Name: equipment_parts_compatibility equipment_parts_compatibility_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_parts_compatibility
    ADD CONSTRAINT equipment_parts_compatibility_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE;


--
-- Name: equipment_parts_compatibility equipment_parts_compatibility_part_id_spare_parts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_parts_compatibility
    ADD CONSTRAINT equipment_parts_compatibility_part_id_spare_parts_id_fk FOREIGN KEY (part_id) REFERENCES public.spare_parts(id) ON DELETE CASCADE;


--
-- Name: equipment_receptions equipment_receptions_driver_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_receptions
    ADD CONSTRAINT equipment_receptions_driver_id_employees_id_fk FOREIGN KEY (driver_id) REFERENCES public.employees(id);


--
-- Name: equipment_receptions equipment_receptions_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_receptions
    ADD CONSTRAINT equipment_receptions_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id);


--
-- Name: equipment_receptions equipment_receptions_inspection_officer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_receptions
    ADD CONSTRAINT equipment_receptions_inspection_officer_id_fkey FOREIGN KEY (inspection_officer_id) REFERENCES public.employees(id);


--
-- Name: equipment_receptions equipment_receptions_mechanic_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_receptions
    ADD CONSTRAINT equipment_receptions_mechanic_id_employees_id_fk FOREIGN KEY (mechanic_id) REFERENCES public.employees(id);


--
-- Name: equipment_receptions equipment_receptions_work_order_id_work_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipment_receptions
    ADD CONSTRAINT equipment_receptions_work_order_id_work_orders_id_fk FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id);


--
-- Name: inspection_checklist_items inspection_checklist_items_inspection_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inspection_checklist_items
    ADD CONSTRAINT inspection_checklist_items_inspection_id_fkey FOREIGN KEY (inspection_id) REFERENCES public.equipment_inspections(id) ON DELETE CASCADE;


--
-- Name: maintenance_records maintenance_records_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_records
    ADD CONSTRAINT maintenance_records_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE;


--
-- Name: maintenance_records maintenance_records_mechanic_id_mechanics_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.maintenance_records
    ADD CONSTRAINT maintenance_records_mechanic_id_mechanics_id_fk FOREIGN KEY (mechanic_id) REFERENCES public.mechanics(id);


--
-- Name: operating_behavior_reports operating_behavior_reports_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operating_behavior_reports
    ADD CONSTRAINT operating_behavior_reports_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE;


--
-- Name: part_compatibility part_compatibility_part_id_spare_parts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.part_compatibility
    ADD CONSTRAINT part_compatibility_part_id_spare_parts_id_fk FOREIGN KEY (part_id) REFERENCES public.spare_parts(id) ON DELETE CASCADE;


--
-- Name: parts_requests parts_requests_approved_by_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_requests
    ADD CONSTRAINT parts_requests_approved_by_id_employees_id_fk FOREIGN KEY (approved_by_id) REFERENCES public.employees(id);


--
-- Name: parts_requests parts_requests_reception_id_equipment_receptions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_requests
    ADD CONSTRAINT parts_requests_reception_id_equipment_receptions_id_fk FOREIGN KEY (reception_id) REFERENCES public.equipment_receptions(id);


--
-- Name: parts_requests parts_requests_requested_by_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_requests
    ADD CONSTRAINT parts_requests_requested_by_id_employees_id_fk FOREIGN KEY (requested_by_id) REFERENCES public.employees(id);


--
-- Name: parts_requests parts_requests_work_order_id_work_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_requests
    ADD CONSTRAINT parts_requests_work_order_id_work_orders_id_fk FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id);


--
-- Name: parts_storage_locations parts_storage_locations_garage_id_garages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_storage_locations
    ADD CONSTRAINT parts_storage_locations_garage_id_garages_id_fk FOREIGN KEY (garage_id) REFERENCES public.garages(id);


--
-- Name: parts_storage_locations parts_storage_locations_part_id_spare_parts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_storage_locations
    ADD CONSTRAINT parts_storage_locations_part_id_spare_parts_id_fk FOREIGN KEY (part_id) REFERENCES public.spare_parts(id) ON DELETE CASCADE;


--
-- Name: parts_usage_history parts_usage_history_maintenance_record_id_maintenance_records_i; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_usage_history
    ADD CONSTRAINT parts_usage_history_maintenance_record_id_maintenance_records_i FOREIGN KEY (maintenance_record_id) REFERENCES public.maintenance_records(id) ON DELETE CASCADE;


--
-- Name: parts_usage_history parts_usage_history_part_id_spare_parts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_usage_history
    ADD CONSTRAINT parts_usage_history_part_id_spare_parts_id_fk FOREIGN KEY (part_id) REFERENCES public.spare_parts(id);


--
-- Name: reception_inspection_items reception_inspection_items_checklist_item_id_reception_checklis; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reception_inspection_items
    ADD CONSTRAINT reception_inspection_items_checklist_item_id_reception_checklis FOREIGN KEY (checklist_item_id) REFERENCES public.reception_checklists(id);


--
-- Name: reception_inspection_items reception_inspection_items_reception_id_equipment_receptions_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reception_inspection_items
    ADD CONSTRAINT reception_inspection_items_reception_id_equipment_receptions_id FOREIGN KEY (reception_id) REFERENCES public.equipment_receptions(id) ON DELETE CASCADE;


--
-- Name: reception_inspection_items reception_inspection_items_recorded_by_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reception_inspection_items
    ADD CONSTRAINT reception_inspection_items_recorded_by_id_employees_id_fk FOREIGN KEY (recorded_by_id) REFERENCES public.employees(id);


--
-- Name: reorder_rules reorder_rules_part_id_spare_parts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reorder_rules
    ADD CONSTRAINT reorder_rules_part_id_spare_parts_id_fk FOREIGN KEY (part_id) REFERENCES public.spare_parts(id) ON DELETE CASCADE;


--
-- Name: reorder_rules reorder_rules_warehouse_id_warehouses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reorder_rules
    ADD CONSTRAINT reorder_rules_warehouse_id_warehouses_id_fk FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: repair_estimates repair_estimates_approved_by_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_estimates
    ADD CONSTRAINT repair_estimates_approved_by_id_employees_id_fk FOREIGN KEY (approved_by_id) REFERENCES public.employees(id);


--
-- Name: repair_estimates repair_estimates_generated_by_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_estimates
    ADD CONSTRAINT repair_estimates_generated_by_id_employees_id_fk FOREIGN KEY (generated_by_id) REFERENCES public.employees(id);


--
-- Name: repair_estimates repair_estimates_reception_id_equipment_receptions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_estimates
    ADD CONSTRAINT repair_estimates_reception_id_equipment_receptions_id_fk FOREIGN KEY (reception_id) REFERENCES public.equipment_receptions(id) ON DELETE CASCADE;


--
-- Name: stock_ledger stock_ledger_from_warehouse_id_warehouses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_ledger
    ADD CONSTRAINT stock_ledger_from_warehouse_id_warehouses_id_fk FOREIGN KEY (from_warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: stock_ledger stock_ledger_from_zone_id_warehouse_zones_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_ledger
    ADD CONSTRAINT stock_ledger_from_zone_id_warehouse_zones_id_fk FOREIGN KEY (from_zone_id) REFERENCES public.warehouse_zones(id);


--
-- Name: stock_ledger stock_ledger_part_id_spare_parts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_ledger
    ADD CONSTRAINT stock_ledger_part_id_spare_parts_id_fk FOREIGN KEY (part_id) REFERENCES public.spare_parts(id);


--
-- Name: stock_ledger stock_ledger_performed_by_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_ledger
    ADD CONSTRAINT stock_ledger_performed_by_id_employees_id_fk FOREIGN KEY (performed_by_id) REFERENCES public.employees(id);


--
-- Name: stock_ledger stock_ledger_to_warehouse_id_warehouses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_ledger
    ADD CONSTRAINT stock_ledger_to_warehouse_id_warehouses_id_fk FOREIGN KEY (to_warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: stock_ledger stock_ledger_to_zone_id_warehouse_zones_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_ledger
    ADD CONSTRAINT stock_ledger_to_zone_id_warehouse_zones_id_fk FOREIGN KEY (to_zone_id) REFERENCES public.warehouse_zones(id);


--
-- Name: stock_ledger stock_ledger_work_order_id_work_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_ledger
    ADD CONSTRAINT stock_ledger_work_order_id_work_orders_id_fk FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id);


--
-- Name: stock_reservations stock_reservations_part_id_spare_parts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_reservations
    ADD CONSTRAINT stock_reservations_part_id_spare_parts_id_fk FOREIGN KEY (part_id) REFERENCES public.spare_parts(id);


--
-- Name: stock_reservations stock_reservations_reserved_by_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_reservations
    ADD CONSTRAINT stock_reservations_reserved_by_id_employees_id_fk FOREIGN KEY (reserved_by_id) REFERENCES public.employees(id);


--
-- Name: stock_reservations stock_reservations_warehouse_id_warehouses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_reservations
    ADD CONSTRAINT stock_reservations_warehouse_id_warehouses_id_fk FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: stock_reservations stock_reservations_work_order_id_work_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_reservations
    ADD CONSTRAINT stock_reservations_work_order_id_work_orders_id_fk FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE CASCADE;


--
-- Name: stock_reservations stock_reservations_zone_id_warehouse_zones_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_reservations
    ADD CONSTRAINT stock_reservations_zone_id_warehouse_zones_id_fk FOREIGN KEY (zone_id) REFERENCES public.warehouse_zones(id);


--
-- Name: system_settings system_settings_updated_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_updated_by_users_id_fk FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: warehouse_zones warehouse_zones_warehouse_id_warehouses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouse_zones
    ADD CONSTRAINT warehouse_zones_warehouse_id_warehouses_id_fk FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE CASCADE;


--
-- Name: warehouses warehouses_manager_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_manager_id_employees_id_fk FOREIGN KEY (manager_id) REFERENCES public.employees(id);


--
-- Name: work_order_required_parts work_order_required_parts_spare_part_id_spare_parts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_required_parts
    ADD CONSTRAINT work_order_required_parts_spare_part_id_spare_parts_id_fk FOREIGN KEY (spare_part_id) REFERENCES public.spare_parts(id) ON DELETE SET NULL;


--
-- Name: work_order_required_parts work_order_required_parts_work_order_id_work_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_order_required_parts
    ADD CONSTRAINT work_order_required_parts_work_order_id_work_orders_id_fk FOREIGN KEY (work_order_id) REFERENCES public.work_orders(id) ON DELETE CASCADE;


--
-- Name: work_orders work_orders_approved_by_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_approved_by_id_employees_id_fk FOREIGN KEY (approved_by_id) REFERENCES public.employees(id);


--
-- Name: work_orders work_orders_completion_approved_by_id_employees_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_completion_approved_by_id_employees_id_fk FOREIGN KEY (completion_approved_by_id) REFERENCES public.employees(id);


--
-- Name: work_orders work_orders_created_by_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_created_by_id_users_id_fk FOREIGN KEY (created_by_id) REFERENCES public.users(id);


--
-- Name: work_orders work_orders_equipment_id_equipment_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_equipment_id_equipment_id_fk FOREIGN KEY (equipment_id) REFERENCES public.equipment(id) ON DELETE CASCADE;


--
-- Name: work_orders work_orders_garage_id_garages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_garage_id_garages_id_fk FOREIGN KEY (garage_id) REFERENCES public.garages(id);


--
-- Name: work_orders work_orders_workshop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.work_orders
    ADD CONSTRAINT work_orders_workshop_id_fkey FOREIGN KEY (workshop_id) REFERENCES public.workshops(id);


--
-- Name: workshop_members workshop_members_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshop_members
    ADD CONSTRAINT workshop_members_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: workshop_members workshop_members_workshop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshop_members
    ADD CONSTRAINT workshop_members_workshop_id_fkey FOREIGN KEY (workshop_id) REFERENCES public.workshops(id) ON DELETE CASCADE;


--
-- Name: workshops workshops_foreman_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshops
    ADD CONSTRAINT workshops_foreman_id_fkey FOREIGN KEY (foreman_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: workshops workshops_garage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshops
    ADD CONSTRAINT workshops_garage_id_fkey FOREIGN KEY (garage_id) REFERENCES public.garages(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

