ALTER SESSION ENABLE ADG_REDIRECT_DML;
ALTER SESSION DISABLE ADG_REDIRECT_PLSQL;
set serveroutput on

execute process_embeddings(p_batch_size => 10 , p_iterations => 2 );
commit;

select count(*) from cats_vec_clipimg;
