/* now there's the trick:
insert the embeddings with DML redirection from the standby database so that the
embeddings are generated on the standby database and then redirected to the primary database.
*/
alter session enable adg_redirect_dml;

/*
insert into cats_vec_clipimg (id, embedding) 
select id, vector_embedding(clipimg using img as data) from cats where id=1;
ROLLBACK;
-- insert as select doesn't work as it gets:

Error starting at line : 1 in command -
insert into cats_vec_clipimg (id, embedding)
select id, vector_embedding(clipimg using img as data) from cats where id=1
Error at Command Line : 2 Column : 12
Error report -
SQL Error: ORA-40286: remote operations not permitted on mining models

https://docs.oracle.com/error-help/db/ora-40286/40286. 00000 -  "remote operations not permitted on mining models"
*Cause:    An attempt was made to perform queries or DML operations on
           remote tables using local mining models.
*Action:   Remove the reference to remote tables in the statement.
*/

DECLARE
  CURSOR c_embeddings IS
    SELECT c.id, 
           vector_embedding(clipimg USING img AS data) AS embed_vector
    FROM cats c
    LEFT OUTER JOIN cats_vec_clipimg v ON c.id = v.id
    WHERE v.id IS NULL AND c.img IS NOT NULL;

  v_row c_embeddings%ROWTYPE;

BEGIN
  OPEN c_embeddings;
  LOOP
    FETCH c_embeddings INTO v_row;
    EXIT WHEN c_embeddings%NOTFOUND;

    -- Insert one row at a time
    INSERT INTO cats_vec_clipimg (id, embedding)
    VALUES (v_row.id, v_row.embed_vector);
  END LOOP;
  CLOSE c_embeddings;
END;
/
commit;
