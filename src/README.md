# Offloading embedding creation on Active Data Guard 23ai standby database

The scripts contained here set up a database schema, load it with documents (cat images) and create the vector embeddings using ONNX models on the standby database.

## Content

This folder contains three directory with scripts that must be run in the following order:

* `init/` : contains the script to create the services for the `PRIMARY` and `STANDBY` roles (respectively `mypdb_rw` and `mypdb_ro`). 
* `schema/`: contains the scripts to create the `ADGVEC` user and its schema. It also inserts the images as BLOBs using a python script.
* `embedding/`: contains the scripts to load and use the ONNX models and the procedure to generate the embeddings on the standby database.

Check the content of the directories for more details.
