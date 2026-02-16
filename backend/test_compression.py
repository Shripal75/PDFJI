import fitz
from PIL import Image
import io
import os
from utils import compress_pdf

def create_dummy_pdf(filename):
    doc = fitz.open()
    page = doc.new_page()
    
    # Create large image (2000x3000) ~ 6MP
    # To mimic 2.3MB file, we can just use random noise or a photo.
    # Random noise doesn't compress well with JPEG (high entropy).
    # A gradient or solid color compresses VERY well.
    # We need something realistic.
    # Let's generate a gradient.
    
    width, height = 2000, 3000
    img = Image.new('RGB', (width, height), color='white')
    pixels = img.load()
    for y in range(height):
        for x in range(width):
            pixels[x, y] = (x % 255, y % 255, (x+y) % 255)
            
    # Save as high quality JPEG first
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG', quality=95)
    img_bytes = img_byte_arr.getvalue()
    
    page.insert_image(page.rect, stream=img_bytes)
    doc.save(filename)
    doc.close()
    return os.path.getsize(filename)

if __name__ == "__main__":
    input_pdf = "test_large.pdf"
    output_pdf = "test_compressed.pdf"
    
    print("Creating dummy PDF...")
    orig_size = create_dummy_pdf(input_pdf)
    print(f"Original Size: {orig_size/1024/1024:.2f} MB")
    
    print("Compressing at Quality 10...")
    compress_pdf(input_pdf, output_pdf, quality=10)
    
    comp_size = os.path.getsize(output_pdf)
    print(f"Compressed Size: {comp_size/1024/1024:.2f} MB")
    print(f"Ratio: {comp_size/orig_size*100:.1f}%")
    
    # Cleanup
    # os.remove(input_pdf)
    # os.remove(output_pdf)
