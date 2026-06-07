import urllib.request

url = "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQG6o8PpFHouZEOeuxNDGXR8jAavWZkuhs8vQqYyZZEBuS9dPhGZIIaqEWUesoCoCciOL5bKbL4QVosLHudqczlr3IZc6IhTlm7PfQah6I6A70J654sEB3AfyWwmOoswIEWe6RLJKWvk3A=="
print("Fetching redirect target...")
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        print("Final URL:", response.geturl())
except Exception as e:
    print("Error:", e)
