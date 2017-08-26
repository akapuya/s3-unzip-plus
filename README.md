# S3 Unzip #

A simple library to unzip an archive file in a S3 bucket to its root folder.

### Install ###

- To include as library: `npm install s3-unzip`
- To use as a command-line tool: `npm install -g s3-unzip`

### Restrictions ###

- The module only supports the input zip file MIME type of 'application/zip'

### Command Line Usage ###

`s3-unzip -b test-bucket-in-s3 -f Companies.zip`

#### Required Options ####

- `-b, --bucket` : Bucket name in S3 where the zip file exists
- `-f, --file` : Filename (including the .zip extension) of the archive that will be decompressed

### Library Usage ###

Include like most libraries:

`var s3Unzip = require("s3-unzip");`

Run the decompression for the file in the specified bucket:

~~~~
var s = new s3Unzip({
    bucket: "test-bucket-in-s3",
    file: "Companies.zip"
  }, function(err, success){
    if (err) console.log(err);
    else console.log(success);
  });
~~~~

#### Required Options ####

Same as command line options above:
- bucket
- file

### AWS Lambda Usage ###

Create an AWS Lambda function, name it, and zip all files from this package to upload the code.

#### Configuration ####

##### Basic #####
- Runtime: **Node.js 6.10**
- Handler: **index.handler**
- Role: **(create a custom role with Full S3 Access)**

##### Advanced #####

For a 20MB zip file:
- Memory: **at least 512MB**
- Timeout: **at least 30 sec**

#### Test Options ####

Test JSON:
~~~~
{
    "command":{
        "bucket": "test-bucket-in-s3",
        "file": "Companies.zip"
    }
}
~~~~
