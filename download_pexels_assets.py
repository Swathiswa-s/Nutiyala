import urllib.request
import re
import os
from PIL import Image

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
}

dest_dir = 'c:/Users/Swathi/aaradhya/assets/images/pexels'
os.makedirs(dest_dir, exist_ok=True)

# Curated list of high-quality Pexels photo IDs matching Indian ethnic & luxury fashion
# We will download them with high resolution and quality
photo_map = {
    # Kurtis
    'kurti_sage_1.jpg': 'https://images.pexels.com/photos/8770996/pexels-photo-8770996.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'kurti_sage_2.jpg': 'https://images.pexels.com/photos/36311379/pexels-photo-36311379.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'kurti_lavender_1.jpg': 'https://images.pexels.com/photos/28943474/pexels-photo-28943474.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'kurti_lavender_2.jpg': 'https://images.pexels.com/photos/38281680/pexels-photo-38281680.jpeg?auto=compress&cs=tinysrgb&w=1200',
    
    # Co-ord Sets / Suits
    'coord_terracotta_1.jpg': 'https://images.pexels.com/photos/35869868/pexels-photo-35869868.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'coord_terracotta_2.jpg': 'https://images.pexels.com/photos/20957555/pexels-photo-20957555.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'coord_rosewood_1.jpg': 'https://images.pexels.com/photos/14250181/pexels-photo-14250181.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'coord_rosewood_2.jpg': 'https://images.pexels.com/photos/28941551/pexels-photo-28941551.jpeg?auto=compress&cs=tinysrgb&w=1200',

    # Shawls / Wraps
    'shawl_pashmina_1.jpg': 'https://images.pexels.com/photos/6103407/pexels-photo-6103407.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'shawl_pashmina_2.jpg': 'https://images.pexels.com/photos/16049198/pexels-photo-16049198.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'shawl_atelier_1.jpg': 'https://images.pexels.com/photos/8619007/pexels-photo-8619007.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'shawl_atelier_2.jpg': 'https://images.pexels.com/photos/37647057/pexels-photo-37647057.jpeg?auto=compress&cs=tinysrgb&w=1200',

    # Hijabs
    'hijab_lavender_1.jpg': 'https://images.pexels.com/photos/4911074/pexels-photo-4911074.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'hijab_lavender_2.jpg': 'https://images.pexels.com/photos/7451485/pexels-photo-7451485.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'hijab_terracotta_1.jpg': 'https://images.pexels.com/photos/32872405/pexels-photo-32872405.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'hijab_terracotta_2.jpg': 'https://images.pexels.com/photos/17717992/pexels-photo-17717992.jpeg?auto=compress&cs=tinysrgb&w=1200',

    # Category Pillar Highlights
    'pillar_kurtis.jpg': 'https://images.pexels.com/photos/35902078/pexels-photo-35902078.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'pillar_coords.jpg': 'https://images.pexels.com/photos/14928074/pexels-photo-14928074.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'pillar_hijabs.jpg': 'https://images.pexels.com/photos/29118567/pexels-photo-29118567.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'pillar_shawls.jpg': 'https://images.pexels.com/photos/6633533/pexels-photo-6633533.jpeg?auto=compress&cs=tinysrgb&w=1200',

    # Detail Shots
    'detail_embroidery_1.jpg': 'https://images.pexels.com/photos/36470545/pexels-photo-36470545.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'detail_embroidery_2.jpg': 'https://images.pexels.com/photos/36754808/pexels-photo-36754808.jpeg?auto=compress&cs=tinysrgb&w=1200'
}

for name, url in photo_map.items():
    file_path = os.path.join(dest_dir, name)
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
            with open(file_path, 'wb') as f:
                f.write(data)
            # Verify and optimize with Pillow
            with Image.open(file_path) as im:
                # Save high quality
                im.save(file_path, quality=94, optimize=True)
                print(f"Downloaded {name}: {im.size}")
    except Exception as e:
        print(f"Failed {name}: {e}")

print("Completed Pexels download.")
