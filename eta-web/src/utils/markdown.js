/**
 * Simple utility to convert basic markdown to sanitized HTML.
 * Prevents XSS by escaping HTML tags and only allowing specific safe formatting.
 */
export const sanitizeAndParseMarkdown = (text) => {
    if (!text) return '';

    // 1. Escape all HTML to prevent script injection
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    // 2. Convert common markdown patterns to safe HTML tags

    // Headers (### Header -> h3)
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>');

    // Bold (**text** -> strong)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-blue-600">$1</strong>');

    // Italic (*text* -> em)
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // Bullet points (- point -> li)
    // First, wrap adjacent bullet points in a <ul>
    html = html.replace(/^\s*[-*] (.*$)/gim, '<li class="ml-4 list-disc">$1</li>');

    // Inline code (`code` -> code)
    html = html.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-sm font-mono text-pink-600">$1</code>');

    // Newlines to <br> (only if not already a block element)
    html = html.replace(/\n\n/g, '</p><p class="mb-3">');
    html = html.replace(/\n/g, '<br />');

    // Wrap in a paragraph if it doesn't start with a header
    if (!html.startsWith('<h')) {
        html = '<p class="mb-3">' + html + '</p>';
    }

    return html;
};
