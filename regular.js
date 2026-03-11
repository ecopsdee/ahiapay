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
let currentStep = 1;
const totalSteps = 5;
let stampImageData = null;
let lineItems = [createEmptyLineItem()];

function createEmptyLineItem() {
  return {
    id: Date.now() + Math.random(),
    description: '',
    quantity: '',
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
nextBtn.addEventListener('click', () => {
  goToStep(currentStep + 1);
});

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



let signatureImageData = null;

setupImageUpload('stampUpload', 'stampFile', 'stampPreviewImg', 'stampRemove', (data) => {
  stampImageData = data;
});

setupImageUpload('signatureUpload', 'signatureFile', 'signaturePreviewImg', 'signatureRemove', (data) => {
  signatureImageData = data;
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
        <label>Description of Item <span class="required">*</span></label>
        <input type="text" class="li-description" value="${item.description}" placeholder="e.g. CM8000 Plus(5G) 6GB + 256GB" data-id="${item.id}">
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Quantity <span class="required">*</span></label>
          <input type="number" class="li-quantity" value="${item.quantity}" placeholder="e.g. 1" min="0" data-id="${item.id}">
        </div>
        <div class="form-group">
          <label>Unit Price (₦) <span class="required">*</span></label>
          <input type="number" class="li-unitprice" value="${item.unitPrice}" placeholder="e.g. 125000" step="0.01" min="0" data-id="${item.id}">
        </div>
      </div>

      <div class="line-item-amount">
        Amount: <span class="li-amount-display">₦${formatCurrency(calcItemAmount(item))}</span>
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

      if (input.classList.contains('li-description')) item.description = input.value;
      if (input.classList.contains('li-quantity')) item.quantity = input.value;
      if (input.classList.contains('li-unitprice')) item.unitPrice = input.value;

      // Update this item's amount display
      const card = input.closest('.line-item-card');
      const amountDisplay = card.querySelector('.li-amount-display');
      amountDisplay.textContent = '₦' + formatCurrency(calcItemAmount(item));

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
  const total = calcFOB();
  // No display elements to update in regular view right now
}

function formatCurrency(num) {
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}



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

  // Top Right Info
  const invoiceNo = $('#invoiceNo').value || '—';
  const invoiceDateRaw = $('#invoiceDate').value;
  let formattedDate = '—';
  if (invoiceDateRaw) {
    const d = new Date(invoiceDateRaw);
    formattedDate = d.toLocaleDateString('en-GB'); // Outputs DD/MM/YYYY
  }

  // Company Info
  const companyName = $('#companyName').value || 'Company Name';
  const companyPhone = $('#companyPhone').value || '';
  const companyEmail = $('#companyEmail').value || '';
  const companyWebsite = $('#companyWebsite').value || '';

  // Buyer Info
  const buyerName = $('#buyerName').value || '—';
  const buyerAddress = ($('#buyerAddress').value || '—').replace(/\n/g, '<br>');
  const buyerPhone = $('#buyerPhone').value || '';

  const total = calcFOB();

  // Line items
  const itemRows = lineItems.map((item) => {
    const amount = calcItemAmount(item);
    const qty = parseFloat(item.quantity) || 0;
    return `
      <tr>
        <td style="text-align: left; padding: 10px 0;">${item.description || '—'}</td>
        <td style="text-align: center; padding: 10px 0;">${qty > 0 ? qty.toLocaleString() : '—'}</td>
        <td style="text-align: right; padding: 10px 0;">₦${item.unitPrice ? parseFloat(item.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</td>
        <td style="text-align: right; padding: 10px 0;">₦${amount > 0 ? formatCurrency(amount) : '0.00'}</td>
      </tr>
    `;
  }).join('');

  const stampHTML = stampImageData
    ? `<div style="position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%) rotate(-25deg); opacity: 0.6; pointer-events: none;"><img src="${stampImageData}" style="max-height: 150px; max-width: 300px;"></div>`
    : '';

  const signatureHTML = signatureImageData
    ? `<div style="text-align: right; margin-top: 40px;"><img src="${signatureImageData}" style="max-height: 80px; max-width: 150px;" alt="Signature"></div>`
    : '';

  preview.innerHTML = `
    <div style="position: relative; padding: 40px; font-family: 'Inter', sans-serif; color: #1a202c; max-width: 800px; margin: 0 auto;">
      ${stampHTML}
      
      <!-- Top Section -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
        <h1 style="font-size: 48px; font-weight: 700; margin: 0; color: #000; letter-spacing: -1px;">INVOICE</h1>
        <div style="text-align: left; display: grid; grid-template-columns: auto auto; column-gap: 30px; row-gap: 5px; font-size: 14px; margin-top: 10px; color: #2d3748; font-weight: 600;">
          <span style="text-transform: uppercase;">INVOICE #</span>
          <span style="text-align: right; font-weight: 400; color: #4a5568;">${invoiceNo}</span>
          <span style="text-transform: uppercase;">DATE</span>
          <span style="text-align: right; font-weight: 400; color: #4a5568;">${formattedDate}</span>
        </div>
      </div>

      <!-- Entities Section -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 50px; font-size: 13px; line-height: 1.6; border-top: 1px solid #000; padding-top: 24px;">
        <div>
          <strong style="font-size: 16px; margin-bottom: 8px; display: block; color: #1a202c;">FROM</strong>
          <div style="font-weight: 700; margin-bottom: 4px; font-size: 14px; color: #2d3748;">${companyName.toUpperCase()}</div>
          <div style="color: #4a5568;">${companyPhone}</div>
          <div style="color: #4a5568;">${companyEmail}</div>
          ${companyWebsite ? `<div style="color: #4a5568;; word-break: break-all;"><a href="${companyWebsite}" style="color: inherit; text-decoration: none;">${companyWebsite}</a></div>` : ''}
        </div>
        <div>
          <strong style="font-size: 16px; margin-bottom: 8px; display: block; color: #1a202c;">Bill To</strong>
          <div style="font-weight: 700; margin-bottom: 4px; font-size: 14px; color: #2d3748;">${buyerName}</div>
          <div style="color: #4a5568;">${buyerAddress}</div>
          ${buyerPhone ? `<div style="color: #4a5568;">${buyerPhone}</div>` : ''}
        </div>
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px;">
        <thead>
          <tr style="border-top: 1px solid #000; border-bottom: 1px solid #000;">
            <th style="text-align: left; padding: 12px 0; font-weight: 700; color: #000;">Description</th>
            <th style="text-align: center; padding: 12px 0; font-weight: 700; color: #000; width: 80px;">QTY</th>
            <th style="text-align: right; padding: 12px 0; font-weight: 700; color: #000; width: 120px;">Price</th>
            <th style="text-align: right; padding: 12px 0; font-weight: 700; color: #000; width: 140px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <!-- Totals Section -->
      <div style="display: flex; justify-content: flex-end;">
        <table style="width: 350px; border-collapse: collapse; font-size: 18px;">
          <tr style="border-top: 1px solid #000; border-bottom: 1px solid #000; font-weight: 700; color: #000;">
            <td style="padding: 12px 0; text-align: left;">TOTAL</td>
            <td style="padding: 12px 0; text-align: right;">₦${formatCurrency(total)}</td>
          </tr>
        </table>
      </div>

      ${signatureHTML}
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
    filename: `Invoice_${invoiceNo}.pdf`,
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
    const total = calcFOB();
    const totalAmount = `₦${formatCurrency(total)}`;

    // Build invoice summary for email body
    const itemsList = lineItems.map((item, i) => {
      const amount = calcItemAmount(item);
      return `  ${i + 1}. ${item.description || 'N/A'} — ${item.quantity ? parseFloat(item.quantity).toLocaleString() : '0'} @ ₦${item.unitPrice || '0'} = ₦${formatCurrency(amount)}`;
    }).join('\n');

    const emailMessage = `Commercial Invoice #${invoiceNo}

Buyer: ${buyerName}
Phone: ${$('#buyerPhone').value || 'N/A'}
Email: ${$('#buyerEmail').value || 'N/A'}
Date: ${invoiceDate}

Items:
${itemsList}

Total Amount: ${totalAmount}`;

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
      filename: `Invoice_${invoiceNo}.pdf`,
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
