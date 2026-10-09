from pathlib import Path
from PIL import Image
import hashlib
import json

root=Path(__file__).resolve().parents[1]
checks=[
    ('public/assets/hero-evolution.webp',(1920,440)),
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
if manifest.exists():
    listed={item.get('path') for item in data.get('assets',[])}
    samples=root/'public/assets/species/samples'
    if samples.exists():
        for file in samples.iterdir():
            path=f'/assets/species/samples/{file.name}'
            if path not in listed: errors.append(f'{path}: missing from asset manifest')
if errors:
    for e in errors: print('ERROR',e)
    raise SystemExit(1)
print('Asset audit passed.')
