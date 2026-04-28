from pathlib import Path
import re

root = Path('.')
style = root / 'style.css'
text = style.read_text('utf-8')
text = text.replace("font-family: 'Open Sans', 'Funnel Display', Arial, Helvetica, sans-serif;", "font-family: 'Open Sans', Arial, Helvetica, sans-serif;")
text = text.replace("font-family: 'Lobster Two', 'Montserrat Alternates', Arial, Helvetica, sans-serif;", "font-family: 'Lobster Two', Arial, Helvetica, sans-serif;")
text = text.replace("font-family: 'Funnel Display', 'Open Sans', Arial, Helvetica, sans-serif;", "font-family: 'Open Sans', Arial, Helvetica, sans-serif;")
style.write_text(text, 'utf-8')

old_link = '<link href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@300..800&family=Lobster+Two:ital,wght@0,400;0,700;1,400;1,700&family=Montserrat+Alternates:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet">'
new_link = '<link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Lobster+Two:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">'

for html_file in root.glob('*.html'):
    html_text = html_file.read_text('utf-8')
    if old_link in html_text:
        html_text = html_text.replace(old_link, new_link)
    html_text = re.sub(r'<style>\s*@import url\(\'https://fonts\.cdnfonts\.com/css/rage-italic\'\);\s*</style>', '', html_text)
    html_file.write_text(html_text, 'utf-8')
    print(f'updated {html_file.name}')
