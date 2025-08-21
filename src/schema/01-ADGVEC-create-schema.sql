/*
Creates the tables for the adg-vector workshop.
Run as : ADGVEC
Scope  : PDB
*/
create table if not exists cats (
   id       number primary key,
   img_size number,
   img      blob
);
create table if not exists cats_vec_clipimg (
   id         number,
   embedding vector,
   constraint cats_vec_clipimg_pk primary key ( id ),
   constraint cats_vec_clipimg_fk foreign key ( id ) references cats ( id )
);