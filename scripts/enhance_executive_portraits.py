#!/usr/bin/env python3
"""Create non-generative, higher-resolution copies of the executive portraits.

The original files remain untouched. This script only resamples the source pixels
and applies a restrained unsharp mask; it does not synthesize facial features.
"""
from pathlib import Path
from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "public" / "executives"
OUTPUT_DIR = SOURCE_DIR / "enhanced"
PORTRAITS = (
    "favor-cletus.webp",
    "prisca-ohale.webp",
    "ogechi-eze.webp",
    "christiana-aso.webp",
    "emeka-chilaka.webp",
)
SCALE = 2
WEBP_QUALITY = 92

def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for filename in PORTRAITS:
        source = SOURCE_DIR / filename
        if not source.is_file():
            raise FileNotFoundError(f"Required original portrait is missing: {source}")
        with Image.open(source) as opened:
            image = ImageOps.exif_transpose(opened).convert("RGB")
            width, height = image.size
            if width < 1 or height < 1:
                raise ValueError(f"Invalid source dimensions for {filename}: {image.size}")
            enlarged = image.resize((width * SCALE, height * SCALE), Image.Resampling.LANCZOS)
            enhanced = enlarged.filter(ImageFilter.UnsharpMask(radius=1.4, percent=125, threshold=3))
            target = OUTPUT_DIR / filename
            enhanced.save(target, "WEBP", quality=WEBP_QUALITY, method=6)
        with Image.open(target) as check:
            expected = (width * SCALE, height * SCALE)
            if check.size != expected or check.format != "WEBP":
                raise RuntimeError(f"Output validation failed for {target}: {check.format} {check.size}")
        print(f"{filename}: {width}x{height} -> {expected[0]}x{expected[1]} ({target.stat().st_size} bytes)")

if __name__ == "__main__":
    main()
