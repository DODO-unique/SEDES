"""
LSB Steganography for PNG Images
---------------------------------
Encodes and decodes hidden messages in PNG images using
Least Significant Bit (LSB) substitution.

Usage:
    python lsb_steganography.py encode <image> <message> [output]
    python lsb_steganography.py decode <image>

Requirements:
    pip install Pillow
"""

import sys
from PIL import Image


# ── Constants ──────────────────────────────────────────────────────────────────

DELIMITER = "<<END>>"          # Marks the end of the hidden message
BITS_PER_CHANNEL = 1           # How many LSBs per colour channel to use (1–4)
CHANNELS = 3                   # RGB channels used for embedding


# ── Core helpers ───────────────────────────────────────────────────────────────

def _text_to_bits(text: str) -> str:
    """Convert a UTF-8 string to a binary string."""
    return "".join(f"{byte:08b}" for byte in text.encode("utf-8"))


def _bits_to_text(bits: str) -> str:
    """Convert a binary string back to a UTF-8 string."""
    chars = [bits[i:i+8] for i in range(0, len(bits), 8)]
    return "".join(chr(int(c, 2)) for c in chars if len(c) == 8)


def _max_capacity(image: Image.Image) -> int:
    """Return the maximum number of characters that can be hidden."""
    width, height = image.size
    total_bits = width * height * CHANNELS * BITS_PER_CHANNEL
    return total_bits // 8


# ── Encode ─────────────────────────────────────────────────────────────────────

def encode_image(image: Image.Image, message: str) -> Image.Image:
    """Core embedding logic returning a new PIL Image."""
    payload      = message + DELIMITER
    bit_stream   = _text_to_bits(payload)
    total_bits   = len(bit_stream)
    capacity     = _max_capacity(image)

    if total_bits > capacity * 8:          # capacity is already in bytes
        raise ValueError(
            f"Message too large: needs {total_bits} bits, "
            f"image holds {capacity * 8} bits."
        )

    pixels = list(image.getdata())
    bit_index = 0

    new_pixels: list[tuple[int, int, int]] = []

    for pixel in pixels:
        r, g, b = pixel
        channels = [r, g, b]

        for ch_idx in range(CHANNELS):
            if bit_index < total_bits:
                # Clear LSB(s) then set them to our data bit(s)
                mask = ~((1 << BITS_PER_CHANNEL) - 1) & 0xFF
                data_bits = int(
                    bit_stream[bit_index : bit_index + BITS_PER_CHANNEL], 2
                )
                channels[ch_idx] = (channels[ch_idx] & mask) | data_bits
                bit_index += BITS_PER_CHANNEL

        new_pixels.append(tuple(channels))  # type: ignore[arg-type]

        if bit_index >= total_bits:
            # Keep the remaining pixels unchanged
            new_pixels.extend(pixels[len(new_pixels):])
            break

    stego = Image.new("RGB", image.size)
    stego.putdata(new_pixels)
    return stego


def encode(input_path: str, message: str, output_path: str | None = None) -> str:
    """
    Hide *message* inside the PNG at *input_path*.

    Parameters
    ----------
    input_path  : path to the carrier PNG image
    message     : plaintext secret to embed
    output_path : where to save the result (default: stego_<input_path>)

    Returns
    -------
    Path to the saved stego image.
    """
    image = Image.open(input_path).convert("RGB")
    
    stego = encode_image(image, message)


    if output_path is None:
        import os
        base, ext = os.path.splitext(input_path)
        output_path = f"{base}_stego.png"

    stego.save(output_path, format="PNG")
    print(f"[✓] Message encoded successfully → {output_path}")
    return output_path


# ── Decode ─────────────────────────────────────────────────────────────────────

def decode_image(image: Image.Image) -> str:
    """
    Extract a hidden message from the PIL Image object.
    
    Returns
    -------
    The recovered plaintext message (without the delimiter).
    """
    pixels = list(image.getdata())

    bits: list[str] = []
    mask = (1 << BITS_PER_CHANNEL) - 1

    delimiter_bits = _text_to_bits(DELIMITER)
    delimiter_len  = len(delimiter_bits)

    for pixel in pixels:
        for value in pixel[:CHANNELS]:
            bits.append(format(value & mask, f"0{BITS_PER_CHANNEL}b"))

        # Check for delimiter every 8 bits to stop early
        if len(bits) >= delimiter_len:
            candidate = "".join(bits[-delimiter_len:])
            if candidate == delimiter_bits:
                break

    raw_bits = "".join(bits)
    text     = _bits_to_text(raw_bits)

    if DELIMITER not in text:
        raise ValueError(
            "No hidden message found — image may not contain encoded data, "
            "or was saved in a lossy format."
        )

    return text.split(DELIMITER)[0]


def decode(stego_path: str) -> str:
    """
    Extract a hidden message from the PNG at *stego_path*.

    Returns
    -------
    The recovered plaintext message (without the delimiter).

    Raises
    ------
    ValueError  if no valid delimiter is found (wrong image or no message).
    """
    image  = Image.open(stego_path).convert("RGB")
    return decode_image(image)

# ── CLI ────────────────────────────────────────────────────────────────────────

def _usage():
    print(__doc__)
    sys.exit(1)


def main():
    args = sys.argv[1:]

    if not args:
        _usage()

    command = args[0].lower()

    if command == "encode":
        if len(args) < 3:
            print("Usage: python lsb_steganography.py encode <image> <message> [output]")
            sys.exit(1)
        input_path  = args[1]
        message     = args[2]
        output_path = args[3] if len(args) > 3 else None
        encode(input_path, message, output_path)

    elif command == "decode":
        if len(args) < 2:
            print("Usage: python lsb_steganography.py decode <image>")
            sys.exit(1)
        stego_path = args[1]
        message = decode(stego_path)
        print(f"[✓] Hidden message: {message}")

    else:
        _usage()


if __name__ == "__main__":
    main()