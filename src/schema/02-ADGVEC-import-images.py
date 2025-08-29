'''
This python script inserts all the cat images as blobs into the cats table using the oracledb driver.
This could also be done directly in PL/SQL (probably much faster) by copying the images to the DB server and using DBMS_LOB.

## Usage:

Set the environment variable srequired by the script:

export DB_USER=adgvec
export DB_PASSWORD=<the adgvec password>
export DB_DSN=<connect string, e.g. adgvec0-84,adgvec1-84/mypdb_rw>
export IMAGE_DIRECTORY=<path to the cat images>
export ORACLE_HOME=<your instantclient directory>

'''
import os
import oracledb
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Retrieve database connection parameters and image directory from environment variables
db_user = os.getenv('DB_USER')
db_password = os.getenv('DB_PASSWORD')
db_dsn = os.getenv('DB_DSN')
image_directory = os.getenv('IMAGE_DIRECTORY')
oracle_home = os.getenv('ORACLE_HOME')

oracledb.init_oracle_client(lib_dir=oracle_home)

# Establish a connection to the Oracle database
with oracledb.connect(user=db_user, password=db_password, dsn=db_dsn) as connection:
    with connection.cursor() as cursor:
        # Iterate over each file in the directory
        for filename in os.listdir(image_directory):
            if filename.endswith('.jpg'):
                # Extract the numeric ID from the filename (e.g., '1.jpg' -> 1)
                image_id = int(os.path.splitext(filename)[0])
                image_path = os.path.join(image_directory, filename)

                # Read the image file in binary mode
                with open(image_path, 'rb') as image_file:
                    image_data = image_file.read()
                    image_size = len(image_data)

                    try:
                        # Insert the image data into the 'cats' table
                        cursor.execute("""
                            INSERT INTO cats (id, img_size, img)
                            VALUES (:id, :img_size, :img)""",
                            {'id': image_id, 'img_size': image_size, 'img': image_data})
                    except oracledb.IntegrityError as e:
                        error_obj, = e.args
                        if error_obj.code == 1:  # ORA-00001: unique constraint violated
                            print(f"Skipping image {filename}: ID {image_id} already exists.")
                        else:
                            raise  # Re-raise the exception if it's not a unique constraint violation    
                    print(image_id)


        # Commit the transaction
        connection.commit()
