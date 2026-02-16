import logging
import os

# Configure logging to file
logging.basicConfig(
    filename='compression_debug.log', 
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s',
    force=True
)

print("Starting debug compression (logging to compression_debug.log)...")

from utils import compress_pdf

try:
    if not os.path.exists("temp_test.pdf"):
        logging.error("temp_test.pdf not found!")
    else:
        compress_pdf("temp_test.pdf", "output_debug.pdf", quality=10)
        logging.info("Compression finished successfully.")
except Exception as e:
    logging.error(f"Error during compression: {e}")
