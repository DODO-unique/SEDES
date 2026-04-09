import os
import re

def process_file(base):
    fname = f'frontend/{base}.html'
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    style_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
    if style_match:
        style_content = style_match.group(1).strip()
        with open(f'frontend/{base}.css', 'w', encoding='utf-8') as f:
            f.write(style_content + '\n')
        content = content.replace(style_match.group(0), f'<link rel="stylesheet" href="{base}.css"/>')

    script_match = re.search(r'<script>(.*?)</script>', content, re.DOTALL)
    if script_match:
        script_content = script_match.group(1).strip()
        with open(f'frontend/{base}.js', 'w', encoding='utf-8') as f:
            f.write(script_content + '\n')
        content = content.replace(script_match.group(0), f'<script src="{base}.js"></script>')

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

process_file('encode')
process_file('decode')
