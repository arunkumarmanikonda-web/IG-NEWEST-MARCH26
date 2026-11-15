"""Render one leased catalogue page without decoding the whole catalogue in Node."""
import base64
import hmac
import io
import json
import os
from time import sleep
from threading import Lock
from collections import OrderedDict
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

from pypdf import PdfReader, PdfWriter
import pypdfium2 as pdf
import pypdfium2.raw as raw


render_lock = Lock()


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args):
        return None


class PrivateSource(io.RawIOBase):
    block_size = 1024 * 1024

    def __init__(self, url, size):
        self.url, self.size, self.pos = url, size, 0
        self.blocks = OrderedDict()
        self.etag = None
        self.http = build_opener(NoRedirect())

    def tell(self):
        return self.pos

    def seek(self, offset, whence=os.SEEK_SET):
        self.pos = (0, self.pos, self.size)[whence] + offset
        if self.pos < 0:
            raise ValueError("Invalid source position")
        return self.pos

    def block(self, start):
        if start not in self.blocks:
            end = min(start + self.block_size, self.size) - 1
            headers = {"Range": f"bytes={start}-{end}", "Accept-Encoding": "identity"}
            if self.etag:
                headers["If-Match"] = self.etag
            for attempt in range(3):
                try:
                    with self.http.open(Request(self.url, headers=headers), timeout=15) as response:
                        if response.status != 206 or response.headers.get("Content-Range") != f"bytes {start}-{end}/{self.size}":
                            raise IOError("Unexpected byte range")
                        data = response.read(end - start + 2)
                        if len(data) != end - start + 1:
                            raise IOError("Incomplete byte range")
                        self.etag = self.etag or response.headers.get("ETag")
                    break
                except OSError:
                    if attempt == 2:
                        raise
                    sleep(0.3 * (attempt + 1))
            self.blocks[start] = data
            if len(self.blocks) > 32:
                self.blocks.popitem(last=False)
        self.blocks.move_to_end(start)
        return self.blocks[start]

    def readinto(self, buffer):
        dest = memoryview(buffer).cast("B")
        count = min(len(dest), max(0, self.size - self.pos))
        written = 0
        while written < count:
            offset = self.pos % self.block_size
            block = self.block(self.pos - offset)
            n = min(len(block) - offset, count - written)
            dest[written:written+n] = memoryview(block)[offset:offset+n]
            written += n
            self.pos += n
        return written


def render(stream, number):
    with pdf.PdfDocument(stream) as doc:
        if not 1 <= number <= len(doc) <= 500:
            raise ValueError("Invalid catalogue page")
        page = doc[number-1]
        bitmap = page.render(scale=3400/max(page.get_size()), rev_byteorder=True,
                             extra_flags=raw.FPDF_RENDER_LIMITEDIMAGECACHE)
        image = bitmap.to_pil().convert("RGB")
        coords = bitmap.get_posconv(page)
        boxes = []
        for obj in page.get_objects(filter=[raw.FPDF_PAGEOBJ_IMAGE], max_depth=1):
            left, bottom, right, top = obj.get_bounds()
            corners = [coords.to_bitmap(x, y) for x in (left, right) for y in (bottom, top)]
            xs, ys = zip(*corners)
            box = [max(0, min(xs)), max(0, min(ys)), min(image.width, max(xs)), min(image.height, max(ys))]
            w, h = box[2]-box[0], box[3]-box[1]
            if min(w, h) < 80 or (w >= image.width*.85 and h >= image.height*.85):
                continue
            if box not in boxes:
                boxes.append(box)
            if len(boxes) == 24:
                break
        text = page.get_textpage().get_text_bounded()[:18000]
        # The Vercel response includes base64, so bound the encoded JPEG too.
        for quality in (94, 90, 84, 78):
            out = io.BytesIO()
            image.save(out, "JPEG", quality=quality)
            if out.tell() <= 3000000:
                return {"page_count": len(doc), "text": text, "boxes": boxes,
                        "jpeg": base64.b64encode(out.getvalue()).decode("ascii")}
        raise ValueError("Page artwork exceeds the renderer response allowance")


def render_source(source, number):
    # Resolve only this page and its resource references via the PDF cross-reference
    # table. Giving the original to PDFium can trigger a scan of all 199 pages.
    reader = PdfReader(source, strict=True)
    total = len(reader.pages)
    if not 1 <= number <= total <= 500:
        raise ValueError("Invalid catalogue page")
    writer = PdfWriter()
    writer.add_page(reader.pages[number-1], excluded_keys=("/Annots", "/B"))
    subset = io.BytesIO()
    writer.write(subset)
    subset.seek(0)
    result = render(subset, 1)
    result["page_count"] = total
    return result


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        secret = os.environ.get("EMAIL_WORKER_SECRET", "")
        if not secret or not hmac.compare_digest(self.headers.get("Authorization", ""), "Bearer "+secret):
            self.send_error(403)
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            if not 0 < length <= 16384:
                raise ValueError("Invalid request length")
            data = json.loads(self.rfile.read(length))
            url = urlsplit(data["url"])
            storage = urlsplit(os.environ["NEXT_PUBLIC_SUPABASE_URL"])
            if url.scheme != "https" or url.netloc != storage.netloc or not url.path.startswith((
                    "/storage/v1/object/sign/ig-data-rooms/", "/storage/v1/object/sign/ig-brand-catalogues/")):
                raise ValueError("Invalid source")
            size, number = data["size"], data["page"]
            if type(size) is not int or size <= 0 or type(number) is not int:
                raise ValueError("Invalid catalogue coordinates")
            with render_lock:
                result = render_source(PrivateSource(data["url"], size), number)
            body = json.dumps(result, separators=(",", ":")).encode()
        except Exception as error:
            frame = error.__traceback__
            while frame.tb_next:
                frame = frame.tb_next
            print("Catalogue renderer failed:", type(error).__name__, frame.tb_frame.f_code.co_name, frame.tb_lineno, flush=True)
            self.send_error(502, "Could not render the saved catalogue page")
            return
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "private, no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
