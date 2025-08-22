-- inmemory vector in this environment fails with
-- ORA-51962: The vector memory area is out of space for the current container.
-- >> must increate VECTOR_MEMORY_SIZE

-- CREATE VECTOR INDEX cats_vec_clipimg_hnsw_idx ON cats_vec_clipimg (embedding)
-- ORGANIZATION INMEMORY NEIGHBOR GRAPH
-- DISTANCE COSINE WITH TARGET ACCURACY 95;

CREATE VECTOR INDEX cats_vec_clipimg_hnsw_idx ON cats_vec_clipimg (embedding)
organization neighbor partitions 
DISTANCE EUCLIDEAN WITH TARGET ACCURACY 95;
