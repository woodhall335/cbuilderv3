// src/lib/render.ts
import Handlebars from 'handlebars';

type Clause = { id: string; title?: string; template: string };

export function renderClausesToHtml(
  clauses: Clause[] = [],
  payload: Record<string, any> = {}
): string {
  return clauses
    .map((c) => {
      const tpl = Handlebars.compile(c.template ?? '');
      const html = tpl(payload).replace(/\n/g, '<br />');
      const title = c.title ? `<h2 class="ch-clause-title">${c.title}</h2>` : '';
      return `${title}<div class="ch-clause-body"><p>${html}</p></div>`;
    })
    .join('\n');
}
