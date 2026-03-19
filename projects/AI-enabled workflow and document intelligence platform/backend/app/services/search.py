from opensearchpy import OpenSearch
from opensearchpy.exceptions import OpenSearchException

from app.core.config import get_settings


class SearchService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._client: OpenSearch | None = None
        if self.settings.opensearch_url:
            auth = None
            if self.settings.opensearch_user and self.settings.opensearch_password:
                auth = (self.settings.opensearch_user, self.settings.opensearch_password)
            self._client = OpenSearch(
                hosts=[self.settings.opensearch_url],
                http_auth=auth,
                use_ssl=self.settings.opensearch_url.startswith("https"),
                verify_certs=False,
                ssl_show_warn=False,
            )

    @property
    def enabled(self) -> bool:
        return self._client is not None

    def ensure_index(self) -> None:
        if not self._client:
            return
        try:
            if not self._client.indices.exists(index=self.settings.opensearch_index):
                self._client.indices.create(
                    index=self.settings.opensearch_index,
                    body={
                        "mappings": {
                            "properties": {
                                "document_id": {"type": "keyword"},
                                "filename": {"type": "text"},
                                "workflow_id": {"type": "keyword"},
                                "content": {"type": "text"},
                            }
                        }
                    },
                )
        except OpenSearchException:
            # Index operations are best effort in local environments.
            return

    def index_document(self, document_id: str, filename: str, workflow_id: str | None, content: str) -> bool:
        if not self._client:
            return False
        try:
            self.ensure_index()
            self._client.index(
                index=self.settings.opensearch_index,
                id=document_id,
                body={
                    "document_id": document_id,
                    "filename": filename,
                    "workflow_id": workflow_id,
                    "content": content,
                },
                refresh=True,
            )
            return True
        except OpenSearchException:
            return False

    def search(self, query: str, limit: int = 10) -> list[dict]:
        if not self._client:
            return []
        try:
            self.ensure_index()
            result = self._client.search(
                index=self.settings.opensearch_index,
                body={
                    "size": limit,
                    "query": {
                        "multi_match": {
                            "query": query,
                            "fields": ["filename^2", "content"],
                        }
                    },
                    "highlight": {"fields": {"content": {}}},
                },
            )
            hits = []
            for hit in result.get("hits", {}).get("hits", []):
                source = hit.get("_source", {})
                snippet = None
                highlight = hit.get("highlight", {}).get("content", [])
                if highlight:
                    snippet = highlight[0]
                hits.append(
                    {
                        "id": source.get("document_id", hit.get("_id")),
                        "filename": source.get("filename", ""),
                        "score": float(hit.get("_score", 0.0)),
                        "snippet": snippet,
                    }
                )
            return hits
        except OpenSearchException:
            return []
