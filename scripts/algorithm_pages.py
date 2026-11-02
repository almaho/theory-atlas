"""Self-contained paper walkthroughs, built beside the atlas."""
from site_pages import site_navigation, site_theme, site_appearance


def build_algorithm_pages(root, write=True):
    template = (root / 'src/ors-walkthrough.html').read_text()
    css = '\n'.join((root / 'src' / name).read_text() for name in
                    ('style.css', 'focus.css', 'site.css', 'ors-walkthrough.css'))
    js = '\n'.join((root / 'src' / name).read_text() for name in
                   ('ors-walkthrough-engine.js', 'ors-walkthrough.js'))
    replacements = {'/* WALK_CSS */': css, '/* WALK_JS */': js,
                    '<!-- SITE_NAV -->': site_navigation('atlas'),
                    '<!-- SITE_THEME -->': site_theme(root),
                    '<!-- SITE_APPEARANCE -->': site_appearance()}
    for token, value in replacements.items():
        assert template.count(token) == 1, 'Missing walkthrough token: ' + token
        template = template.replace(token, value)
    if write:
        (root / 'dist/matching-ors.html').write_text(template)
    print('Algorithm walkthrough: Behnezhad–Ghafari ORS dynamic matching.')
