# schema scripts

The scripts in this directory create the ADGVEC user and schema (just to tables).

Note, for laziness, I haven't created any indexes, as the demo is relatively small. Ensure you do that if you want to scale this up.

## Usage

* run the SQL scripts in alphabetical order. The name contains the user that must be used to run the script (SYS or ADGVEC).
* run the python script after having set up a venv environment and installed the requirements found in `../requirements.txt`.