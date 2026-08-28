const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const MAX_PREVIEW_PAGES = 6;
const PDF_PREVIEW_SCALE = 1.5;

const loadPdfJs = async () => {
  const [pdfjsLib, { default: pdfWorkerUrl }] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  return pdfjsLib;
};

const extractTextFromPDF = async (file) => {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageTexts = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pageTexts.push(content.items.map((item) => item.str).join(' '));
  }

  const text = pageTexts.join('\n\n').trim();
  if (!text) {
    throw new Error('No selectable text found in this PDF. It may be a scanned image — try pasting the text directly instead.');
  }
  return text;
};

const extractTextFromDOCX = async (file) => {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value.trim();
  if (!text) {
    throw new Error('No text found in this DOCX file.');
  }
  return text;
};

const extractTextFromTXT = async (file) => {
  const text = (await file.text()).trim();
  if (!text) {
    throw new Error('This file appears to be empty.');
  }
  return text;
};


const renderPDFPreview = async (file) => {
  const pdfjsLib = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageCount = Math.min(pdf.numPages, MAX_PREVIEW_PAGES);
  const pages = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: PDF_PREVIEW_SCALE });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');
    await page.render({ canvasContext: context, viewport }).promise;
    pages.push(canvas.toDataURL('image/png'));
    canvas.width = 0;
    canvas.height = 0;
  }

  return {
    type: 'image-pages',
    pages,
    totalPages: pdf.numPages,
    truncated: pdf.numPages > pageCount,
  };
};

const sanitizeHtmlPreview = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '');

const renderDOCXPreview = async (file) => {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = sanitizeHtmlPreview(result.value || '').trim();
  if (!html) {
    throw new Error('No content found to preview in this DOCX file.');
  }
  return { type: 'html', html };
};

const renderTXTPreview = async (file) => {
  const text = (await file.text()).trim();
  return { type: 'text', text };
};

export const renderResumePreview = async (file) => {
  if (!file) return null;

  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  try {
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await renderPDFPreview(file);
    }
    if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      return await renderDOCXPreview(file);
    }
    return await renderTXTPreview(file);
  } catch (error) {
    console.error('Resume preview rendering error:', error);
    return null;
  }
};


const MIN_RESUME_WORDS = 40;
const MIN_SIGNAL_MATCHES = 2;

const ANALYSIS_REPORT_SIGNALS = [
  /resume\s+analysis\s+report/i,
  /match\s+score\s*:\s*\d+\s*\/\s*100/i,
  /ats\s+risk\s*:/i,
  /improvement\s+areas/i,
  /suggested\s+bullet\s+rewrites/i,
];

const RESUME_SIGNALS = [
  { name: 'contact', pattern: /[\w.+-]+@[\w-]+\.[a-z]{2,}|(\+?\d[\d .()-]{7,}\d)/i },
  { name: 'experience', pattern: /\b(work experience|professional experience|employment history|experience)\b/i },
  { name: 'education', pattern: /\b(education|university|college|bachelor|master|b\.?tech|m\.?tech|degree)\b/i },
  { name: 'skills', pattern: /\bskills\b/i },
  { name: 'summary', pattern: /\b(summary|objective|profile)\b/i },
  { name: 'projects', pattern: /\bprojects?\b/i },
  { name: 'certifications', pattern: /\b(certification|certificate|license)s?\b/i },
  { name: 'dateRange', pattern: /\b(19|20)\d{2}\s*(-|–|—|to)\s*((19|20)\d{2}|present|current)\b/i },
];

export const assertLooksLikeResume = (text) => {
  if (ANALYSIS_REPORT_SIGNALS.some((pattern) => pattern.test(text))) {
    throw new Error(
      'This looks like a previously generated resume analysis report, not a resume. Please upload your original resume file instead.'
    );
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  if (wordCount < MIN_RESUME_WORDS) {
    throw new Error(
      'This file looks too short to be a resume. Please upload an actual resume/CV.'
    );
  }

  const matchCount = RESUME_SIGNALS.filter(({ pattern }) => pattern.test(text)).length;
  if (matchCount < MIN_SIGNAL_MATCHES) {
    throw new Error(
      "This doesn't look like a resume — we couldn't find typical resume content (work experience, education, skills, contact details, etc.). Please upload an actual resume/CV."
    );
  }
};

export const parseResume = async (file) => {
  if (!file) {
    throw new Error('No file provided');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('File is too large (max 10MB). Try a smaller file or paste the text directly.');
  }

  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  try {
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await extractTextFromPDF(file);
    }
    if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      return await extractTextFromDOCX(file);
    }
    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      return await extractTextFromTXT(file);
    }
    throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
  } catch (error) {
    console.error('Resume parsing error:', error);
    throw error instanceof Error ? error : new Error('Failed to parse resume file.');
  }
};