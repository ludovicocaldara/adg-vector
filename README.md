# Active Data Guard - AI Inferencing Demo

This lab uses a standby database with Active Data Guard to:

* Load cat images on the primary database
* Load an ONNX multi-modal model (text, images) on the primary database
* Run embedding generation on the standby database and insert the vectors through DML redirection

To demonstrate that the embedding generation doesn't run on the primary database, the primary and standby PDBs can be configured with Observability & Monitoring service to show the load happenind on the standby database.

## Requirements

* An Oracle Cloud Infrastructure (OCI) tenancy with quotas for an Active Data Guard database
* A laptop or VM with:

  * **SQL Developer for VSCode**
  * A Python development environment
  * Connectivity to the databases via SQL*Net (you can configure tunneling if there's a jumphost or bastion)

## Content 

* `terraform/` — Infrastructure as Code (Terraform stack) to spin up the database with Active Data Guard
* `data/` — Image dataset with pets (cats or dogs) to be loaded in the database
* `src/init/` — Scripts to initialize the environment
* `src/schema/` — Scripts to create the empty schema and populate it with the images
* `src/embeddings/` — Scripts to generate the embeddings and do other operations like `select AI`

## Setup

### Initial database setup

1. Spin up the Terraform stack using `terraform/`
2. If the stack does not provision (yet) a PDB, create one to host the schema
3. If the stack uses Clusterware:

    * Create the services `mypdb_ro` and `mypdb_rw` respectively for the Standby and Primary roles.

    Otherwise:

    * Run the script `src/init/init_services.sql` to create startup triggers that start and stop the correct services depending on the role.

4. Run the script `src/init/unlock_dbsnmp.sql` to unlock the DBSNMP user that we''l use with the Observability service.

### Set up the schema

1. As `sys`, create the `adgvec` user with `src/schema/00-SYS-create-user.sql`
2. As `adgvec`, create the empty schema with `src/schema/02-ADGVEC-create-schema.sql`
3. Import the images:

    * With a remote client:
      Use the script `03-ADGVEC-import-images.py` to load them from your local laptop
    * Using a local directory on the DB server:
      Create a directory where you put the images and load them with a PL/SQL (script not provided)

### Set up the Observability

* In the OCI console, go to **Menu -> Observability & management -> Database Management**

    ![OCI Menu pointing to Database Management](doc/images/observability-menu.png)

* The setup steps are not documented yet. It will require setting up dbsnmp and advanced diagnostic credentials.

* Once set up, open the databases and then click on the standby one (there's no way to tell them apart as far as I know)

    ![OCI Menu pointing to Database Management](doc/images/observability-dblist.png)

    ![OCI Menu pointing to Database Management](doc/images/observability-standby.png)

* From `vscode`, open a connection as `sys` to `mypdb_rw` (you might need to set that up using tunnels)

  * Run `src/embeddings/00-SYS-create-directory.sql` to create the directory pointing to `$HOME/onnx`

* From a machine with `OML4py` installed, prepare the `clip` models from HuggingFace using `01-prepare-model.py`

* Copy the generated models in the onnx directory on the primary

* Load the models using a connection as `adgvec` to `mypdb_rw` and running `02-ADGVEC-load-model.sql`

* To show that the embedding generation can be offloaded on the standby, you can use multiple scripts:

  * `03-ADGVEC-embeddings-single-transaction.sql` : this will try to create ALL the embeddings in a single thread without intermediary commits.
      The result is that the standby will spin on CPU. That will give the time to show the CPU load on Observability Performance hub
      ![The standby CPU is loaded](doc/images/observability-standby-loaded.png)

  