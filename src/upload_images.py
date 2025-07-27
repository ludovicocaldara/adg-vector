
import os
import subprocess

# Config
upload_url="/p/rGESl4CoWq2jhGPP_pqO0Gtub-yGl41hLVMQ32fVUvtLAbNkpM9gzSXGapWmZ61i/n/oradbclouducm/b/pet-images/o/"
upload_dir = "./images"

# Upload files
for filename in os.listdir(upload_dir):
    filepath = os.path.join(upload_dir, filename)
    if os.path.isfile(filepath):
        full_url = f"{upload_url}{filename}"
        print(f"Uploading {filename}...")
        subprocess.run(["oci", "os", "object", "put", "--file", filepath, "--bucket-name", pet-images, "--name", filename])


oci os object put --bucket-name bucket_name --file file_location --name object_name  --metadata json_formatted_key-value_pairs

