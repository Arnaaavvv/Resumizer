// pdfjs-dist and its worker are bundled as a large chunk, so both are
// lazy-loaded only when a PDF is actually uploaded rather than on page load.
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

// Rendering every page of a huge resume to a canvas image can stall the UI,
// so the visual preview caps out here (the extracted *text* used for
// analysis still covers every page).
const MAX_PREVIEW_PAGES = 6;
const PDF_PREVIEW_SCALE = 1.5;

const loadPdfJs = async () => {
  const [pdfjsLib, { default: pdfWorkerUrl }] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  // Import the worker as a bundled asset URL so its version always matches
  // the installed pdfjs-dist package (a version mismatch with a CDN worker
  // is a common source of "Failed to parse PDF" errors).
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

// ---------------------------------------------------------------------
// Visual preview rendering — separate from text extraction above. This
// produces an actual on-screen rendition of the resume (rasterized PDF
// pages, or the resume's real formatting for DOCX) rather than a flat
// text dump, for display in the Resume Preview panel.
// ---------------------------------------------------------------------

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
    // eslint-disable-next-line no-await-in-loop
    await page.render({ canvasContext: context, viewport }).promise;
    pages.push(canvas.toDataURL('image/png'));
    // Release the canvas backing store immediately rather than waiting for GC.
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

/**
 * Produces a *visual* preview of the resume for the Resume Preview panel:
 * - PDF  -> rasterized page images (what the file actually looks like)
 * - DOCX -> the document's real formatting, converted to HTML
 * - TXT  -> plain text (no formatting exists to preview)
 *
 * This is best-effort and independent of parseResume(): if rendering fails,
 * it returns null so the caller can fall back to the plain-text view rather
 * than blocking the analysis flow.
 */
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

// ---------------------------------------------------------------------
// "Is this actually a resume?" check — runs immediately after text
// extraction, entirely client-side, so a mismatched upload (an invoice,
// an essay, a code file, a random PDF, a blank/scanned page, etc.) gets
// flagged right away instead of silently proceeding to a paid AI call.
// ---------------------------------------------------------------------

const MIN_RESUME_WORDS = 40;
const MIN_SIGNAL_MATCHES = 2;

// Distinctive phrases from this app's OWN exported analysis report (see
// storage.js's exportResults / exportResultsAsPDF). Checked first and
// separately from the generic signals below, because a report *about* a
// resume is full of resume-sounding words ("experience", "skills",
// "education", a literal "SUMMARY" heading) and would otherwise sail
// through the generic heuristic as a false negative.
const ANALYSIS_REPORT_SIGNALS = [
  /resume\s+analysis\s+report/i,
  /match\s+score\s*:\s*\d+\s*\/\s*100/i,
  /ats\s+risk\s*:/i,
  /improvement\s+areas/i,
  /suggested\s+bullet\s+rewrites/i,
];

// Each pattern targets something genuinely common across resume formats.
// Requiring a couple of independent hits (rather than just one) keeps
// this from misfiring on resumes that happen to phrase things unusually,
// while still catching documents that are clearly something else.
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

/**
 * Throws a user-facing error if the extracted text doesn't look like a
 * resume. Intentionally heuristic and forgiving (word count + a couple of
 * loosely-matched signals) rather than a strict classifier, so unusually
 * formatted but genuine resumes aren't rejected.
 */
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