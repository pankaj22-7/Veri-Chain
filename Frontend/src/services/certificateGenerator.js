import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

class CertificateGenerator {
  // Generate PDF certificate
  async generatePDF(certificateData) {
    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Set fonts and colors
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(24);
      pdf.setTextColor(25, 25, 112); // Dark blue

      // Institution name
      pdf.text(certificateData.institutionName, 148, 30, { align: 'center' });

      // Certificate title
      pdf.setFontSize(20);
      pdf.setTextColor(0, 0, 0);
      pdf.text('CERTIFICATE OF COMPLETION', 148, 50, { align: 'center' });

      // Decorative line
      pdf.setDrawColor(25, 25, 112);
      pdf.setLineWidth(1);
      pdf.line(40, 60, 257, 60);

      // Certificate body
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(14);
      pdf.text('This is to certify that', 148, 80, { align: 'center' });

      // Student name
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(22);
      pdf.setTextColor(25, 25, 112);
      pdf.text(certificateData.studentName, 148, 100, { align: 'center' });

      // Achievement text
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('has successfully completed the requirements for', 148, 120, { align: 'center' });

      // Degree name
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.setTextColor(25, 25, 112);
      pdf.text(certificateData.degreeName, 148, 140, { align: 'center' });

      // Department
      if (certificateData.department) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Department of ${certificateData.department}`, 148, 155, { align: 'center' });
      }

      // GPA
      if (certificateData.gpa) {
        pdf.text(`GPA: ${certificateData.gpa}`, 148, 170, { align: 'center' });
      }

      // Honors
      if (certificateData.honors) {
        pdf.setFont('helvetica', 'italic');
        pdf.text(certificateData.honors, 148, 185, { align: 'center' });
      }

      // Date and signature area
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      const issueDate = certificateData.graduationDate || new Date().toLocaleDateString();
      pdf.text(`Date: ${issueDate}`, 60, 200);

      // Signature line
      pdf.line(180, 195, 240, 195);
      pdf.text('Authorized Signature', 210, 202, { align: 'center' });

      // Certificate ID
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Certificate ID: ${certificateData.certificateId}`, 148, 215, { align: 'center' });

      // Blockchain hash
      if (certificateData.blockchainHash) {
        pdf.text(`Blockchain Hash: ${certificateData.blockchainHash}`, 148, 225, { align: 'center' });
      }

      // Add border
      pdf.setDrawColor(25, 25, 112);
      pdf.setLineWidth(2);
      pdf.rect(20, 20, 257, 185, 'S');

      return pdf;
    } catch (error) {
      console.error('PDF Generation Error:', error);
      throw error;
    }
  }

  // Generate certificate image from HTML element
  async generateImage(elementId, options = {}) {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Certificate element not found');
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: options.width || 1000,
        height: options.height || 700,
        ...options
      });

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Image Generation Error:', error);
      throw error;
    }
  }

  // Convert data URL to File object
  dataURLtoFile(dataURL, filename) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
  }

  // Convert PDF to blob
  pdfToBlob(pdf) {
    return new Blob([pdf.output('blob')], { type: 'application/pdf' });
  }

  // Create certificate metadata
  createMetadata(certificateData, ipfsHashes = {}) {
    return {
      name: `Certificate - ${certificateData.studentName}`,
      description: `${certificateData.degreeName} certificate for ${certificateData.studentName}`,
      image: ipfsHashes.imageHash ? `ipfs://${ipfsHashes.imageHash}` : '',
      attributes: [
        {
          trait_type: "Student Name",
          value: certificateData.studentName
        },
        {
          trait_type: "Degree",
          value: certificateData.degreeName
        },
        {
          trait_type: "Institution",
          value: certificateData.institutionName
        },
        {
          trait_type: "Issue Date",
          value: certificateData.graduationDate || new Date().toISOString().split('T')[0]
        },
        {
          trait_type: "Certificate ID",
          value: certificateData.certificateId
        },
        {
          trait_type: "Department",
          value: certificateData.department || ''
        },
        {
          trait_type: "GPA",
          value: certificateData.gpa || ''
        },
        {
          trait_type: "Honors",
          value: certificateData.honors || ''
        }
      ],
      external_url: ipfsHashes.pdfHash ? `https://gateway.pinata.cloud/ipfs/${ipfsHashes.pdfHash}` : '',
      certificate_pdf: ipfsHashes.pdfHash ? `ipfs://${ipfsHashes.pdfHash}` : '',
      blockchain_hash: certificateData.blockchainHash || '',
      created_at: new Date().toISOString(),
      version: "1.0"
    };
  }
}

export default new CertificateGenerator();
