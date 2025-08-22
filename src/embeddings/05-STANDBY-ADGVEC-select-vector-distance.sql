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