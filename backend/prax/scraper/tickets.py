import logging
import re

from bs4 import BeautifulSoup, Tag

logger = logging.getLogger(__name__)

TICKET_RE = re.compile(r"\d{2}\d{2}-\d{6}")


def _cell_text(row: Tag, index: int) -> str:
    cells = row.find_all("td")
    if index < len(cells):
        return cells[index].get_text(strip=True)
    return ""


def parse_ticket_list(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "lxml")
    results = []

    for table in soup.find_all("table"):
        rows = table.find_all("tr")
        for row in rows:
            cells = row.find_all("td")
            if len(cells) < 6:
                continue

            texts = [c.get_text(strip=True) for c in cells]

            ticket_num = None
            for t in texts:
                if TICKET_RE.match(t):
                    ticket_num = t
                    break

            if not ticket_num:
                continue

            idx = texts.index(ticket_num)

            link = None
            for c in cells[idx:]:
                a = c.find("a", href=True)
                if a and TICKET_RE.search(a.get("href", "")):
                    link = a["href"]
                    break

            if not link:
                for c in cells:
                    a = c.find("a", href=True)
                    if a and "TicketPrincipal" in a.get("href", ""):
                        link = a["href"]
                        break

            ticket_id = ""
            if link:
                m = re.search(r"/TicketPrincipal/(\d+)", link)
                if m:
                    ticket_id = m.group(1)

            subject = texts[idx + 1] if idx + 1 < len(texts) else ""
            last_update = texts[idx + 2] if idx + 2 < len(texts) else ""
            requester = texts[idx + 3] if idx + 3 < len(texts) else ""
            client = texts[idx + 4] if idx + 4 < len(texts) else ""
            status = texts[idx + 5] if idx + 5 < len(texts) else ""
            responsible = texts[idx + 6] if idx + 6 < len(texts) else ""
            module = texts[idx + 7] if idx + 7 < len(texts) else ""
            open_date = texts[idx + 8] if idx + 8 < len(texts) else ""
            group_type = texts[idx + 9] if idx + 9 < len(texts) else ""
            group = texts[idx + 10] if idx + 10 < len(texts) else ""
            system = texts[idx + 11] if idx + 11 < len(texts) else ""
            origin = texts[idx + 12] if idx + 12 < len(texts) else ""
            close_date = texts[idx + 13] if idx + 13 < len(texts) else ""

            results.append({
                "ticket_number": ticket_num,
                "ticket_id": ticket_id,
                "subject": subject,
                "last_update": last_update,
                "requester": requester,
                "client": client,
                "status": status,
                "responsible": responsible,
                "module": module,
                "open_date": open_date,
                "group_type": group_type,
                "group": group,
                "system": system,
                "origin": origin,
                "close_date": close_date,
                "raw_text": " | ".join(texts[:15]),
            })

    logger.info(f"Parsed {len(results)} tickets from list")
    return results
