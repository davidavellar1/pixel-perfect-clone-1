import { it } from "node:test";
import assert from "node:assert/strict";
import { relatedProjects } from "./relatedProjects";

it("private city or host text cannot create a news association", () => {
  const item = { title: "Private city heat project", country_codes: ["FR"], technologies: [] };
  const projects = [{ id: "p", country_code: "FR", technology: "geothermal", city: "Private city" }];
  assert.deepEqual(relatedProjects(item, projects), []);
});
it("public country and technology create the same association for every matching listing", () => {
  assert.deepEqual(relatedProjects({ country_codes: ["FR"], technologies: ["geothermal"] }, [
    { id: "a", country_code: "FR", technology: "geothermal" },
    { id: "b", country_code: "FR", technology: "geothermal" },
    { id: "c", country_code: "DK", technology: "geothermal" },
  ]), ["a", "b"]);
});