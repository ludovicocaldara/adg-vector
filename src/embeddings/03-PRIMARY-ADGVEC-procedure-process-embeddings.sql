/*
This script creates a procedure that process the embeddings of the images in the picture table.
The embeddings are in a separate table (I find it more flexible in case you need to introduce new models or replace existing ones).

It opens a cursor to generate the embeddings for the images that still lack them, then it loops the cursor to insert them into the primary via DML redirection. The `ALTER SESSION` statement wouldn't be necessary if you set it before running the procedure, however it's included to make it always work.

Note: we don't use INSERT .. SELECT as it's not supported yet with DML redirect if used in combination with VECTOR_EMBEDDING. We are working on removing this limitation (Bug 38149985).

You can execute the provedure with:

`execute process_embeddings (p_batch_size => 10, p_iterations => 100);`

If `p_iterations` is set to 0, it loops until no images without embeddings are found.

Run as : ADGVEC
Scope  : Primary PDB
*/
CREATE OR REPLACE PROCEDURE process_embeddings (
    p_batch_size IN PLS_INTEGER,
    p_iterations IN PLS_INTEGER
) AS
    TYPE t_embedding IS RECORD (
        id            pictures.id%TYPE,
        embed_vector  picture_embeddings.embedding%TYPE
    );

    TYPE t_embedding_table IS TABLE OF t_embedding;

    v_embeddings t_embedding_table;
    v_batch_count PLS_INTEGER := 0;
    v_total_processed PLS_INTEGER := 0;
    v_continue BOOLEAN := TRUE;

    CURSOR c_embeddings IS
        SELECT c.id,
               vector_embedding(clipimg USING img AS data) AS embed_vector
        FROM pictures c
        LEFT OUTER JOIN picture_embeddings v ON c.id = v.id
        WHERE v.id IS NULL AND c.img IS NOT NULL and c.id IS NOT NULL;
BEGIN
    OPEN c_embeddings;

    EXECUTE IMMEDIATE 'ALTER SESSION ENABLE ADG_REDIRECT_DML';

    LOOP
        FETCH c_embeddings BULK COLLECT INTO v_embeddings LIMIT p_batch_size;
        EXIT WHEN v_embeddings.COUNT = 0;

        FOR i IN v_embeddings.FIRST .. v_embeddings.LAST LOOP
            DBMS_OUTPUT.PUT_LINE(   'Processing ID: ' || v_embeddings(i).id);
            INSERT INTO picture_embeddings (id, embedding)
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
