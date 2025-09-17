/*
This script runs the procedure. It can be run on the primary or the standby to generate the load on one or the other, according to your preference.
Obviously, I created this to be executed on the standby database and show Active Data Guard offload capabilities. :-)

Run as : ADGVEC
Scope  : Standby PDB
*/
set serveroutput on

execute process_embeddings(p_batch_size => 10 , p_iterations => 100 );
commit;

select count(*) from picture_embeddings;
