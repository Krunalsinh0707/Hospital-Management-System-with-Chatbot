import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

def generate_pdf_report(report_type: str, report_data: dict, user_data: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F9D8A')
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B')
    )
    
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=10, spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155')
    )

    elements = []

    # 1. HEADER BRANDING
    elements.append(Paragraph("HEALTH ANALYZER", title_style))
    elements.append(Paragraph("AI-POWERED CLINICAL DIAGNOSTIC DECISION SUPPORT SYSTEM", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#0F9D8A'), spaceBefore=8, spaceAfter=12))

    # 2. PATIENT INFORMATION TABLE
    patient_name = user_data.get('full_name', 'Patient')
    patient_email = user_data.get('email', 'N/A')
    blood_group = user_data.get('blood_group', 'O+')
    report_date = report_data.get('created_at', datetime.now().strftime("%Y-%m-%d %H:%M"))
    
    info_data = [
        [Paragraph(f"<b>Patient Name:</b> {patient_name}", body_style), Paragraph(f"<b>Report Date:</b> {str(report_date)[:16]}", body_style)],
        [Paragraph(f"<b>Email:</b> {patient_email}", body_style), Paragraph(f"<b>Blood Group:</b> {blood_group}", body_style)],
        [Paragraph(f"<b>Assessment Type:</b> {report_type.upper()}", body_style), Paragraph(f"<b>Report ID:</b> #HA-{report_data.get('id', '001')}", body_style)]
    ]
    
    info_table = Table(info_data, colWidths=[270, 270])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 15))

    # 3. DIAGNOSTIC FINDINGS & ML INSIGHTS
    elements.append(Paragraph("Diagnostic Summary & Neural ML Insights", section_style))
    
    prediction = report_data.get('prediction') or report_data.get('diabetes_prediction') or 'Analysis Complete'
    prob_val = report_data.get('probability') or 0.85
    prob_pct = f"{round(float(prob_val) * 100, 1)}%" if float(prob_val) <= 1.0 else f"{prob_val}%"
    risk_level = report_data.get('risk_level') or ('High' if 'high' in str(prediction).lower() or 'positive' in str(prediction).lower() else 'Low')

    findings_data = [
        ["Diagnostic Vector", "Inference Finding", "Model Confidence", "Stratified Risk"],
        [report_type.capitalize(), str(prediction), prob_pct, str(risk_level)]
    ]

    findings_table = Table(findings_data, colWidths=[135, 150, 125, 130])
    findings_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F9D8A')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#F1F5F9')),
    ]))
    elements.append(findings_table)
    elements.append(Spacer(1, 15))

    # 4. CLINICAL ADVICE / EXPLANATION
    elements.append(Paragraph("Clinical Advice & Recommendations", section_style))
    advice_text = "Based on your biometric parameters, your clinical vectors demonstrate stable physiological patterns. Maintain a balanced diet, adequate hydration, and regular exercise."
    if "high" in str(risk_level).lower() or "positive" in str(prediction).lower():
        advice_text = "High-risk physiological markers detected. We strongly advise scheduling a clinical consultation with your primary physician or a specialist for comprehensive evaluation."
        
    elements.append(Paragraph(advice_text, body_style))
    elements.append(Spacer(1, 20))

    # 5. FOOTER DISCLAIMER
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceBefore=20, spaceAfter=8))
    disclaimer = Paragraph(
        "<i>Disclaimer: This document is generated by the Health Analyzer AI decision support engine. It is intended for informational reference only and does not constitute a clinical diagnosis.</i>",
        ParagraphStyle('Disclaimer', parent=body_style, fontSize=8, leading=11, textColor=colors.HexColor('#94A3B8'))
    )
    elements.append(disclaimer)

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
