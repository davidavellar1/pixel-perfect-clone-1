const colour = /\b(?:bg|text|border|ring|fill|stroke|from|via|to)-(?:\[#|(?:white|black)(?=[/\s"'`]|$)|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d)/;
export const tokenRule = {
  meta: { type: "problem", schema: [], messages: { token: "Use a semantic design token instead of a raw colour utility." } },
  create(context) {
    const check = (node, value) => { if (typeof value === "string" && colour.test(value)) context.report({ node, messageId: "token" }); };
    return { Literal(node) { check(node, node.value); }, TemplateElement(node) { check(node, node.value.raw); } };
  },
};