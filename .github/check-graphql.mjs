// Validates every `#graphql` query in app/ against the Shopify API schemas.
// Catches typos, extra/missing braces and unknown fields before deploy.
// Run: node .github/check-graphql.mjs
import { readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import {
  buildClientSchema,
  NoUnusedFragmentsRule,
  parse,
  specifiedRules,
  validate,
  visit,
} from "graphql";

const require = createRequire(import.meta.url);
const { getSchema } = require("@shopify/hydrogen-codegen");

function loadSchema(api) {
  const json = JSON.parse(readFileSync(getSchema(api), "utf8"));
  return buildClientSchema(json.data ?? json);
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      walk(p, out);
    } else if (/\.(ts|tsx|js|jsx)$/.test(name)) {
      out.push(p);
    }
  }
  return out;
}

// These files talk to the Admin API, whose schema isn't bundled. Their queries
// are still checked for syntax (braces etc.), just not against a schema.
const ADMIN_API_FILES = ["app/routes/api/entry-form.ts"];

const literal = /`#graphql([\s\S]*?)`/g;
const docs = [];
const errors = [];

for (const file of walk("app")) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(literal)) {
    const text = m[1].replace(/\$\{[^}]*\}/g, "");
    const line = src.slice(0, m.index).split("\n").length;
    const api = ADMIN_API_FILES.includes(file.split("\\").join("/"))
      ? "admin"
      : file.includes(`${join("app", "routes", "account")}`)
        ? "customer-account"
        : "storefront";
    try {
      docs.push({ file, line, api, doc: parse(text) });
    } catch (e) {
      errors.push(`${file}:${line}\n  ${e.message}`);
    }
  }
}

// Collect fragments by API so operations can use fragments defined elsewhere.
const fragments = { storefront: new Map(), "customer-account": new Map() };
for (const d of docs) {
  if (d.api === "admin") {
    continue;
  }
  for (const def of d.doc.definitions) {
    if (
      def.kind === "FragmentDefinition" &&
      !fragments[d.api].has(def.name.value)
    ) {
      fragments[d.api].set(def.name.value, def);
    }
  }
}

function usedFragments(node, pool, seen = new Set()) {
  visit(node, {
    FragmentSpread(s) {
      const name = s.name.value;
      if (seen.has(name) || !pool.has(name)) {
        return;
      }
      seen.add(name);
      usedFragments(pool.get(name), pool, seen);
    },
  });
  return seen;
}

const schemas = {
  storefront: loadSchema("storefront"),
  "customer-account": loadSchema("customer-account"),
};
const rules = specifiedRules.filter((r) => r !== NoUnusedFragmentsRule);

for (const d of docs) {
  if (d.api === "admin") {
    continue;
  }
  const pool = fragments[d.api];
  for (const def of d.doc.definitions) {
    const root = def.kind === "OperationDefinition" ? def : null;
    if (!root) {
      continue;
    }
    const names = usedFragments(root, pool);
    const doc = {
      kind: "Document",
      definitions: [root, ...[...names].map((n) => pool.get(n))],
    };
    for (const e of validate(schemas[d.api], doc, rules)) {
      errors.push(`${d.file}:${d.line}\n  ${e.message}`);
    }
  }
}

if (errors.length) {
  console.error(`\n✖ ${errors.length} GraphQL error(s):\n`);
  console.error(errors.join("\n\n"));
  process.exit(1);
}
console.log(`✓ ${docs.length} GraphQL documents valid`);
