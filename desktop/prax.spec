# -*- mode: python ; coding: utf-8 -*-

import os

block_cipher = None
ROOT = os.path.dirname(os.path.abspath(SPEC))
BACKEND = os.path.join(ROOT, '..', 'backend')

a = Analysis(
    [os.path.join(ROOT, 'launcher.py')],
    pathex=[ROOT, BACKEND],
    binaries=[],
    datas=[
        (os.path.join(ROOT, '..', 'frontend', 'dist'), os.path.join('frontend', 'dist')),
        (os.path.join(BACKEND, 'prax'), 'prax'),
        (os.path.join(ROOT, 'assets'), 'assets'),
    ],
    hiddenimports=[
        'webview',
        'webview.platforms.winforms',
        'clr_loader',
        'pythonnet',
        'bottle',
        'prax',
        'prax.main',
        'prax.database',
        'prax.config',
        'prax.models',
        'prax.routers',
        'prax.schemas',
        'prax.scraper',
        'prax.services',
        'prax.auth',
        'login',
        'auth',
        'aiosqlite',
        'sqlalchemy.dialects.sqlite',
        'uvicorn',
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'starlette',
        'starlette.routing',
        'starlette.responses',
        'fastapi',
        'fastapi.routing',
        'PIL',
        'PIL.Image',
        'PIL.ImageDraw',
        'PIL.ImageTk',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['matplotlib', 'numpy', 'pandas', 'scipy', 'xmlrpc', 'pydoc', 'doctest', 'unittest', 'ftplib', 'poplib', 'imaplib', 'smtplib', 'telnetlib', 'difflib', 'optparse', 'wave', 'colorsys', 'msilib', 'test', 'lib2to3'],
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='PRAX',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    icon=os.path.join(ROOT, 'assets', 'icon_login.ico'),
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='PRAX',
)
