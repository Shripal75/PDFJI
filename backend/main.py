from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import shutil
import os
import uuid
from typing import List, Optional
from pydantic import BaseModel
from utils import merge_pdfs, compress_pdf, convert_pdf_to_word, images_to_pdf, pdf_to_images, reorder_pdf, split_pdf, rotate_pdf, extract_text, word_to_pdf, pdf_to_high_res_images, compress_image, assemble_pdf, convert_image

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Length", "Content-Disposition"]
)

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
PREVIEW_DIR = "previews"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(PREVIEW_DIR, exist_ok=True)

app.mount("/previews", StaticFiles(directory=PREVIEW_DIR), name="previews")

class PageSpec(BaseModel):
    file_id: str
    page_index: int
    rotation: int = 0

class OrganizeRequest(BaseModel):
    pages: List[PageSpec]

@app.post("/merge")
async def merge_files(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")
    
    file_paths = []
    try:
        for file in files:
            file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            file_paths.append(file_path)
        
        output_filename = f"merged_{uuid.uuid4()}.pdf"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        merge_pdfs(file_paths, output_path)
        
        return FileResponse(output_path, filename="merged.pdf", media_type="application/pdf")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Merge error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup uploaded files? Optional, maybe later
        pass

from fastapi import Form

@app.post("/compress")
async def compress_file(file: UploadFile = File(...), quality: int = Form(50), target_size: Optional[int] = Form(None)):
    try:
        file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        output_filename = f"compressed_{uuid.uuid4()}.pdf"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        compress_pdf(file_path, output_path, quality, target_size)
        
        return FileResponse(output_path, filename=f"compressed_{file.filename}", media_type="application/pdf")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Compression error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/estimate-size")
async def estimate_size(file: UploadFile = File(...), quality: int = Form(50), target_size: Optional[int] = Form(None)):
    """Compress to a temp file and return just the size (no file download)."""
    try:
        file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        original_size = os.path.getsize(file_path)
        
        output_filename = f"estimate_{uuid.uuid4()}.pdf"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        compress_pdf(file_path, output_path, quality, target_size)
        
        compressed_size = os.path.getsize(output_path)
        
        # Cleanup temp files
        try:
            os.remove(file_path)
            os.remove(output_path)
        except:
            pass
        
        return {
            "original_size": original_size,
            "compressed_size": compressed_size,
            "saved_percent": round((1 - compressed_size / original_size) * 100, 1) if original_size > 0 else 0
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/img-to-pdf")
async def img_to_pdf(files: List[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No images uploaded")
    
    file_paths = []
    try:
        for file in files:
            # Check extension if needed, but PIL handles many
            file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            file_paths.append(file_path)
        
        output_filename = f"images_merged_{uuid.uuid4()}.pdf"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        images_to_pdf(file_paths, output_path)
        
        return FileResponse(output_path, filename="converted_images.pdf", media_type="application/pdf")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Image to PDF error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup uploaded files?
        pass



@app.post("/organize-pdf")
async def organize_pdf_endpoint(request: OrganizeRequest):
    try:
        output_filename = f"organized_{uuid.uuid4()}.pdf"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        # Assemble pages_spec for utils
        pages_spec = []
        for p in request.pages:
             # Construct full path from file_id
             # Security: ensure file_id is just filename in UPLOAD_DIR
             safe_file_id = os.path.basename(p.file_id)
             file_path = os.path.join(UPLOAD_DIR, safe_file_id)
             if not os.path.exists(file_path):
                 print(f"File not found: {file_path}")
                 continue
                 
             pages_spec.append({
                 'file_path': file_path,
                 'page_index': p.page_index,
                 'rotate': p.rotation
             })
        
        assemble_pdf(pages_spec, output_path)
        
        return FileResponse(output_path, filename=f"organized.pdf", media_type="application/pdf")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Organize PDF error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/split-pdf")
async def split_pdf_endpoint(file: UploadFile = File(...), pages: str = Form(...)):
    try:
        file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        output_filename = f"split_{uuid.uuid4()}.pdf"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        split_pdf(file_path, output_path, pages)
        
        return FileResponse(output_path, filename=f"split_{file.filename}", media_type="application/pdf")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract-pages")
async def extract_pages_endpoint(file: UploadFile = File(...)):
    """Extract pages from PDF for preview (returns list of image URLs)."""
    try:
        file_id = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, file_id)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Create a unique directory for this request's previews in the mounted PREVIEW_DIR
        preview_id = uuid.uuid4()
        output_subdir = os.path.join(PREVIEW_DIR, f"{preview_id}")
        
        # Use utils function to generate previews
        image_filenames = pdf_to_images(file_path, output_subdir)
        
        # Construct URLs for frontend
        # Mounted at /previews -> PREVIEW_DIR
        image_urls = [f"/previews/{preview_id}/{name}" for name in image_filenames]
        
        return JSONResponse(content={"file_id": file_id, "pages": image_urls})
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rotate-pdf")
async def rotate_pdf_endpoint(file: UploadFile = File(...), rotations: str = Form(...)):
    """
    Rotate individual pages.
    rotations: JSON string like '{"0": 90, "2": 180}' (page_index: angle).
    """
    import json
    try:
        rotations_dict = json.loads(rotations)
        
        file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        output_filename = f"rotated_{uuid.uuid4()}.pdf"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        rotate_pdf(file_path, output_path, rotations_dict)
        
        return FileResponse(output_path, filename=f"rotated_{file.filename}", media_type="application/pdf")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract-text")
async def extract_text_endpoint(file: UploadFile = File(...), pages: str = Form("")):
    try:
        file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        output_filename = f"extracted_{uuid.uuid4()}.txt"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        # Parse pages
        from utils import parse_page_range
        import fitz
        
        # Need to know total pages to parse range correctly
        doc = fitz.open(file_path)
        total_pages = len(doc)
        doc.close()
        
        if pages.strip():
             page_indices = parse_page_range(pages, total_pages)
        else:
             page_indices = None
        
        extract_text(file_path, output_path, page_indices)
        
        return FileResponse(output_path, filename=f"{file.filename[:-4]}.txt", media_type="text/plain")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/convert-to-word")
async def convert_to_word_endpoint(file: UploadFile = File(...), pages: str = Form("")):
    try:
        file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        output_filename = f"converted_{uuid.uuid4()}.docx"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        # Parse page selection (convert to 0-based indices)
        page_indices = None
        if pages.strip():
            import fitz as fitz_check
            from utils import parse_page_range
            doc_check = fitz_check.open(file_path)
            total = len(doc_check)
            doc_check.close()
            page_indices = parse_page_range(pages, total)  # returns 0-based list
        
        convert_pdf_to_word(file_path, output_path, pages=page_indices)
        
        original_name = file.filename.rsplit('.', 1)[0] if '.' in file.filename else file.filename
        return FileResponse(output_path, filename=f"{original_name}.docx", media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pdf-to-images")
async def pdf_to_images_endpoint(file: UploadFile = File(...), format: str = Form("png"), pages: str = Form("")):
    """Convert PDF pages to images and return as ZIP. Pages is optional, e.g. '1-3, 5'."""
    import zipfile
    from utils import parse_page_range
    try:
        file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Parse page selection (convert to 0-based indices)
        page_indices = None
        if pages.strip():
            import fitz as fitz_check
            doc_check = fitz_check.open(file_path)
            total = len(doc_check)
            doc_check.close()
            page_indices = parse_page_range(pages, total)  # returns 0-based list
        
        output_subdir = os.path.join(OUTPUT_DIR, f"pdf_images_{uuid.uuid4()}")
        image_paths = pdf_to_high_res_images(file_path, output_subdir, fmt=format, page_indices=page_indices)
        
        original_name = file.filename.rsplit('.', 1)[0] if '.' in file.filename else file.filename
        
        # Single image: return directly without ZIP
        if len(image_paths) == 1:
            ext = "jpg" if format == "jpg" else "png"
            media = "image/jpeg" if format == "jpg" else "image/png"
            return FileResponse(image_paths[0], filename=f"{original_name}.{ext}", media_type=media)
        
        # Multiple images: return as ZIP
        zip_filename = f"pdf_images_{uuid.uuid4()}.zip"
        zip_path = os.path.join(OUTPUT_DIR, zip_filename)
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for img_path in image_paths:
                zf.write(img_path, os.path.basename(img_path))
        
        return FileResponse(zip_path, filename=f"{original_name}_images.zip", media_type="application/zip")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# @app.post("/ocr-pdf")
# async def ocr_pdf_endpoint(file: UploadFile = File(...), pages: str = Form("")):
#     """Extract text from handwritten/scanned PDF or image using OCR."""
#     try:
#         file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
#         with open(file_path, "wb") as buffer:
#             shutil.copyfileobj(file.file, buffer)
#         
#         import fitz
#         # import easyocr
#         from utils import parse_page_range
#         
#         # reader = easyocr.Reader(['en'], gpu=False)
#         
#         ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
#         image_exts = {'png', 'jpg', 'jpeg', 'bmp', 'tiff', 'tif', 'webp', 'gif'}
#         
#         all_text = []
#         
#         if ext == 'pdf':
#             # PDF: render each page to image, then OCR
#             doc = fitz.open(file_path)
#             total_pages = len(doc)
#             
#             # Determine pages to process
#             if pages.strip():
#                 page_indices = parse_page_range(pages, total_pages)
#             else:
#                 page_indices = list(range(total_pages))
#             
#             for page_num in page_indices:
#                 if 0 <= page_num < total_pages:
#                     page = doc.load_page(page_num)
#                     pix = page.get_pixmap(matrix=fitz.Matrix(2.0, 2.0))
#                     img_bytes = pix.tobytes("png")
#                     # results = reader.readtext(img_bytes, detail=0, paragraph=True)
#                     # page_text = "\n".join(results)
#                     # if page_text.strip():
#                     #     all_text.append(f"--- Page {page_num + 1} ---\n{page_text}")
#             doc.close()
#         elif ext in image_exts:
#             # Image file: OCR directly
#             # results = reader.readtext(file_path, detail=0, paragraph=True)
#             # page_text = "\n".join(results)
#             # if page_text.strip():
#             #     all_text.append(page_text)
#             pass
#         else:
#             raise HTTPException(status_code=400, detail=f"Unsupported file type: .{ext}")
#         
#         full_text = "\n\n".join(all_text) if all_text else "No text detected in the document."
#         
#         return {"text": full_text}
#     except HTTPException:
#         raise
#     except Exception as e:
#         import traceback
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=str(e))

@app.post("/compress-image")
async def compress_image_endpoint(file: UploadFile = File(...), quality: int = Form(50), target_size: Optional[int] = Form(None)):
    try:
        file_id = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, file_id)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        output_filename = f"compressed_{file_id}"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        compress_image(file_path, output_path, quality, target_size)
        
        return FileResponse(output_path, filename=f"compressed_{file.filename}", media_type="application/octet-stream")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/estimate-image-size")
async def estimate_image_size(file: UploadFile = File(...), quality: int = Form(50), target_size: Optional[int] = Form(None)):
    try:
        # Save temp file
        file_id = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, file_id)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
        original_format = "PNG" # Default
        if ext in ['jpg', 'jpeg']: original_format = "JPEG"
        elif ext == 'webp': original_format = "WEBP"
        
        # Run estimation
        output_filename = f"estimate_{uuid.uuid4()}_{file.filename}"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        # We run the actual compression logic to get the size
        # Ideally we'd optimize this to not do full I/O but for now it's accurate
        original_file_size = os.path.getsize(file_path)
        
        compress_image(file_path, output_path, quality, target_size)
        
        compressed_size = os.path.getsize(output_path)
        
        # Cleanup
        try:
            os.remove(file_path)
            os.remove(output_path)
        except:
            pass
        
        return {
            "original_size": original_file_size,
            "compressed_size": compressed_size,
            "saved_percent": round((1 - compressed_size / original_file_size) * 100, 1) if original_file_size > 0 else 0
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pdf-to-ppt")
async def pdf_to_ppt_endpoint(file: UploadFile = File(...), pages: Optional[str] = Form(None)):
    try:
        file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        output_filename = f"converted_{uuid.uuid4()}.pptx"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        # Parse pages if provided
        page_indices = None
        if pages and pages.strip():
            import fitz
            doc = fitz.open(file_path)
            num_pages = len(doc)
            doc.close()
            from utils import parse_page_range
            page_indices = parse_page_range(pages, num_pages)
        
        from utils import pdf_to_ppt
        pdf_to_ppt(file_path, output_path, page_indices=page_indices)
        
        original_name = file.filename.rsplit('.', 1)[0] if '.' in file.filename else file.filename
        return FileResponse(output_path, filename=f"{original_name}.pptx", media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ppt-to-pdf")
async def ppt_to_pdf_endpoint(file: UploadFile = File(...), pages: Optional[str] = Form(None)):
    try:
        file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        output_filename = f"converted_{uuid.uuid4()}.pdf"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        # Parse pages
        page_indices = None
        if pages and pages.strip():
            # We need total count. 
            # Ideally we check it, but utils.ppt_to_pdf handles logic?
            # Actually parsing range requires 'total'.
            # Opening PPT via COM just to get count is slow.
            # workaround: Assume max generic or let functionality verify?
            # Better: open it briefly to get count? Or catch error?
            # Let's trust the frontend sent valid max, OR parse comfortably.
            # BUT utils.parse_page_range needs 'total_pages'.
            pass # See logic below
            
        # Optimization: We can't easily get total_pages without opening it.
        # But we open it for conversion anyway.
        # So we might need to move parsing INSIDE utils or extract it here.
        # Strategy: To parse specific range like "1-5", we need to know 5 <= Total.
        # If we pass "None" as total to parse_page_range, maybe we can adapt it?
        # Let's look at utils.parse_page_range implementation.
        # If I can't check 'total', I'll just skip validation or do it in utils.
        # Actually, let's just Open -> Count -> Close here? No, too slow (2 opens).
        # Let's modify utils.ppt_to_pdf to accept the STRING 'pages' and parse it internally?
        # No, better to keep utils pure.
        # Let's getting count:
        try:
             import comtypes.client
             powerpoint = comtypes.client.CreateObject("PowerPoint.Application")
             pres = powerpoint.Presentations.Open(file_path, WithWindow=False)
             total = pres.Slides.Count
             pres.Close()
             # powerpoint.Quit() # Keep it running for next step speedup?
        except:
             total = 1000 # Fallback
             
        from utils import parse_page_range
        page_indices = parse_page_range(pages, total) if pages and pages.strip() else None

        from utils import ppt_to_pdf
        ppt_to_pdf(file_path, output_path, page_indices=page_indices)
        
        original_name = file.filename.rsplit('.', 1)[0] if '.' in file.filename else file.filename
        return FileResponse(output_path, filename=f"{original_name}.pdf", media_type="application/pdf")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract-pptx-pages")
async def extract_pptx_pages_endpoint(file: UploadFile = File(...)):
    """Extract slides from PPTX as images for preview."""
    try:
        file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        subdir_name = f"pptx_slides_{uuid.uuid4()}"
        output_subdir = os.path.join(PREVIEW_DIR, subdir_name)
        
        from utils import extract_pptx_slides
        image_names = extract_pptx_slides(file_path, output_subdir)
        
        # Return URLs
        urls = [f"/previews/{subdir_name}/{name}" for name in image_names]
        return {"pages": urls}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/pdf-to-word")
async def pdf_to_word_endpoint(file: UploadFile = File(...), pages: Optional[str] = Form(None)):
    try:
        file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        output_filename = f"converted_{uuid.uuid4()}.docx"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        # Parse pages if provided
        page_indices = None
        if pages and pages.strip():
            import fitz
            doc = fitz.open(file_path)
            num_pages = len(doc)
            doc.close()
            from utils import parse_page_range
            page_indices = parse_page_range(pages, num_pages)
        
        convert_pdf_to_word(file_path, output_path, pages=page_indices)
        
        original_name = file.filename.rsplit('.', 1)[0] if '.' in file.filename else file.filename
        return FileResponse(output_path, filename=f"{original_name}.docx", media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/word-to-pdf")
async def word_to_pdf_endpoint(file: UploadFile = File(...)):
    try:
        file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        output_filename = f"converted_{uuid.uuid4()}.pdf"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        word_to_pdf(file_path, output_path)
        
        original_name = file.filename.rsplit('.', 1)[0] if '.' in file.filename else file.filename
        return FileResponse(output_path, filename=f"{original_name}.pdf", media_type="application/pdf")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/convert-image")
async def convert_image_endpoint(
    file: UploadFile = File(...),
    target_format: str = Form("png")
):
    try:
        file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        ext = target_format.lower()
        if ext == 'jpeg':
            ext = 'jpg'
        output_filename = f"converted_{uuid.uuid4()}.{ext}"
        output_path = os.path.join(OUTPUT_DIR, output_filename)

        convert_image(file_path, output_path, target_format)

        media_types = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'webp': 'image/webp',
        }
        media_type = media_types.get(ext, 'application/octet-stream')

        original_name = file.filename.rsplit('.', 1)[0] if '.' in file.filename else file.filename
        return FileResponse(output_path, filename=f"{original_name}.{ext}", media_type=media_type)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/translate-pdf")
async def translate_pdf_endpoint(file: UploadFile = File(...), source_lang: str = Form("en"), target_lang: str = Form("hi"), pages: str = Form("")):
    """Extract text from PDF and translate it."""
    try:
        import fitz
        from deep_translator import GoogleTranslator
        from utils import parse_page_range

        file_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        doc = fitz.open(file_path)
        total_pages = len(doc)

        # Determine pages to process
        if pages.strip():
            page_indices = parse_page_range(pages, total_pages)
        else:
            page_indices = list(range(total_pages))

        translator = GoogleTranslator(source=source_lang, target=target_lang)

        results = []
        for page_num in page_indices:
            if 0 <= page_num < total_pages:
                page = doc.load_page(page_num)
                text = page.get_text("text").strip()
                if text:
                    # Google Translate has a 5000 char limit per request
                    # Split into chunks if needed
                    chunks = [text[i:i+4500] for i in range(0, len(text), 4500)]
                    translated_chunks = []
                    for chunk in chunks:
                        try:
                            translated = translator.translate(chunk)
                            translated_chunks.append(translated)
                        except Exception as te:
                            translated_chunks.append(f"[Translation error: {str(te)}]")
                    translated_text = " ".join(translated_chunks)
                    results.append({
                        "page": page_num + 1,
                        "original": text,
                        "translated": translated_text
                    })
                else:
                    results.append({
                        "page": page_num + 1,
                        "original": "",
                        "translated": "(No text found on this page)"
                    })
        doc.close()

        return {"pages": results, "source_lang": source_lang, "target_lang": target_lang}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class TranslatedPage(BaseModel):
    page: int
    translated: str

class GeneratePdfRequest(BaseModel):
    pages: List[TranslatedPage]
    filename: str = "translated"

@app.post("/generate-translated-pdf")
async def generate_translated_pdf(request: GeneratePdfRequest):
    """Generate a PDF from translated text using fpdf2 for Unicode support."""
    try:
        from fpdf import FPDF
        
        pdf = FPDF()
        pdf.set_auto_page_break(auto=True, margin=20)
        pdf.set_left_margin(20)
        pdf.set_right_margin(20)
        
        # Try to add a Unicode font that supports multiple scripts
        font_added = False
        font_candidates = [
            (r"C:\Windows\Fonts\Nirmala.ttc", "Nirmala"),
            (r"C:\Windows\Fonts\mangal.ttf", "Mangal"),
            (r"C:\Windows\Fonts\arial.ttf", "Arial"),
        ]
        
        for font_path, font_name in font_candidates:
            if os.path.exists(font_path):
                try:
                    pdf.add_font(font_name, "", font_path, uni=True)
                    pdf.set_font(font_name, size=9)
                    font_added = True
                    break
                except Exception:
                    continue
        
        if not font_added:
            pdf.set_font("Helvetica", size=9)
        
        for page_data in request.pages:
            text = page_data.translated
            if not text.strip():
                text = "(No text on this page)"
            
            pdf.add_page()
            
            # Page header
            pdf.set_font_size(8)
            pdf.set_text_color(150, 150, 150)
            try:
                pdf.cell(0, 6, f"Page {page_data.page}", new_x="LMARGIN", new_y="NEXT")
            except Exception:
                pass
            pdf.ln(3)
            
            # Render translated text using write() for better character-level wrapping
            pdf.set_font_size(9)
            pdf.set_text_color(30, 30, 30)
            
            try:
                # write() handles wrapping at character level, avoiding "not enough horizontal space"
                pdf.write(5, text)
                pdf.ln(5)
            except Exception:
                # Ultimate fallback: render character by character
                try:
                    for char in text:
                        try:
                            pdf.write(5, char)
                        except Exception:
                            pdf.write(5, "?")
                    pdf.ln(5)
                except Exception:
                    pdf.multi_cell(0, 5, "(Text could not be rendered)")
        
        output_filename = f"translated_{uuid.uuid4()}.pdf"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        pdf.output(output_path)
        
        return FileResponse(
            output_path, 
            filename=f"{request.filename}.pdf", 
            media_type="application/pdf"
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

