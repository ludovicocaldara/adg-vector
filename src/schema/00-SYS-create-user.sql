/*
Creates the user ADGVEC for playing with inferencing and vectors.

Run as : SYS (or another DBA user)
Scope  : Primary PDB
*/

create user adgvec identified by &adgvecpass;
create role vec_role not identified;

-- most developer required grants:
grant db_developer_role to vec_role;

-- usage of ONNX models:
grant create mining model to vec_role;

-- optional: grants for Application Continuity:
grant keep date time to vec_role;
grant keep sysguid to vec_role;

grant vec_role to adgvec;
alter user adgvec quota unlimited on users;
