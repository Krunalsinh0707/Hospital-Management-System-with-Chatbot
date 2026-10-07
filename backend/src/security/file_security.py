import os
import re
import uuid
from typing import Set, Tuple
from fastapi import UploadFile, HTTPException, status

ALLOWED_EXTENSIONS: Set[str] = {".pdf", ".png", ".jpg", ".jpeg"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

MAGIC_NUMBERS = {
    b"%PDF-": ".pdf",
    b"\x89PNG\r\n\x1a\n": ".png",
    b"\xff\xd8\xff": ".jpg",
}

def sanitize_filename(filename: str) -> Tuple[str, str]:
    """
    Sanitize filename against path traversal and return:
    (safe_disk_filename, clean_original_name)
    """
    clean_original = os.path.basename(filename or "unnamed_report")
    clean_original = re.sub(r"[^\w\.\-\s]", "_", clean_original)

    ext = os.path.splitext(clean_original)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".bin"

    safe_disk_filename = f"report_{uuid.uuid4().hex}{ext}"
    return safe_disk_filename, clean_original

async def validate_uploaded_file(
    file: UploadFile,
    max_size: int = MAX_FILE_SIZE_BYTES,
    allowed_exts: Set[str] = ALLOWED_EXTENSIONS
) -> Tuple[bool, str]:
    """
    Validate file extension, file size, and file signature.
    """
    if not file.filename:
        return False, "Filename cannot be empty"

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_exts:
        return False, f"File type '{ext}' is not permitted. Allowed extensions: {', '.join(sorted(allowed_exts))}"

    # Read leading bytes for signature check & size check
    content = await file.read(8192)
    if not content:
        await file.seek(0)
        return False, "Uploaded file is empty"

    # Signature validation
    if ext == ".pdf":
        if not content.startswith(b"%PDF-"):
            await file.seek(0)
            return False, "File format mismatch: Content is not a valid PDF document"
    elif ext == ".png":
        if not content.startswith(b"\x89PNG\r\n\x1a\n"):
            await file.seek(0)
            return False, "File format mismatch: Content is not a valid PNG image"
    elif ext in (".jpg", ".jpeg"):
        if not content.startswith(b"\xff\xd8\xff"):
            await file.seek(0)
            return False, "File format mismatch: Content is not a valid JPEG image"

    # Check total size
    total_size = len(content)
    while chunk := await file.read(65536):
        total_size += len(chunk)
        if total_size > max_size:
            await file.seek(0)
            return False, f"File size exceeds maximum limit of {max_size // (1024 * 1024)}MB"

    # Reset file pointer to beginning for subsequent reads
    await file.seek(0)
    return True, ""
