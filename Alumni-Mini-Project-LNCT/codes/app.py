import csv
from pathlib import Path

from flask import Flask, abort, jsonify, request, send_from_directory

BASE_DIR = Path(__file__).resolve().parent
CSV_PATH = BASE_DIR / "students.csv"

FIELDNAMES = [
    "name", "enrolment", "year", "branch", "cgpa", "city", "phone", "email",
    "linkedin", "github", "portfolio", "status", "company", "role", "package", "placementType",
    "skills", "projectTitle", "projectDescription", "projectLanguage", "projectStack",
    "track",
]

app = Flask(__name__, static_folder=None)


# ---------------------------------------------------------------------------
# CSV read/write helpers
# ---------------------------------------------------------------------------

def ensure_csv():
    """Create students.csv with just a header row if it doesn't exist yet."""
    if not CSV_PATH.exists():
        with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
            csv.DictWriter(f, fieldnames=FIELDNAMES).writeheader()


def read_rows():
    ensure_csv()
    with CSV_PATH.open("r", newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def write_rows(rows):
    with CSV_PATH.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(rows)


# ---------------------------------------------------------------------------
# Conversion between a flat CSV row and the nested shape index.html expects
# ---------------------------------------------------------------------------

def parse_skills(raw):
    """"Python:4, React:3" -> [["Python", 4], ["React", 3]]"""
    out = []
    for part in filter(None, (p.strip() for p in (raw or "").split(","))):
        if ":" in part:
            name, lvl = part.rsplit(":", 1)
            try:
                lvl = int(lvl.strip())
            except ValueError:
                lvl = 3
        else:
            name, lvl = part, 3
        out.append([name.strip(), lvl])
    return out


def format_skills(sk):
    return ", ".join(f"{name}:{lvl}" for name, lvl in (sk or []))


def parse_track(raw):
    """"2024|Placed at Acme; 2025|Promoted" -> [["2024","Placed at Acme"], ["2025","Promoted"]]"""
    out = []
    for part in filter(None, (p.strip() for p in (raw or "").split(";"))):
        if "|" in part:
            yr, note = part.split("|", 1)
            out.append([yr.strip(), note.strip()])
    return out


def format_track(track):
    return "; ".join(f"{yr}|{note}" for yr, note in (track or []))


def row_to_student(row):
    pj = []
    if row.get("projectTitle"):
        pj.append({
            "t": row.get("projectTitle", ""),
            "d": row.get("projectDescription", ""),
            "l": row.get("projectLanguage") or "Other",
            "x": row.get("projectStack", ""),
        })
    year = row.get("year") or ""
    cgpa = row.get("cgpa") or ""
    return {
        "n": row.get("name", ""),
        "e": row.get("enrolment", ""),
        "y": int(year) if year.isdigit() else year,
        "b": row.get("branch", ""),
        "cg": float(cgpa) if cgpa else 0,
        "city": row.get("city", ""),
        "ph": row.get("phone", ""),
        "em": row.get("email", ""),
        "li": row.get("linkedin", ""),
        "gh": row.get("github", ""),
        "pf": row.get("portfolio", ""),
        "st": row.get("status", ""),
        "co": row.get("company", ""),
        "role": row.get("role", ""),
        "ctc": row.get("package", ""),
        "ptype": row.get("placementType", ""),
        "sk": parse_skills(row.get("skills")),
        "pj": pj,
        "track": parse_track(row.get("track")),
    }


def student_to_row(s):
    pj = (s.get("pj") or [{}])
    p = pj[0] if pj else {}
    return {
        "name": s.get("n", ""),
        "enrolment": s.get("e", ""),
        "year": s.get("y", ""),
        "branch": s.get("b", ""),
        "cgpa": s.get("cg", ""),
        "city": s.get("city", ""),
        "phone": s.get("ph", ""),
        "email": s.get("em", ""),
        "linkedin": s.get("li", ""),
        "github": s.get("gh", ""),
        "portfolio": s.get("pf", ""),
        "status": s.get("st", ""),
        "company": s.get("co", ""),
        "role": s.get("role", ""),
        "package": s.get("ctc", ""),
        "placementType": s.get("ptype", ""),
        "skills": format_skills(s.get("sk")),
        "projectTitle": p.get("t", ""),
        "projectDescription": p.get("d", ""),
        "projectLanguage": p.get("l", ""),
        "projectStack": p.get("x", ""),
        "track": format_track(s.get("track")),
    }


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------

REQUIRED_FIELDS = ["n", "e", "y", "b", "st"]


@app.get("/api/students")
def list_students():
    return jsonify([row_to_student(r) for r in read_rows()])


@app.post("/api/students")
def add_student():
    data = request.get_json(force=True, silent=True) or {}
    missing = [f for f in REQUIRED_FIELDS if not str(data.get(f, "")).strip()]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    rows = read_rows()
    enrolment = str(data["e"]).strip()
    if any(r["enrolment"] == enrolment for r in rows):
        return jsonify({"error": "A student with this enrolment number already exists."}), 409

    rows.append(student_to_row(data))
    write_rows(rows)
    return jsonify(data), 201


@app.put("/api/students/<enrolment>")
def update_student(enrolment):
    data = request.get_json(force=True, silent=True) or {}
    missing = [f for f in REQUIRED_FIELDS if not str(data.get(f, "")).strip()]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    rows = read_rows()
    idx = next((i for i, r in enumerate(rows) if r["enrolment"] == enrolment), None)
    if idx is None:
        return jsonify({"error": f"No student found with enrolment number {enrolment}."}), 404

    rows[idx] = student_to_row(data)
    write_rows(rows)
    return jsonify(data)


@app.delete("/api/students/<enrolment>")
def delete_student(enrolment):
    rows = read_rows()
    kept = [r for r in rows if r["enrolment"] != enrolment]
    if len(kept) == len(rows):
        return jsonify({"error": f"No student found with enrolment number {enrolment}."}), 404
    write_rows(kept)
    return "", 204


@app.get("/api/students/export")
def export_csv():
    """Download students.csv exactly as it sits on disk — the one file that
    holds every record, rather than a fresh file generated per request."""
    ensure_csv()
    return send_from_directory(BASE_DIR, "students.csv", as_attachment=True, download_name="students.csv")


# ---------------------------------------------------------------------------
# Static file serving — index.html, styles.css, the logo, etc.
# ---------------------------------------------------------------------------

@app.get("/")
def home():
    # The site now opens on the sign-in gate rather than the directory
    # itself — login.html sends insiders/outsiders on to index.html once
    # they've chosen how they're visiting (see login.html's script).
    return send_from_directory(BASE_DIR, "login.html")


@app.get("/index.html")
def directory_page():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/<path:filename>")
def static_files(filename):
    full_path = BASE_DIR / filename
    if not full_path.is_file():
        abort(404)
    return send_from_directory(BASE_DIR, filename)


if __name__ == "__main__":
    ensure_csv()
    app.run(debug=True, port=5000)
