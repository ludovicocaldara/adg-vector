/*
Create the directory ONNX inside the PDB to load the ONNX models.

Run as  : SYS
Scope   : Primary PDB

*/

alter session set container=mypdb;

-- change the path accordingly to your database environment. This is fine for OCI BaseDB Systems.
create or replace directory onnx as '/home/oracle/onnx';
grant read on directory onnx to adgvec;

-- put the ONNX models prepared with prepare_model.py in the directory (next steps)
