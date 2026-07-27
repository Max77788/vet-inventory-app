import assert from "node:assert/strict";
import { catalogSearchFilter } from "../lib/catalog-search.ts";

assert.equal(catalogSearchFilter("антибіотик"), "name.ilike.*антибіотик*,category.ilike.*антибіотик*");
assert.equal(catalogSearchFilter("Вангард Плюс"), "name.ilike.*Вангард Плюс*,category.ilike.*Вангард Плюс*");
assert.equal(catalogSearchFilter("   "), null);
assert.equal(catalogSearchFilter("антибіотик,(test)"), "name.ilike.*антибіотикtest*,category.ilike.*антибіотикtest*");

console.log("catalog search regression checks passed");
