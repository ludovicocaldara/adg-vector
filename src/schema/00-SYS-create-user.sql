/*
Creates the user ADGVEC for playing with inferencing and vectors.
Execute as: SYS (or another DBA user)
Scope: PDB

Make sure the DBMS_CLOUD is installed before running this script:
  $ORACLE_HOME/perl/bin/perl $ORACLE_HOME/rdbms/admin/catcon.pl -u sys/your-password -force_pdb_mode 'READ WRITE' -b dbms_cloud_install -d $ORACLE_HOME/rdbms/admin/ -l /tmp catclouduser.sql
  $ORACLE_HOME/perl/bin/perl $ORACLE_HOME/rdbms/admin/catcon.pl -u sys/your-password -force_pdb_mode 'READ WRITE' -b dbms_cloud_install -d $ORACLE_HOME/rdbms/admin/ -l /tmp dbms_cloud_install.sql
*/
create user adgvec identified by WElcome123##;
create role vec_role not identified;
grant db_developer_role to vec_role;
grant create mining model to vec_role;
grant keep date time to vec_role;
grant keep sysguid to vec_role;
grant vec_role to adgvec;
alter user adgvec quota unlimited on users;
grant execute on dbms_cloud to adgvec;
-- we don't use database links as distributed transactions don't work with DML redirection
-- grant create database link to adgvec;
