/*
This script loads the ONNX models generated in the previous step.
The models must be generated (or copied) into the directory created in the step 01.
You can check with:

`select directory_path from dba_directories where directory_name='ONNX';`

If you haven't changed the script, that will be: `/home/oracle/onnx`

Run as : adgvec
Scope  : primary PDB 
*/

BEGIN
  DBMS_VECTOR.LOAD_ONNX_MODEL('ONNX','clip_img.onnx','clipimg');
  DBMS_VECTOR.LOAD_ONNX_MODEL('ONNX','clip_txt.onnx','cliptxt');
END;
/

SELECT model_name, model_size FROM user_mining_models;

SELECT attribute_name, attribute_type, data_type, vector_info FROM user_mining_model_attributes ORDER BY 1;
