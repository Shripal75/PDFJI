# PDFji

**PDFji** is a powerful, all-in-one PDF manipulation suite designed to make managing your documents fast and easy. It offers a modern, responsive web interface to merge, split, rotate, organize, compress, and convert PDF files with a few clicks.

![PDFji Dashboard](frontend/public/logo.png)

## 🚀 Features

### PDF Editing
- **Merge PDF**: Combine multiple PDF files into a single document.
- **Split PDF**: Extract specific pages or split documents into multiple parts.
- **Rotate PDF**: Rotate specific pages or the entire document.
- **Organize PDF**: Rearrange page order, delete unwanted pages, and rotate individual pages using a drag-and-drop interface.
- **Compress PDF**: Reduce file size while maintaining quality.

### PDF Conversion
- **PDF to Image**: Convert PDF pages into high-quality images (PNG, JPG).
- **PDF to Word**: Convert PDFs to editable Word documents (DOCX).
- **PDF to PowerPoint**: Convert PDFs to editable PowerPoint presentations (PPTX).

### Create PDF
- **Image to PDF**: Combine multiple images into a single PDF.
- **Word to PDF**: Convert Word documents to PDF.
- **PowerPoint to PDF**: Convert PowerPoint presentations to PDF.

### Text & OCR
- **Extract Text**: Extract raw text from PDF files.
- **OCR (Beta)**: Optical Character Recognition to extract text from scanned PDFs and images.
- **Compress Image**: Smart image compression tool.

## 🛠️ Tech Stack

### Frontend
- **React 19**: Modern UI library for building interactive interfaces.
- **Vite**: Next-generation frontend tooling for fast builds.
- **TailwindCSS 4**: Utility-first CSS framework for rapid and beautiful styling.
- **@dnd-kit**: Lightweight and performant drag-and-drop toolkit.
- **Axios**: Promise-based HTTP client for API requests.
- **Heroicons**: Beautiful hand-crafted SVG icons.

### Backend
- **FastAPI**: Modern, high-performance web framework for Python.
- **Uvicorn**: Lightning-fast ASGI server implementation.
- **PyMuPDF (Fitz)**: High-performance PDF rendering and manipulation.
- **pdf2docx**: Converter for extracting data from PDF to DOCX.
- **docx2pdf**: Convert DOCX to PDF on Windows.
- **Pillow (PIL)**: Python Imaging Library for image processing.
- **EasyOCR**: Ready-to-use OCR with 80+ supported languages.

## 📦 Installation & Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **Microsoft Word** (Optional, required for `docx2pdf` conversion on Windows)

### 1. Clone the Repository
```bash
git clone https://github.com/Shripal75/PDFJI.git
cd PDFJI
```

### 2. Backend Setup
Navigate to the `backend` directory and install Python dependencies.

```bash
cd backend
# Create a virtual environment (optional but recommended)
python -m venv venv
# Activate venv:
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

# Install requirements
pip install -r requirements.txt
```

### 3. Frontend Setup
Navigate to the `frontend` directory and install Node dependencies.

```bash
cd ../frontend
npm install
```

## 🚀 Running the Application

### Windows (Easy Start)
Simply double-click the `run_app.bat` file in the root directory. This script will automatically launch both the backend and frontend servers for you.

### Manual Start

**Start Backend:**
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```
The backend will run at `http://127.0.0.1:8000`.

**Start Frontend:**
```bash
cd frontend
npm run dev
```
The frontend will run at `http://localhost:5173`.

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).

---

Made with ❤️ by [Shripal75](https://github.com/Shripal75)
