const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app-v2.js"), "utf8");
const auth = fs.readFileSync(path.join(root, "auth.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles-v2.css"), "utf8");
const schema = fs.readFileSync(path.join(root, "supabase", "schema.sql"), "utf8");

assert.match(html, /id="signed-out"/);
assert.match(html, /id="dashboard"/);
assert.match(html, /id="request-modal"/);
assert.match(html, /id="family-tree-viewport"/);
assert.match(html, /id="family-tree-lines"/);
assert.match(html, /id="family-tree-nodes"/);
assert.match(html, /styles-v2\.css/);
assert.match(html, /app-v2\.js/);
assert.match(html, /Sign in with Google/);
assert.match(auth, /signInWithOAuth/);
assert.match(auth, /provider:\s*"google"/);

assert.match(app, /from\("uravu_family_trees"\)/);
assert.match(app, /from\("uravu_people"\)/);
assert.match(app, /from\("uravu_relationships"\)/);
assert.match(app, /from\("uravu_tree_members"\)/);
assert.match(app, /uravu_create_tree/);
assert.match(app, /uravu_request_tree_access/);
assert.match(app, /uravu_review_tree_request/);
assert.match(app, /uravu_assign_member_person/);
assert.match(app, /uravu_set_member_role/);
assert.match(app, /uravu_delete_tree/);
assert.match(app, /family-tree-lines/);
assert.match(app, /family-node-card/);
assert.doesNotMatch(app, /\$\("#people-list"\)/);
assert.match(styles, /\.modal-backdrop/);
assert.match(styles, /\.person-card/);

assert.doesNotMatch(app, /Johan Rohith|S\. Priya|ggf-p|cousin-p1|demo family data/i);
assert.doesNotMatch(app, /localStorage\.(setItem|getItem).*tree/i);
assert.match(worker, /Deliberately no fetch handler/);
assert.doesNotMatch(worker, /caches\.match\(event\.request\)/i);

assert.match(schema, /enable row level security/ig);
assert.match(schema, /Only the tree owner can grant admin access/);
assert.match(schema, /Only the tree owner or an admin can assign family entries/);
assert.match(schema, /uravu_one_pending_request_per_user_tree/);
assert.match(schema, /would create a family-tree cycle/);

console.log("Uravu clean-app smoke checks passed.");
