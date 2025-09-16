# init scripts

The scripts here are meant for single-instance databases without Clusterware.
The init_Services.sql will create and start on the correct database two services:

* `mypdb_rw`: the service for the primary database
* `mypdb_ro`: the service for the standby database

This assumes that you have a PDB named `mypdb`. (See ../../terraform for a stack that creates it automatically in BaseDB).
The prefix of the service automatically changes if it's deployed in the context of another pdb.

## Usage

* run `init_services.sql` as SYS in the PDB context. That will run the three scripts `create_pdb_services.sql`, `create_pdb_service_trigger.sql`, `execute_pdb_service_trigger.sql`.
* run `unlock_dbsnmp.sql` as SYS in the CDB$ROOT context if you plan to configure OCI Observability and Management or Enterprise MAnager to monitor the database activity.

## Instructions for Clusterware environments

```bash
# on both nodes:
srvctl add service -db adgvec -service mypdb_rw -pdb mypdb -role PRIMARY \
    -commit_outcome TRUE -failovertype AUTO -failover_restore AUTO -notification TRUE -drain_timeout 30 -stopoption IMMEDIATE \
    -preferred adgvec1,adgvec2

srvctl add service -db adgvec -service mypdb_ro -pdb mypdb -role PHYSICAL_STANDBY \
    -commit_outcome TRUE -failovertype AUTO -failover_restore AUTO -notification TRUE -drain_timeout 30 -stopoption IMMEDIATE \
    -preferred adgvec1,adgvec2

srvctl start service -db adgvec -service mypdb_rw -role
srvctl start service -db adgvec -service mypdb_ro -role
```

Don't forget to discard the PDB state in case it's set by default:

```sql
alter session set container=mypdb;
alter pluggable database mypdb discard state;
select name, aq_ha_notification, commit_outcome, session_state_consistency, failover_restore from v$active_services;
```
