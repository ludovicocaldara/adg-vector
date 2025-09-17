/*
Creates the tables for the adg-vector workshop.

Run as : ADGVEC
Scope  : Primary PDB
*/

-- contains cat images
create table if not exists pictures (
   id       number primary key,
   img_size number,
   img      blob
);

-- contains vector embeddings (1:1 relation with cats)
create table if not exists picture_embeddings (
   id         number,
   embedding vector,
   constraint picture_embeddings_pk primary key ( id ),
   constraint picture_embeddings_fk foreign key ( id ) references pictures ( id )
);
