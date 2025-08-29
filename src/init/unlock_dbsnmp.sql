/*
If you want to use the OCI Observability & Management service, unlock dbsnmp before attempting to configure it.

run as : SYS
Scope  : CDB$ROOT
*/
alter user dbsnmp IDENTIFIED by &password account unlock container=all;
GRANT CREATE PROCEDURE to dbsnmp container=all;
GRANT SELECT ANY DICTIONARY,  select_catalog_role to dbsnmp container=all;
GRANT ALTER SYSTEM to dbsnmp container=all;
GRANT ADVISOR to dbsnmp container=all;
GRANT EXECUTE ON DBms_workload_Repository to dbsnmp container=all;
