CREATE OR REPLACE PROCEDURE process_embeddings (
    p_batch_size IN PLS_INTEGER,
    p_iterations IN PLS_INTEGER
) AS
    TYPE t_embedding IS RECORD (
        id            cats.id%TYPE,
        embed_vector  cats_vec_clipimg.embedding%TYPE
    );

    TYPE t_embedding_table IS TABLE OF t_embedding;

    v_embeddings t_embedding_table;
    v_batch_count PLS_INTEGER := 0;
    v_total_processed PLS_INTEGER := 0;
    v_continue BOOLEAN := TRUE;

    CURSOR c_embeddings IS
        SELECT c.id,
               vector_embedding(clipimg USING img AS data) AS embed_vector
        FROM cats c
        LEFT OUTER JOIN cats_vec_clipimg v ON c.id = v.id
        WHERE v.id IS NULL AND c.img IS NOT NULL and c.id IS NOT NULL;
BEGIN
    OPEN c_embeddings;

    EXECUTE IMMEDIATE 'ALTER SESSION ENABLE ADG_REDIRECT_DML';

    LOOP
        FETCH c_embeddings BULK COLLECT INTO v_embeddings LIMIT p_batch_size;
        EXIT WHEN v_embeddings.COUNT = 0;

        FOR i IN v_embeddings.FIRST .. v_embeddings.LAST LOOP
            DBMS_OUTPUT.PUT_LINE(   'Processing ID: ' || v_embeddings(i).id);
            INSERT INTO cats_vec_clipimg (id, embedding)
            VALUES (v_embeddings(i).id, v_embeddings(i).embed_vector);
        END LOOP;
        COMMIT;

        v_total_processed := v_total_processed + v_embeddings.COUNT;
        v_batch_count := v_batch_count + 1;

        IF p_iterations > 0 AND v_batch_count >= p_iterations THEN
            v_continue := FALSE;
        END IF;

        EXIT WHEN NOT v_continue;
    END LOOP;

    CLOSE c_embeddings;
END process_embeddings;
/