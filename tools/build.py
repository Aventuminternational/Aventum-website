#!/usr/bin/env python3
"""
Site build step. Run after every change to index.html, privacy.html, styles.css,
main.js or lang-init.js:

    python3 tools/build.py

1. Cache busting: adds ?v=<content hash> to styles.css, main.js and lang-init.js in
   every page, so returning visitors never combine new HTML with old CSS/JS.
2. Refreshes the FAQ structured data (JSON-LD) from the FAQ section.
3. Builds zh/index.html: a static, Chinese-only copy of index.html for Baidu and
   other Chinese search engines (they index static HTML far better than text that
   is switched on with JavaScript). Never edit zh/index.html by hand.
"""
import hashlib
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "index.html"
OUT = ROOT / "zh" / "index.html"
SITE = "https://aventuminternational.com"

ZH_TITLE = "巴西白砂糖 ICUMSA 45 供应 · 巴西食糖进口经纪 | Aventum International"
ZH_DESC = ("Aventum International 总部位于荷兰阿姆斯特丹，为中国及其他市场的进口商对接巴西 ICUMSA 45 "
           "精制白砂糖供应商。标准条款为巴西港口 FOB，可按需报指定目的港 CIF（如 CIF 上海港），可安排试单。")
ZH_KEYWORDS = ("巴西白糖,巴西白砂糖,ICUMSA 45,ICUMSA45白糖,巴西食糖进口,精制白砂糖,白糖进口,"
               "食糖贸易,巴西糖供应商,巴西港口FOB,CIF上海港,大宗商品经纪")


def remove_spans(s, cls):
    """Remove every <span class="cls">…</span>, including nested spans inside it."""
    open_tag = f'<span class="{cls}">'
    out, i = [], 0
    while True:
        j = s.find(open_tag, i)
        if j < 0:
            out.append(s[i:])
            return "".join(out)
        out.append(s[i:j])
        depth, k = 0, j
        for m in re.finditer(r"<span\b|</span>", s[j:]):
            depth += 1 if m.group(0) == "<span" else -1
            if depth == 0:
                k = j + m.end()
                break
        i = k


def text_of(fragment):
    return html.unescape(re.sub(r"<[^>]+>", "", fragment)).strip()


def faq_jsonld(page, lang_cls):
    """FAQPage structured data from the <details class="faq-item"> blocks."""
    items = []
    for block in re.findall(r'<details class="faq-item[^"]*">(.*?)</details>', page, re.S):
        q = re.search(rf'<summary><span class="{lang_cls}">(.*?)</span>', block, re.S)
        a = re.search(rf'<div class="faq-answer"><p><span class="{lang_cls}">(.*?)</span></p>', block, re.S)
        if q and a:
            items.append({"@type": "Question", "name": text_of(q.group(1)),
                          "acceptedAnswer": {"@type": "Answer", "text": text_of(a.group(1))}})
    data = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": items}
    return ('<!-- faq-jsonld:start -->\n<script type="application/ld+json">\n'
            + json.dumps(data, ensure_ascii=False, indent=2)
            + '\n</script>\n<!-- faq-jsonld:end -->')


def set_faq(page, block):
    return re.sub(r"<!-- faq-jsonld:start -->.*?<!-- faq-jsonld:end -->", lambda m: block, page, flags=re.S)


def sub1(pattern, repl, s):
    new, n = re.subn(pattern, repl, s, count=1, flags=re.S)
    if n != 1:
        raise SystemExit(f"build: pattern not found: {pattern[:60]}")
    return new


def absolutise(s):
    """Relative asset/page URLs -> root-relative, because the page lives in /zh/."""
    def fix(url):
        if re.match(r"^(#|/|https?:|mailto:|tel:|data:)", url):
            return url
        return "/" + url

    s = re.sub(r'\b(src|href|poster|srcset|data-href-cn)="([^"]*)"',
               lambda m: f'{m.group(1)}="{fix(m.group(2))}"', s)
    s = re.sub(r'\bdata-sources="([^"]*)"',
               lambda m: 'data-sources="' + ",".join(fix(u.strip()) for u in m.group(1).split(",")) + '"', s)
    return s


ASSETS = ["styles.css", "main.js", "lang-init.js"]


def version_assets(page):
    for name in ASSETS:
        h = hashlib.md5((ROOT / name).read_bytes()).hexdigest()[:8]
        page = re.sub(rf'(["/]){re.escape(name)}(\?v=[0-9a-f]+)?"', rf'\g<1>{name}?v={h}"', page)
    return page


def main():
    for extra in ["privacy.html"]:
        f = ROOT / extra
        f.write_text(version_assets(f.read_text(encoding="utf-8")), encoding="utf-8")

    src = version_assets(SRC.read_text(encoding="utf-8"))

    # 1. Refresh English FAQ data in the main page
    src = set_faq(src, faq_jsonld(src, "lang-en"))
    SRC.write_text(src, encoding="utf-8")

    zh = src
    # 2. Chinese only: drop English spans, bake Chinese attribute values in
    zh = remove_spans(zh, "lang-en")
    zh = re.sub(r'(<[^>]*?)\splaceholder="[^"]*"([^>]*?data-ph-cn="([^"]*)")', r'\1\2 placeholder="\3"', zh)
    zh = re.sub(r'(<[^>]*?data-ph-cn="([^"]*)"[^>]*?)\splaceholder="[^"]*"', r'\1 placeholder="\2"', zh)
    zh = re.sub(r'(<[^>]*?data-aria-cn="([^"]*)"[^>]*?)\saria-label="[^"]*"', r'\1 aria-label="\2"', zh)
    zh = re.sub(r'(<img[^>]*?)\salt="[^"]*"([^>]*?data-alt-cn="([^"]*)")', r'\1 alt="\3"\2', zh)
    zh = re.sub(r'(<option[^>]*?data-cn="([^"]*)"[^>]*>)[^<]*(</option>)', r'\1\2\3', zh)
    zh = re.sub(r'href="([^"]*)"(\s+data-href-cn="([^"]*)")', r'href="\3"\2', zh)
    zh = zh.replace('href="privacy.html"', 'href="privacy.html?lang=zh"')
    zh = zh.replace('aria-pressed="true" lang="en"', 'aria-pressed="false" lang="en"')
    zh = zh.replace('aria-pressed="false" lang="zh-CN"', 'aria-pressed="true" lang="zh-CN"')
    zh = zh.replace('<input type="hidden" name="language" id="f-language" value="en">',
                    '<input type="hidden" name="language" id="f-language" value="zh-CN">')
    zh = zh.replace('aria-label="Aventum International, back to top"', 'aria-label="Aventum International，返回顶部"')
    zh = zh.replace('aria-label="Main"', 'aria-label="主导航"').replace('aria-label="Mobile"', 'aria-label="移动导航"')

    # 3. Head: language, Chinese meta, canonical, Baidu hints; no Google Fonts (blocked in mainland China)
    zh = sub1(r'<html lang="en">', '<html lang="zh-CN" data-lang-lock>', zh)
    zh = sub1(r"<title>.*?</title>", f"<title>{ZH_TITLE}</title>", zh)
    zh = sub1(r'<meta name="description" content="[^"]*">',
              f'<meta name="description" content="{ZH_DESC}">\n<meta name="keywords" content="{ZH_KEYWORDS}">\n'
              '<meta http-equiv="Cache-Control" content="no-transform">\n'
              '<meta http-equiv="Cache-Control" content="no-siteapp">\n'
              '<meta name="applicable-device" content="pc,mobile">', zh)
    zh = sub1(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{SITE}/zh/">', zh)
    zh = sub1(r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{SITE}/zh/">', zh)
    zh = sub1(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{ZH_TITLE}">', zh)
    zh = sub1(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{ZH_DESC}">', zh)
    zh = sub1(r'<meta property="og:locale" content="en_US">\s*<meta property="og:locale:alternate" content="zh_CN">',
              '<meta property="og:locale" content="zh_CN">\n<meta property="og:locale:alternate" content="en_US">', zh)
    zh = sub1(r'<meta name="twitter:title" content="[^"]*">', f'<meta name="twitter:title" content="{ZH_TITLE}">', zh)
    zh = sub1(r'<meta name="twitter:description" content="[^"]*">', f'<meta name="twitter:description" content="{ZH_DESC}">', zh)
    zh = sub1(r'\s*<!-- Fonts load.*?</noscript>', "", zh)
    zh = sub1(r"<body([^>]*)>", lambda m: f'<body data-title-cn="{ZH_TITLE}" data-description-cn="{ZH_DESC}">', zh)
    zh = set_faq(zh, faq_jsonld(src, "lang-cn"))
    zh = sub1(r"<!DOCTYPE html>", "<!DOCTYPE html>\n<!-- Generated by tools/build.py from index.html. Do not edit by hand. -->", zh)

    # 4. Root-relative URLs (the page is served from /zh/)
    zh = absolutise(zh)

    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(zh, encoding="utf-8")
    left = len(re.findall(r'class="lang-en"', zh))
    print(f"wrote {OUT.relative_to(ROOT)} ({len(zh) // 1024} KB), English spans left: {left}")


if __name__ == "__main__":
    main()
