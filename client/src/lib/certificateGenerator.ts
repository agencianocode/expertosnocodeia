import jsPDF from 'jspdf';

interface CertificateData {
  studentName: string;
  courseName: string;
  issueDate: string;
  expiryDate: string;
  certificateId: string;
  score: number;
}

export function generateCertificate(data: CertificateData): void {
  // Create new PDF document (A4 landscape)
  const pdf = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Colors
  const primaryColor = '#000000';
  const goldColor = '#B8860B';
  const grayColor = '#555555';

  // Elegant border design
  pdf.setDrawColor('#000000');
  pdf.setLineWidth(3);
  pdf.rect(15, 15, pageWidth - 30, pageHeight - 30);
  
  // Inner decorative border
  pdf.setDrawColor('#B8860B');
  pdf.setLineWidth(1);
  pdf.rect(20, 20, pageWidth - 40, pageHeight - 40);

  // Top decorative line
  pdf.setDrawColor('#000000');
  pdf.setLineWidth(1);
  pdf.line(50, 40, pageWidth - 50, 40);

  // Main title - Certificate of achievement
  pdf.setFontSize(28);
  pdf.setTextColor(primaryColor);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Certificado de logro', pageWidth / 2, 55, { align: 'center' });

  // Course name in caps with elegant font
  pdf.setFontSize(20);
  pdf.setTextColor(goldColor);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.courseName.toUpperCase(), pageWidth / 2, 70, { align: 'center' });


  // Main description - moved up for better balance
  pdf.setFontSize(12);
  pdf.setTextColor(grayColor);
  pdf.setFont('helvetica', 'normal');
  const descriptionLines = [
    'Por la presente se certifica que este estudiante cursó estudios y completó todos los',
    'requisitos para este curso'
  ];
  
  let yPosition = 82;
  descriptionLines.forEach((line) => {
    pdf.text(line, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 7;
  });

  // Decorative line above student name - golden ratio positioning
  pdf.setDrawColor(goldColor);
  pdf.setLineWidth(2);
  pdf.line(pageWidth / 2 - 80, 105, pageWidth / 2 + 80, 105);

  // Award text - moved up with perfect spacing
  pdf.setFontSize(14);
  pdf.setTextColor(primaryColor);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Este certificado se otorga a', pageWidth / 2, 115, { align: 'center' });

  // Student name in a gray box - moved up for signature section
  const boxX = pageWidth / 2 - 100;
  const boxY = 120;
  const boxWidth = 200;
  const boxHeight = 35;
  
  // Draw gray box
  pdf.setFillColor('#f0f0f0');
  pdf.setDrawColor('#cccccc');
  pdf.setLineWidth(2);
  pdf.rect(boxX, boxY, boxWidth, boxHeight, 'FD');
  
  // Student name inside the box
  pdf.setFontSize(22);
  pdf.setTextColor('#333333');
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.studentName, pageWidth / 2, boxY + 23, { align: 'center' });

  // Logo and Signature section (clean text only)
  const logoSectionY = 165;
  
  // Left side: University text in one perfect line
  pdf.setFontSize(10);
  pdf.setTextColor('#333333');
  pdf.setFont('helvetica', 'bold');
  pdf.text('Universidad Expertos NoCode IA', pageWidth / 2 - 80, logoSectionY);
  
  // Right side: Clean signature section
  pdf.setDrawColor('#cccccc');
  pdf.setLineWidth(0.5);
  pdf.line(pageWidth / 2 + 20, logoSectionY - 5, pageWidth / 2 + 90, logoSectionY - 5);
  
  // CEO name and title
  pdf.setFontSize(9);
  pdf.setTextColor('#333333');
  pdf.setFont('helvetica', 'bold');
  pdf.text('Fabian Segura', pageWidth / 2 + 55, logoSectionY + 2, { align: 'center' });
  
  pdf.setFontSize(8);
  pdf.setTextColor('#666666');
  pdf.setFont('helvetica', 'normal');
  pdf.text('CEO, Expertos NoCode IA', pageWidth / 2 + 55, logoSectionY + 8, { align: 'center' });

  // Footer section - visible with proper margin
  const footerY = pageHeight - 30;
  pdf.setFontSize(10);
  pdf.setTextColor(primaryColor);
  pdf.setFont('helvetica', 'normal');
  
  // Issue date - left aligned with margin
  pdf.text('Emitido: ' + data.issueDate, 30, footerY);
  
  // Expiry date - perfectly centered
  pdf.text('Expira: ' + data.expiryDate, pageWidth / 2, footerY, { align: 'center' });
  
  // Certificate ID - right aligned with margin
  pdf.text('ID Certificado: ' + data.certificateId, pageWidth - 30, footerY, { align: 'right' });

  // Page number in bottom right
  pdf.setFontSize(8);
  pdf.setTextColor(grayColor);
  pdf.text('1', pageWidth - 25, pageHeight - 10);

  // Save the PDF
  const fileName = `certificate-${data.courseName.toLowerCase().replace(/\s+/g, '-')}-${data.certificateId}.pdf`;
  pdf.save(fileName);
}

// Generate unique certificate ID
export function generateCertificateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Format date for certificate
export function formatCertificateDate(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}