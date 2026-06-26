import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from prax.auth import init_auth_db, reset_password


def main():
    init_auth_db()
    if len(sys.argv) < 2:
        print("Uso: python reset_password.py <token>")
        sys.exit(1)

    token = sys.argv[1]
    import getpass
    new_pass = getpass.getpass("Nova senha: ")
    confirm = getpass.getpass("Confirmar senha: ")

    if new_pass != confirm:
        print("As senhas nao coincidem")
        sys.exit(1)
    if len(new_pass) < 6:
        print("A senha deve ter pelo menos 6 caracteres")
        sys.exit(1)

    if reset_password(token, new_pass):
        print("Senha alterada com sucesso!")
    else:
        print("Token invalido ou expirado")
        sys.exit(1)


if __name__ == "__main__":
    main()
