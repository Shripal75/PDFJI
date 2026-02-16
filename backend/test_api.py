import requests

def test_compress():
    url = "http://localhost:8000/compress"
    files = {'file': open('../test1.pdf', 'rb')}
    try:
        response = requests.post(url, files=files)
        if response.status_code == 200:
            print("Compression successful!")
            with open("test_compressed.pdf", "wb") as f:
                f.write(response.content)
        else:
            print(f"Compression failed with status {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_compress()
