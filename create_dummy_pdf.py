from pypdf import PdfWriter, PageObject
import io

def create_pdf(filename, text):
    writer = PdfWriter()
    page = PageObject.create_blank_page(width=200, height=200)
    # We can't easily add text without a font, but a blank page is a valid PDF
    # content = f"BT /F1 24 Tf 50 150 Td ({text}) Tj ET" 
    # page.merge_page(PageObject.create_from_content(content)) # This is complex without fonts
    
    # Just a simple page
    writer.add_page(page)
    
    with open(filename, "wb") as f:
        writer.write(f)

if __name__ == "__main__":
    create_pdf("test1.pdf", "Hello World 1")
    create_pdf("test2.pdf", "Hello World 2")
    print("Created test1.pdf and test2.pdf")
