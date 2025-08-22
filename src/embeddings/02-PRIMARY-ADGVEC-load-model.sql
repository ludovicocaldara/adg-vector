/*
run as : adgvec
scope  : primary PDB 
*/
BEGIN
  DBMS_VECTOR.LOAD_ONNX_MODEL('ONNX','clip_img.onnx','clipimg');
  DBMS_VECTOR.LOAD_ONNX_MODEL('ONNX','clip_txt.onnx','cliptxt');
END;
/

SELECT model_name, model_size FROM user_mining_models;

SELECT attribute_name, attribute_type, data_type, vector_info FROM user_mining_model_attributes ORDER BY 1;
