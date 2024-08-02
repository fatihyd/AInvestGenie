from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient,ContentSettings
import os
from chardet import detect
from fpdf import FPDF
import json
import dotenv


dotenv.load_dotenv()

# Azure storage baglanti ayalari

connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
script_directory= os.path.dirname(os.path.abspath(__file__))
data_file = os.path.join(script_directory, "DataFiles")


class PDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 12)
        self.cell(0, 10, '', 0, 1, 'C')

    def chapter_title(self, title):
        self.set_font('Arial', 'B', 12)
        self.cell(0, 10, title, 0, 1, 'L')
        self.ln(10)

    def chapter_body(self, body):
        self.set_font('Arial', '', 12)
        self.multi_cell(0, 10, body)
        self.ln()

    def add_content(self, title, body):
        self.add_page()
        self.chapter_title(title)
        self.chapter_body(body)

def detect_encoding(file_path):
    with open(file_path, 'rb') as file:
        raw_data = file.read()
    result = detect(raw_data)
    return result['encoding']

def file_to_pdf(file_path, pdf_path):
    pdf = PDF()
    encoding = detect_encoding(file_path)

    with open(file_path, 'r', encoding=encoding, errors='replace') as file:
        json_data = json.load(file)

    json_str = json.dumps(json_data, indent=4)
    pdf.add_content(os.path.basename(file_path), json_str)

    pdf.output(pdf_path, 'F')

def upload_blob(blob_service_client, container_name, local_file_path, target_content_type):
    blob_name = os.path.basename(local_file_path)
    blob_client = blob_service_client.get_blob_client(container=container_name, blob=blob_name)

    with open(local_file_path, "rb") as data:
        content_settings = ContentSettings(content_type=target_content_type)
        blob_client.upload_blob(data, overwrite=True, content_settings=content_settings)

    print(f"{blob_name} isimli blob başarıyla yüklendi")


def upload_batch():

    blob_service_client = BlobServiceClient.from_connection_string(connection_string)
    container_client = blob_service_client.get_container_client(container_name)

    for file_name in os.listdir(data_file):
        if file_name.endswith('.json'):
            local_file_path = os.path.join(data_file, file_name)
            local_pdf_path = os.path.splitext(local_file_path)[0] + ".pdf"

        file_to_pdf(local_file_path, local_pdf_path)
        upload_blob(blob_service_client, container_name, local_pdf_path, "application/pdf")
        os.remove(local_file_path)
        os.remove(local_pdf_path)
    print("All files uploaded successfully")