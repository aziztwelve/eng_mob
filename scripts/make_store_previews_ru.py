from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter


ROOT = Path("/home/aziz/Documents/startup/eng/eng_mob/store-assets")
OUT = ROOT / "previews-ru"
W, H = 1206, 2622


def font(size: int, bold: bool = False):
    name = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    return ImageFont.truetype(name, size)


def rounded_image(source: Path, size: tuple[int, int], radius: int = 34) -> Image.Image:
    source_image = Image.open(source).convert("RGBA")
    source_image.thumbnail((size[0] - 28, size[1] - 28), Image.LANCZOS)
    canvas = Image.new("RGBA", size, (255, 255, 255, 255))
    x = (size[0] - source_image.width) // 2
    y = (size[1] - source_image.height) // 2
    canvas.alpha_composite(source_image, (x, y))
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius, fill=255)
    canvas.putalpha(mask)
    return canvas


def text(draw: ImageDraw.ImageDraw, xy, value: str, size: int, fill, bold=False, anchor=None):
    draw.text(xy, value, font=font(size, bold), fill=fill, anchor=anchor)


files = sorted(ROOT.glob("Screenshot*.png"))
by_time = {p.name.split(" ")[-1].removesuffix(".png"): p for p in files}

# All source screenshots are represented across the 10 concepts. The first three
# are the recommended learning-focused set; the remaining concepts explore the
# product breadth (practice, game, progress, shop, AI and account).
sets = [
    ("Учите язык легко", "Уроки, которые хочется проходить каждый день", ["06-17-53", "06-18-06", "06-18-25"]),
    ("Слова запоминаются сами", "Слушайте, повторяйте и говорите увереннее", ["06-18-25", "06-18-13", "06-17-53"]),
    ("Играйте. Учитесь. Растите.", "Каждый новый уровень — ещё один шаг к свободной речи", ["06-20-43", "06-20-50", "06-21-13"]),
    ("Ваш личный языковой путь", "Понятный прогресс и маленькие победы каждый день", ["06-20-50", "06-21-04", "06-21-27"]),
    ("Практика без скуки", "Интерактивные задания помогают говорить на практике", ["06-18-25", "06-21-04", "06-21-19"]),
    ("Закрепляйте результат", "Повторяйте материал и не теряйте серию занятий", ["06-21-13", "06-21-27", "06-20-43"]),
    ("Lingo IQ всегда рядом", "Короткие занятия, умная практика и поддержка AI", ["06-21-38", "06-20-43", "06-21-19"]),
    ("От первого слова до диалога", "Слушайте, произносите и проверяйте себя", ["06-18-13", "06-18-25", "06-21-38"]),
    ("Учитесь в своём темпе", "Выбирайте уровень, цель и удобный ритм", ["06-20-50", "06-21-04", "06-17-53"]),
    ("Начните сегодня", "Lingo IQ превращает обучение языку в привычку", ["06-17-53", "06-21-27", "06-21-38"]),
]

styles = [
    ((235, 248, 255), (10, 53, 105), (46, 184, 235)),
    ((244, 251, 255), (18, 43, 91), (76, 196, 246)),
    ((255, 248, 226), (74, 43, 12), (255, 176, 53)),
    ((245, 242, 255), (48, 30, 92), (139, 103, 229)),
    ((235, 255, 244), (14, 77, 57), (43, 190, 111)),
    ((255, 242, 239), (93, 36, 27), (245, 102, 81)),
    ((239, 249, 255), (12, 52, 72), (25, 160, 213)),
    ((255, 247, 236), (77, 44, 18), (240, 139, 56)),
    ((242, 248, 235), (38, 72, 36), (111, 177, 85)),
    ((244, 247, 255), (21, 43, 85), (50, 121, 226)),
]

OUT.mkdir(exist_ok=True)
for index, ((title, subtitle, keys), (background, ink, accent)) in enumerate(zip(sets, styles), 1):
    canvas = Image.new("RGBA", (W, H), background + (255,))
    draw = ImageDraw.Draw(canvas)

    # Soft decorative circles keep the layouts distinct without changing the app UI.
    for cx, cy, r, alpha in [(1050, 280, 260, 35), (120, 2180, 310, 24), (1090, 2250, 120, 45)]:
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(layer).ellipse((cx-r, cy-r, cx+r, cy+r), fill=accent + (alpha,))
        canvas = Image.alpha_composite(canvas, layer)
    draw = ImageDraw.Draw(canvas)

    text(draw, (74, 82), "Lingo IQ", 52, ink, True)
    text(draw, (1132, 107), f"{index:02d} / 10", 26, ink, False, "ra")
    text(draw, (74, 250), title, 68, ink, True)
    text(draw, (74, 340), subtitle, 31, ink)

    # Three source screens in a store-ready vertical composition.
    card_y = 555
    card_h = 610
    card_w = 1058
    for number, key in enumerate(keys):
        source = by_time[key]
        x = 74
        y = card_y + number * 650
        shadow = Image.new("RGBA", (card_w + 20, card_h + 20), (0, 0, 0, 0))
        shadow_draw = ImageDraw.Draw(shadow)
        shadow_draw.rounded_rectangle((10, 12, card_w + 10, card_h + 12), 38, fill=(0, 30, 60, 38))
        shadow = shadow.filter(ImageFilter.GaussianBlur(12))
        canvas.alpha_composite(shadow, (x - 2, y - 2))
        card = rounded_image(source, (card_w, card_h), 38)
        canvas.alpha_composite(card, (x, y))
        draw = ImageDraw.Draw(canvas)
        badge_x, badge_y = x + 28, y + 26
        draw.rounded_rectangle((badge_x, badge_y, badge_x + 112, badge_y + 54), 27, fill=accent)
        text(draw, (badge_x + 56, badge_y + 27), f"ЭКРАН {number + 1}", 19, (255, 255, 255), True, "mm")

    draw.rounded_rectangle((74, 2490, 1132, 2570), 40, fill=accent)
    text(draw, (603, 2530), "Учите языки с Lingo IQ", 30, (255, 255, 255), True, "mm")
    canvas.convert("RGB").save(OUT / f"variant-{index:02d}-ru-1206x2622.png", optimize=True)

(OUT / "README.txt").write_text(
    "Превью русских промо-композиций Lingo IQ.\n"
    "10 вариантов, каждый содержит три исходных экрана.\n"
    "Размер превью: 1206x2622 px — формат iPhone 6.3.\n"
    "После выбора варианта его нужно финально адаптировать под Android 1080x1920 и\n"
    "комплекты iOS 1179x2556, 1206x2622, 1284x2778 и 1320x2868.\n",
    encoding="utf-8",
)
