# this Terraform script sets up a Base DB 23ai with a Data Guard Association in Oracle Cloud Infrastructure (OCI)

data "oci_identity_availability_domain" "ad" {
  compartment_id = var.compartment_ocid
  ad_number      = var.ad_number
}

data "oci_core_network_security_groups" "misc_labs_nsg" {
  display_name   = "misc_labs_nsg"
  compartment_id = var.compartment_ocid
}
data "oci_core_vcns" "misc_labs_vcn" {
  display_name   = "misc_labs_vcn"
  compartment_id = var.compartment_ocid
}

data "oci_core_route_tables" "misc_labs_rt" {
  display_name   = "misc_labs_rt"
  compartment_id = var.compartment_ocid
}

data "oci_core_nat_gateways" "misc_labs_nat_gateway" {
  display_name   = "misc_labs_nat_gateway"
  compartment_id = var.compartment_ocid
}

data "oci_core_security_lists" "misc_labs_securitylist" {
  display_name   = "misc_labs_securitylist"
  compartment_id = var.compartment_ocid
}

resource "oci_core_route_table" "misc_labs_priv_rt" {
  display_name   = "priv_rt_${var.lab_name}_${var.resId}"

  compartment_id = var.compartment_ocid
  vcn_id            = data.oci_core_vcns.misc_labs_vcn.virtual_networks[0].id

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = data.oci_core_nat_gateways.misc_labs_nat_gateway.nat_gateways[0].id
  }
}

# ---------------------------------------------
# Setup the subnet
# ---------------------------------------------
resource "oci_core_subnet" "lab_subnet" {
  display_name      = "subnet_${var.lab_name}_${var.resId}"
  dns_label         = "${var.lab_name}${var.resId}"

  compartment_id    = var.compartment_ocid
  vcn_id            = data.oci_core_vcns.misc_labs_vcn.virtual_networks[0].id
  cidr_block        = "10.0.${var.resId}.0/24"
  route_table_id    = oci_core_route_table.misc_labs_priv_rt.id
  security_list_ids = [data.oci_core_security_lists.misc_labs_securitylist.security_lists[0].id]
}
terraform {
  required_providers {
    oci = {
     source = "oracle/oci"
    }
  }
}
provider "oci" {
  region           = "${var.region}"
}
#*************************************
#             DB System
#*************************************
resource "oci_database_db_system" "adg_db_system" {
  availability_domain     = data.oci_identity_availability_domain.ad.name
  compartment_id          = var.compartment_ocid
  cpu_core_count          = var.cpu_core_count
  data_storage_percentage = var.data_storage_percentage
  data_storage_size_in_gb = var.data_storage_size_in_gb
  database_edition        = var.db_edition
  db_home {
    database {
      admin_password = var.db_admin_password
      db_name        = var.lab_name
      pdb_name       = var.pdb_name
      db_unique_name = "${var.lab_name}_site0"
    }
    db_version     = var.db_version
    display_name = "${var.lab_name}0-23aiHome"
  }
  db_system_options {
    storage_management = var.storage_management
  }
  source = "NONE"
  subnet_id               = oci_core_subnet.lab_subnet.id
  shape                   = var.db_shape
  ssh_public_keys         = [ var.ssh_public_key ]
  hostname                = "${var.lab_name}0-${var.resId}"
  license_model           = var.license_model
  node_count              = var.node_count
  display_name            = "${var.lab_name}0-${var.resId}"
}

data "oci_database_db_homes" "adg_db_homes" {
  compartment_id = var.compartment_ocid
  db_system_id   = oci_database_db_system.adg_db_system.id
}   

data "oci_database_databases" "db" {
  compartment_id = var.compartment_ocid
  db_home_id     = data.oci_database_db_homes.adg_db_homes.db_homes[0].id
  system_id = data.oci_database_db_homes.adg_db_homes.db_homes[0].db_system_id
}

resource "oci_database_data_guard_association" "adg_association" {
  #Required
  creation_type                    = "NewDbSystem"
  database_admin_password          = var.db_admin_password
  database_id                      = data.oci_database_databases.db.databases[0].id
  protection_mode                  = "MAXIMUM_PERFORMANCE"
  transport_type                   = "ASYNC"
  delete_standby_db_home_on_delete = "true"

  peer_db_unique_name = "${var.lab_name}_site1"
  #required for NewDbSystem creation_type
  display_name            = "${var.lab_name}1-${var.resId}"
  shape               = var.db_shape
  subnet_id               = oci_core_subnet.lab_subnet.id
  availability_domain     = data.oci_identity_availability_domain.ad.name
  hostname                = "${var.lab_name}1-${var.resId}"
  cpu_core_count          = var.cpu_core_count
}


data "oci_objectstorage_namespace" "ns" {
  compartment_id = var.compartment_ocid
}

resource "oci_objectstorage_bucket" "image_bucket" {
  name           = var.bucket_name
  compartment_id = var.compartment_ocid
  namespace      = data.oci_objectstorage_namespace.ns.namespace
  access_type    = "NoPublicAccess"
  storage_tier   = "Standard"
}

resource "oci_objectstorage_preauthrequest" "upload_par" {
  access_type         = "AnyObjectReadWrite"
  bucket_listing_action = "ListObjects"
  name                = "${var.bucket_name}-upload-par"
  bucket              = oci_objectstorage_bucket.image_bucket.name
  namespace           = data.oci_objectstorage_namespace.ns.namespace
  time_expires        = timeadd(timestamp(), "4380h")
}

output "namespace" {
  value = data.oci_objectstorage_namespace.ns.namespace
}

output "bucket_name" {
  value = oci_objectstorage_bucket.image_bucket.name
}

output "upload_par_url" {
  value = oci_objectstorage_preauthrequest.upload_par.access_uri
}



