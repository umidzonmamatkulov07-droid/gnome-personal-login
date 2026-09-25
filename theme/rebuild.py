#!/usr/bin/env python3
"""Rebuild the saved GNOME Shell 50 theme from its editable source files."""

from pathlib import Path
from subprocess import run

here = Path(__file__).resolve().parent
run(
    [
        "glib-compile-resources",
        f"--sourcedir={here / 'source'}",
        f"--target={here / 'lockscreen-theme.gresource'}",
        str(here / "theme.xml"),
    ],
    check=True,
)
