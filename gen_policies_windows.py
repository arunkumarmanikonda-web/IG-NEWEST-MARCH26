#!/usr/bin/env python3
"""
India Gully Ventures – Policy PDF Generator
Run this script in your repo root to generate GOV-007 and GOV-008 PDFs
Usage: python gen_policies_windows.py
Output: code-of-conduct-ethics.pdf and related-party-transaction-policy.pdf
        saved in the SAME folder as this script
"""

import os
import sys

# ── Output paths (same directory as this script) ──────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_007 = os.path.join(SCRIPT_DIR, "code-of-conduct-ethics.pdf")
OUT_008 = os.path.join(SCRIPT_DIR, "related-party-transaction-policy.pdf")

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import mm
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    )
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
except ImportError:
    print("ERROR: reportlab not installed. Run: pip install reportlab")
    sys.exit(1)

# ── Shared palette ─────────────────────────────────────────────────────────
GOLD   = colors.HexColor("#C9A84C")
DARK   = colors.HexColor("#1A1A2E")
MID    = colors.HexColor("#3D3D5C")
LIGHT  = colors.HexColor("#F5F0E8")
BORDER = colors.HexColor("#E8E0CC")
WHITE  = colors.white
RED    = colors.HexColor("#7F1D1D")
RLIGHT = colors.HexColor("#FEE2E2")

styles = getSampleStyleSheet()

def st(name, **kw):
    return ParagraphStyle(name, parent=styles["Normal"], **kw)

def section_header(text, width_mm=166):
    H1 = st("_H1x", fontName="Helvetica-Bold", fontSize=12, textColor=WHITE, spaceBefore=0, spaceAfter=0)
    data = [[Paragraph(text, H1)]]
    t = Table(data, colWidths=[width_mm*mm])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), DARK),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
        ("RIGHTPADDING",  (0,0), (-1,-1), 8),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ]))
    return t

def bullet(text):
    BL = st("_BLx", fontName="Helvetica", fontSize=9.5, textColor=DARK,
            leftIndent=12, spaceBefore=1, spaceAfter=1, alignment=TA_JUSTIFY, leading=13)
    return Paragraph(f"<b>\u2022</b>&nbsp; {text}", BL)

# ══════════════════════════════════════════════════════════════════════════
# GOV-007  Code of Conduct & Ethics Policy
# ══════════════════════════════════════════════════════════════════════════
def gen_007():
    TITLE  = st("T7",  fontName="Helvetica-Bold", fontSize=20, textColor=DARK,  alignment=TA_CENTER, spaceAfter=2)
    SUB    = st("S7",  fontName="Helvetica",      fontSize=10, textColor=MID,   alignment=TA_CENTER, spaceAfter=1)
    BODY   = st("B7",  fontName="Helvetica",      fontSize=9.5, textColor=DARK, spaceBefore=2, spaceAfter=3, alignment=TA_JUSTIFY, leading=14)
    NOTE   = st("N7",  fontName="Helvetica-Oblique", fontSize=8.5, textColor=MID, spaceBefore=2, spaceAfter=2)
    FOOTER = st("F7",  fontName="Helvetica",      fontSize=8,  textColor=MID,  alignment=TA_CENTER)

    doc = SimpleDocTemplate(OUT_007, pagesize=A4,
        leftMargin=22*mm, rightMargin=22*mm, topMargin=18*mm, bottomMargin=18*mm,
        title="Code of Conduct & Ethics Policy",
        author="India Gully Ventures Private Limited")

    story = []
    story.append(Spacer(1, 8*mm))

    # Cover banner
    cover = Table([[Paragraph("INDIA GULLY VENTURES", st("c7a", fontName="Helvetica-Bold", fontSize=9, textColor=GOLD, alignment=TA_CENTER))],
                   [Paragraph("PRIVATE LIMITED",      st("c7b", fontName="Helvetica",      fontSize=8, textColor=MID,  alignment=TA_CENTER))]],
                  colWidths=[166*mm])
    cover.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),LIGHT),("BOX",(0,0),(-1,-1),1.5,GOLD),
                                ("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6)]))
    story += [cover, Spacer(1,5*mm),
              HRFlowable(width="100%", thickness=2, color=GOLD, spaceAfter=5),
              Paragraph("CODE OF CONDUCT &amp; ETHICS POLICY", TITLE),
              HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=4),
              Paragraph("Governing the professional conduct of all Directors, KMPs, employees and associates", SUB),
              Spacer(1, 3*mm)]

    # Meta table
    meta = [["Document ID:", "GOV-007",      "Version:", "v2.0"],
            ["Effective:",   "January 2025", "Review:",  "January 2026"],
            ["Owner:",       "Board of Directors / CS", "Status:", "Active"],
            ["CIN:",         "U74999MH2017PTC291234",   "GSTIN:", "27AABCI1234K1Z5"]]
    mt = Table(meta, colWidths=[28*mm, 54*mm, 28*mm, 56*mm])
    mt.setStyle(TableStyle([("FONTNAME",(0,0),(-1,-1),"Helvetica"),("FONTSIZE",(0,0),(-1,-1),8.5),
        ("FONTNAME",(0,0),(0,-1),"Helvetica-Bold"),("FONTNAME",(2,0),(2,-1),"Helvetica-Bold"),
        ("TEXTCOLOR",(0,0),(0,-1),MID),("TEXTCOLOR",(2,0),(2,-1),MID),
        ("BACKGROUND",(0,0),(-1,-1),LIGHT),("BOX",(0,0),(-1,-1),0.5,BORDER),
        ("INNERGRID",(0,0),(-1,-1),0.25,BORDER),
        ("TOPPADDING",(0,0),(-1,-1),4),("BOTTOMPADDING",(0,0),(-1,-1),4),("LEFTPADDING",(0,0),(-1,-1),6)]))
    story += [mt, Spacer(1, 6*mm)]

    # Sections
    sections = [
        ("1.   PURPOSE & OBJECTIVE",
         ["India Gully Ventures Private Limited (<b>'the Company'</b>) is committed to conducting its business with the highest standards of integrity, transparency and ethical behaviour. This Code of Conduct &amp; Ethics Policy (<b>'Policy'</b>) establishes the principles governing Directors, KMPs, all employees, contractual staff, interns and business associates.",
          "This Policy is adopted in compliance with <b>Section 178 of the Companies Act, 2013</b>, the <b>SEBI (LODR) Regulations, 2015</b> and the <b>Digital Personal Data Protection Act, 2023 (DPDP Act)</b>."],
         []),

        ("2.   SCOPE",
         ["This Policy applies to:"],
         ["All full-time and part-time employees across all levels and departments",
          "Board of Directors (Executive and Independent)",
          "Key Managerial Personnel (MD, CEO, CFO, CS)",
          "Contractual workers, consultants and advisors engaged by the Company",
          "Third-party representatives acting on behalf of India Gully Ventures",
          "Interns, trainees and seconded staff"]),

        ("3.   CORE VALUES & PRINCIPLES",
         [],
         ["<b>Integrity:</b> Act honestly in all professional dealings. No individual shall misrepresent facts, forge documents or engage in deceptive practices.",
          "<b>Respect:</b> Treat all colleagues, clients and stakeholders with dignity irrespective of gender, religion, caste, nationality or disability.",
          "<b>Accountability:</b> Take ownership of decisions and actions. Report errors promptly and avoid concealment.",
          "<b>Transparency:</b> Maintain open and accurate communication. Financial and operational disclosures must be truthful and timely.",
          "<b>Excellence:</b> Strive for the highest quality in all work and continuously seek process improvement.",
          "<b>Sustainability:</b> Consider ESG factors in business decisions in alignment with the Company's ESG Charter."]),

        ("4.   CONFLICT OF INTEREST",
         ["A conflict of interest arises when personal interests diverge from the Company's interests. All covered persons must:"],
         ["Disclose actual or potential conflicts to the Board/HR within <b>7 business days</b> of becoming aware",
          "Abstain from participating in decisions where a personal interest exists",
          "Not use Company resources, relationships or confidential information for personal benefit",
          "Disclose outside employment, directorship or significant financial interests in competing firms",
          "Not directly or indirectly influence vendor selection, hiring or contract awards where a personal relationship exists"]),

        ("5.   CONFIDENTIALITY & INFORMATION SECURITY",
         ["Employees and associates have access to sensitive Company and client data. The following obligations apply:"],
         ["All confidential information — financial data, client lists, pricing, mandates, strategies, source code and personal data — must be treated as strictly confidential",
          "Information must not be disclosed outside the Company without prior written authorisation",
          "Employees must comply with the <b>Information Security Policy (v3.2)</b> and <b>DPDP Act, 2023</b> requirements",
          "Upon separation, all confidential information and Company property must be returned immediately",
          "Confidentiality obligations survive termination for a period of <b>3 years</b>",
          "Unauthorised access or exfiltration of data may attract civil and criminal liability under the <b>IT Act, 2000</b> and <b>DPDP Act, 2023</b>"]),

        ("6.   ANTI-BRIBERY & ANTI-CORRUPTION",
         ["India Gully Ventures has a zero-tolerance policy towards bribery, facilitation payments and corruption in all forms. Compliance with the <b>Prevention of Corruption Act, 1988</b> is mandatory."],
         ["No employee shall offer, promise, give or accept a bribe, kickback or improper payment",
          "Facilitation payments to government officials — even for routine services — are prohibited",
          "All payments, commissions and fees must be accurately recorded in the Company's books",
          "Employees must not use third-party intermediaries to channel improper payments",
          "Violations result in immediate termination and may be reported to law enforcement"]),

        ("7.   WORKPLACE CONDUCT & HARASSMENT (POSH)",
         ["The Company is committed to a safe, inclusive and harassment-free workplace in compliance with the <b>POSH Act, 2013</b>."],
         ["Any form of sexual harassment, bullying, discrimination or hostile behaviour is strictly prohibited",
          "The Company maintains an <b>Internal Complaints Committee (ICC)</b> for redressal of POSH complaints",
          "All complaints will be investigated within <b>90 days</b> and treated with strict confidentiality",
          "Retaliation against a complainant or witness is itself a violation of this Policy",
          "POSH awareness training is conducted annually for all employees"]),

        ("8.   DATA PROTECTION & PRIVACY (DPDP ACT, 2023)",
         ["In compliance with the <b>Digital Personal Data Protection Act, 2023</b>, all employees handling personal data must:"],
         ["Process personal data only for specified, lawful purposes for which consent has been obtained",
          "Not share personal data with unauthorised parties or use it beyond its intended purpose",
          "Report personal data breaches to the <b>DPO at dpo@indiagully.com</b> within <b>72 hours</b>",
          "Comply with data subject rights (access, correction, erasure, nomination) within <b>30 days</b>",
          "Complete mandatory DPDP awareness training within 30 days of joining"]),

        ("9.   USE OF COMPANY ASSETS",
         [],
         ["Company assets — IT equipment, software, vehicles, office facilities — are for legitimate business use only",
          "Personal use is restricted to incidental, occasional use that does not interfere with business operations",
          "Employees must not install unauthorised software or connect personal storage devices to Company systems",
          "Expense claims must be accurate, receipt-supported and submitted within <b>30 days</b>",
          "Company credit cards must not be used for personal purchases"]),

        ("10.  WHISTLEBLOWER PROTECTION",
         ["Employees are encouraged and, where required, obligated to report suspected violations. Reporting channels:"],
         ["<b>Direct Manager / HR:</b> hr@indiagully.com — internal, maintained confidentiality",
          "<b>Company Secretary:</b> legal@indiagully.com — maintained confidentiality",
          "<b>Anonymous Ethics Hotline:</b> ethics@indiagully.com — full anonymity protection",
          "<b>Board Audit Committee:</b> board@indiagully.com — Board-level confidentiality",
          "<b>Anti-retaliation:</b> No employee shall suffer adverse action for reporting in good faith"]),

        ("11.  DISCIPLINARY ACTION",
         ["Violations will be handled through the Company's disciplinary process. Consequences may include:"],
         ["<b>Minor violations:</b> Verbal or written warning; mandatory ethics training",
          "<b>Moderate violations:</b> Final written warning; suspension without pay; demotion",
          "<b>Serious violations:</b> Termination; recovery of ill-gotten gains; civil action",
          "<b>Criminal violations:</b> Immediate termination; report to Police/SEBI/MCA/CERT-In as applicable",
          "Directors may be subject to Board-level action including removal and RoC reporting"]),

        ("12.  ACKNOWLEDGEMENT & REVIEW",
         ["All employees and Directors must sign the <b>Policy Acknowledgement Form</b> on joining and annually thereafter. This Policy is reviewed annually by the Board and Company Secretary. Material amendments require a Board resolution and will be communicated within <b>30 days</b>."],
         []),
    ]

    for title, paras, bullets in sections:
        story += [section_header(title), Spacer(1, 2*mm)]
        for p in paras:
            story.append(Paragraph(p, BODY))
        for b in bullets:
            story.append(bullet(b))
        story.append(Spacer(1, 4*mm))

    # Gift table
    story.append(section_header("ANNEX A – GIFTS & HOSPITALITY LIMITS"))
    story.append(Spacer(1, 2*mm))
    gift_data = [
        ["Category",              "Permitted Limit",          "Approval Required"],
        ["Gifts received",        "Up to \u20b92,000 per instance", "Declare to HR; >2,000 return/donate"],
        ["Gifts given",           "Up to \u20b93,000 per instance", "Line Manager; no cash/gift cards"],
        ["Business meals",        "Up to \u20b95,000 per person",   "No approval; log in expense report"],
        ["Entertainment/events",  "Up to \u20b98,000 per person",   "Pre-approval from Dept Head"],
        ["Government officials",  "NIL — not permitted",          "CS sign-off for any exception"],
    ]
    gt = Table(gift_data, colWidths=[42*mm, 62*mm, 62*mm])
    gt.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),DARK),("TEXTCOLOR",(0,0),(-1,0),WHITE),
        ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),("FONTNAME",(0,1),(-1,-1),"Helvetica"),
        ("FONTSIZE",(0,0),(-1,-1),8.5),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[WHITE,LIGHT]),
        ("BOX",(0,0),(-1,-1),0.5,BORDER),("INNERGRID",(0,0),(-1,-1),0.25,BORDER),
        ("TOPPADDING",(0,0),(-1,-1),4),("BOTTOMPADDING",(0,0),(-1,-1),4),
        ("LEFTPADDING",(0,0),(-1,-1),6),("ALIGN",(0,0),(-1,-1),"LEFT")]))
    story += [gt, Spacer(1, 6*mm)]

    # Approval block
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceBefore=4, spaceAfter=6))
    ap = Table([["Prepared by","Approved by","Board Resolution No."],
                ["Priya Kapoor\nSenior Analyst\nAdvisory & Compliance",
                 "Arun Manikonda\nManaging Director",
                 "BR-2025-01-15\nDate: 15 January 2025"]],
               colWidths=[55*mm, 55*mm, 56*mm])
    ap.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),LIGHT),("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),
        ("FONTNAME",(0,1),(-1,1),"Helvetica"),("FONTSIZE",(0,0),(-1,-1),8.5),
        ("TEXTCOLOR",(0,0),(-1,0),MID),("BOX",(0,0),(-1,-1),1,GOLD),
        ("INNERGRID",(0,0),(-1,-1),0.5,BORDER),
        ("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),22),
        ("LEFTPADDING",(0,0),(-1,-1),8),("ALIGN",(0,0),(-1,-1),"LEFT")]))
    story += [ap, Spacer(1,4*mm)]
    story.append(Paragraph(
        "\u00a9 2025 India Gully Ventures Private Limited  |  CIN: U74999MH2017PTC291234  |  "
        "601-A, Hubtown Solaris, Andheri East, Mumbai \u2013 400 069  |  CONFIDENTIAL",
        FOOTER))

    doc.build(story)
    print(f"  GOV-007 OK  \u2192  {OUT_007}  ({os.path.getsize(OUT_007):,} bytes)")


# ══════════════════════════════════════════════════════════════════════════
# GOV-008  Related Party Transaction Policy
# ══════════════════════════════════════════════════════════════════════════
def gen_008():
    TITLE  = st("T8",  fontName="Helvetica-Bold", fontSize=20, textColor=DARK,  alignment=TA_CENTER, spaceAfter=2)
    SUB    = st("S8",  fontName="Helvetica",      fontSize=10, textColor=MID,   alignment=TA_CENTER, spaceAfter=1)
    BODY   = st("B8",  fontName="Helvetica",      fontSize=9.5, textColor=DARK, spaceBefore=2, spaceAfter=3, alignment=TA_JUSTIFY, leading=14)
    NOTE   = st("N8",  fontName="Helvetica-Oblique", fontSize=8.5, textColor=MID, spaceBefore=2, spaceAfter=2)
    FOOTER = st("F8",  fontName="Helvetica",      fontSize=8,  textColor=MID,  alignment=TA_CENTER)

    doc = SimpleDocTemplate(OUT_008, pagesize=A4,
        leftMargin=22*mm, rightMargin=22*mm, topMargin=18*mm, bottomMargin=18*mm,
        title="Related Party Transaction Policy",
        author="India Gully Ventures Private Limited")

    story = []
    story.append(Spacer(1, 8*mm))

    cover = Table([[Paragraph("INDIA GULLY VENTURES", st("c8a", fontName="Helvetica-Bold", fontSize=9, textColor=GOLD, alignment=TA_CENTER))],
                   [Paragraph("PRIVATE LIMITED",      st("c8b", fontName="Helvetica",      fontSize=8, textColor=MID,  alignment=TA_CENTER))]],
                  colWidths=[166*mm])
    cover.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),LIGHT),("BOX",(0,0),(-1,-1),1.5,GOLD),
                                ("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6)]))
    story += [cover, Spacer(1,5*mm),
              HRFlowable(width="100%", thickness=2, color=GOLD, spaceAfter=5),
              Paragraph("RELATED PARTY TRANSACTION POLICY", TITLE),
              HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=4),
              Paragraph("Framework for identification, approval, disclosure and monitoring of related party transactions", SUB),
              Spacer(1, 3*mm)]

    meta = [["Document ID:", "GOV-008",    "Version:", "v1.2"],
            ["Effective:",   "March 2024", "Review:",  "March 2025"],
            ["Owner:",       "Board / Audit Committee / CS", "Status:", "Active"],
            ["Legal Basis:", "Companies Act 2013 \u00a7177, \u00a7188", "Framework:", "MCA & SEBI Guidelines"]]
    mt = Table(meta, colWidths=[28*mm, 68*mm, 22*mm, 48*mm])
    mt.setStyle(TableStyle([("FONTNAME",(0,0),(-1,-1),"Helvetica"),("FONTSIZE",(0,0),(-1,-1),8.5),
        ("FONTNAME",(0,0),(0,-1),"Helvetica-Bold"),("FONTNAME",(2,0),(2,-1),"Helvetica-Bold"),
        ("TEXTCOLOR",(0,0),(0,-1),MID),("TEXTCOLOR",(2,0),(2,-1),MID),
        ("BACKGROUND",(0,0),(-1,-1),LIGHT),("BOX",(0,0),(-1,-1),0.5,BORDER),
        ("INNERGRID",(0,0),(-1,-1),0.25,BORDER),
        ("TOPPADDING",(0,0),(-1,-1),4),("BOTTOMPADDING",(0,0),(-1,-1),4),("LEFTPADDING",(0,0),(-1,-1),6)]))
    story += [mt, Spacer(1, 6*mm)]

    # Section 1
    story += [section_header("1.   PURPOSE & REGULATORY BACKGROUND"), Spacer(1,2*mm)]
    story.append(Paragraph(
        "India Gully Ventures Private Limited (<b>'the Company'</b>) recognises that transactions with related parties, "
        "if not managed with oversight, may present risks of conflict of interest. This <b>Related Party Transaction Policy</b> "
        "establishes a framework to ensure all such transactions are identified, approved through appropriate governance channels, "
        "conducted at arm's length, and reported to the Audit Committee, Board and, where required, to the RoC.",
        BODY))
    story.append(Paragraph(
        "This Policy is framed in compliance with <b>Sections 177 and 188 of the Companies Act, 2013</b>, "
        "the <b>Companies (Meetings of Board and its Powers) Rules, 2014</b> and applicable SEBI guidelines.",
        BODY))
    story.append(Spacer(1,4*mm))

    # Section 2 – Definitions
    story += [section_header("2.   DEFINITIONS"), Spacer(1,2*mm)]
    defs = [
        ("Related Party", "As defined under Section 2(76) of the Companies Act, 2013: a Director or KMP; a relative of a Director or KMP; "
         "a firm in which a Director/KMP is a partner; a private company in which a Director/KMP is a member or Director; "
         "a holding, subsidiary or associate company."),
        ("Related Party Transaction (RPT)", "Any transaction (directly or indirectly) involving the Company and a Related Party."),
        ("Arm's Length Transaction", "A transaction conducted as if the parties were unrelated, with no conflict of interest."),
        ("Ordinary Course of Business", "Transactions that are routine, usual and customary for the Company's principal business activity."),
        ("Audit Committee", "The Audit Committee of the Board constituted under Section 177 of the Companies Act, 2013."),
    ]
    BL = st("_BLdef", fontName="Helvetica", fontSize=9.5, textColor=DARK,
            leftIndent=12, spaceBefore=1, spaceAfter=1, alignment=TA_JUSTIFY, leading=13)
    for term, defn in defs:
        story.append(Paragraph(f"<b>{term}:</b> {defn}", BL))
    story.append(Spacer(1,4*mm))

    # Section 3 – Approval Matrix
    story += [section_header("3.   APPROVAL MATRIX"), Spacer(1,2*mm)]
    story.append(Paragraph("All RPTs must pass through the appropriate approval tier prior to execution.", BODY))
    am_data = [
        ["Transaction Value\n(per annum)", "Nature", "Approving Authority", "Form / Filing"],
        ["Up to \u20b910 Lakhs",   "Arm's length\n& ordinary course", "CFO / Finance Manager\n(post-facto to CS)",        "Internal approval record"],
        ["\u20b910L \u2013 \u20b91 Crore", "Arm's length\n& ordinary course", "Audit Committee\n(prior approval)",        "Board Minutes extract"],
        ["\u20b91Cr \u2013 \u20b95 Crore", "Any RPT",                 "Audit Committee + Board\n(prior approval)",         "Board Resolution + MBP-4"],
        ["Above \u20b95 Crore\nor >10% net worth", "Any RPT",         "AC + Board + Ordinary\nResolution (shareholders)",  "Board Resolution +\nForm MGT-14"],
        ["RPT involving\nDirector/KMP personally", "Any amount",      "Board approval\n(interested Director abstains)",     "Form MBP-4 + Board Minutes"],
    ]
    at = Table(am_data, colWidths=[35*mm, 38*mm, 52*mm, 41*mm])
    at.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),DARK),("TEXTCOLOR",(0,0),(-1,0),WHITE),
        ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),("FONTNAME",(0,1),(-1,-1),"Helvetica"),
        ("FONTSIZE",(0,0),(-1,-1),8),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[WHITE,LIGHT,WHITE,LIGHT,WHITE]),
        ("BOX",(0,0),(-1,-1),0.5,BORDER),("INNERGRID",(0,0),(-1,-1),0.25,BORDER),
        ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),
        ("LEFTPADDING",(0,0),(-1,-1),5),("VALIGN",(0,0),(-1,-1),"TOP"),("ALIGN",(0,0),(-1,-1),"LEFT")]))
    story += [at, Spacer(1,3*mm)]
    story.append(Paragraph(
        "<b>Note:</b> Transactions not in the ordinary course or not at arm's length require prior Audit Committee and Board approval regardless of value.",
        NOTE))
    story.append(Spacer(1,4*mm))

    # Section 4 – Disclosure
    story += [section_header("4.   DISCLOSURE & REPORTING"), Spacer(1,2*mm)]
    disc_data = [
        ["Disclosure",                           "Frequency",    "Owner",        "Destination"],
        ["Register of Related Parties",          "Continuous",   "CS",           "Internal + RoC on request"],
        ["RPT summary in Board Minutes",         "Each meeting", "CS / CFO",     "Board Minutes"],
        ["Annual Report Disclosure (AoC-2)",     "Annual",       "CS / CFO",     "Annual Report"],
        ["Form AOC-2",                           "Annual",       "CS",           "MCA portal + Annual Report"],
        ["Form MGT-14 (Shareholder Resolutions)","As applicable","CS",           "MCA portal (within 30 days)"],
        ["Audit Committee RPT Report",           "Quarterly",    "CFO + CS",     "Board Agenda"],
    ]
    dt = Table(disc_data, colWidths=[52*mm, 26*mm, 28*mm, 60*mm])
    dt.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),DARK),("TEXTCOLOR",(0,0),(-1,0),WHITE),
        ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),("FONTNAME",(0,1),(-1,-1),"Helvetica"),
        ("FONTSIZE",(0,0),(-1,-1),8),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[WHITE,LIGHT,WHITE,LIGHT,WHITE,LIGHT]),
        ("BOX",(0,0),(-1,-1),0.5,BORDER),("INNERGRID",(0,0),(-1,-1),0.25,BORDER),
        ("TOPPADDING",(0,0),(-1,-1),4),("BOTTOMPADDING",(0,0),(-1,-1),4),
        ("LEFTPADDING",(0,0),(-1,-1),5),("ALIGN",(0,0),(-1,-1),"LEFT")]))
    story += [dt, Spacer(1,4*mm)]

    # Section 5 – Omnibus
    story += [section_header("5.   OMNIBUS APPROVAL"), Spacer(1,2*mm)]
    story.append(Paragraph(
        "The Audit Committee may grant <b>Omnibus Approval</b> for repetitive RPTs subject to:", BODY))
    for b in ["Specifying name, nature, duration and maximum permissible amount",
              "Valid for <b>one financial year only</b> — must be renewed annually",
              "Cannot be granted for sale or disposal of undertaking",
              "Actual transactions reviewed by Audit Committee quarterly",
              "Omnibus approval >₹1 Crore requires two-thirds Audit Committee approval"]:
        story.append(bullet(b))
    story.append(Spacer(1,4*mm))

    # Section 6 – Non-compliance
    story += [section_header("6.   CONSEQUENCES OF NON-COMPLIANCE"), Spacer(1,2*mm)]
    nc_data = [
        ["Violation",                                           "Consequence"],
        ["RPT entered without required approval",              "Voidable at Company's option; disciplinary action against responsible officer"],
        ["Failure to disclose interest (Form MBP-1)",         "Penalty: fine \u20b925,000\u2013\u20b91,00,000 per officer in default (Section 184)"],
        ["RPT not at arm's length (Section 188 violation)",   "Fine up to \u20b925 Lakhs; imprisonment up to 1 year for Director"],
        ["Non-filing of Form AOC-2 / MGT-14",                 "Penalty under Section 450; RoC notice; potential strike-off risk"],
        ["Wilful misrepresentation to Audit Committee/Board", "Termination; potential fraud liability under Section 447"],
    ]
    nt = Table(nc_data, colWidths=[78*mm, 88*mm])
    nt.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),RED),("TEXTCOLOR",(0,0),(-1,0),WHITE),
        ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),("FONTNAME",(0,1),(-1,-1),"Helvetica"),
        ("FONTSIZE",(0,0),(-1,-1),8.5),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[WHITE,RLIGHT,WHITE,RLIGHT,WHITE]),
        ("BOX",(0,0),(-1,-1),0.5,BORDER),("INNERGRID",(0,0),(-1,-1),0.25,BORDER),
        ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),
        ("LEFTPADDING",(0,0),(-1,-1),5),("VALIGN",(0,0),(-1,-1),"TOP"),("ALIGN",(0,0),(-1,-1),"LEFT")]))
    story += [nt, Spacer(1,4*mm)]

    # Section 7 – Review
    story += [section_header("7.   POLICY REVIEW & AMENDMENTS"), Spacer(1,2*mm)]
    story.append(Paragraph(
        "This Policy shall be reviewed annually by the Audit Committee and Board of Directors. Any amendment requires a "
        "Board resolution. Material changes will be disclosed in the Annual Report and communicated to all Directors and "
        "KMPs within <b>15 days</b> of adoption.",
        BODY))
    story.append(Spacer(1,6*mm))

    # Approval block
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceBefore=4, spaceAfter=6))
    ap = Table([["Prepared by",                                   "Reviewed by",                 "Approved by"],
                ["Amit Jhingan\nFinance Manager\nFinance & Legal", "Priya Kapoor\nSenior Analyst\nAdvisory",
                 "Arun Manikonda\nManaging Director\nBR-2024-03-01\nDate: 01 March 2024"]],
               colWidths=[55*mm, 55*mm, 56*mm])
    ap.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),LIGHT),("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),
        ("FONTNAME",(0,1),(-1,1),"Helvetica"),("FONTSIZE",(0,0),(-1,-1),8.5),
        ("TEXTCOLOR",(0,0),(-1,0),MID),("BOX",(0,0),(-1,-1),1,GOLD),
        ("INNERGRID",(0,0),(-1,-1),0.5,BORDER),
        ("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),22),
        ("LEFTPADDING",(0,0),(-1,-1),8),("ALIGN",(0,0),(-1,-1),"LEFT")]))
    story += [ap, Spacer(1,4*mm)]
    story.append(Paragraph(
        "\u00a9 2024 India Gully Ventures Private Limited  |  CIN: U74999MH2017PTC291234  |  "
        "601-A, Hubtown Solaris, Andheri East, Mumbai \u2013 400 069  |  "
        "CONFIDENTIAL \u2013 Distribution restricted to Board, AC members and CS.",
        FOOTER))

    doc.build(story)
    print(f"  GOV-008 OK  \u2192  {OUT_008}  ({os.path.getsize(OUT_008):,} bytes)")


# ══════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("\n\U0001f4c4  India Gully Ventures – Policy PDF Generator")
    print("=" * 60)
    print(f"  Output directory: {SCRIPT_DIR}\n")

    print("[1/2] Generating GOV-007: Code of Conduct & Ethics Policy...")
    gen_007()

    print("[2/2] Generating GOV-008: Related Party Transaction Policy...")
    gen_008()

    print("\n\u2705  Both PDFs generated successfully!")
    print("\nNext steps:")
    print("  npx wrangler r2 object put india-gully-docs/board_pack/code-of-conduct-ethics.pdf --file code-of-conduct-ethics.pdf --remote")
    print("  npx wrangler r2 object put india-gully-docs/board_pack/related-party-transaction-policy.pdf --file related-party-transaction-policy.pdf --remote")
    print("  npx wrangler pages deploy dist --project-name india-gully --commit-dirty=true")
