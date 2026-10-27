"""Validate and publish committed atlas source plus its standalone Pages build."""
import pathlib
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]


def run(*args, capture=False):
    return subprocess.run(args, cwd=ROOT, check=True, text=True,
                          stdout=subprocess.PIPE if capture else None).stdout


def main():
    if run('git', 'branch', '--show-current', capture=True).strip() != 'main':
        raise SystemExit('Publish from main after reviewing and committing the changes.')
    if run('git', 'status', '--porcelain', capture=True).strip():
        raise SystemExit('Commit the reviewed changes before publishing.')
    run(sys.executable, 'scripts/build.py')
    node = shutil.which('node')
    if not node:
        raise SystemExit('Node.js is required to validate the atlas.')
    run(node, 'scripts/test_renderer.cjs')
    if run('git', 'status', '--porcelain', capture=True).strip():
        raise SystemExit('The build changed files. Review and commit them, then publish again.')
    pages_commit = run('git', 'subtree', 'split', '--prefix=dist', 'HEAD', capture=True).strip()
    run('git', 'push', 'origin', 'main')
    run('git', 'push', 'origin', pages_commit + ':refs/heads/gh-pages')
    print('Published source and site branch. GitHub Pages will deploy the new build.')


if __name__ == '__main__':
    main()
