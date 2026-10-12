# Turns the client portfolio (Portfolio/Portfolio, gitignored: 1.5GB of
# source files) into the web copies under /work/<client>/ that the site
# serves: images as WebP (max 1080px), videos as H.264 MP4 (540px wide for
# reels) with a WebP poster. Writes work/media.json (size, duration) for
# scripts/build-work.js.
#
#   python scripts/build-work-media.py            # only what's missing
#   python scripts/build-work-media.py --force    # redo everything
#
# Only finished work is listed here: no stock footage, raw phone captures,
# AI-generated images or video, contracts, invoices or proposals (those stay
# in the source folder).
import json, os, subprocess, sys, tempfile
from PIL import Image, ImageOps
Image.MAX_IMAGE_PIXELS = None

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'Portfolio', 'Portfolio')
OUT = os.path.join(ROOT, 'work')
FORCE = '--force' in sys.argv
TAR = r'C:\Windows\System32\tar.exe' if os.name == 'nt' else 'tar'

FR = 'Freshul/Creative Block Freshul'
TT = 'Tiktak moving/SMM calender/Aug-sep'
LCT = 'Luxury connection Tourism'

# client: [(source, output name[, poster time in seconds])]. "a.pdf#2" is
# page 2 of a PDF; "x.rar!member" is a file inside an archive.
MEDIA = {
    'the-gentry-house': [
        ('TGH/Posts/Reels/Reel 1.mp4', 'soft-opening-reel', 12.5),
    ],
    'freshul': [
        (f'{FR}/Social media posts/Freshul posts/2.jpg', 'teaser-industry-change'),
        (f'{FR}/Social media posts/Freshul posts/1.jpg', 'teaser-beauty-simplified'),
        (f'{FR}/Social media posts/Freshul posts/3.jpg', 'post-booking-problems'),
        (f'{FR}/Social media posts/Freshul posts/4.jpg', 'post-business-simplified'),
        (f'{FR}/Social media posts/Freshul posts/6.jpg', 'post-run-your-business'),
        (f'{FR}/Social media posts/Freshul posts/8.jpg', 'post-booking-task'),
        (f'{FR}/Social media posts/Freshul posts/9.jpg', 'post-better-beauty'),
        (f'{FR}/Social media posts/Freshul Banners/Post 1.jpg', 'banner-guess-whats-coming'),
        (f'{FR}/Social media posts/Freshul Banners/Post 2.jpg', 'banner-coming-soon'),
        (f'{FR}/Social media posts/Freshul Banners/Post 3.jpg', 'banner-beautiful-is-coming'),
        (f'{FR}/Raw data/Unsofted data/Freshul_Brochur/Freshul_Brochure_Front_150x297mm_300dpi.png', 'brochure-front'),
        (f'{FR}/Raw data/Unsofted data/Freshul_Brochur/Freshul_Brochure_Back_150x297mm_300dpi.png', 'brochure-back'),
        (f'{FR}/Raw data/Unsofted data/Freshul brandguidelines.jpg', 'brand-guidelines'),
        (f'{FR}/Raw data/Unsofted data/Hiring post 1.png', 'hiring-urgent'),
        (f'{FR}/Social media posts/Polo shirt design.png', 'polo-shirt'),
        (f'{FR}/Social media posts/Linkedin Cover.png', 'linkedin-cover'),
        (f'{FR}/Ads Creatives/0903 (2)(2).mp4', 'ad-stop-scrolling'),
        (f'{FR}/Ads Creatives/Reel 1.mp4', 'ad-free-onboarding', 15.7),
        (f'{FR}/Influencers videos/Areeba Reel.MOV', 'creator-areeba'),
        (f'{FR}/Influencers videos/Iqra reel.MOV', 'creator-iqra'),
        (f'{FR}/Influencers videos/Mia Final reel.mp4', 'creator-mia'),
        (f'{FR}/Raw data/Unsofted data/Reel 1.mp4', 'reel-partner-app', 19.4),
        (f'{FR}/Social media posts/Reels/reel 3.mp4', 'reel-five-reasons'),
        (f'{FR}/Raw data/Unsofted data/purple Freshul reel.mp4', 'reel-all-in-one-place'),
    ],
    'tiktak-moving': [
        (f'{TT}/posts/Week 1/post 1.jpg', 'nyc-moving-expert'),
        (f'{TT}/posts/Week 1/Post 2.jpg', 'moving-in-manhattan'),
        (f'{TT}/posts/Week 1/post 3.jpg', 'book-now'),
        (f'{TT}/posts/Week 1/post 4.jpg', 'quiet-clean-ready'),
        (f'{TT}/posts/Week 1/post 5.jpg', 'items-safely'),
        (f'{TT}/posts/Week 2/Post 5.jpg', 'quick-easy-eco'),
        (f'{TT}/posts/Week 2/Tik Tak Post 5.jpg', 'emotional-event'),
        (f'{TT}/posts/Week 2/Tik Tak Post 6.jpg', 'safe-fast-nyc'),
        (f'{TT}/posts/Week 3/Post 7.jpg', 'small-moves-189'),
        (f'{TT}/posts/Week 3/Post 8.jpg', 'truck-vs-rickshaw'),
        (f'{TT}/posts/Week 3/Post 9.jpg', 'short-on-time'),
        (f'{TT}/posts/Week 3/Post 10.jpg', 'small-medium-moves'),
        (f'{TT}/posts/week 4/1.jpg', 'six-tips'),
        (f'{TT}/posts/week 4/2.jpg', 'weekend-discount'),
        (f'{TT}/posts/week 4/3.jpg', 'customer-review'),
        (f'{TT}/posts/week 4/4.jpg', 'every-box'),
        (f'{TT}/posts/week 4/Post 11.jpg', 'hassle-free'),
        (f'{TT}/posts/week 4/Post 14.jpg', 'handled-with-care'),
        (f'{TT}/posts/week 4/Post 15.jpg', 'made-easy'),
        (f'{TT}/Highlight/Highlight.png', 'highlight-cover'),
        (f'{TT}/Highlight/Moving.png', 'highlight-moving'),
        (f'{TT}/posts/Week 1/video 1.mp4', 'reel-wrap-it-right'),
        (f'{TT}/posts/Week 2/Reel 2.mp4', 'reel-storage'),
        (f'{TT}/posts/Week 3/Reel 3.mp4', 'reel-streets'),
        (f'{TT}/posts/week 4/Reel 4.mp4', 'reel-looking-to-move'),
        (f'{TT}/posts/week 4/Reel 5.mp4', 'reel-can-a-truck'),
        (f'{TT}/posts/week 4/Reel 6.mp4', 'reel-williamsburg'),
    ],
    'wezatech': [
        *[(f'WezaTech/Social Media/AUG/posts/{n}.jpg', f'aug-{i + 1:02d}') for i, n in enumerate(
            ['Post 1', 'Post 2 (1)', 'Post 3', 'Post 4', 'Post 5', 'Post 6', 'Post 7', 'Post 8', 'Post 9', 'Post 10', 'Post 11', 'Post 12', 'Post 13 (1)', 'Post 14'])],
        *[(f'WezaTech/Social Media Plan/posts/Batch 1.zip!Batch 1/{n}.jpg', f'july-{n:02d}') for n in range(1, 16)],
        ('WezaTech/Social Media Plan/Wezatech SMM report..pdf#1', 'calendar-cover'),
        ('WezaTech/Social Media Plan/Wezatech SMM report..pdf#4', 'calendar-post-1'),
        ('WezaTech/Social Media Plan/Sample Media Plan.pdf#1', 'media-plan-cover'),
    ],
    'luxury-connection-tourism': [
        (f'{LCT}/Luxury Connection Tourism Brochure/Luxury Connection Tourism Tri Fold Brochure.rar!Luxury Connection Tourism Tri Fold Brochure/Mockup.jpg', 'brochure-mockup'),
        (f'{LCT}/Luxury Connection Tourism Brochure/Luxury Connection Tourism Tri Fold Brochure.rar!Luxury Connection Tourism Tri Fold Brochure/Outside (Print Ready).jpg', 'brochure-outside'),
        (f'{LCT}/Luxury Connection Tourism Brochure/Luxury Connection Tourism Tri Fold Brochure.rar!Luxury Connection Tourism Tri Fold Brochure/Inside (Print Ready).jpg', 'brochure-inside'),
        (f'{LCT}/posts/post 1/Post 1 Grid/Post 1 Grid/Instagram-3x3-Grid-Layout_01.jpg', 'grid-convenience-1'),
        (f'{LCT}/posts/post 1/Post 1 Grid/Post 1 Grid/Instagram-3x3-Grid-Layout_02.jpg', 'grid-convenience-2'),
        (f'{LCT}/posts/post 1/Post 1 Grid/Post 1 Grid/Instagram-3x3-Grid-Layout_08.jpg', 'grid-convenience-8'),
        (f'{LCT}/posts/post 14/Post 14 Grid/Post 14 Grid/Instagram-3x3-Grid-Layout_01.jpg', 'grid-arrive'),
        # (Slides 5 and 6 show a website template, not our work.)
        *[(f'{LCT}/car for rent social media template (1).pdf#{n}', f'social-{n:02d}') for n in (1, 2, 3, 4, 7)],
    ],
    'pink-salt': [
        ('Pink salt/Pink Salt Product Images.rar!Pink Salt Product Images/PNGs/IMG_1022.png', 'cutout-jar-front'),
        ('Pink salt/Pink Salt Product Images.rar!Pink Salt Product Images/PNGs/DSC_0072.png', 'cutout-two-jars'),
        ('Pink salt/Pink Salt Product Images.rar!Pink Salt Product Images/PNGs/IMG_1033.png', 'cutout-jar-tall'),
        ('Pink salt/Pink Salt Product Images.rar!Pink Salt Product Images/DSC_0089.JPG', 'shot-pair'),
        ('Pink salt/Pink Salt Product Images.rar!Pink Salt Product Images/DSC_0092.JPG', 'shot-in-hand'),
        ('Pink salt/Pink Salt Product Images.rar!Pink Salt Product Images/DSC_0070 (2).JPG', 'shot-studio'),
        ('Pink salt/Pink Salt Product Images.rar!Pink Salt Product Images/Iphone/IMG_1031.JPG', 'shot-lightbox'),
        ('Pink salt/Pink Salt Product Images.rar!Pink Salt Product Images/DSC_0072.JPG', 'shot-table'),
        ('Pink salt/SMM/OCT-NOV 2024/Posts/Reel/Pink Salt - Reel 1.mp4', 'reel-benefits'),
    ],
    'wecreative': [
        # (brand post/1.jpg and 7.jpg are slides 1 and 7 of the carousel PDF.)
        *[(f'wecreative/Posts/brand post/pdf.pdf#{n}', f'carousel-{n:02d}') for n in range(1, 8)],
        ('wecreative/video/gaming activity/WC -  Gaming Activity.mp4', 'team-gaming-activity'),
    ],
    'growzium': [
        ('Growzium/growzium.com_ (1).png', 'website-full'),
        ('Growzium/Growzium.mp4', 'website-walkthrough'),
    ],
}

_tmp = tempfile.mkdtemp(prefix='work-media-')
_extracted = set()


def source(path):
    """A real file path for a manifest entry (extracting or rendering if needed)."""
    if '!' in path:
        arc, member = path.split('!', 1)
        dest = os.path.join(_tmp, str(abs(hash(arc))))
        if arc not in _extracted:
            os.makedirs(dest, exist_ok=True)
            subprocess.run([TAR, '-xf', os.path.join(SRC, arc), '-C', dest, '--exclude', '*.ai'], check=True)
            _extracted.add(arc)
        return os.path.join(dest, member)
    if '#' in path:
        import fitz
        pdf, page = path.rsplit('#', 1)
        doc = fitz.open(os.path.join(SRC, pdf))
        out = os.path.join(_tmp, f'{abs(hash(path))}.png')
        doc[int(page) - 1].get_pixmap(dpi=150).save(out)
        return out
    return os.path.join(SRC, path)


def image(src, dest):
    im = ImageOps.exif_transpose(Image.open(src))
    im = im.convert('RGBA' if im.mode in ('RGBA', 'LA', 'P') else 'RGB')
    if im.mode == 'RGBA' and im.getextrema()[3][0] == 255:
        im = im.convert('RGB')
    if im.height > im.width * 2.2:
        # A full-page screenshot: keep it readable at 1080 wide.
        w = min(im.width, 1080)
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    else:
        im.thumbnail((1080, 1350) if im.height > im.width else (1600, 1080))
    im.save(dest, 'WEBP', quality=80, method=6)
    return {'w': im.width, 'h': im.height}


def probe(src):
    out = subprocess.run(['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_streams', '-show_format', src], capture_output=True, text=True).stdout
    j = json.loads(out)
    v = next(s for s in j['streams'] if s['codec_type'] == 'video')
    rot = int((v.get('tags') or {}).get('rotate', 0) or next((d.get('rotation', 0) for d in v.get('side_data_list', []) if 'rotation' in d), 0))
    w, h = int(v['width']), int(v['height'])
    if abs(rot) in (90, 270):
        w, h = h, w
    return w, h, float(j['format']['duration']), any(s['codec_type'] == 'audio' for s in j['streams'])


def video(src, dest, poster, at=None):
    w, h, dur, audio = probe(src)
    portrait = h >= w
    scale = 'scale=540:-2' if portrait else 'scale=960:-2'
    crf = '31' if dur > 90 else '28'
    cmd = ['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', scale + ',fps=30', '-c:v', 'libx264', '-preset', 'slow', '-crf', crf,
           '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']
    cmd += ['-c:a', 'aac', '-b:a', '64k', '-ac', '2'] if audio else ['-an']
    subprocess.run(cmd + [dest], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(at if at is not None else min(1.0, dur / 3)), '-i', dest, '-frames:v', '1', '-c:v', 'libwebp', '-quality', '78', poster], check=True)
    ow, oh, _, _ = probe(dest)
    return {'w': ow, 'h': oh, 'dur': round(dur, 1), 'audio': audio}


def main():
    meta_path = os.path.join(OUT, 'media.json')
    meta = json.load(open(meta_path)) if os.path.exists(meta_path) and not FORCE else {}
    for client, items in MEDIA.items():
        os.makedirs(os.path.join(OUT, client), exist_ok=True)
        for src, name, *at in items:
            is_video = src.lower().endswith(('.mp4', '.mov'))
            rel = f'/work/{client}/{name}.' + ('mp4' if is_video else 'webp')
            dest = os.path.join(ROOT, rel.lstrip('/'))
            if rel in meta and os.path.exists(dest):
                continue
            path = source(src)
            if is_video:
                info = video(path, dest, dest[:-4] + '.webp', *at)
                info['poster'] = rel[:-4] + '.webp'
            else:
                info = image(path, dest)
            info['kb'] = round(os.path.getsize(dest) / 1024)
            meta[rel] = info
            print(rel, info)
            json.dump(meta, open(meta_path, 'w'), indent=1)
    json.dump(meta, open(meta_path, 'w'), indent=1)
    total = sum(os.path.getsize(os.path.join(ROOT, k.lstrip('/'))) for k in meta) / 1e6
    print(f'{len(meta)} files, {total:.1f} MB in /work')


main()
