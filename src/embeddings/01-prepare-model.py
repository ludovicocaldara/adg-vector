'''
this script downloads a pre-configured model and makes it suitable for use with the database.
It requires the oml4py package to be installed, and that must be on Linux.

It generates two models in the current directory:
- clip_txt.onnx
- clip_img.onnx
These models must then be loaded into the database.
Alternatively, you can use the oml4py package to load the model directly into the database.
https://docs.oracle.com/en/database/oracle/oracle-database/23/vecse/onnx-pipeline-models-multi-modal-embedding.html
'''
import os
from oml.utils import ONNXPipeline
import oml

pipeline = ONNXPipeline("openai/clip-vit-large-patch14")
pipeline.export2file("clip")