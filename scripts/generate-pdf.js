const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspaceDir = path.resolve(__dirname, '..');
const mdFilePath = path.join(workspaceDir, 'DEPLOYMENT_DOCUMENTATION.md');
const htmlFilePath = path.join(workspaceDir, 'DEPLOYMENT_DOCUMENTATION.html');
const pdfFilePath = path.join(workspaceDir, 'DEPLOYMENT_DOCUMENTATION.pdf');

// 1. Convert Markdown to HTML using marked
console.log('Generating HTML from Markdown...');
execSync(`npx --yes marked "${mdFilePath}" -o "${htmlFilePath}.body"`, { stdio: 'inherit' });

const bodyContent = fs.readFileSync(`${htmlFilePath}.body`, 'utf-8');

// 2. Wrap in a beautiful, modern, print-ready HTML layout
const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Production GitOps on GCP GKE - Deployment Documentation</title>
<style>
  @page {
    size: A4;
    margin: 18mm 15mm 18mm 15mm;
    @bottom-right {
      content: counter(page);
    }
  }

  *, *:before, *:after {
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #1f2328;
    background-color: #ffffff;
    line-height: 1.6;
    font-size: 13.5px;
    padding: 0;
    margin: 0;
  }

  h1, h2, h3, h4, h5, h6 {
    color: #0f172a;
    font-weight: 700;
    margin-top: 1.6em;
    margin-bottom: 0.6em;
    page-break-after: avoid;
    break-after: avoid;
  }

  h1 {
    font-size: 26px;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 8px;
    margin-top: 0;
    color: #1e293b;
  }

  h2 {
    font-size: 19px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 6px;
    margin-top: 1.8em;
    color: #0284c7;
  }

  h3 {
    font-size: 15px;
    color: #334155;
  }

  p, ul, ol {
    margin-top: 0;
    margin-bottom: 12px;
  }

  ul, ol {
    padding-left: 24px;
  }

  li {
    margin-bottom: 4px;
  }

  code {
    font-family: "JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 12px;
    background-color: #f1f5f9;
    color: #0f172a;
    padding: 2px 5px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
  }

  pre {
    background-color: #0f172a;
    color: #f8fafc;
    padding: 14px 16px;
    border-radius: 8px;
    overflow-x: auto;
    font-size: 11.5px;
    line-height: 1.45;
    page-break-inside: avoid;
    break-inside: avoid;
    margin-bottom: 14px;
    border: 1px solid #1e293b;
  }

  pre code {
    background-color: transparent;
    color: #f8fafc;
    padding: 0;
    border: none;
    font-size: 11.5px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 12px;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  th, td {
    border: 1px solid #cbd5e1;
    padding: 8px 12px;
    text-align: left;
    vertical-align: top;
  }

  th {
    background-color: #f8fafc;
    font-weight: 600;
    color: #0f172a;
  }

  tr:nth-child(even) {
    background-color: #f8fafc;
  }

  blockquote {
    margin: 14px 0;
    padding: 10px 16px;
    border-left: 4px solid #0284c7;
    background-color: #f0f9ff;
    color: #0369a1;
    border-radius: 0 6px 6px 0;
    font-size: 13px;
  }

  hr {
    border: 0;
    height: 1px;
    background: #e2e8f0;
    margin: 24px 0;
  }

  a {
    color: #0284c7;
    text-decoration: none;
  }

  .badge {
    display: inline-block;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 9999px;
    background-color: #e0f2fe;
    color: #0369a1;
  }

  img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
    margin: 16px 0;
    display: block;
  }
</style>
</head>
<body>
${bodyContent}
</body>
</html>`;

fs.writeFileSync(htmlFilePath, fullHtml, 'utf-8');
fs.unlinkSync(`${htmlFilePath}.body`);
console.log('HTML generated successfully: ' + htmlFilePath);

// 3. Print to PDF using Edge headless
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
console.log('Rendering PDF via Microsoft Edge headless...');
const printCmd = `"${edgePath}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${pdfFilePath}" --no-pdf-header-footer "file:///${htmlFilePath.replace(/\\\\/g, '/')}"`;

execSync(printCmd, { stdio: 'inherit' });

if (fs.existsSync(pdfFilePath)) {
  const stats = fs.statSync(pdfFilePath);
  console.log(`PDF successfully created! Size: ${(stats.size / 1024).toFixed(1)} KB at ${pdfFilePath}`);
} else {
  console.error('PDF generation failed: File not found.');
}
