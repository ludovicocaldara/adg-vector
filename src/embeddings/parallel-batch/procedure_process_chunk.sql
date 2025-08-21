/*
Parallel execution using DBMS_PARALLEL_EXECUTE to process embeddings in chunks.
This DOES NOT WORK on Active Data Guard Standby databases.
There is an enhancement request to allow this.
*/

CREATE OR REPLACE PROCEDURE process_embeddings_chunk (
    p_start_id IN cats.id%TYPE,
    p_end_id   IN cats.id%TYPE
) AS
    TYPE t_embedding IS RECORD (
        id            cats.id%TYPE,
        embed_vector  cats_vec_clipimg.embedding%TYPE
    );
    TYPE t_embedding_table IS TABLE OF t_embedding;

    v_embeddings t_embedding_table;
BEGIN
    -- Fetch only rows in this ID range and unprocessed ones
    SELECT c.id,
           vector_embedding(clipimg USING img AS data) AS embed_vector
    BULK COLLECT INTO v_embeddings
    FROM cats c
    LEFT JOIN cats_vec_clipimg v ON c.id = v.id
    WHERE v.id IS NULL
      AND c.img IS NOT NULL
      AND c.id BETWEEN p_start_id AND p_end_id;

    -- Bulk insert embeddings
    FORALL i IN 1 .. v_embeddings.COUNT
        INSERT INTO cats_vec_clipimg (id, embedding)
        VALUES (v_embeddings(i).id, v_embeddings(i).embed_vector);

    COMMIT;
END process_embeddings_chunk;
/

DECLARE
  v_chunk_size PLS_INTEGER := 10; -- ✅ rows per chunk
  v_max_chunks PLS_INTEGER := 10; -- ✅ rows per chunk
BEGIN
  DBMS_PARALLEL_EXECUTE.CREATE_TASK('parallel_embeddings');

  DBMS_PARALLEL_EXECUTE.CREATE_CHUNKS_BY_SQL(
    task_name   => 'parallel_embeddings',
    sql_stmt  => '
      select start_id, end_id from (
SELECT TRUNC((ROWNUM - 1) / '||v_chunk_size||') + 1 AS chunk_id,
       MIN(t.id) AS start_id,
       MAX(t.id) AS end_id
FROM (
    SELECT c.id
    FROM cats c
    LEFT JOIN cats_vec_clipimg v ON c.id = v.id
    WHERE v.id IS NULL
      AND c.img IS NOT NULL
    ORDER BY c.id
) t
GROUP BY TRUNC((ROWNUM - 1) / '||v_chunk_size||') + 1
having chunk_id < '||v_max_chunks||' 
ORDER BY chunk_id)',
    by_rowid => false
  );
END;
/

BEGIN
  DBMS_PARALLEL_EXECUTE.RUN_TASK(
    task_name      => 'parallel_embeddings',
    sql_stmt       => 'BEGIN process_embeddings_chunk(:start_id, :end_id); END;',
    language_flag  => DBMS_SQL.NATIVE,
    parallel_level => 4
  );
END;
/

SELECT chunk_id, status
FROM   user_parallel_execute_chunks
WHERE  task_name = 'parallel_embeddings';

exec DBMS_PARALLEL_EXECUTE.DROP_TASK('parallel_embeddings') ;