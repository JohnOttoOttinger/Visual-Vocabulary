#!/usr/bin/env node
// Copies the Oddtoe design system's tokens.json into this repo. The design system is the source:
// change a colour there, run this, and every chart follows. Nothing here edits a token by hand.
import { copyFileSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE = process.env.ODDTOE_DS ||
  join(homedir(), "Documents/Oddtoe - iCloud Apple/Oddtoe Design System for Claude/03_design-tokens/tokens.json");
const HERE = dirname(fileURLToPath(import.meta.url));
copyFileSync(SOURCE, join(HERE, "tokens.json"));
const v = JSON.parse(readFileSync(join(HERE, "tokens.json"), "utf8")).version;
console.log(`brand/tokens.json <- design system v${v}`);
