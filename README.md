# S3 Unzip #

A simple library to unzip an archive file in a S3 bucket to its root folder.

### Install ###

- To include as library: `npm install s3-unzip`
- To use as a command-line tool: `npm install -g s3-unzip`

### Restrictions ###

- The module only supports the input zip file MIME type of 'application/zip'. Please set the Content-Type in S3 for the file prior to running this library.

### Command Line Usage ###

`s3-unzip [-dv] <bucket name> <filename>`

#### Required ####

- `<bucket name>` : Bucket name in S3 where the zip file exists
- `<filename>` : Filename (including the .zip extension) of the archive that will be decompressed

#### Options ####

- `-d, --delete-on-success` : Delete the zip file once the decompression has finished
- `-v, --verbose` : Show the console log messages during runtime

#### Example ####

`s3-unzip -d -v test-bucket-in-s3 Companies.zip`

### Library Usage ###

Include like most libraries:

`var s3Unzip = require("s3-unzip");`

Run the decompression for the file in the specified bucket:

#### Options ####

~~~~
var s = new s3Unzip({
    bucket: "test-bucket-in-s3",
    file: "Companies.zip",
    deleteOnSuccess: true,
    verbose: false
  }, function(err, success){
    if (err) console.error(err);
    else console.log(success);
  });
~~~~

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

#### Options ####

Test JSON:
~~~~
{
    "command":{
        "bucket": "test-bucket-in-s3",
        "file": "Companies.zip",
        "deleteOnSuccess": true,
        "verbose": false
    }
}
~~~~
