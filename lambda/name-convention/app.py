import boto3

def main(event, context):
    print("Hello World")
    return {
        "statusCode": 200,
        "body": "Hello World"
    }

if __name__ == "__main__":
    main(None, None)