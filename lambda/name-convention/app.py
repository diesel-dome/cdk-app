import boto3

def main(event, context):
    # Get the s3 file name from the event
    s3_file_name = event['Records'][0]['s3']['object']['key']

    # Print the s3 file name
    print(f"S3 file name: {s3_file_name}")

if __name__ == "__main__":
    main(None, None)