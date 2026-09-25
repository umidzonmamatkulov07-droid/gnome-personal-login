# Personal GNOME login and lock-screen theme

Backup of the working files for the custom Fedora login and lock-screen sequence.
The theme shows the first photo and the “Say my name” prompt. The GNOME Shell
extension shows the second photo after a successful unlock, then opens the
desktop after about 2.5 seconds. Enter, a click, or a touch opens it sooner.

## Contents

- `theme/lockscreen-theme.gresource`: ready-to-use GNOME theme bundle.
- `theme/source/`: editable theme CSS, images, and other resource files.
- `theme/theme.xml` and `theme/rebuild.py`: rebuild the bundle from those files.
- `extension/extension.js`, `metadata.json`, `lock.jpg`, and `success.png`:
  editable extension and its photos.
- `extension/lock-sequence@umidjon.shell-extension.zip`: packaged extension.

These files were saved from the installed configuration on Fedora 44 with
GNOME Shell 50.0. GNOME internal interfaces can change between versions;
check compatibility before using them on another release. The repository
includes both photos, which are visible and downloadable when it is public.

## Restore the extension

Copy the four files in `extension/` (excluding the ZIP) into
`~/.local/share/gnome-shell/extensions/lock-sequence@umidjon/` and enable
`lock-sequence@umidjon` in GNOME Extensions. Log out and sign in to ensure
GNOME loads the saved code.

## Restore the theme

The system theme file is `/usr/share/gnome-shell/gnome-shell-theme.gresource`.
First save a copy of the current file. Then, on the same GNOME Shell version,
install `theme/lockscreen-theme.gresource` at that path with administrator
privileges. Log out and sign in to see the change. To undo it, put the saved
original file back. Replacing a system theme may need to be repeated after a
GNOME Shell package update.

To rebuild the saved theme after editing `theme/source/`, run
`python3 theme/rebuild.py` from the repository root. This requires
`glib-compile-resources`.
