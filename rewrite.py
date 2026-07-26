import subprocess
import sys

mapping = {
    "fix: parse correct json structure": "fix: ui json parsing",
    "docs: anonymize demonstration outputs": "docs: use example domains",
    "docs: fix copy icon instruction": "docs: fix copy instruction",
    "docs: update RapidAPI UI instructions": "docs: update rapidapi ui guide",
    "fix: use /scan endpoint": "fix: use scan endpoint",
    "fix: add ngrok-skip-browser-warning": "fix: add ngrok bypass header",
    "feat: switch API endpoint to Ngrok domain": "feat: switch to ngrok endpoint",
    "feat: switch API endpoint to self-hosted": "feat: switch to self-hosted api",
    "docs: change placeholder to example.com": "docs: use example.com",
    "feat: add interactive JS features": "feat: add interactive js",
    "feat: add target aesthetic favicon": "feat: add favicon",
    "redesign: brutalist terminal aesthetic": "ui: brutalist terminal redesign",
    "feat: add Google Search Console verification": "feat: add gsc tag",
    "feat: add GitHub Pages landing page": "feat: add gh pages landing",
    "docs: fix 5 UX issues": "docs: fix ux issues",
    "docs: expand API key tutorial": "docs: expand api key guide",
    "feat: full API integration": "feat: full api integration",
    "fix: production-grade error handling": "fix: error handling & validation",
    "fix: explicitly catch HTTP 429": "fix: handle 429 error",
    "docs: restore radar sweep gradient": "docs: restore radar sweep",
    "docs: revert radar gradient": "docs: revert radar gradient",
    "docs: synchronize radar blips": "docs: sync radar blips",
    "docs: upgrade radar animation": "docs: upgrade radar anim",
    "docs: fix SVG SMIL rotation": "docs: fix svg pivot",
    "docs: add MIT license": "docs: add license",
    "docs: expand README": "docs: expand readme",
    "docs: rename banner": "docs: rename banner",
    "docs: strip emojis": "docs: strip emojis",
    "docs: add elite SVG banner": "docs: add svg banner",
    "Initial commit:": "init",
    "docs: add website link": "docs: add website link"
}

def get_new_msg(old_msg):
    for k, v in mapping.items():
        if old_msg.startswith(k):
            return v
    return old_msg

hashes = subprocess.check_output(['git', 'log', '--reverse', '--format=%H||%s', 'main']).decode('utf-8').strip().split('\n')

subprocess.check_call(['git', 'checkout', '--orphan', 'new_main'])
subprocess.check_call(['git', 'rm', '-rf', '.'])

for i, line in enumerate(hashes):
    if not line.strip(): continue
    parts = line.split('||', 1)
    if len(parts) != 2: continue
    h, msg = parts
    new_msg = get_new_msg(msg)
    
    if i == 0:
        subprocess.check_call(['git', 'checkout', h, '--', '.'])
        subprocess.check_call(['git', 'add', '-A'])
        subprocess.check_call(['git', 'commit', '-m', new_msg])
    else:
        try:
            subprocess.check_call(['git', 'cherry-pick', '--no-commit', h])
            subprocess.check_call(['git', 'commit', '-m', new_msg])
        except subprocess.CalledProcessError:
            subprocess.call(['git', 'cherry-pick', '--abort'])

subprocess.check_call(['git', 'branch', '-f', 'main', 'new_main'])
subprocess.check_call(['git', 'checkout', 'main'])
subprocess.check_call(['git', 'branch', '-D', 'new_main'])
