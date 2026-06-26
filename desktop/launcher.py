import sys
import os
import threading
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

ASSETS_DIR = Path(__file__).resolve().parent / "assets"


def get_base_path():
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))


def get_resource_path(relative_path):
    base = get_base_path()
    if getattr(sys, 'frozen', False):
        base = os.path.join(sys._MEIPASS)
    return os.path.join(base, relative_path)


def start_backend():
    from prax.main import app
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")


def open_app():
    import webview
    time.sleep(2)
    icon_path = str(ASSETS_DIR / "icon_login.ico")
    window = webview.create_window(
        title="PRAX - Workflow Portal",
        url="http://127.0.0.1:8000",
        width=1280,
        height=800,
        min_size=(900, 600),
    )
    if os.path.exists(icon_path):
        window.icon = icon_path
    webview.start(debug=False)


def on_login_success(user_data):
    print(f"Login OK: {user_data['username']}")
    backend_thread = threading.Thread(target=start_backend, daemon=True)
    backend_thread.start()
    open_app()


def main():
    from login import LoginApp
    app_login = LoginApp(on_success=on_login_success)
    app_login.run()


if __name__ == "__main__":
    main()
