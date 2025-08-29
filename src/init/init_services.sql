/*
Executes the scripts to create and start the services.

Run as : SYS
Scope  : Primary PDB
*/
show pdbs;
alter session set container=mypdb;

@create_pdb_services.sql
@create_pdb_service_trigger.sql
@execute_pdb_service_trigger.sql

-- the discard state avoids problems with services upon Data Guard switchover
alter pluggable database mypdb discard state;
select name, aq_ha_notification, commit_outcome, session_state_consistency, failover_restore from v$active_services;
