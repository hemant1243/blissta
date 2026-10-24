# Blissta Vault

Search layer over the "Blissta Vault" Google Drive folder.

- `src/vault.html`: the published page (artifact with the `db` capability). Reads collection `vault`:
  `folders` (Drive folder ids per product / editor / month), `meta` (syncedAt, count),
  `idx-<product-slug>` (clips array per product), `tags` (per clip: winner, word).
- `index.js`: turns raw Drive listings into those docs. `node vault/index.js <listingsDir> <outDir> <rootFolderId>`.
- Sync: an hourly routine lists the Drive tree, runs `index.js`, and writes the docs with `write_db`.

Folder rule: `Blissta Vault / Product / Editor / YYYY-MM / PRODUCT_EDITOR_YYYY-MM-DD_concept_v1.mp4`.
Files that do not match the name rule land on the "Fix the name" shelf.
