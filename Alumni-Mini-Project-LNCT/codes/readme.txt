
LNCT Bhopal Alumni Directory — Flask backend

Serves index.html (and its sibling files) and exposes a small REST API that
reads and writes a single CSV file, students.csv, which lives next to this
script. That CSV is the one persistent store for every alumni record: add a
student through the website's "+ Add student" form, edit one with the
"Edit" button on their profile, or open students.csv yourself in a
spreadsheet editor — all three stay in sync, because the API always reads
the file fresh and writes the whole file back on every change.

Run it with:
    pip install flask
    python app.py
then open http://127.0.0.1:5000 in a browser.

Folder layout expected (all in the same directory as this file):
    app.py               this file — the backend
    login.html           sign-in gate, the page "/" serves
    login.css            its styling
    login.js             its behaviour (visitor radios, email check, autocomplete)
    index.html           the alumni directory itself, served at "/index.html"
    styles.css           its styling
    app.js               its behaviour (search, theme toggle, add/edit form, honeycomb bg)
    Logo-Lnct.svg         the LNCT logo used on both pages
    students.csv         every alumni record — the one file this app reads and writes
    requirements.txt     just "Flask"

Every file here holds exactly one language — .py, .html, .css, .js, .csv —
so none of them mix markup, styling, logic or data.