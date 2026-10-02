from pathlib import Path
from PIL import Image
import hashlib
import json

root=Path(__file__).resolve().parents[1]
checks=[
    ('public/assets/hero-evolution.webp',(1920,440)),
    ('public/assets/neanderthal.webp',(1024,1024)),
    ('public/assets/neanderthal-768.webp',(768,768)),
]
errors=[]
for rel,expected in checks:
    path=root/rel
    if not path.exists(): errors.append(f'missing: {rel}'); continue
    with Image.open(path) as im:
        if im.size!=expected: errors.append(f'{rel}: expected {expected}, got {im.size}')
manifest=root/'public/assets/asset-manifest.json'
if manifest.exists():
    data=json.loads(manifest.read_text())
    package=json.loads((root/'package.json').read_text())
    if data.get('version')!=package.get('version','').replace('0.',''): errors.append(f"asset-manifest version is not aligned with package release {package.get('version')}")
    for item in data.get('assets',[]):
        path=item.get('path','')
        expected=item.get('sha256')
        if path.startswith('/assets/') and expected:
            fp=root/'public'/path.lstrip('/')
            if fp.is_file():
                actual=hashlib.sha256(fp.read_bytes()).hexdigest()
                if actual!=expected: errors.append(f'{path}: sha256 mismatch')
legacy=root/'public/assets/legacy/v21-plates'

media_manifest=root/'public/assets/media-manifest-v22.json'
if media_manifest.exists():
    media=json.loads(media_manifest.read_text())
    items=media.get('items',[])
    ids=[item.get('mediaId') for item in items]
    if len(ids)!=len(set(ids)): errors.append('media-manifest contains duplicate media IDs')
    for item in items:
        src=item.get('src','')
        status=item.get('status')
        if status=='legacy': errors.append(f"legacy media appears in production media manifest: {item.get('mediaId')}")
        if src.startswith('/assets/') and not (root/'public'/src.lstrip('/')).exists(): errors.append(f"missing canonical media asset: {src}")
        elif src and not src.startswith(('https://','http://','/assets/')): errors.append(f"invalid media src: {src}")
else:
    errors.append('missing media-manifest-v22.json')
if not legacy.exists() or not any(legacy.iterdir()): errors.append('legacy v21 plate quarantine directory is empty')
if errors:
    for e in errors: print('ERROR',e)
    raise SystemExit(1)
print('Asset audit passed.')
