import io
import re

from pypdf import PdfReader

# Keywords that usually mark the *final* total on a receipt/invoice.
# Ordered roughly by specificity (stronger first). The parser scans from the
# bottom up and prefers the most specific match it can find.
_TOTAL_KEYWORDS = (
    # strong / final-total indicators
    ("grand total", 3),
    ("amount due", 3),
    ("amount payable", 3),
    ("balance due", 3),
    ("you pay", 3),
    ("total due", 3),
    ("net amount", 3),
    ("final total", 3),
    ("total payable", 3),
    ("to pay", 2),
    ("total amount", 2),
    ("amount to pay", 2),
    ("payable", 2),
    ("grand total", 3),
    # generic "total" (still strong when it's the only one / at the bottom)
    ("total", 2),
    ("balance", 1),
    ("amount", 1),
    ("pay", 1),
)

# Currency prefixes shown on receipts — including Indian Rupee ("Rs", "Rs.",
# "₹", "INR").
_CURRENCY_PREFIX = r"(?:Rs\.?|INR|INR\s|₹|\$|€|£|USD|EUR)?\s*"

# A usable money number:
#   1,234.56 | 1234.56 | 1,234 | 1234 | 12.5 | 1234.5
_MONEY_RE = re.compile(rf"{_CURRENCY_PREFIX}((?:\d{{1,3}}(?:,\d{{3}})+|\d+)(?:\.\d{{1,2}})?)")

# Numbers that look like dates, phone numbers, times, etc. and are NOT the
# amount even when they sit on a "total" line.
_DATE_LIKE_RE = re.compile(
    r"(?:\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})"  # 12/05/2026, 12-05-26, 12.05.2026
    r"|\d{1,2}:\d{2}"                          # times 14:30
    r"|\b(?:19|20)\d{2}\b"                     # year 2026
    r"|\b\d{10,}\b"                            # long numbers / phone/UPI refs
)


def _looks_like_money(raw: str) -> float | None:
    """Try to parse a raw numeric string to a float, or return None."""
    try:
        number = float(raw.replace(",", ""))
    except (TypeError, ValueError):
        return None
    # Zero / tiny placeholder values are not useful totals.
    if number <= 0:
        return None
    return number


class PdfParseError(Exception):
    """Raised when a PDF cannot be turned into an expense."""


def _clean_text(page_text: str) -> str:
    """Normalise whitespace so lines are stable for parsing."""
    return re.sub(r"[ \t]+", " ", page_text)


def _money_on_line(line: str) -> float | None:
    """Return the last plausible money value on a single line, or None.

    Uses the last match because receipt totals are almost always written after
    surrounding text on the same line (e.g. "Grand Total .... 1,250.00").
    """
    candidates = _MONEY_RE.findall(line)
    if not candidates:
        return None

    # Search from the end backwards and keep the last value that isn't a
    # date/time/year.
    for raw in reversed(candidates):
        if _DATE_LIKE_RE.search(raw):
            continue
        value = _looks_like_money(raw)
        if value is not None:
            return value
    return None


def _extract_amount(text: str) -> float | None:
    """Return the best-guess total amount, or None.

    Strategy:
      1. Walk lines from the bottom up.
      2. For lines matching a total keyword (strongest first), take the last
         money value on that line.
      3. Prefer strong ("grand total" etc.) keyword lines; among the same
         strength, prefer the bottom-most one (receipt totals are printed near
         the bottom of the page).
    """
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    if not lines:
        return None

    best: tuple[int, float] | None = None  # (strength, value)

    # Walk from the bottom up. Receipt totals are printed near the bottom, so
    # for ties the bottom-most line (seen first here) is kept.
    for idx in range(len(lines) - 1, -1, -1):
        line = lines[idx]
        lowered = line.lower()

        matched = None
        strength = -1
        for kw, level in _TOTAL_KEYWORDS:
            if kw in lowered:
                matched = kw
                strength = level
                # Strongest keywords win; keep scanning for higher strength.
                break

        if matched is None:
            continue

        # Already found a stronger keyword line -> no need to keep going up.
        if best is not None and strength < best[0]:
            continue

        value = _money_on_line(line)
        if value is None:
            continue

        # Stronger/keyword lines replace weaker ones; equal-strength lines
        # keep whichever was seen first (bottom-most).
        if best is None or strength > best[0]:
            best = (strength, value)

    if best is not None:
        return best[1]

    # Fallback: no keyword line had a usable amount. Prefer the last money
    # value on the last line that contains one (common for plain receipts), then
    # fall back to the largest money value.
    for line in reversed(lines):
        if _DATE_LIKE_RE.search(line):
            continue
        value = _money_on_line(line)
        if value is not None:
            return value

    values = []
    for line in lines:
        value = _money_on_line(line)
        if value is not None:
            values.append(value)
    if values:
        return max(values)
    return None


def _extract_title(text: str) -> str:
    """Return a suggested title (vendor name), often the first line."""
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped or len(stripped) < 2:
            continue
        if _MONEY_RE.search(stripped) is not None:
            continue
        if _DATE_LIKE_RE.search(stripped):
            continue
        return stripped[:60]
    return "PDF Expense"


def extract_from_pdf(data: bytes) -> dict:
    """Extract {amount: float, title: str} from a PDF's bytes.

    Raises PdfParseError when the PDF has no extractable text or no amount.
    """
    try:
        reader = PdfReader(io.BytesIO(data))
    except Exception as exc:  # noqa: BLE001 - unreadable/corrupt PDF
        raise PdfParseError(f"Could not read PDF: {exc}") from exc

    parts = []
    try:
        for page in reader.pages:
            parts.append(page.extract_text() or "")
    except Exception as exc:  # noqa: BLE001 - page-level extraction failure
        raise PdfParseError(f"Could not extract PDF text: {exc}") from exc

    text = _clean_text("\n".join(parts))
    if not text.strip():
        raise PdfParseError(
            "No text could be extracted from this PDF. "
            "Make sure it is a digital (non-scanned) document."
        )

    amount = _extract_amount(text)
    if amount is None:
        raise PdfParseError("Could not find an amount in this PDF.")

    return {"amount": round(amount, 2), "title": _extract_title(text)}
