import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {UnlockDialog} from 'resource:///org/gnome/shell/ui/unlockDialog.js';

const SUCCESS_MS = 2500;
const LOGIN_SETTLE_MS = 350;

export default class LockSequence extends Extension {
    enable() {
        // Preserve the already working first photo on the lock screen.
        const lockImage = Gio.File.new_for_path(`${this.path}/lock.jpg`).get_uri();
        this._originalCreateBackground = UnlockDialog.prototype._createBackground;
        UnlockDialog.prototype._createBackground = function (monitorIndex) {
            const monitor = Main.layoutManager.monitors[monitorIndex];
            const widget = new St.Widget({
                style_class: 'screen-shield-background',
                x: monitor.x,
                y: monitor.y,
                width: monitor.width,
                height: monitor.height,
                style: `background-image: url("${lockImage}"); background-size: cover; background-position: center; background-repeat: no-repeat;`,
            });
            this._backgroundGroup.add_child(widget);
        };
        Main.screenShield._dialog?._updateBackgrounds();

        // GNOME reaches this point after successful authentication and before
        // removing the shield, so the second photo covers the desktop reveal.
        const shield = Main.screenShield;
        this._originalContinueDeactivate = shield._continueDeactivate;
        shield._continueDeactivate = (...args) => {
            if (shield.locked && shield._dialog && !shield._isGreeter)
                this._show();
            return this._originalContinueDeactivate.apply(shield, args);
        };
        this._lockedId = shield.connect('locked-changed', () => {
            if (shield.locked)
                this._dismiss();
        });

        // A sign-in starts a fresh user shell instead of unlocking this one.
        if (Main.layoutManager._startingUp) {
            this._startupId = Main.layoutManager.connect('startup-complete', () => {
                Main.layoutManager.disconnect(this._startupId);
                this._startupId = 0;
                this._queueLoginPhoto();
            });
        } else if (!shield.locked && !shield.active) {
            this._queueLoginPhoto();
        }
    }

    _queueLoginPhoto() {
        if (Main.sessionMode.currentMode !== 'user')
            return;
        this._showId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, LOGIN_SETTLE_MS, () => {
            this._showId = 0;
            if (Main.sessionMode.currentMode === 'user' && !Main.screenShield.locked)
                this._show();
            return GLib.SOURCE_REMOVE;
        });
    }

    _show() {
        this._dismiss();
        const image = Gio.File.new_for_path(`${this.path}/success.png`).get_uri();
        this._overlay = new St.Widget({
            reactive: true,
            x: 0,
            y: 0,
            width: global.stage.width,
            height: global.stage.height,
        });
        for (const monitor of Main.layoutManager.monitors) {
            this._overlay.add_child(new St.Widget({
                x: monitor.x,
                y: monitor.y,
                width: monitor.width,
                height: monitor.height,
                style: `background-color: #303746; background-image: url("${image}"); background-size: cover; background-position: center; background-repeat: no-repeat;`,
            }));
        }
        Main.uiGroup.add_child(this._overlay);
        Main.uiGroup.set_child_above_sibling(this._overlay, null);
        this._eventId = global.stage.connect('captured-event', (_actor, event) => {
            const type = event.type();
            if (type === Clutter.EventType.KEY_PRESS) {
                const key = event.get_key_symbol();
                if (key !== Clutter.KEY_Return && key !== Clutter.KEY_KP_Enter)
                    return Clutter.EVENT_PROPAGATE;
            } else if (type !== Clutter.EventType.BUTTON_PRESS &&
                       type !== Clutter.EventType.TOUCH_BEGIN) {
                return Clutter.EVENT_PROPAGATE;
            }
            this._dismiss();
            return Clutter.EVENT_STOP;
        });
        this._timerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, SUCCESS_MS, () => {
            this._timerId = 0;
            this._dismiss();
            return GLib.SOURCE_REMOVE;
        });
        log('lock-sequence: second photo displayed');
    }

    _dismiss() {
        if (this._showId) {
            GLib.source_remove(this._showId);
            this._showId = 0;
        }
        if (this._eventId) {
            global.stage.disconnect(this._eventId);
            this._eventId = 0;
        }
        if (this._timerId) {
            GLib.source_remove(this._timerId);
            this._timerId = 0;
        }
        this._overlay?.destroy();
        this._overlay = null;
    }

    disable() {
        this._dismiss();
        if (this._startupId) {
            Main.layoutManager.disconnect(this._startupId);
            this._startupId = 0;
        }
        if (this._lockedId) {
            Main.screenShield.disconnect(this._lockedId);
            this._lockedId = 0;
        }
        if (this._originalContinueDeactivate) {
            Main.screenShield._continueDeactivate = this._originalContinueDeactivate;
            this._originalContinueDeactivate = null;
        }
        if (this._originalCreateBackground) {
            UnlockDialog.prototype._createBackground = this._originalCreateBackground;
            this._originalCreateBackground = null;
            Main.screenShield._dialog?._updateBackgrounds();
        }
    }
}
