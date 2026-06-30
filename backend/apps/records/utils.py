import boto3
from django.conf import settings


def generate_presigned_url(key, expiry_seconds=300):
    """
    Generate a temporary download URL for a file stored in
    MinIO or AWS S3.

    TODO (Infrastructure):
    Requires a running MinIO or AWS S3 service.
    """

    client = boto3.client(
        "s3",
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )

    return client.generate_presigned_url(
        ClientMethod="get_object",
        Params={
            "Bucket": settings.AWS_STORAGE_BUCKET_NAME,
            "Key": key,
        },
        ExpiresIn=expiry_seconds,
    )