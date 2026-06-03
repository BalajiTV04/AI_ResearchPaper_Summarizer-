import fitz
import os
import uuid

def extract_text_from_pdf(file_path: str) -> tuple:
    doc = fitz.open(file_path)
    text = " ".join([page.get_text() for page in doc])
    page_count = len(doc)
    doc.close()
    if len(text.strip()) < 100:
        raise ValueError("PDF appears scanned. Text extraction failed.")
    return text, page_count

def save_uploaded_file(upload_dir: str, file) -> str:
    unique_name = f"{uuid.uuid4().hex}.pdf"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, unique_name)
    with open(file_path, "wb") as f:
        f.write(file.file.read())
    return file_path
