import { SamplePreset } from '../models/clipboard.model';

export const WINDOWS_CLIPBOARD_PRESETS: SamplePreset[] = [
  {
    id: 'word-rich-text',
    title: 'Microsoft Word 复制 (Rich Text)',
    description: '模拟在 MS Word / Outlook 中复制富文本，同时包含 text/plain、Windows HTML 格式和 text/rtf',
    badge: 'Word / Office',
    formats: [
      {
        mimeType: 'text/plain',
        textContent: 'Windows 剪贴板 MIME 调试器\n这是一个由 Microsoft Word 复制的示例文本，包含多级标题、加粗文本和代码片段。',
      },
      {
        mimeType: 'text/html',
        textContent: `Version:0.9
StartHTML:0000000105
EndHTML:0000000782
StartFragment:0000000141
EndFragment:0000000746
SourceURL:https://developer.microsoft.com/en-us/windows/
<html><body>
<!--StartFragment--><div class="WordSection1">
<h1 style="color:#0078d4;font-family:Segoe UI;">Windows 剪贴板 MIME 调试器</h1>
<p style="font-size:14px;line-height:1.6;">这是一个由 <b>Microsoft Word</b> 复制的示例富文本，包含多级标题、加粗文本和代码片段。</p>
<pre style="background:#f3f2f1;padding:8px;border-radius:4px;"><code>const mimeType = "text/html";</code></pre>
</div><!--EndFragment-->
</body>
</html>`,
      },
      {
        mimeType: 'text/rtf',
        textContent: `{\\rtf1\\ansi\\ansicpg936\\deff0\\noblistedit\\fet0{\\fonttbl{\\f0\\fnil\\fcharset134 Segoe UI;}}
{\\colortbl ;\\red0\\green120\\blue212;\\red51\\green51\\blue51;}
\\viewkind4\\uc1
\\pard\\cf1\\b\\f0\\fs36 Windows 剪贴板 MIME 调试器\\par
\\cf2\\b0\\fs22 这是一个由 Microsoft Word 复制的示例富文本。\\par
}`,
      },
      {
        mimeType: 'CF_UNICODETEXT',
        textContent: 'Windows 剪贴板 MIME 调试器\r\n这是一个由 Microsoft Word 复制的示例文本。',
      },
      {
        mimeType: 'HTML Format',
        textContent: 'Version:0.9\r\nStartHTML:0000000105\r\nEndHTML:0000000782\r\nStartFragment:0000000141\r\nEndFragment:0000000746\r\n<html>...',
      },
    ],
  },
  {
    id: 'web-selection-link',
    title: 'Chrome/Edge 网页选中与链接',
    description: '包含网页选中 HTML 片段、纯文本以及 text/uri-list 链接',
    badge: 'Browser Web',
    formats: [
      {
        mimeType: 'text/plain',
        textContent: 'Google Cloud Console - Project Overview\nhttps://console.cloud.google.com/home/dashboard',
      },
      {
        mimeType: 'text/html',
        textContent: `Version:0.9
StartHTML:00000105
EndHTML:00000420
StartFragment:00000140
EndFragment:00000384
SourceURL:https://console.cloud.google.com/
<html><body>
<!--StartFragment--><a href="https://console.cloud.google.com/home/dashboard" target="_blank" style="color:#1a73e8;font-weight:600;">Google Cloud Console - Project Overview</a><!--EndFragment-->
</body></html>`,
      },
      {
        mimeType: 'text/uri-list',
        textContent: 'https://console.cloud.google.com/home/dashboard\r\n# Google Cloud Console Dashboard Link',
      },
      {
        mimeType: 'text/x-moz-url',
        textContent: 'https://console.cloud.google.com/home/dashboard\r\nGoogle Cloud Console - Project Overview',
      },
    ],
  },
  {
    id: 'api-developer-json',
    title: 'API 接口 JSON 与 XML 载荷',
    description: '包含结构化应用数据，包含 application/json、text/xml 以及纯文本格式',
    badge: 'Dev Data',
    formats: [
      {
        mimeType: 'application/json',
        textContent: JSON.stringify(
          {
            status: 'success',
            code: 200,
            platform: 'Windows 11 x64',
            clipboardCapabilities: ['text/plain', 'text/html', 'text/rtf', 'image/png', 'CF_HDROP'],
            activeFormats: 5,
            debugInfo: {
              timestamp: new Date().toISOString(),
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              encoding: 'UTF-8',
            },
          },
          null,
          2
        ),
      },
      {
        mimeType: 'text/xml',
        textContent: `<?xml version="1.0" encoding="UTF-8"?>
<response status="success">
  <platform>Windows 11 x64</platform>
  <activeFormats count="5">
    <format mime="text/plain" />
    <format mime="text/html" />
    <format mime="text/rtf" />
    <format mime="image/png" />
    <format mime="CF_HDROP" />
  </activeFormats>
</response>`,
      },
      {
        mimeType: 'text/plain',
        textContent: `{"status":"success","code":200,"platform":"Windows 11 x64"}`,
      },
    ],
  },
  {
    id: 'windows-hdrop-files',
    title: 'Windows 资源管理器文件复制 (CF_HDROP)',
    description: '模拟在 Windows 资源管理器中复制 2 个文件，包含二进制 CF_HDROP 与 text/uri-list',
    badge: 'Windows Explorer',
    formats: [
      {
        mimeType: 'text/uri-list',
        textContent: 'file:///C:/Users/Developer/Documents/project_design.docx\r\nfile:///C:/Users/Developer/Downloads/screenshot_2026.png',
      },
      {
        mimeType: 'text/plain',
        textContent: 'C:\\Users\\Developer\\Documents\\project_design.docx\r\nC:\\Users\\Developer\\Downloads\\screenshot_2026.png',
      },
      {
        mimeType: 'CF_HDROP',
        binaryBytes: [20, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 67, 0, 58, 0, 92, 0, 85, 0, 115, 0, 101, 0, 114, 0, 115, 0],
        isBinary: true,
      },
      {
        mimeType: 'application/x-win-hdrop',
        textContent: 'Windows DropFiles Structure (2 Files selected)',
      },
    ],
  },
  {
    id: 'binary-png-image',
    title: '剪贴板 PNG 图片 (Binary Blob)',
    description: '模拟复制带有 PNG 图像头的二进制数据',
    badge: 'Image Binary',
    formats: [
      {
        mimeType: 'image/png',
        // Real PNG header signature bytes
        binaryBytes: [
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
          0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x08, 0x06, 0x00, 0x00, 0x00, 0x5c, 0x72, 0xa8,
          0x66, 0x00, 0x00, 0x00, 0x01, 0x73, 0x52, 0x47, 0x42, 0x00, 0xae, 0xce, 0x1c, 0xe9, 0x00, 0x00,
        ],
        isBinary: true,
      },
      {
        mimeType: 'image/bmp',
        binaryBytes: [0x42, 0x4d, 0x36, 0x00, 0x0c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x36, 0x00, 0x00, 0x00],
        isBinary: true,
      },
      {
        mimeType: 'text/plain',
        textContent: 'Image (PNG 256x256 RGBA, 12.4 KB)',
      },
    ],
  },
];
