import re
from bs4 import BeautifulSoup


def parse_ticket_messages(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "lxml")
    messages = []

    historico = soup.find("div", {"id": "historicoTramites"})
    if not historico:
        return messages

    text = historico.get_text(separator="\n", strip=True)
    lines = [l.strip() for l in text.split("\n") if l.strip()]

    current_msg = None
    for line in lines:
        if line in ("Anexos", "OK", "Historico"):
            continue

        date_match = re.match(r"(\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2})", line)
        if date_match:
            if current_msg:
                messages.append(current_msg)
            current_msg = {"date": date_match.group(1), "author": "", "content": "", "status": ""}
        elif line.startswith("Status:"):
            if current_msg:
                current_msg["status"] = line.replace("Status:", "").strip()
        elif current_msg and not current_msg["author"] and re.match(r"^[A-Z]+", line):
            current_msg["author"] = line
        elif current_msg:
            if current_msg["content"]:
                current_msg["content"] += " " + line
            else:
                current_msg["content"] = line

    if current_msg:
        messages.append(current_msg)

    return messages
