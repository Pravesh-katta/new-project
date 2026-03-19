import uuid
from pathlib import Path

import boto3
from botocore.client import BaseClient
from botocore.exceptions import BotoCoreError, ClientError

from app.core.config import get_settings


class StorageService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._s3: BaseClient | None = None
        if self.settings.s3_endpoint_url and self.settings.s3_bucket:
            self._s3 = boto3.client(
                "s3",
                endpoint_url=self.settings.s3_endpoint_url,
                aws_access_key_id=self.settings.s3_access_key_id or None,
                aws_secret_access_key=self.settings.s3_secret_access_key or None,
                region_name=self.settings.s3_region,
            )
        self.settings.local_object_storage_path.mkdir(parents=True, exist_ok=True)

    @property
    def uses_s3(self) -> bool:
        return self._s3 is not None

    def save_bytes(self, filename: str, data: bytes) -> str:
        object_key = f"{uuid.uuid4()}-{filename}"
        if self._s3:
            try:
                self._s3.put_object(Bucket=self.settings.s3_bucket, Key=object_key, Body=data)
                return object_key
            except (BotoCoreError, ClientError):
                # Fall back to local storage so local development can still proceed.
                pass

        target = self.settings.local_object_storage_path / object_key
        target.write_bytes(data)
        return object_key

    def read_bytes(self, object_key: str) -> bytes:
        if self._s3:
            try:
                response = self._s3.get_object(Bucket=self.settings.s3_bucket, Key=object_key)
                return response["Body"].read()
            except (BotoCoreError, ClientError):
                pass

        target = self.settings.local_object_storage_path / object_key
        if not target.exists():
            raise FileNotFoundError(f"Object not found: {object_key}")
        return target.read_bytes()

    def local_path(self, object_key: str) -> Path:
        return self.settings.local_object_storage_path / object_key
