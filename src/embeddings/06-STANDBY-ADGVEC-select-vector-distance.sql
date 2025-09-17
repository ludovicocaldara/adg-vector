/*
This script just selects a few cat images using semantic search.
Note, it uses EXACT FETCH. You can use approximate fetch instead to take advantage of the index.

Run as : ADGVEC
Scope  : Standby PDB
*/
SELECT c.id, c.img,
  VECTOR_DISTANCE(v.embedding,
    VECTOR_EMBEDDING(cliptxt USING 'people playing on the beach' AS data), COSINE) distance
FROM pictures c
JOIN picture_embeddings v
  ON c.id = v.id
ORDER BY distance
FETCH EXACT FIRST 10 ROWS ONLY;

SELECT c.id, c.img,
  VECTOR_DISTANCE(v.embedding,
    VECTOR_EMBEDDING(cliptxt USING 'high mountain peaks' AS data), COSINE) distance
FROM pictures c
JOIN picture_embeddings v
  ON c.id = v.id
ORDER BY distance
FETCH EXACT FIRST 10 ROWS ONLY;

SELECT c.id, c.img,
  VECTOR_DISTANCE(v.embedding,
    VECTOR_EMBEDDING(cliptxt USING 'beautiful wildlife' AS data), COSINE) distance
FROM pictures c
JOIN picture_embeddings v
  ON c.id = v.id
ORDER BY distance
FETCH EXACT FIRST 10 ROWS ONLY;

SELECT c.id, c.img,
  VECTOR_DISTANCE(v.embedding,
    VECTOR_EMBEDDING(cliptxt USING 'colorful flowers' AS data), COSINE) distance
FROM pictures c
JOIN picture_embeddings v
  ON c.id = v.id
ORDER BY distance
FETCH EXACT FIRST 10 ROWS ONLY;
