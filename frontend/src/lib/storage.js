const line = (char = '-', len = 60) => char.repeat(len);

// Normalizes the raw analysis results into a shape both exporters can rely
// on (safe defaults for every field, no undefined arrays/strings).
const normalizeResults = (results) => ({
  matchScore: results.matchScore ?? 'N/A',
  summary: results.summary || 'No summary provided.',
  strengths: results.strengths || [],
  gaps: results.gaps || [],
  keywordAnalysis: {
    matched: results.keywordAnalysis?.matched || [],
    missing: results.keywordAnalysis?.missing || [],
  },
  bulletRewrites: results.bulletRewrites || [],
  formattingIssues: results.formattingIssues || [],
  atsRisk: results.atsRisk || 'unknown',
});

const buildTimestamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const exportResults = async (results) => {
  const r = normalizeResults(results);

  try {
    const textContent = `RESUME ANALYSIS REPORT
${line('=')}

MATCH SCORE: ${r.matchScore}/100
ATS RISK: ${String(r.atsRisk).toUpperCase()}

SUMMARY
${line()}
${r.summary}

STRENGTHS
${line()}
${r.strengths.length ? r.strengths.map((s) => `- ${s}`).join('\n') : 'None identified.'}

IMPROVEMENT AREAS
${line()}
${r.gaps.length
  ? r.gaps.map((g) => `- [${String(g.severity || 'n/a').toUpperCase()}] ${g.issue}\n  Suggestion: ${g.suggestion}`).join('\n\n')
  : 'None identified.'}

KEYWORD ANALYSIS
${line()}
Matched: ${r.keywordAnalysis.matched.join(', ') || 'None'}
Missing: ${r.keywordAnalysis.missing.join(', ') || 'None'}

SUGGESTED BULLET REWRITES
${line()}
${r.bulletRewrites.length
  ? r.bulletRewrites
      .map((b, i) => `${i + 1}. Original:  ${b.original}\n   Improved:  ${b.improved}\n   Why:       ${b.reason}`)
      .join('\n\n')
  : 'None provided.'}

FORMATTING & STRUCTURE
${line()}
${r.formattingIssues.length ? r.formattingIssues.map((i) => `- ${i}`).join('\n') : 'No issues flagged.'}

${line('=')}
Generated on: ${new Date().toLocaleString()}
`.trim();

    const blob = new Blob([textContent], { type: 'text/plain' });
    downloadBlob(blob, `resume-analysis-${buildTimestamp()}.txt`);
    return true;
  } catch (error) {
    console.error('Failed to export results:', error);
    throw error;
  }
};

export const exportResultsAsPDF = async (results) => {
  const r = normalizeResults(results);

  try {
    // jsPDF is only needed for this one action, so it's lazy-loaded rather
    // than bundled into the main app chunk.
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 48;
    const maxWidth = pageWidth - marginX * 2;
    let y = 56;

    const ensureSpace = (neededHeight) => {
      if (y + neededHeight > pageHeight - 48) {
        doc.addPage();
        y = 56;
      }
    };

    const addHeading = (text) => {
      ensureSpace(26);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(text, marginX, y);
      y += 6;
      doc.setDrawColor(180, 180, 180);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 16;
    };

    const addBody = (text, { bold = false, indent = 0 } = {}) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(text, maxWidth - indent);
      lines.forEach((lineText) => {
        ensureSpace(14);
        doc.text(lineText, marginX + indent, y);
        y += 14;
      });
    };

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Resume Analysis Report', marginX, y);
    y += 28;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Match Score: ${r.matchScore}/100`, marginX, y);
    y += 16;
    doc.text(`ATS Risk: ${String(r.atsRisk).toUpperCase()}`, marginX, y);
    y += 24;

    addHeading('Summary');
    addBody(r.summary || 'No summary provided.');
    y += 10;

    addHeading('Strengths');
    if (r.strengths.length) {
      r.strengths.forEach((s) => addBody(`• ${s}`));
    } else {
      addBody('None identified.');
    }
    y += 10;

    addHeading('Improvement Areas');
    if (r.gaps.length) {
      r.gaps.forEach((g) => {
        addBody(`[${String(g.severity || 'n/a').toUpperCase()}] ${g.issue}`, { bold: true });
        addBody(`Suggestion: ${g.suggestion}`, { indent: 12 });
        y += 6;
      });
    } else {
      addBody('None identified.');
    }
    y += 4;

    addHeading('Keyword Analysis');
    addBody(`Matched: ${r.keywordAnalysis.matched.join(', ') || 'None'}`);
    addBody(`Missing: ${r.keywordAnalysis.missing.join(', ') || 'None'}`);
    y += 10;

    addHeading('Suggested Bullet Rewrites');
    if (r.bulletRewrites.length) {
      r.bulletRewrites.forEach((b, i) => {
        addBody(`${i + 1}. Original: ${b.original}`, { bold: true });
        addBody(`Improved: ${b.improved}`, { indent: 12 });
        addBody(`Why: ${b.reason}`, { indent: 12 });
        y += 6;
      });
    } else {
      addBody('None provided.');
    }
    y += 4;

    addHeading('Formatting & Structure');
    if (r.formattingIssues.length) {
      r.formattingIssues.forEach((issue) => addBody(`• ${issue}`));
    } else {
      addBody('No issues flagged.');
    }

    ensureSpace(24);
    y += 10;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, marginX, y);

    doc.save(`resume-analysis-${buildTimestamp()}.pdf`);
    return true;
  } catch (error) {
    console.error('Failed to export results as PDF:', error);
    throw error;
  }
};
