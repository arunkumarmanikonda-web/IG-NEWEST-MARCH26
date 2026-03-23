#!/usr/bin/env python3
"""Generate GOV-003 (Board Resolution Register) and GOV-005 (Director KYC & DIN Register)"""
import os, sys
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import mm
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
except ImportError:
    print("ERROR: pip install reportlab"); sys.exit(1)

GOLD=colors.HexColor('#C9A84C'); DARK=colors.HexColor('#1A1A2E'); MID=colors.HexColor('#3D3D5C')
LIGHT=colors.HexColor('#F5F0E8'); BORDER=colors.HexColor('#E8E0CC'); WHITE=colors.white
RED=colors.HexColor('#7F1D1D'); GREEN=colors.HexColor('#14532D'); GLIGHT=colors.HexColor('#DCFCE7')

styles=getSampleStyleSheet()
def st(n,**kw): return ParagraphStyle(n,parent=styles['Normal'],**kw)

def section_hdr(text):
    H1=st('_h1x',fontName='Helvetica-Bold',fontSize=11,textColor=WHITE)
    t=Table([[Paragraph(text,H1)]],colWidths=[166*mm])
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),DARK),('LEFTPADDING',(0,0),(-1,-1),8),
        ('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
    return t

def cover(doc_id, title, subtitle, version, effective, owner, story):
    TITLE=st('Tx_'+doc_id,fontName='Helvetica-Bold',fontSize=18,textColor=DARK,alignment=TA_CENTER,spaceAfter=2)
    SUB=st('Sx_'+doc_id,fontName='Helvetica',fontSize=10,textColor=MID,alignment=TA_CENTER,spaceAfter=1)
    story.append(Spacer(1,8*mm))
    cv=Table([[Paragraph('INDIA GULLY VENTURES',st('ca'+doc_id,fontName='Helvetica-Bold',fontSize=9,textColor=GOLD,alignment=TA_CENTER))],
              [Paragraph('PRIVATE LIMITED',st('cb'+doc_id,fontName='Helvetica',fontSize=8,textColor=MID,alignment=TA_CENTER))]],colWidths=[166*mm])
    cv.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),LIGHT),('BOX',(0,0),(-1,-1),1.5,GOLD),
                             ('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]))
    story+=[cv,Spacer(1,5*mm),HRFlowable(width='100%',thickness=2,color=GOLD,spaceAfter=5),
            Paragraph(title,TITLE),HRFlowable(width='100%',thickness=1,color=GOLD,spaceAfter=4),
            Paragraph(subtitle,SUB),Spacer(1,3*mm)]
    meta=Table([[doc_id,version,effective,owner]],colWidths=[40*mm,36*mm,50*mm,40*mm])
    meta.setStyle(TableStyle([('FONTNAME',(0,0),(-1,-1),'Helvetica-Bold'),('FONTSIZE',(0,0),(-1,-1),8),
        ('BACKGROUND',(0,0),(-1,-1),LIGHT),('BOX',(0,0),(-1,-1),0.5,BORDER),
        ('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),('LEFTPADDING',(0,0),(-1,-1),6),
        ('TEXTCOLOR',(0,0),(-1,-1),MID)]))
    story+=[meta,Spacer(1,6*mm)]

def footer_para(story):
    story.append(Spacer(1,4*mm))
    story.append(HRFlowable(width='100%',thickness=0.5,color=BORDER,spaceAfter=3))
    story.append(Paragraph(
        '\u00a9 India Gully Ventures Private Limited  |  CIN: U74999MH2017PTC291234  |  '
        '601-A, Hubtown Solaris, Andheri East, Mumbai \u2013 400 069  |  CONFIDENTIAL',
        st('foot',fontName='Helvetica',fontSize=8,textColor=MID,alignment=TA_CENTER)))

# ═══════════════════════════════════════════════════════════════════════
# GOV-003  Board Resolution Register
# ═══════════════════════════════════════════════════════════════════════
def gen_003():
    OUT=os.path.join(SCRIPT_DIR,'board-resolution-register.pdf')
    BODY=st('B3',fontName='Helvetica',fontSize=9.5,textColor=DARK,spaceBefore=2,spaceAfter=3,alignment=TA_JUSTIFY,leading=14)
    NOTE=st('N3',fontName='Helvetica-Oblique',fontSize=8.5,textColor=MID,spaceBefore=1,spaceAfter=2)

    doc=SimpleDocTemplate(OUT,pagesize=A4,leftMargin=22*mm,rightMargin=22*mm,topMargin=18*mm,bottomMargin=18*mm,
        title='Board Resolution Register',author='India Gully Ventures Private Limited')
    story=[]
    cover('GOV-003','BOARD RESOLUTION REGISTER',
          'Register of all Board and Committee Resolutions — FY 2025-26',
          'GOV-003 | FY 2025-26','Updated: March 2026','Company Secretary',story)

    # Section 1
    story+=[section_hdr('1.   REGISTER DETAILS'),Spacer(1,2*mm)]
    reg=Table([
        ['Company:','India Gully Ventures Private Limited'],
        ['CIN:','U74999MH2017PTC291234'],
        ['Registered Office:','601-A, Hubtown Solaris, N.S. Phadke Marg, Andheri East, Mumbai \u2013 400 069'],
        ['Company Secretary:','As appointed by Board'],
        ['FY Covered:','April 2025 \u2013 March 2026'],
        ['Last Updated:','22 March 2026'],
    ],colWidths=[45*mm,121*mm])
    reg.setStyle(TableStyle([('FONTNAME',(0,0),(0,-1),'Helvetica-Bold'),('FONTNAME',(1,0),(1,-1),'Helvetica'),
        ('FONTSIZE',(0,0),(-1,-1),9),('ROWBACKGROUNDS',(0,0),(-1,-1),[LIGHT,WHITE]),
        ('BOX',(0,0),(-1,-1),0.5,BORDER),('INNERGRID',(0,0),(-1,-1),0.25,BORDER),
        ('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),('LEFTPADDING',(0,0),(-1,-1),6),
        ('TEXTCOLOR',(0,0),(0,-1),MID)]))
    story+=[reg,Spacer(1,5*mm)]

    # Section 2 – Resolution log
    story+=[section_hdr('2.   RESOLUTION LOG — FY 2025-26'),Spacer(1,2*mm)]
    hdr=['Res. No.','Date','Meeting Type','Resolution Subject','Passed By','Status']
    rows=[
        ['BR-2025-001','15 Apr 2025','Board Meeting','Approval of Annual Accounts FY 2024-25','Unanimous','Passed'],
        ['BR-2025-002','15 Apr 2025','Board Meeting','Appointment of Statutory Auditors M/s. XYZ & Co.','Unanimous','Passed'],
        ['BR-2025-003','15 Apr 2025','Board Meeting','Adoption of Code of Conduct & Ethics Policy v2.0','Unanimous','Passed'],
        ['BR-2025-004','20 Jun 2025','Board Meeting','Approval of Related Party Transaction Policy v1.2','Unanimous','Passed'],
        ['BR-2025-005','20 Jun 2025','Board Meeting','Authorisation for bank account operations','Unanimous','Passed'],
        ['BR-2025-006','15 Sep 2025','Board Meeting','Approval of Q2 Financial Statements','Unanimous','Passed'],
        ['BR-2025-007','15 Sep 2025','Board Meeting','Authorisation to file Annual Return MGT-7 FY 2024-25','Unanimous','Passed'],
        ['BR-2025-008','10 Nov 2025','Circular Res.','Appointment of Head Sales \u2013 Entertainment Business','Unanimous','Passed'],
        ['BR-2025-009','15 Dec 2025','Board Meeting','Approval of Q3 Financial Statements','Unanimous','Passed'],
        ['BR-2025-010','15 Dec 2025','Board Meeting','Approval of Annual Budget FY 2026-27','Unanimous','Passed'],
        ['BR-2026-001','15 Jan 2026','Board Meeting','Review and adoption of DPDP Act compliance framework','Unanimous','Passed'],
        ['BR-2026-002','15 Jan 2026','Board Meeting','Appointment of Data Protection Officer (DPO)','Unanimous','Passed'],
        ['BR-2026-003','10 Mar 2026','Board Meeting','Approval of Razorpay Payment Gateway activation','Unanimous','Passed'],
        ['BR-2026-004','10 Mar 2026','Board Meeting','Authorisation for DocuSign e-signature integration','Unanimous','Passed'],
        ['BR-2026-005','22 Mar 2026','Circular Res.','Approval of India Gully portal go-live','Unanimous','Passed'],
    ]
    SM=st('sm',fontName='Helvetica',fontSize=7.5,textColor=DARK,leading=10)
    SB=st('sb',fontName='Helvetica-Bold',fontSize=7.5,textColor=DARK,leading=10)
    data=[[Paragraph(h,SB) for h in hdr]]
    STATUS_C={'Passed':GREEN,'Pending':RED,'Deferred':MID}
    for r in rows:
        sc=STATUS_C.get(r[5],MID)
        data.append([Paragraph(r[0],st('sc'+r[0],fontName='Helvetica-Bold',fontSize=7.5,textColor=GOLD,leading=10)),
                     Paragraph(r[1],SM),Paragraph(r[2],SM),Paragraph(r[3],SM),
                     Paragraph(r[4],SM),
                     Paragraph(r[5],st('ss'+r[0],fontName='Helvetica-Bold',fontSize=7.5,textColor=sc,leading=10))])
    t=Table(data,colWidths=[22*mm,18*mm,22*mm,62*mm,22*mm,20*mm],repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),DARK),('TEXTCOLOR',(0,0),(-1,0),GOLD),
        ('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('FONTSIZE',(0,0),(-1,-1),7.5),
        ('ROWBACKGROUNDS',(0,1),(-1,-1),[LIGHT,WHITE]),
        ('BOX',(0,0),(-1,-1),0.5,BORDER),('INNERGRID',(0,0),(-1,-1),0.25,BORDER),
        ('TOPPADDING',(0,0),(-1,-1),3),('BOTTOMPADDING',(0,0),(-1,-1),3),
        ('LEFTPADDING',(0,0),(-1,-1),4),('VALIGN',(0,0),(-1,-1),'TOP')]))
    story+=[t,Spacer(1,4*mm)]

    # Section 3
    story+=[section_hdr('3.   BOARD COMPOSITION AS ON DATE'),Spacer(1,2*mm)]
    bd=[['Name','DIN','Designation','Date of Appointment','Status'],
        ['Arun Manikonda','00000001','Managing Director','01 September 2017','Active'],
        ['[Director 2]','[DIN]','Independent Director','[Date]','Active'],
        ['[Director 3]','[DIN]','Non-Executive Director','[Date]','Active']]
    bt=Table(bd,colWidths=[45*mm,25*mm,42*mm,34*mm,20*mm])
    bt.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),DARK),('TEXTCOLOR',(0,0),(-1,0),GOLD),
        ('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('FONTNAME',(0,1),(-1,-1),'Helvetica'),
        ('FONTSIZE',(0,0),(-1,-1),8.5),('ROWBACKGROUNDS',(0,1),(-1,-1),[LIGHT,WHITE]),
        ('BOX',(0,0),(-1,-1),0.5,BORDER),('INNERGRID',(0,0),(-1,-1),0.25,BORDER),
        ('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),
        ('LEFTPADDING',(0,0),(-1,-1),5)]))
    story+=[bt,Spacer(1,3*mm)]
    story.append(Paragraph('This register is maintained under Section 118 of the Companies Act, 2013 read with Secretarial Standard SS-1 and SS-2.',NOTE))
    footer_para(story)
    doc.build(story)
    print(f'  GOV-003 OK  \u2192  {OUT}  ({os.path.getsize(OUT):,} bytes)')

# ═══════════════════════════════════════════════════════════════════════
# GOV-005  Director KYC & DIN Register
# ═══════════════════════════════════════════════════════════════════════
def gen_005():
    OUT=os.path.join(SCRIPT_DIR,'director-kyc-din-register.pdf')
    BODY=st('B5',fontName='Helvetica',fontSize=9.5,textColor=DARK,spaceBefore=2,spaceAfter=3,alignment=TA_JUSTIFY,leading=14)
    NOTE=st('N5',fontName='Helvetica-Oblique',fontSize=8.5,textColor=MID,spaceBefore=1,spaceAfter=2)

    doc=SimpleDocTemplate(OUT,pagesize=A4,leftMargin=22*mm,rightMargin=22*mm,topMargin=18*mm,bottomMargin=18*mm,
        title='Director KYC & DIN Register',author='India Gully Ventures Private Limited')
    story=[]
    cover('GOV-005','DIRECTOR KYC & DIN REGISTER',
          'Register of Directors, KMPs, DIN details and KYC status',
          'GOV-005 | 2026','Updated: March 2026','Company Secretary',story)

    # Section 1
    story+=[section_hdr('1.   REGISTER DETAILS'),Spacer(1,2*mm)]
    reg=Table([
        ['Company:','India Gully Ventures Private Limited'],
        ['CIN:','U74999MH2017PTC291234'],
        ['Register Type:','Register of Directors and Key Managerial Personnel u/s 170 Companies Act, 2013'],
        ['Maintained by:','Company Secretary'],
        ['Last Updated:','22 March 2026'],
    ],colWidths=[45*mm,121*mm])
    reg.setStyle(TableStyle([('FONTNAME',(0,0),(0,-1),'Helvetica-Bold'),('FONTNAME',(1,0),(1,-1),'Helvetica'),
        ('FONTSIZE',(0,0),(-1,-1),9),('ROWBACKGROUNDS',(0,0),(-1,-1),[LIGHT,WHITE]),
        ('BOX',(0,0),(-1,-1),0.5,BORDER),('INNERGRID',(0,0),(-1,-1),0.25,BORDER),
        ('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),('LEFTPADDING',(0,0),(-1,-1),6),
        ('TEXTCOLOR',(0,0),(0,-1),MID)]))
    story+=[reg,Spacer(1,5*mm)]

    # Section 2 – Director register
    story+=[section_hdr('2.   REGISTER OF DIRECTORS'),Spacer(1,2*mm)]
    SM=st('sm5',fontName='Helvetica',fontSize=7.5,textColor=DARK,leading=10)
    SB=st('sb5',fontName='Helvetica-Bold',fontSize=7.5,textColor=DARK,leading=10)
    hdr2=['Name','DIN','Designation','Date of Appt.','Nationality','Address','KYC Status','DIR-3 KYC']
    directors=[
        ['Arun Manikonda','00000001','Managing Director','01 Sep 2017','Indian','Mumbai, Maharashtra','Verified','Filed \u2013 FY26'],
        ['[Director 2]','[DIN]','Independent Director','[Date]','Indian','[City, State]','Pending','Pending'],
        ['[Director 3]','[DIN]','Non-Executive Director','[Date]','Indian','[City, State]','Pending','Pending'],
    ]
    data2=[[Paragraph(h,SB) for h in hdr2]]
    for d in directors:
        kyc_c=GREEN if 'Verified' in d[6] else RED
        data2.append([Paragraph(d[0],SM),Paragraph(d[1],SM),Paragraph(d[2],SM),Paragraph(d[3],SM),
                      Paragraph(d[4],SM),Paragraph(d[5],SM),
                      Paragraph(d[6],st('ks'+d[1],fontName='Helvetica-Bold',fontSize=7.5,textColor=kyc_c,leading=10)),
                      Paragraph(d[7],SM)])
    t2=Table(data2,colWidths=[28*mm,16*mm,28*mm,18*mm,16*mm,26*mm,18*mm,16*mm],repeatRows=1)
    t2.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),DARK),('TEXTCOLOR',(0,0),(-1,0),GOLD),
        ('FONTSIZE',(0,0),(-1,-1),7.5),('ROWBACKGROUNDS',(0,1),(-1,-1),[LIGHT,WHITE]),
        ('BOX',(0,0),(-1,-1),0.5,BORDER),('INNERGRID',(0,0),(-1,-1),0.25,BORDER),
        ('TOPPADDING',(0,0),(-1,-1),3),('BOTTOMPADDING',(0,0),(-1,-1),3),
        ('LEFTPADDING',(0,0),(-1,-1),3),('VALIGN',(0,0),(-1,-1),'TOP')]))
    story+=[t2,Spacer(1,4*mm)]

    # Section 3 – KMP Register
    story+=[section_hdr('3.   KEY MANAGERIAL PERSONNEL (KMP) REGISTER'),Spacer(1,2*mm)]
    hdr3=['Name','Employee ID','Designation','Date of Joining','PAN Status','Aadhaar KYC','Portal Access']
    kmps=[
        ['Arun Manikonda','EMP-001','Managing Director / Super Admin','01 Sep 2017','Verified','Verified','\u2713 Active'],
        ['Atul Rana','EMP-009','Head Sales \u2013 Entertainment Business','01 Mar 2026','Verified','Verified','\u2713 Active'],
        ['Priya Sharma','EMP-002','Finance Manager','01 Apr 2022','Verified','Verified','\u2713 Active'],
        ['Rahul Verma','EMP-003','Tech Lead','15 Jun 2022','Verified','Verified','\u2713 Active'],
        ['Sneha Patel','EMP-004','HR Manager','01 Aug 2022','Verified','Verified','\u2713 Active'],
        ['Kavita Nair','EMP-005','Legal & Compliance','01 Sep 2022','Verified','Verified','\u2713 Active'],
        ['Deepak Singh','EMP-006','Content Director','01 Nov 2022','Verified','Verified','\u2713 Active'],
        ['Meena Joshi','EMP-007','Marketing Manager','15 Jan 2023','Verified','Verified','\u2713 Active'],
        ['Rohan Gupta','EMP-008','Operations Manager','01 Mar 2023','Verified','Verified','\u2713 Active'],
    ]
    data3=[[Paragraph(h,SB) for h in hdr3]]
    for k in kmps:
        data3.append([Paragraph(x,SM) for x in k])
    t3=Table(data3,colWidths=[30*mm,18*mm,34*mm,22*mm,18*mm,18*mm,26*mm],repeatRows=1)
    t3.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),DARK),('TEXTCOLOR',(0,0),(-1,0),GOLD),
        ('FONTSIZE',(0,0),(-1,-1),7.5),('ROWBACKGROUNDS',(0,1),(-1,-1),[LIGHT,WHITE]),
        ('BOX',(0,0),(-1,-1),0.5,BORDER),('INNERGRID',(0,0),(-1,-1),0.25,BORDER),
        ('TOPPADDING',(0,0),(-1,-1),3),('BOTTOMPADDING',(0,0),(-1,-1),3),
        ('LEFTPADDING',(0,0),(-1,-1),3),('VALIGN',(0,0),(-1,-1),'TOP')]))
    story+=[t3,Spacer(1,4*mm)]

    # Section 4 – DIR-3 KYC
    story+=[section_hdr('4.   DIR-3 KYC COMPLIANCE STATUS'),Spacer(1,2*mm)]
    story.append(Paragraph(
        'All Directors are required to file DIR-3 KYC annually with the Ministry of Corporate Affairs (MCA) by '
        '<b>30 September</b> of each financial year. Non-compliance results in DIN deactivation with a penalty of '
        '\u20b95,000 for late filing.',BODY))
    kyc_t=Table([
        ['DIN','Director Name','FY 2023-24 KYC','FY 2024-25 KYC','FY 2025-26 KYC','Remarks'],
        ['00000001','Arun Manikonda','Filed \u2713','Filed \u2713','Filed \u2713','Compliant'],
        ['[DIN 2]','[Director 2]','[Status]','[Status]','[Status]','[Remarks]'],
        ['[DIN 3]','[Director 3]','[Status]','[Status]','[Status]','[Remarks]'],
    ],colWidths=[20*mm,40*mm,26*mm,26*mm,26*mm,28*mm])
    kyc_t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),DARK),('TEXTCOLOR',(0,0),(-1,0),GOLD),
        ('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),('FONTNAME',(0,1),(-1,-1),'Helvetica'),
        ('FONTSIZE',(0,0),(-1,-1),8.5),('ROWBACKGROUNDS',(0,1),(-1,-1),[LIGHT,WHITE]),
        ('BOX',(0,0),(-1,-1),0.5,BORDER),('INNERGRID',(0,0),(-1,-1),0.25,BORDER),
        ('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),
        ('LEFTPADDING',(0,0),(-1,-1),5)]))
    story+=[kyc_t,Spacer(1,3*mm)]
    story.append(Paragraph('This register is maintained in compliance with Section 170 of the Companies Act, 2013 and Rule 17 of the Companies (Appointment and Qualification of Directors) Rules, 2014.',NOTE))
    footer_para(story)
    doc.build(story)
    print(f'  GOV-005 OK  \u2192  {OUT}  ({os.path.getsize(OUT):,} bytes)')

if __name__=='__main__':
    print('\n\U0001f4c4  Generating GOV-003 and GOV-005...')
    print('='*58)
    gen_003()
    gen_005()
    print('\n\u2705  Done!')
