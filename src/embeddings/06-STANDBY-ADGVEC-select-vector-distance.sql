/*
This script just selects a few cat images using semantic search.
Note, it uses EXACT FETCH. You can use approximate fetch instead to take advantage of the index.

Run as : ADGVEC
Scope  : Standby PDB
*/
SELECT c.id, c.img,
  VECTOR_DISTANCE(v.embedding,
    VECTOR_EMBEDDING(cliptxt USING 'a cute red kitten' AS data), COSINE) distance
FROM cats c
JOIN cats_vec_clipimg v
  ON c.id = v.id
ORDER BY distance
FETCH EXACT FIRST 10 ROWS ONLY;

SELECT c.id, c.img,
  VECTOR_DISTANCE(v.embedding,
    VECTOR_EMBEDDING(cliptxt USING 'a big black and white cat looking angry' AS data), COSINE) distance
FROM cats c
JOIN cats_vec_clipimg v
  ON c.id = v.id
ORDER BY distance
FETCH EXACT FIRST 10 ROWS ONLY;

SELECT c.id, c.img,
  VECTOR_DISTANCE(v.embedding,
    VECTOR_EMBEDDING(cliptxt USING 'a white fluffy cat' AS data), COSINE) distance
FROM cats c
JOIN cats_vec_clipimg v
  ON c.id = v.id
ORDER BY distance
FETCH EXACT FIRST 10 ROWS ONLY;

SELECT c.id, c.img,
  VECTOR_DISTANCE(v.embedding,
    VECTOR_EMBEDDING(cliptxt USING 'a cat playing with a toy' AS data), COSINE) distance
FROM cats c
JOIN cats_vec_clipimg v
  ON c.id = v.id
ORDER BY distance
FETCH EXACT FIRST 10 ROWS ONLY;
