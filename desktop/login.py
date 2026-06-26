import tkinter as tk
import threading
import asyncio
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from PIL import Image, ImageTk, ImageDraw, ImageFilter

from prax.auth import init_auth_db, save_praxio_user, update_env_credentials, user_exists, create_reset_token
from prax.scraper.auth import validate_credentials
from prax.config import settings

VERDE_ESCURO = "#005840"
VERDE_LIMAO = "#D1F843"
BG_DARK = "#1a1a2e"
PANEL_LEFT = "#1e1e30"
PANEL_RIGHT = "#12121f"
INPUT_BG = "#2a2a40"
INPUT_FG = "#ECF0EF"
PLACEHOLDER_FG = "#666680"
BRANCO = "#FFFFFF"
ERRO_VERMELHO = "#E74C3C"

ASSETS_DIR = Path(__file__).resolve().parent / "assets"
ICON_PATH = ASSETS_DIR / "icon_login.png"


def _create_space_bg(w, h):
    img = Image.new("RGB", (w, h), (18, 18, 31))
    draw = ImageDraw.Draw(img)
    import random
    random.seed(42)
    for _ in range(120):
        x, y, r = random.randint(0, w), random.randint(0, h), random.randint(1, 3)
        brightness = random.randint(60, 200)
        draw.ellipse([x - r, y - r, x + r, y + r], fill=(brightness, brightness, brightness + 20))
    cx, cy = w * 0.5, h * 0.45
    for r, alpha in [(60, 40), (45, 60), (30, 90)]:
        layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        ld = ImageDraw.Draw(layer)
        ld.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(150, 170, 220, alpha))
        img = Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")
    return img


class LoginApp:
    def __init__(self, on_success):
        self.on_success = on_success
        self.user_data = None
        self._password_visible = False

        self.root = tk.Tk()
        self.root.title("PRAX - Login")
        self.root.configure(bg=BG_DARK)
        self.root.resizable(False, False)
        self.root.overrideredirect(True)

        if ICON_PATH.exists():
            try:
                self.root.iconbitmap(str(ASSETS_DIR / "icon_login.ico"))
            except Exception:
                pass

        w, h = 900, 560
        sw = self.root.winfo_screenwidth()
        sh = self.root.winfo_screenheight()
        x = (sw - w) // 2
        y = (sh - h) // 2
        self.root.geometry(f"{w}x{h}+{x}+{y}")

        self._drag_data = {"x": 0, "y": 0}
        self.root.bind("<Button-1>", self._start_drag)
        self.root.bind("<B1-Motion>", self._on_drag)

        init_auth_db()
        self._build_ui()

    def _start_drag(self, e):
        self._drag_data["x"] = e.x
        self._drag_data["y"] = e.y

    def _on_drag(self, e):
        x = self.root.winfo_x() + (e.x - self._drag_data["x"])
        y = self.root.winfo_y() + (e.y - self._drag_data["y"])
        self.root.geometry(f"+{x}+{y}")

    def _build_ui(self):
        for w in self.root.winfo_children():
            w.destroy()

        main = tk.Frame(self.root, bg=BG_DARK)
        main.pack(fill="both", expand=True, padx=10, pady=10)

        left = tk.Frame(main, bg=PANEL_LEFT, width=500)
        left.pack(side="left", fill="both", expand=True)
        left.pack_propagate(False)

        right = tk.Frame(main, bg=PANEL_RIGHT, width=370)
        right.pack(side="right", fill="both")
        right.pack_propagate(False)

        self._build_form(left)
        self._build_illustration(right)

    def _build_illustration(self, parent):
        if ICON_PATH.exists():
            pil_icon = Image.open(ICON_PATH).resize((120, 120), Image.LANCZOS)
            self._icon_photo = ImageTk.PhotoImage(pil_icon)
            tk.Label(parent, image=self._icon_photo, bg=PANEL_RIGHT).pack(expand=True)

        tk.Label(
            parent, text="Workflow Portal", font=("Segoe UI", 14),
            fg="#8888aa", bg=PANEL_RIGHT,
        ).pack(pady=(10, 0))

        tk.Label(
            parent, text="PRAX", font=("Segoe UI", 20, "bold"),
            fg=VERDE_LIMAO, bg=PANEL_RIGHT,
        ).pack(pady=(0, 60))

    def _build_form(self, parent):
        pad = tk.Frame(parent, bg=PANEL_LEFT, padx=50, pady=40)
        pad.pack(fill="both", expand=True)

        tk.Label(
            pad, text="Bem-vindo", font=("Segoe UI", 24, "bold"),
            fg=BRANCO, bg=PANEL_LEFT, anchor="w",
        ).pack(fill="x", pady=(0, 5))

        tk.Label(
            pad, text="Entre com suas credenciais do PRAXIO", font=("Segoe UI", 10),
            fg="#8888aa", bg=PANEL_LEFT, anchor="w",
        ).pack(fill="x", pady=(0, 30))

        tk.Label(
            pad, text="Usuario", font=("Segoe UI", 10),
            fg="#8888aa", bg=PANEL_LEFT, anchor="w",
        ).pack(fill="x", pady=(0, 5))
        self.username_entry = self._make_entry(pad, "Seu usuario PRAXIO")

        tk.Label(
            pad, text="Senha", font=("Segoe UI", 10),
            fg="#8888aa", bg=PANEL_LEFT, anchor="w",
        ).pack(fill="x", pady=(15, 5))
        self.password_frame = tk.Frame(pad, bg=INPUT_BG)
        self.password_frame.pack(fill="x", pady=(0, 5))
        self.password_entry = tk.Entry(
            self.password_frame, font=("Segoe UI", 12), bg=INPUT_BG, fg=INPUT_FG,
            insertbackground=INPUT_FG, relief="flat", bd=0, show="*",
            highlightthickness=0,
        )
        self.password_entry.pack(side="left", fill="x", expand=True, ipady=10, padx=(15, 0))
        self._eye_label = tk.Label(
            self.password_frame, text="Ocultar", font=("Segoe UI", 9),
            fg="#8888aa", bg=INPUT_BG, cursor="hand2",
        )
        self._eye_label.pack(side="right", padx=(0, 10))
        self._eye_label.bind("<Button-1>", lambda e: self._toggle_password())

        self.error_label = tk.Label(
            pad, text="", font=("Segoe UI", 10),
            fg=ERRO_VERMELHO, bg=PANEL_LEFT, wraplength=380, anchor="w",
        )
        self.error_label.pack(fill="x", pady=(10, 5))

        self._status_label = tk.Label(
            pad, text="", font=("Segoe UI", 10),
            fg=VERDE_LIMAO, bg=PANEL_LEFT, wraplength=380, anchor="w",
        )
        self._status_label.pack(fill="x", pady=(0, 5))

        btn = tk.Button(
            pad, text="Entrar", font=("Segoe UI", 13, "bold"),
            bg=VERDE_LIMAO, fg="#1a1a2e", activebackground="#b8d93c",
            activeforeground="#1a1a2e", relief="flat", cursor="hand2",
            command=self._do_login, bd=0,
        )
        btn.pack(fill="x", ipady=12, pady=(0, 20))

        links = tk.Frame(pad, bg=PANEL_LEFT)
        links.pack(fill="x")

        forgot = tk.Label(
            links, text="Esqueci minha senha", font=("Segoe UI", 9, "underline"),
            fg="#8888aa", bg=PANEL_LEFT, cursor="hand2",
        )
        forgot.pack(side="right")
        forgot.bind("<Button-1>", lambda e: self._show_forgot())

        register = tk.Label(
            links, text="Criar nova conta", font=("Segoe UI", 9),
            fg=VERDE_LIMAO, bg=PANEL_LEFT, cursor="hand2",
        )
        register.pack(side="left")
        register.bind("<Button-1>", lambda e: self._show_register())

    def _make_entry(self, parent, placeholder):
        entry = tk.Entry(
            parent, font=("Segoe UI", 12), bg=INPUT_BG, fg=PLACEHOLDER_FG,
            insertbackground=INPUT_FG, relief="flat", bd=0,
            highlightthickness=2, highlightbackground="#3a3a55",
            highlightcolor=VERDE_LIMAO,
        )
        entry.pack(fill="x", ipady=10, padx=2)
        entry.insert(0, placeholder)
        entry._placeholder = placeholder
        entry._is_placeholder = True

        def on_focus_in(e):
            if entry._is_placeholder:
                entry.delete(0, "end")
                entry.config(fg=INPUT_FG)
                entry._is_placeholder = False

        def on_focus_out(e):
            if not entry.get():
                entry.insert(0, placeholder)
                entry.config(fg=PLACEHOLDER_FG)
                entry._is_placeholder = True

        entry.bind("<FocusIn>", on_focus_in)
        entry.bind("<FocusOut>", on_focus_out)
        return entry

    def _toggle_password(self):
        self._password_visible = not self._password_visible
        if self._password_visible:
            self.password_entry.config(show="")
            self._eye_label.config(text="Ocultar")
        else:
            self.password_entry.config(show="*")
            self._eye_label.config(text="Mostrar")

    def _get_val(self, entry):
        if hasattr(entry, "_is_placeholder") and entry._is_placeholder:
            return ""
        return entry.get().strip()

    def _show_forgot(self):
        popup = tk.Toplevel(self.root)
        popup.title("Recuperar senha")
        popup.configure(bg=PANEL_LEFT)
        popup.geometry("420x300")
        popup.resizable(False, False)
        popup.transient(self.root)
        popup.grab_set()

        tk.Label(
            popup, text="Recuperar senha", font=("Segoe UI", 16, "bold"),
            fg=BRANCO, bg=PANEL_LEFT,
        ).pack(pady=(25, 5))

        tk.Label(
            popup, text="Informe usuario ou email para gerar token de reset",
            font=("Segoe UI", 10), fg="#8888aa", bg=PANEL_LEFT, wraplength=360,
        ).pack(pady=(0, 20))

        identifier = self._make_entry(popup, "Usuario ou email")

        result_label = tk.Label(
            popup, text="", font=("Segoe UI", 10),
            fg=VERDE_LIMAO, bg=PANEL_LEFT, wraplength=360,
        )
        result_label.pack(pady=(0, 10))

        def do_reset():
            val = identifier.get().strip()
            if not val or val == "Usuario ou email":
                result_label.config(fg=ERRO_VERMELHO, text="Preencha o campo")
                return
            token = create_reset_token(val)
            if token:
                result_label.config(
                    fg=VERDE_LIMAO,
                    text=f"Token gerado:\n{token}\n\nUse: python -m prax.reset_password {token}",
                )
            else:
                result_label.config(fg=ERRO_VERMELHO, text="Usuario ou email nao encontrado")

        tk.Button(
            popup, text="Gerar token", font=("Segoe UI", 12, "bold"),
            bg=VERDE_LIMAO, fg="#1a1a2e", relief="flat", cursor="hand2",
            command=do_reset,
        ).pack(fill="x", padx=50, ipady=8)

    def _show_register(self):
        popup = tk.Toplevel(self.root)
        popup.title("Criar conta PRAXIO")
        popup.configure(bg=PANEL_LEFT)
        popup.geometry("420x350")
        popup.resizable(False, False)
        popup.transient(self.root)
        popup.grab_set()

        tk.Label(
            popup, text="Conta PRAXIO", font=("Segoe UI", 16, "bold"),
            fg=BRANCO, bg=PANEL_LEFT,
        ).pack(pady=(25, 5))

        tk.Label(
            popup, text="Use suas credenciais do portal PRAXIO para criar sua conta local",
            font=("Segoe UI", 10), fg="#8888aa", bg=PANEL_LEFT, wraplength=360,
        ).pack(pady=(0, 20))

        reg_user = self._make_entry(popup, "Usuario PRAXIO")
        reg_pass = self._make_entry(popup, "Senha PRAXIO")

        error_label = tk.Label(
            popup, text="", font=("Segoe UI", 10),
            fg=ERRO_VERMELHO, bg=PANEL_LEFT, wraplength=360,
        )
        error_label.pack(pady=(10, 5))

        def do_register():
            user = reg_user.get().strip()
            pwd = reg_pass.get().strip()
            if not user or not pwd:
                error_label.config(text="Preencha todos os campos")
                return
            error_label.config(text="Validando no PRAXIO...", fg=VERDE_LIMAO)

            def try_register():
                ok = asyncio.run(validate_credentials(user, pwd))
                if ok:
                    result = save_praxio_user(user, pwd)
                    update_env_credentials(user, pwd)
                    popup.after(0, lambda: (popup.destroy(), self.on_success(result)))
                else:
                    popup.after(0, lambda: error_label.config(
                        text="Credenciais invalidas no portal PRAXIO", fg=ERRO_VERMELHO
                    ))

            threading.Thread(target=try_register, daemon=True).start()

        tk.Button(
            popup, text="Criar conta", font=("Segoe UI", 12, "bold"),
            bg=VERDE_LIMAO, fg="#1a1a2e", relief="flat", cursor="hand2",
            command=do_register,
        ).pack(fill="x", padx=50, ipady=8, pady=(15, 0))

    def _do_login(self):
        username = self._get_val(self.username_entry)
        password = self._get_val(self.password_entry)

        if not username or not password:
            self.error_label.config(text="Preencha todos os campos")
            return

        self.error_label.config(text="")
        self._status_label.config(text="Validando no portal PRAXIO...")
        self.username_entry.config(state="disabled")
        self.password_entry.config(state="disabled")

        def try_login():
            try:
                ok = asyncio.run(validate_credentials(username, password, settings.praxio_base_url))
            except Exception:
                ok = False

            if ok:
                result = save_praxio_user(username, password)
                update_env_credentials(username, password)
                self.root.after(0, lambda: self.on_success(result))
            else:
                self.root.after(0, lambda: (
                    self.error_label.config(text="Credenciais invalidas no portal PRAXIO"),
                    self._status_label.config(text=""),
                    self.username_entry.config(state="normal"),
                    self.password_entry.config(state="normal"),
                ))

        threading.Thread(target=try_login, daemon=True).start()

    def run(self):
        self.root.mainloop()
        return self.user_data
