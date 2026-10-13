import urllib.request
import re
import os

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
}

queries = {
    'kurti': 'indian woman kurti dress',
    'coord': 'indian woman modern ethnic suit',
    'hijab': 'woman wearing elegant silk hijab',
    'shawl': 'pashmina scarf shawl woman',
    'embroidery': 'indian textile embroidery craft'
}

all_found = {}

for cat, q in queries.items():
    url = f"https://www.pexels.com/search/{urllib.parse.quote(q)}/"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            # Extract high-res image URLs
            # Pexels images format: https://images.pexels.com/photos/12345/pexels-photo-12345.jpeg
            matches = re.findall(r'https://images\.pexels\.com/photos/\d+/[^"?\s]+', html)
            unique = list(dict.fromkeys(matches))
            all_found[cat] = unique[:10]
            print(f"[{cat}] found {len(unique)} images")
    except Exception as e:
        print(f"[{cat}] error: {e}")

print("Results:", {k: len(v) for k, v in all_found.items()})

# Save results to a json file
import json
with open('c:/Users/Swathi/aaradhya/pexels_urls.json', 'w') as f:
    json.dump(all_found, f, indent=2)
print("Saved to pexels_urls.json")
