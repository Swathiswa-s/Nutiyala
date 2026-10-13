"""
Download unique high-quality Pexels images for each product.
Each product gets 2 unique images (primary + secondary).
"""
import urllib.request
import os
import time

OUT = r"c:\Users\Swathi\aaradhya\assets\images\pexels"
os.makedirs(OUT, exist_ok=True)

# Carefully curated unique URLs - each product gets 2 distinct images
# No URL is repeated across products
DOWNLOADS = {
    # Product 1: Sage Sharara Kurti - green/sage traditional dress
    "sage_kurti_1.jpg": "https://images.pexels.com/photos/35359949/pexels-photo-35359949.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&dpr=2",
    "sage_kurti_2.jpg": "https://images.pexels.com/photos/20957555/pexels-photo-20957555.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&dpr=2",

    # Product 2: Lavender Kurti Set - elegant lilac/lavender outfit
    "lavender_kurti_new_1.jpg": "https://images.pexels.com/photos/37982893/pexels-photo-37982893.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&dpr=2",
    "lavender_kurti_new_2.jpg": "https://images.pexels.com/photos/26208424/pexels-photo-26208424.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&dpr=2",

    # Product 3: Terracotta Co-ord - warm toned architectural set
    "terracotta_coord_new_1.jpg": "https://images.pexels.com/photos/28405815/pexels-photo-28405815.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&dpr=2",
    "terracotta_coord_new_2.jpg": "https://images.pexels.com/photos/35902078/pexels-photo-35902078.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&dpr=2",

    # Product 4: Rosewood Co-ord Set - dusty pink/rose traditional outfit
    "rosewood_coord_new_1.jpg": "https://images.pexels.com/photos/39164312/pexels-photo-39164312.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&dpr=2",
    "rosewood_coord_new_2.jpg": "https://images.pexels.com/photos/8568157/pexels-photo-8568157.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&dpr=2",

    # Product 5: Pashmina Shawl - kashmiri shawl/wrap
    "pashmina_shawl_new_1.jpg": "https://images.pexels.com/photos/37921733/pexels-photo-37921733.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&dpr=2",
    "pashmina_shawl_new_2.jpg": "https://images.pexels.com/photos/18453079/pexels-photo-18453079.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&dpr=2",

    # Product 6: Lavender Silk Hijab
    "hijab_lav_new_1.jpg": "https://images.pexels.com/photos/8819334/pexels-photo-8819334.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&dpr=2",
    "hijab_lav_new_2.jpg": "https://images.pexels.com/photos/30722459/pexels-photo-30722459.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&dpr=2",

    # Product 7: Terracotta Hijab
    "hijab_terra_new_1.jpg": "https://images.pexels.com/photos/7920188/pexels-photo-7920188.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&dpr=2",
    "hijab_terra_new_2.jpg": "https://images.pexels.com/photos/30825617/pexels-photo-30825617.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&dpr=2",

    # Product 8: Atelier Reversible Shawl
    "atelier_shawl_new_1.jpg": "https://images.pexels.com/photos/36212007/pexels-photo-36212007.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&dpr=2",
    "atelier_shawl_new_2.jpg": "https://images.pexels.com/photos/34954207/pexels-photo-34954207.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&dpr=2",

    # Detail/editorial images for craft story sections
    "craft_detail_new_1.jpg": "https://images.pexels.com/photos/10454182/pexels-photo-10454182.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&dpr=2",
    "editorial_model_1.jpg": "https://images.pexels.com/photos/14928074/pexels-photo-14928074.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600&dpr=2",

    # Pillar section hero images (wide format)
    "pillar_kurtis_new.jpg": "https://images.pexels.com/photos/36470545/pexels-photo-36470545.jpeg?auto=compress&cs=tinysrgb&w=1600&h=1200&dpr=2",
    "pillar_coords_new.jpg": "https://images.pexels.com/photos/28943474/pexels-photo-28943474.jpeg?auto=compress&cs=tinysrgb&w=1600&h=1200&dpr=2",
    "pillar_shawls_new.jpg": "https://images.pexels.com/photos/36311379/pexels-photo-36311379.jpeg?auto=compress&cs=tinysrgb&w=1600&h=1200&dpr=2",
    "pillar_hijabs_new.jpg": "https://images.pexels.com/photos/13085573/pexels-photo-13085573.jpeg?auto=compress&cs=tinysrgb&w=1600&h=1200&dpr=2",
}

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
}

ok = 0
fail = 0
for fname, url in DOWNLOADS.items():
    dest = os.path.join(OUT, fname)
    if os.path.exists(dest) and os.path.getsize(dest) > 10000:
        print(f"SKIP (exists): {fname}")
        ok += 1
        continue
    try:
        req = urllib.request.Request(url, headers=headers)
        data = urllib.request.urlopen(req, timeout=30).read()
        with open(dest, 'wb') as f:
            f.write(data)
        kb = len(data) / 1024
        print(f"OK: {fname} ({kb:.0f}KB)")
        ok += 1
        time.sleep(0.8)
    except Exception as e:
        print(f"FAIL: {fname} - {e}")
        fail += 1

print(f"\nDone: {ok} downloaded, {fail} failed")
