/* ============================================
   AhiaPay — App Logic
   Wizard navigation, calculations, preview, PDF, email
   ============================================ */

import { numberToWords, numberToWordsWithCurrency } from './lib/number-to-words.js';

// =============================================
// EmailJS Configuration
// TODO: Replace with your EmailJS credentials
// Sign up at https://www.emailjs.com (free: 200 emails/month)
// =============================================
const EMAILJS_PUBLIC_KEY = 'wcv43AnQkhyGOnRHY';
const EMAILJS_SERVICE_ID = 'service_3m7cojc';
const EMAILJS_TEMPLATE_ID = 'template_hk0624k';
const OWNER_EMAIL = 'hipoautomobile@gmail.com';

// =============================================
// State
// =============================================
let currentStep = 1;
const totalSteps = 7;
let stampImageData = null;
let lineItems = [createEmptyLineItem()];

function createEmptyLineItem() {
  return {
    id: Date.now() + Math.random(),
    hsCode: '',
    description: '',
    brand: '',
    quantity: '',
    unit: 'PCS',
    unitPrice: '',
  };
}

// =============================================
// DOM References
// =============================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const steps = $$('.step');
const progressFill = $('.progress-fill');
const stepCurrent = $('#stepCurrent');
const backBtn = $('#backBtn');
const nextBtn = $('#nextBtn');
const wizardFooter = $('.wizard-footer');
const loadingOverlay = $('#loadingOverlay');
const loadingMessage = $('#loadingMessage');
const toast = $('#toast');

// =============================================
// Wizard Navigation
// =============================================
function goToStep(step) {
  if (step < 1 || step > totalSteps) return;

  // Hide all steps
  steps.forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });

  // Show target step
  const nextEl = $(`.step[data-step="${step}"]`);
  nextEl.style.display = 'block';
  // Small delay so the browser registers the display change before animating
  requestAnimationFrame(() => {
    nextEl.classList.add('active');
  });

  currentStep = step;

  // Update UI
  progressFill.style.width = `${(currentStep / totalSteps) * 100}%`;
  stepCurrent.textContent = currentStep;
  backBtn.disabled = currentStep === 1;
  nextBtn.style.display = currentStep === totalSteps ? 'none' : 'flex';
  wizardFooter.classList.toggle('hidden', currentStep === totalSteps);

  // Render preview on last step
  if (currentStep === totalSteps) {
    renderPreview();
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize: hide all steps except step 1
steps.forEach(s => {
  if (s.dataset.step !== '1') {
    s.style.display = 'none';
  }
});

backBtn.addEventListener('click', () => goToStep(currentStep - 1));
nextBtn.addEventListener('click', () => goToStep(currentStep + 1));

// =============================================
// Image Upload Handlers
// =============================================
function setupImageUpload(areaId, fileInputId, previewImgId, removeId, onLoad) {
  const area = $(`#${areaId}`);
  const fileInput = $(`#${fileInputId}`);
  const previewImg = $(`#${previewImgId}`);
  const removeBtn = $(`#${removeId}`);

  area.addEventListener('click', (e) => {
    if (e.target !== removeBtn && !removeBtn.contains(e.target)) {
      fileInput.click();
    }
  });

  // Drag and drop
  area.addEventListener('dragover', (e) => {
    e.preventDefault();
    area.classList.add('dragover');
  });

  area.addEventListener('dragleave', () => {
    area.classList.remove('dragover');
  });

  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
      handleFile(fileInput.files[0]);
    }
  });

  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    previewImg.src = '';
    area.classList.remove('has-image');
    fileInput.value = '';
    onLoad(null);
  });

  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      area.classList.add('has-image');
      onLoad(e.target.result);
    };
    reader.readAsDataURL(file);
  }
}



setupImageUpload('stampUpload', 'stampFile', 'stampPreviewImg', 'stampRemove', (data) => {
  stampImageData = data;
});

// =============================================
// Line Items Management
// =============================================
const lineItemsContainer = $('#lineItemsContainer');
const addItemBtn = $('#addItemBtn');

function renderLineItems() {
  lineItemsContainer.innerHTML = lineItems.map((item, index) => `
    <div class="line-item-card" data-id="${item.id}">
      <div class="line-item-header">
        <span class="line-item-number">Item ${index + 1}</span>
        ${lineItems.length > 1 ? `<button class="btn-remove-item" data-id="${item.id}" title="Remove"><i class="fas fa-trash-alt"></i></button>` : ''}
      </div>

      <div class="form-group">
        <label>HS Code (Optional)</label>
        <input type="text" class="li-hscode" value="${item.hsCode}" placeholder="e.g. 8481200000" data-id="${item.id}">
      </div>

      <div class="form-group">
        <label>Description of Goods <span class="required">*</span></label>
        <input type="text" class="li-description" value="${item.description}" placeholder="e.g. ENGINE VALVE" data-id="${item.id}">
      </div>

      <div class="form-group">
        <label>Brand Name</label>
        <input type="text" class="li-brand" value="${item.brand}" placeholder="e.g. HIPO BRAND" data-id="${item.id}">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Quantity <span class="required">*</span></label>
          <input type="number" class="li-quantity" value="${item.quantity}" placeholder="e.g. 300000" min="0" data-id="${item.id}">
        </div>
        <div class="form-group">
          <label>Unit</label>
          <input type="text" class="li-unit" value="${item.unit}" placeholder="e.g. PCS" data-id="${item.id}">
        </div>
      </div>

      <div class="form-group">
        <label>Unit Price (USD) <span class="required">*</span></label>
        <input type="number" class="li-unitprice" value="${item.unitPrice}" placeholder="e.g. 0.17" step="0.01" min="0" data-id="${item.id}">
      </div>

      <div class="line-item-amount">
        Amount: <span class="li-amount-display">${formatCurrency(calcItemAmount(item))}</span> USD
      </div>
    </div>
  `).join('');

  // Attach events
  lineItemsContainer.querySelectorAll('.btn-remove-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseFloat(btn.dataset.id);
      lineItems = lineItems.filter(item => item.id !== id);
      renderLineItems();
      updateTotals();
    });
  });

  // Input change handlers
  lineItemsContainer.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
      const id = parseFloat(input.dataset.id);
      const item = lineItems.find(i => i.id === id);
      if (!item) return;

      if (input.classList.contains('li-hscode')) item.hsCode = input.value;
      if (input.classList.contains('li-description')) item.description = input.value;
      if (input.classList.contains('li-brand')) item.brand = input.value;
      if (input.classList.contains('li-quantity')) item.quantity = input.value;
      if (input.classList.contains('li-unit')) item.unit = input.value;
      if (input.classList.contains('li-unitprice')) item.unitPrice = input.value;

      // Update this item's amount display
      const card = input.closest('.line-item-card');
      const amountDisplay = card.querySelector('.li-amount-display');
      amountDisplay.textContent = formatCurrency(calcItemAmount(item));

      updateTotals();
    });
  });
}

addItemBtn.addEventListener('click', () => {
  lineItems.push(createEmptyLineItem());
  renderLineItems();
});

function calcItemAmount(item) {
  const qty = parseFloat(item.quantity) || 0;
  const price = parseFloat(item.unitPrice) || 0;
  return qty * price;
}

function calcFOB() {
  return lineItems.reduce((sum, item) => sum + calcItemAmount(item), 0);
}

function updateTotals() {
  const fob = calcFOB();
  const freight = parseFloat($('#seaFreight')?.value) || 0;
  const cf = fob + freight;

  const fobDisplay = $('#fobDisplay');
  const cfDisplay = $('#cfDisplay');

  if (fobDisplay) fobDisplay.textContent = `$${formatCurrency(fob)}`;
  if (cfDisplay) cfDisplay.textContent = `$${formatCurrency(cf)}`;
}

function formatCurrency(num) {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Listen for freight changes
document.addEventListener('input', (e) => {
  if (e.target.id === 'seaFreight') {
    updateTotals();
  }
});

// Initial render
renderLineItems();

// Set today's date as default
const today = new Date().toISOString().split('T')[0];
$('#invoiceDate').value = today;

// =============================================
// Invoice Preview Renderer
// =============================================
function renderPreview() {
  const preview = $('#invoicePreview');

  const invoiceNo = $('#invoiceNo').value || '—';
  const invoiceDate = $('#invoiceDate').value
    ? new Date($('#invoiceDate').value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()
    : '—';
  const buyerName = $('#buyerName').value || '—';
  const buyerAddress = ($('#buyerAddress').value || '—').replace(/\n/g, '<br>');
  const buyerPhone = $('#buyerPhone').value || '';
  const buyerEmail = $('#buyerEmail').value || '';

  const fob = calcFOB();
  const freight = parseFloat($('#seaFreight')?.value) || 0;
  const cf = fob + freight;
  const fobLocation = $('#fobLocation').value || 'CHINA';
  const freightOrigin = $('#freightOrigin').value || 'CHINA';
  const destPort = $('#destPort').value || '—';

  const countryOrigin = $('#countryOrigin').value || '—';
  const countrySupply = $('#countrySupply').value || '—';
  const certNo = $('#certNo').value || '—';
  const partialShipment = $('#partialShipment').value || 'ALLOWED';

  const beneficiaryName = $('#beneficiaryName').value || '—';
  const beneficiaryBank = $('#beneficiaryBank').value || '—';
  const bankAccountNo = $('#bankAccountNo').value || '—';
  const bankAddress = $('#bankAddress').value || '—';
  const bankSwift = $('#bankSwift').value || '—';
  const intermediaryBank = $('#intermediaryBank').value || '';
  const intermediarySwift = $('#intermediarySwift').value || '';

  const totalInWords = numberToWordsWithCurrency(cf);

  // Build items table rows
  const itemRows = lineItems.map((item, i) => {
    const amount = calcItemAmount(item);
    const qty = parseFloat(item.quantity) || 0;
    return `
      <tr>
        <td class="text-center">${i + 1}</td>
        <td>${item.hsCode || '—'}</td>
        <td>${item.description || '—'}</td>
        <td>${item.brand || '—'}</td>
        <td class="text-right">${qty > 0 ? qty.toLocaleString() + ' ' + (item.unit || 'PCS') : '—'}</td>
        <td class="text-right">${item.unitPrice ? parseFloat(item.unitPrice).toFixed(2) + ' USD' : '—'}</td>
        <td class="text-right">${amount > 0 ? formatCurrency(amount) + ' USD' : '—'}</td>
      </tr>
    `;
  }).join('');

  const companyName = $('#companyName').value || 'Company Name';
  const companyAddress = ($('#companyAddress').value || 'Company Address\nCity, Country').replace(/\n/g, '<br>');

  const headerHTML = `
    <div class="inv-header text-header" style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px;">
      <h1 style="margin: 0; font-size: 24px; text-transform: uppercase;">${companyName}</h1>
      <p style="margin: 5px 0 0 0; font-size: 14px;">${companyAddress}</p>
    </div>
  `;

  const stampHTML = stampImageData
    ? `<img src="${stampImageData}" class="inv-stamp" alt="Company Stamp">`
    : '';

  preview.innerHTML = `
    ${headerHTML}

    <div class="inv-title">PROFORMA INVOICE</div>

    <div class="inv-meta-buyer">
      <div class="inv-buyer">
        <strong>TO:</strong> ${buyerName}<br>
        ${buyerAddress}
        ${buyerPhone ? `<br><strong>TEL:</strong>${buyerPhone}` : ''}
        ${buyerEmail ? `, <strong>E-mail:</strong> ${buyerEmail}` : ''}
      </div>
      <div class="inv-meta">
        <span class="inv-meta-label">No.</span> <strong>${invoiceNo}</strong><br>
        <span class="inv-meta-label">Date</span> <strong>${invoiceDate}</strong>
      </div>
    </div>

    <table class="inv-table">
      <thead>
        <tr>
          <th style="width:35px">S/N</th>
          <th style="width:90px">HSCODE</th>
          <th>DESCRIPTION OF GOODS</th>
          <th style="width:80px">BRAND NAME</th>
          <th style="width:90px">QUANTITY</th>
          <th style="width:85px">UNIT PRICE USD</th>
          <th style="width:100px">AMOUNT USD</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <table class="inv-totals-table">
      <tr>
        <td class="empty-cell" colspan="4" style="border:none;"></td>
        <td class="label-cell">TOTAL F.O.B:<br>${fobLocation}</td>
        <td class="amount-cell">${formatCurrency(fob)} USD</td>
      </tr>
      <tr>
        <td class="empty-cell" colspan="4" style="border:none;"></td>
        <td class="label-cell">TOTAL SEA<br>FREIGHT ${freightOrigin}:</td>
        <td class="amount-cell">${formatCurrency(freight)} USD</td>
      </tr>
      <tr>
        <td class="empty-cell" colspan="4" style="border:none;"></td>
        <td class="label-cell">TOTAL C&F: ${destPort}<br>NIGERIA</td>
        <td class="amount-cell">${formatCurrency(cf)} USD</td>
      </tr>
    </table>

    <div class="inv-summary">
      <p><strong>TOTAL:</strong> ${totalInWords}</p>
      <p><strong>COUNTRY OF ORIGIN:</strong> ${countryOrigin}</p>
      <p><strong>COUNTRY OF SUPPLY:</strong> ${countrySupply}</p>
      <p><strong>PRODUCT CERTIFICATION NO:</strong> ${certNo}</p>
      <p><strong>PARTIAL SHIPMENT:</strong> ${partialShipment}</p>
    </div>

    <div class="inv-banking">
      <p><strong>BENEFICIARY NAME:</strong> ${beneficiaryName}</p>
      <p><strong>BENEFICIARY BANK:</strong> ${beneficiaryBank}</p>
      <p><strong>BANK ACCOUNT NO:</strong> ${bankAccountNo}</p>
      <p></p>
      <p><strong>BANK ADDRESS:</strong> ${bankAddress}</p>
      <p></p>
      <p><strong>BANK SWIFT:</strong> ${bankSwift}</p>
      ${intermediaryBank ? `<p><strong>INTERMEDIARY BANK:</strong> ${intermediaryBank}</p>` : ''}
      ${intermediarySwift ? `<p><strong>SWIFT:</strong>${intermediarySwift}</p>` : ''}
      ${stampHTML}
    </div>
  `;
}

// =============================================
// PDF Generation
// =============================================
async function generatePDF() {
  renderPreview();

  const element = $('#invoicePreview');
  const invoiceNo = $('#invoiceNo').value || 'invoice';

  const opt = {
    margin: [8, 8, 8, 8],
    filename: `Proforma_Invoice_${invoiceNo}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    },
  };

  return html2pdf().set(opt).from(element).toPdf().get('pdf').then((pdf) => {
    return { pdf, filename: opt.filename };
  });
}

// =============================================
// Send via Email (EmailJS) — email-only, no download
// =============================================
$('#sendBtn').addEventListener('click', async () => {
  const recipientEmail = $('#recipientEmail').value.trim();
  if (!recipientEmail) {
    showToast('Please enter your email address', 'error');
    return;
  }

  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    showToast('Please enter a valid email address', 'error');
    return;
  }

  // Check if EmailJS is configured
  if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
    showToast('Email service not yet configured. Please contact the admin.', 'error');
    return;
  }

  showLoading('Generating and sending invoice...');

  try {
    renderPreview();
    const element = $('#invoicePreview');
    const invoiceNo = $('#invoiceNo').value || 'invoice';
    const buyerName = $('#buyerName').value || 'Customer';
    const invoiceDate = $('#invoiceDate').value || 'N/A';
    const fob = calcFOB();
    const freight = parseFloat($('#seaFreight')?.value) || 0;
    const cf = fob + freight;
    const totalAmount = `$${formatCurrency(cf)} USD`;

    // Build invoice summary for email body
    const itemsList = lineItems.map((item, i) => {
      const amount = calcItemAmount(item);
      return `  ${i + 1}. ${item.description || 'N/A'} — ${item.quantity ? parseFloat(item.quantity).toLocaleString() : '0'} ${item.unit || 'PCS'} @ $${item.unitPrice || '0'} = $${formatCurrency(amount)}`;
    }).join('\n');

    const emailMessage = `Proforma Invoice #${invoiceNo}

Buyer: ${buyerName}
Phone: ${$('#buyerPhone').value || 'N/A'}
Email: ${$('#buyerEmail').value || 'N/A'}
Date: ${invoiceDate}

Items:
${itemsList}

Total FOB: $${formatCurrency(fob)} USD
Sea Freight: $${formatCurrency(freight)} USD
Total C&F: ${totalAmount}

Country of Origin: ${$('#countryOrigin').value || 'N/A'}
Country of Supply: ${$('#countrySupply').value || 'N/A'}

Beneficiary: ${$('#beneficiaryName').value || 'N/A'}
Bank: ${$('#beneficiaryBank').value || 'N/A'}
Account No: ${$('#bankAccountNo').value || 'N/A'}
SWIFT: ${$('#bankSwift').value || 'N/A'}`;

    // Initialize EmailJS
    emailjs.init(EMAILJS_PUBLIC_KEY);

    // Send to owner only — include the user's email in the message
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: OWNER_EMAIL,
      invoice_number: invoiceNo,
      buyer_name: buyerName,
      invoice_date: invoiceDate,
      total_amount: totalAmount,
      message: `User Email: ${recipientEmail}\n\n${emailMessage}`,
    });

    // Download the PDF locally
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Proforma_Invoice_${invoiceNo}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0, windowHeight: element.scrollHeight },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };
    await html2pdf().set(opt).from(element).save();

    showToast('Invoice emailed & PDF downloaded!', 'success');
  } catch (err) {
    console.error('Email send error:', err);
    showToast('Failed to send. Check console for details.', 'error');
  } finally {
    hideLoading();
  }
});

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// =============================================
// UI Helpers
// =============================================
function showLoading(message = 'Loading...') {
  loadingMessage.textContent = message;
  loadingOverlay.classList.add('visible');
}

function hideLoading() {
  loadingOverlay.classList.remove('visible');
}

function showToast(message, type = 'info') {
  const icon = toast.querySelector('.toast-icon');
  const msg = toast.querySelector('.toast-message');

  toast.className = 'toast visible ' + type;
  icon.className = 'toast-icon fas ' + (type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');
  msg.textContent = message;

  setTimeout(() => {
    toast.classList.remove('visible');
  }, 4000);
}
