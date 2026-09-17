import React from 'react';
import { jsPDF } from 'jspdf';
import { Decision, EvaluationResult, ExplainableAIReport, RealityCheck } from '../types';
import { Download } from 'lucide-react';

interface PdfReportGeneratorProps {
  decision: Decision;
  evaluations: EvaluationResult[];
  aiReport?: ExplainableAIReport;
  realityCheck?: RealityCheck;
}

export const PdfReportGenerator: React.FC<PdfReportGeneratorProps> = ({
  decision,
  evaluations,
  aiReport,
  realityCheck
}) => {

  const generatePdf = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header Title
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('NEXORA AI — Decision Report', 14, 22);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated: ${new Date().toLocaleDateString()} | Category: ${decision.category}`, 14, 32);

    let y = 50;

    // Decision Summary
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(decision.title, 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const descLines = doc.splitTextToSize(decision.description || 'No description provided.', pageWidth - 28);
    doc.text(descLines, 14, y);
    y += descLines.length * 6 + 10;

    // AI Recommendation Box
    if (aiReport && aiReport.recommended_option_name) {
      doc.setFillColor(240, 249, 255); // sky-50
      doc.setDrawColor(14, 165, 233);
      doc.rect(14, y, pageWidth - 28, 35, 'FD');

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(2, 132, 199);
      doc.text(`Recommended Option: ${aiReport.recommended_option_name} (${aiReport.recommendation_score}/100)`, 20, y + 12);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const summaryLines = doc.splitTextToSize(aiReport.summary, pageWidth - 40);
      doc.text(summaryLines, 20, y + 22);

      y += 45;
    }

    // Option Scoring Table
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Evaluated Options Comparison', 14, y);
    y += 8;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, pageWidth - 28, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Option Name', 18, y + 6);
    doc.text('Final Score', 90, y + 6);
    doc.text('Base Score', 125, y + 6);
    doc.text('Penalties', 160, y + 6);
    y += 10;

    doc.setFont('helvetica', 'normal');
    evaluations.forEach((ev) => {
      doc.text(ev.option_name, 18, y + 4);
      doc.text(`${ev.final_score}/100`, 90, y + 4);
      doc.text(`${ev.base_score}`, 125, y + 4);
      doc.text(`-${ev.penalties}`, 160, y + 4);
      y += 8;
    });

    y += 15;

    // Reality Check Section if available
    if (realityCheck) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Reality Check (Predicted vs Actual)', 14, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Selected Option: ${realityCheck.option_name || 'N/A'}`, 14, y);
      y += 6;
      doc.text(`Actual Duration: ${realityCheck.actual_time_months || 0} months (Predicted: ${realityCheck.pred_time || 0} months)`, 14, y);
      y += 6;
      doc.text(`Satisfaction Score: ${realityCheck.satisfaction_score || 0} / 10`, 14, y);
    }

    // Save File
    doc.save(`NEXORA_Decision_${decision.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  return (
    <button
      onClick={generatePdf}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-md transition-all"
    >
      <Download className="w-4 h-4 text-sky-400" />
      Export PDF Report
    </button>
  );
};
