import re
import os
import json
from datetime import datetime
from dotenv import load_dotenv
from azure.storage.blob import BlobServiceClient
from azure.search.documents import SearchClient
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import SearchIndex, SimpleField, SearchableField
from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.credentials import AzureKeyCredential

# Load environment variables
load_dotenv()

azure_search_endpoint = os.getenv("AZURE_SEARCH_ENDPOINT")
azure_search_key = os.getenv("AZURE_SEARCH_KEY")
azure_search_index = os.getenv("AZURE_SEARCH_INDEX")
azure_storage_connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
azure_blob_container_name = os.getenv("AZURE_BLOB_CONTAINER_NAME")
azure_document_intelligence_endpoint = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT")
azure_document_intelligence_key = os.getenv("AZURE_DOCUMENT_INTELLIGENCE_KEY")
indexed_files_metadata_path = "indexed_files_metadata.json"

def load_indexed_files_metadata():
    if os.path.exists(indexed_files_metadata_path):
        with open(indexed_files_metadata_path, "r") as file:
            return json.load(file)
    return {}

def save_indexed_files_metadata(metadata):
    with open(indexed_files_metadata_path, "w") as file:
        json.dump(metadata, file)

def create_or_update_search_index():
    index_client = SearchIndexClient(endpoint=azure_search_endpoint, credential=AzureKeyCredential(azure_search_key))
    fields = [
        SimpleField(name="id", type="Edm.String", key=True),
        SearchableField(name="content", type="Edm.String")
    ]
    index = SearchIndex(name=azure_search_index, fields=fields)
    index_client.create_or_update_index(index)

def extract_text_from_file(blob_service_client, container_name, blob_name):
    document_analysis_client = DocumentAnalysisClient(endpoint=azure_document_intelligence_endpoint, credential=AzureKeyCredential(azure_document_intelligence_key))
    blob_client = blob_service_client.get_blob_client(container=container_name, blob=blob_name)
    file_content = blob_client.download_blob().readall()
    
    poller = document_analysis_client.begin_analyze_document(model_id="prebuilt-receipt", document=file_content)
    result = poller.result()

    text = ""
    for page in result.pages:
        for line in page.lines:
            text += line.content + "\n"
    return text

def sanitize_key(key):
    sanitized_key = re.sub(r'[^a-zA-Z0-9_-]', '_', key)
    return sanitized_key

def index_documents(search_client, documents, chunk_size=128):
    for i in range(0, len(documents), chunk_size):
        chunk = documents[i:i + chunk_size]
        results = search_client.upload_documents(documents=chunk)
        for result in results:
            if result.succeeded:
                print(f"Document {result.key} uploaded to index")
            else:
                print(f"Failed to upload document {result.key}")

def main():
    blob_service_client = BlobServiceClient.from_connection_string(azure_storage_connection_string)
    search_client = SearchClient(endpoint=azure_search_endpoint, index_name=azure_search_index, credential=AzureKeyCredential(azure_search_key))

    create_or_update_search_index()  # Update the index if it exists

    indexed_files_metadata = load_indexed_files_metadata()
    documents = []

    container_client = blob_service_client.get_container_client(azure_blob_container_name)
    blobs_list = container_client.list_blobs()

    for blob in blobs_list:
        if blob.name.endswith(".pdf"):
            last_modified_str = blob.last_modified.strftime("%Y-%m-%dT%H:%M:%S")
            if blob.name in indexed_files_metadata and indexed_files_metadata[blob.name] == last_modified_str:
                print(f"Skipping {blob.name}, no changes detected.")
                continue

            pdf_text = extract_text_from_file(blob_service_client, azure_blob_container_name, blob.name)
            sanitized_key = sanitize_key(blob.name)
            documents.append({"id": sanitized_key, "content": pdf_text})
            indexed_files_metadata[blob.name] = last_modified_str

    if documents:
        index_documents(search_client, documents)
        save_indexed_files_metadata(indexed_files_metadata)
        print(f"Indexing Completed {azure_search_index}")
    else:
        print("No new or updated documents to index.")

if __name__ == "__main__":
    main()
