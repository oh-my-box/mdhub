import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

// @ts-ignore
export const mdParser = MarkdownIt({
  highlight: function (str: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const code = hljs
          .highlight(str, { language: lang, ignoreIllegals: true  })
          .value.replace(/\n/g, "<br/>");
        return `<pre class="woap-code-wrap"><code class="woap-code-container hljs language-${lang}">${code}</code></pre>`;
      } catch (__) {}
    }
    return ''; // use external default escaping
  },
})