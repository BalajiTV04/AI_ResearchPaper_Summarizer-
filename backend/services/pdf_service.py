import fitz
import os
import uuid
import logging

# Set up logger
logger = logging.getLogger(__name__)

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
    logger.info(f"Saved uploaded file to: {file_path}")
    return file_path

def extract_images_from_pdf(file_path: str, output_dir: str, pdf_id: str) -> list:
    """
    Extract embedded images from a PDF file and save them as image files.
    
    Args:
        file_path: Path to the PDF file
        output_dir: Base directory to save extracted images (e.g., ./uploads)
        pdf_id: Unique identifier for the PDF (used to create a subdirectory)
    
    Returns:
        List of dicts with keys: filename, url, page_number, width, height
    """
    images_output_dir = os.path.join(output_dir, "images", pdf_id)
    abs_output_dir = os.path.abspath(images_output_dir)
    os.makedirs(abs_output_dir, exist_ok=True)
    
    logger.info(f"=== Image Extraction Debug ===")
    logger.info(f"PDF file path: {file_path}")
    logger.info(f"Output directory: {abs_output_dir}")
    logger.info(f"PDF exists on disk: {os.path.exists(file_path)}")
    
    doc = fitz.open(file_path)
    num_pages = len(doc)
    logger.info(f"PDF has {num_pages} pages")
    
    extracted_images = []
    seen_hashes = set()  # Deduplicate identical images
    
    for page_num in range(num_pages):
        page = doc[page_num]
        image_list = page.get_images(full=True)
        logger.info(f"Page {page_num + 1}: found {len(image_list)} image(s)")
        
        for img_idx, img in enumerate(image_list):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            
            ext = base_image.get("ext", "png")
            width = base_image.get("width", 0)
            height = base_image.get("height", 0)
            
            logger.info(f"  Image {img_idx + 1}: xref={xref}, ext={ext}, size={width}x{height}, bytes={len(image_bytes)}")
            
            # Simple hash to skip duplicate images embedded multiple times
            img_hash = hash(image_bytes[:1000])
            if img_hash in seen_hashes:
                logger.info(f"  -> SKIPPED (duplicate hash)")
                continue
            seen_hashes.add(img_hash)
            
            # Skip very small images (likely icons, bullets, or decorative elements)
            if width < 50 or height < 50:
                logger.info(f"  -> SKIPPED (too small: {width}x{height})")
                continue
            
            # Skip very large images (likely full-page backgrounds)
            if width > 2000 and height > 2000:
                logger.info(f"  -> SKIPPED (too large: {width}x{height})")
                continue
            
            # Generate unique filename
            image_filename = f"fig_page{page_num + 1}_{img_idx + 1}.{ext}"
            image_path = os.path.join(abs_output_dir, image_filename)
            
            with open(image_path, "wb") as f:
                f.write(image_bytes)
            
            logger.info(f"  -> SAVED: {image_path}")
            
            # Generate URL relative to the server mount point
            # mount: "/uploads" -> directory: ./uploads
            # saved to: ./uploads/images/{pdf_id}/{filename}
            # URL: /uploads/images/{pdf_id}/{filename}
            img_url = f"/uploads/images/{pdf_id}/{image_filename}"
            
            extracted_images.append({
                "filename": image_filename,
                "url": img_url,
                "page_number": page_num + 1,
                "width": width,
                "height": height
            })
    
    doc.close()
    logger.info(f"Total images extracted and saved: {len(extracted_images)}")
    logger.info(f"=== End Image Extraction Debug ===")
    return extracted_images