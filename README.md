# Aventum-website
Aventum International website

## Chinese page (/zh/)

`zh/index.html` is generated from `index.html` for Baidu, and CSS/JS links get a version number for cache busting. After every change to the HTML, CSS or JS, run:

    python3 tools/build.py

and commit both files. Never edit `zh/index.html` by hand.
