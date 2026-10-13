import urllib.request
import re
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
}

searches = [
    'indian model traditional dress',
    'indian ethnic lehenga suit',
    'indian silk dupatta',
    'anarkali suit indian woman',
    'indian embroidery fashion dress',
    'kashmiri pashmina shawl',
    'luxury silk hijab woman'
]

discovered = {}

for term in searches:
    url = f"https://www.pexels.com/search/{urllib.parse.quote(term)}/"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            # Extract image URLs
            matches = re.findall(r'https://images\.pexels\.com/photos/\d+/[^"?\s]+', html)
            unique = list(dict.fromkeys(matches))
            discovered[term] = unique[:12]
            print(f"'{term}': {len(unique)} photos")
    except Exception as e:
        print(f"'{term}': error {e}")

with open('c:/Users/Swathi/aaradhya/pexels_indian_couture.json', 'w') as f:
    json.dump(discovered, f, indent=2)

print("Saved to pexels_indian_couture.json")
