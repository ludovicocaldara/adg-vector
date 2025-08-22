/*
run as : SYS
scope  : Primary PDB
*/
alter session set container=mypdb;
create or replace directory onnx as '/home/oracle/onnx';
-- put the ONNX models prepared with prepare_model.py in the directory
grant read on directory onnx to adgvec;
