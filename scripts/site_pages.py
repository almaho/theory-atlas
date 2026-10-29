"""Build the community pages with the same navigation as the atlas."""
from pathlib import Path


def site_navigation(active):
    links = [('atlas', 'index.html#atlas', 'Atlas'),
             ('vision', 'vision.html', 'Vision'),
             ('people', 'people.html', 'People')]
    items = []
    for key, href, title in links:
        current = ' aria-current="page"' if key == active else ''
        home = ' data-atlas-home="true"' if key == 'atlas' else ''
        items.append(f'<a class="site-link" href="{href}"{current}{home}>{title}</a>')
    return ('<nav class="view-nav" aria-label="Site navigation">'
            '<a class="atlas-brand" href="index.html#atlas" data-atlas-home="true">'
            'THEORY ATLAS<span>Knowledge, in view.</span></a>'
            '<div class="site-links">' + ''.join(items) + '</div></nav>')


def build_site_pages(root: Path, write=True):
    css = '\n'.join((root / 'src' / name).read_text()
                    for name in ('style.css', 'focus.css', 'site.css'))
    footer = ('<footer class="site-footer"><a href="index.html#atlas">Explore the atlas ↗</a>'
              '<span>A community effort in theoretical computer science.</span>'
              '<a href="https://github.com/almaho/theory-atlas" target="_blank" '
              'rel="noopener noreferrer">Project on GitHub ↗</a></footer>')
    for page in ('vision', 'people'):
        template = (root / 'src' / f'{page}.html').read_text()
        for token in ('/* SITE_CSS */', '<!-- SITE_NAV -->', '<!-- SITE_FOOTER -->'):
            assert template.count(token) == 1, f'{page}: missing or repeated {token}'
        html = template.replace('/* SITE_CSS */', css).replace(
            '<!-- SITE_NAV -->', site_navigation(page)).replace('<!-- SITE_FOOTER -->', footer)
        if write:
            (root / 'dist').mkdir(exist_ok=True)
            (root / 'dist' / f'{page}.html').write_text(html)
    print('Community pages: Vision and People; shared Atlas / Vision / People navigation.')
