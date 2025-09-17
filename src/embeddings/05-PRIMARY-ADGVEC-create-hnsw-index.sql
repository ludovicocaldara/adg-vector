/*
This script creates the vector index to accellerate approximate queries.

The creation of an inmemory vector in the default BaseDB environment fails with:
ORA-51962: The vector memory area is out of space for the current container.
must increase VECTOR_MEMORY_SIZE

CREATE VECTOR INDEX picture_embeddings_idx ON picture_embeddings (embedding)
ORGANIZATION INMEMORY NEIGHBOR GRAPH
DISTANCE COSINE WITH TARGET ACCURACY 95;

While that would be easyy to solve, we create a neighbor partition index instead, to limit the number of steps.

Run as : ADGVEC
Scope  : Primary PDB
*/

CREATE VECTOR INDEX picture_embeddings_idx ON picture_embeddings (embedding)
organization neighbor partitions 
DISTANCE EUCLIDEAN WITH TARGET ACCURACY 95;
