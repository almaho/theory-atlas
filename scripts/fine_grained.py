"""Validate and build the separate fine-grained complexity page."""
import json


def build_fine_grained(root, write=True):
    data = json.loads((root / 'data/fine-grained.json').read_text())
    nodes = {n['id']: n for n in data['nodes']}
    sources = data['sources']
    assert len(nodes) == len(data['nodes']), 'Duplicate fine-grained problem'
    assert len({e['id'] for e in data['edges']}) == len(data['edges'])
    groups = {g['id'] for g in data['groups']}
    for source in sources.values():
        assert source['url'].startswith('https://')
        assert source['status'] in ('published', 'preprint', 'reference')
        assert source['title'] and source['authors']
    for node in nodes.values():
        assert node['group'] in groups
        assert all(node.get(k) for k in ('label', 'short', 'contract', 'parameter', 'tag'))
        group = next(g for g in data['groups'] if g['id'] == node['group'])
        assert 110 <= node['x'] <= 1245 and group['top'] + 32 <= node['y'] <= group['bottom'] - 32
        for bound in node['baselines'] + ([node['lower']] if node.get('lower') else []) + node.get('claims', []) + node.get('related', []):
            assert bound['sourceId'] in sources
            assert bound['bound'] and bound['detail'] and bound['locator']
        if node.get('lower'):
            assert node['lower']['condition']
            assert node['lower']['status'] in ('conditional', 'historical')
        else:
            assert node.get('lowerBoundStatus'), 'Missing bounds need an explicit scope note'
        for claim in node.get('claims', []):
            assert sources[claim['sourceId']]['status'] == 'preprint'
    for edge in data['edges']:
        assert edge['from'] in nodes and edge['to'] in nodes
        assert edge['from'] != edge['to']
        assert edge['sourceId'] in sources
        assert all(edge.get(k) for k in ('consequence', 'transformation', 'locator', 'notes', 'verifiedOn'))
        assert edge['kind'] in ('reduction', 'structural')
        if edge['kind'] == 'structural':
            assert edge.get('fixedDirection') is True
        assert all(s in sources for s in edge.get('additionalSources', []))
    for row in data.get('dynamicView', {}).get('rows', []):
        node = nodes[row['nodeId']]
        assert node['group'] in ('dynamic', 'matching')
        if row.get('threshold') is not None:
            assert row['queryExponent'] < node['lower']['queryCeilingExponent']
            assert row['threshold'] == node['lower']['threshold']
        else:
            assert row.get('barrierNote')
        for index in row['algorithmIndices']:
            result = node['baselines'][index]
            assert result['query'] == row['query']
            if result.get('updateExponent') is not None:
                assert 0 <= result['updateExponent'] <= 3
                if row.get('threshold') is not None:
                    assert row['threshold'] <= result['updateExponent']
            else:
                assert result.get('symbolic') is True
            assert result['guarantee']
    if write:
        template = (root / 'src/fine-grained.html').read_text()
        payload = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c').replace('&', '\\u0026')
        for marker in ('/* FG_CSS */', '/* FG_JS */', '/* FG_DATA */'):
            assert template.count(marker) == 1
        html = template.replace('/* FG_CSS */', (root / 'src/fine-grained.css').read_text() + '\n' + (root / 'src/paper-links.css').read_text())
        html = html.replace('/* FG_JS */', (root / 'src/fine-grained.js').read_text() + '\n' + (root / 'src/paper-links.js').read_text()).replace('/* FG_DATA */', payload)
        (root / 'dist').mkdir(exist_ok=True)
        (root / 'dist/fine-grained.html').write_text(html)
    print(f'Fine-grained: {len(nodes)} problems; {len(data["edges"])} connections; {len(sources)} sources.')
    return data
