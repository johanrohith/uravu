const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const auth = fs.readFileSync(path.join(root, "auth.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const worker = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const schema = fs.readFileSync(path.join(root, "supabase", "schema.sql"), "utf8");
const permissionsMigration = fs.readFileSync(path.join(root, "supabase", "member-permissions-migration.sql"), "utf8");
const linkingMigration = fs.readFileSync(path.join(root, "supabase", "linking-requests-migration.sql"), "utf8");
const recordDeletionMigration = fs.readFileSync(path.join(root, "supabase", "record-deletion-permissions-migration.sql"), "utf8");
const singleTreeMigration = fs.readFileSync(path.join(root, "supabase", "single-tree-linking-migration.sql"), "utf8");

const dateHelperStart = app.indexOf("function datePartsValid");
const dateHelperEnd = app.indexOf("function formatDateEntry", dateHelperStart);
assert.ok(dateHelperStart >= 0 && dateHelperEnd > dateHelperStart);
const parsePartialDate = new Function(app.slice(dateHelperStart, dateHelperEnd) + "\nreturn parsePartialDate;")();
assert.deepEqual(parsePartialDate("24-06-1985"), { valid:true, value:"1985-06-24", date:"1985-06-24", precision:"day" });
assert.deepEqual(parsePartialDate("06-1985"), { valid:true, value:"1985-06", date:null, precision:"month-year" });
assert.deepEqual(parsePartialDate("1985"), { valid:true, value:"1985", date:null, precision:"year" });
assert.deepEqual(parsePartialDate("24-06"), { valid:true, value:"06-24", date:null, precision:"month-day" });
assert.deepEqual(parsePartialDate("06"), { valid:true, value:"06", date:null, precision:"month" });
assert.equal(parsePartialDate("31-02-1985").valid, false);

function extractFunction(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, "Could not extract " + startMarker);
  return source.slice(start, end);
}

const generationMapSource = extractFunction(app, "function generationMap() {", "\n  function relationNames");
const relationshipLabelsSource = extractFunction(
  app,
  "function relationshipLabelsForCurrentUser() {",
  "\n  function renderPersonConnectOptions"
);
const familyState = {
  user: { id:"current-user" },
  language: "en",
  members: [{ user_id:"current-user", person_id:"me" }],
  people: [
    { id:"great-grandfather", full_name:"Great Grandpa", gender:"male" },
    { id:"great-grandmother", full_name:"Great Grandma", gender:"female" },
    { id:"grandfather", full_name:"Grandpa", gender:"male" },
    { id:"grandmother", full_name:"Grandma", gender:"female" },
    { id:"parent", full_name:"Parent", gender:"other" },
    { id:"me", full_name:"Me", gender:"other" },
    { id:"child", full_name:"Child", gender:"other" },
    { id:"grandchild", full_name:"Grandchild", gender:"other" },
    { id:"great-grandchild", full_name:"Great Grandchild", gender:"other" }
  ],
  relationships: [
    { person_id:"great-grandfather", related_person_id:"grandfather", relationship_type:"parent" },
    { person_id:"great-grandmother", related_person_id:"grandmother", relationship_type:"parent" },
    { person_id:"grandfather", related_person_id:"parent", relationship_type:"parent" },
    { person_id:"grandmother", related_person_id:"parent", relationship_type:"parent" },
    { person_id:"parent", related_person_id:"me", relationship_type:"parent" },
    { person_id:"me", related_person_id:"child", relationship_type:"parent" },
    { person_id:"child", related_person_id:"grandchild", relationship_type:"parent" },
    { person_id:"grandchild", related_person_id:"great-grandchild", relationship_type:"parent" }
  ]
};
const createGenerationMap = new Function("state", generationMapSource + "\nreturn generationMap;");
const familyLevels = createGenerationMap(familyState)();
const levelOf = id => Array.from(familyLevels.entries()).find(([, people]) => people.some(person => person.id === id))?.[0];
assert.equal(levelOf("grandfather"), levelOf("grandmother"), "Co-parents should share a generation");

const createRelationshipLabeler = new Function("state", relationshipLabelsSource + "\nreturn relationshipLabelsForCurrentUser;");
const labels = createRelationshipLabeler(familyState)();
assert.equal(labels.get("grandfather"), "Grandfather");
assert.equal(labels.get("grandmother"), "Grandmother");
assert.equal(labels.get("great-grandfather"), "Great-grandfather");
assert.equal(labels.get("great-grandmother"), "Great-grandmother");
assert.equal(labels.get("great-grandchild"), "Great-grandchild");

familyState.language = "ta";
const tamilLabels = createRelationshipLabeler(familyState)();
assert.equal(tamilLabels.get("great-grandfather"), "கொள்ளுத்தாத்தா");
assert.equal(tamilLabels.get("great-grandmother"), "கொள்ளுப்பாட்டி");

assert.match(html, /id="signed-out"/);
assert.match(html, /id="dashboard"/);
assert.match(html, /id="request-modal"/);
assert.match(html, /id="family-tree-viewport"/);
assert.match(html, /id="family-tree-lines"/);
assert.match(html, /id="family-tree-nodes"/);
assert.match(html, /styles\.css/);
assert.match(html, /app\.js/);
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
assert.match(app, /function isOwner/);
assert.match(app, /function isManager/);
assert.match(app, /uravu_delete_tree/);
assert.match(app, /family-tree-lines/);
assert.match(app, /family-node-card/);
assert.match(app, /relationshipLabelsForCurrentUser/);
assert.match(app, /function syncSpouseChildLinks/);
assert.match(app, /function backfillExistingSpouseChildren/);
assert.match(app, /clearPersonForm\(\);\s*if \(!wasEditing && !isManager\(\)\) await requestLinkToPerson/);
assert.match(app, /clearPersonForm\(\);\s*if \(!isManager\(\) && personId\) await requestLinkToPerson/);
assert.match(app, /const layoutPartners = new Map/);
assert.match(app, /addLayoutPartner\(parentId, otherId\)/);
assert.match(app, /english="Wife";tamil="மனைவி"/);
assert.match(app, /graph-relationship-label/);
assert.match(html, /English Name/);
assert.match(html, /id="person-tamil"[^>]*required/);
assert.match(html, /id="person-gender" required/);
assert.match(html, /id="person-birth-calendar" type="date"/);
assert.match(html, /id="person-death-calendar" type="date"/);
assert.match(html, /id="person-birth" type="text"[^>]*placeholder="DD-MM-YYYY"/);
assert.match(html, /id="person-death" type="text"[^>]*placeholder="DD-MM-YYYY"/);
assert.ok(!app.includes("Family data is loaded from Supabase, not browser cache"));
assert.match(schema, /tamil_name text not null/);
assert.match(schema, /gender text not null/);
assert.ok(permissionsMigration.includes("alter table public.uravu_people alter column tamil_name set not null"));
assert.ok(permissionsMigration.includes("alter table public.uravu_people alter column gender set not null"));
assert.doesNotMatch(html, /id="access-requests-list"/);
assert.match(html, /id="linking-requests-list"/);
assert.ok(styles.includes(".dashboard.tree-open .action-grid"));
assert.match(app, /Every connected spouse or co-parent group gets one adjacent block/);
assert.ok(!app.includes("coupleGap + 2"));
assert.match(app, /function isManager\(\) \{\s*return Boolean\(state.activeMembership && state.activeMembership.person_id\);/);
assert.match(schema, /public.uravu_can_edit_tree/);
assert.match(app, /if \(!person \|\| !canEditPerson\(person\) \|\| !state\.activeTree\) return;/);
assert.match(app, /canDelete \? '<button class="danger-button" type="button" data-delete-person=/);
assert.match(schema, /create policy uravu_people_delete_owner on public\.uravu_people\s+for delete to authenticated using \(public\.uravu_has_tree_role\(tree_id,array\['owner'\]\)\)/);
assert.match(recordDeletionMigration, /create policy uravu_people_delete_owner on public\.uravu_people/);
assert.doesNotMatch(recordDeletionMigration, /create policy uravu_people_delete_editor/i);
assert.ok(!schema.includes("role in ('owner', 'admin'"));
assert.match(permissionsMigration, /set role = 'member'/);
assert.match(permissionsMigration, /public.uravu_can_edit_tree/);
assert.match(permissionsMigration, /Only the tree owner or a member linked to a family record can review requests/);
assert.match(linkingMigration, /Only the owner or a member linked to a family record can link accounts/);
assert.match(linkingMigration, /Only the tree owner can unlink an account/);
assert.match(app, /state\.requests\.filter\(request => request\.request_type === "link"\)/);
assert.ok(!schema.includes("Only the tree owner can review family-record assignment requests"));
assert.match(html, /id="person-deceased"/);

assert.match(html, /id="person-tamil"[^>]*required/);
assert.match(html, /id="person-gender" required/);
assert.match(html, /id="person-birth-calendar" type="date"/);
assert.match(html, /id="person-death-calendar" type="date"/);
assert.match(html, /placeholder="DD-MM-YYYY"/);
assert.ok(!html.includes("Family data is loaded from Supabase, not browser cache"));
assert.doesNotMatch(html, /id="access-requests-panel"/);
assert.match(html, /id="linking-requests-panel"/);
assert.ok(!html.includes("Access, role and linking requests"));
assert.match(app, /function syncCalendarFromText/);
assert.match(app, /function syncTextFromCalendar/);
assert.match(app, /Your account must be linked to a family record before you can review linking requests/);
assert.match(html, /id="death-date-field" hidden/);
assert.match(html, /id="person-connections-section" hidden/);
assert.match(html, /connection-input-group/);
assert.match(app, /function syncDeathDateField/);
assert.match(app, /function parsePartialDate/);
assert.match(app, /function formatFamilyDate/);
assert.match(app, /function addConnectionFromForm/);
assert.match(app, /data\.is_deceased = deceased/);
assert.ok(app.includes("death_date:deceased ? (death.date || null) : null"));
assert.match(app, /birth_date_text/);
assert.match(app, /death_date_text/);
assert.match(html, /id="add-connection-button"/);
assert.match(html, /id="add-connection-heading">Add a connection/);
assert.match(html, /type="text" inputmode="numeric" maxlength="10"/);
assert.match(html, /app\.js\?v=uravu-relationships-20261019-1/);
assert.match(styles, /field-help/);
assert.match(styles, /connection-add-actions/);

assert.match(app, /function renderEditorConnections/);
assert.ok(app.includes("if (!connectedId || !relationshipType)"))
assert.match(app, /person-connections-list/);
assert.match(styles, /person-connection-row/);
assert.match(styles, /connection-input-group/);
assert.match(styles, /\.family-node-card/);
assert.doesNotMatch(app.slice(app.indexOf("function renderPersonCard"), app.indexOf("function renderMembers")), /data-remove-relationship/);
assert.match(app, /function openPersonDetails/);
assert.match(app, /data-view-person/);
assert.ok(app.includes('$$("[data-view-person]")'));
assert.ok(app.includes('$$("[data-edit-person]")'));
assert.ok(app.includes('$$("[data-remove-relationship]")'));
assert.match(html, /id="person-details-modal"/);
assert.match(app, /person-connection-row/);
assert.match(styles, /person-details-list/);
assert.match(html, /app\.js\?v=uravu-relationships-20261019-1/);
assert.match(styles, /graph-relationship-label/);
assert.doesNotMatch(app, /\$\("#people-list"\)/);
assert.match(styles, /\.modal-backdrop/);
assert.match(styles, /\.person-card/);

assert.doesNotMatch(app, /Johan Rohith|S\. Priya|ggf-p|cousin-p1|demo family data/i);
assert.doesNotMatch(app, /localStorage\.(setItem|getItem).*tree/i);
assert.match(worker, /Deliberately no fetch handler/);
assert.doesNotMatch(worker, /caches\.match\(event\.request\)/i);

assert.match(schema, /enable row level security/ig);
assert.ok(schema.includes("role text not null default 'member' check (role in ('owner', 'member'))"));
assert.match(schema, /Only the owner or a member linked to a family record can link accounts/);
assert.match(schema, /uravu_one_pending_request_per_user_tree/);
assert.match(schema, /would create a family-tree cycle/);


function relationLabel(egoId,people,relationships,targetId,language="ta"){
 const state={user:{id:"current-user"},language,members:[{user_id:"current-user",person_id:egoId}],people,relationships};
 return new Function("state",relationshipLabelsSource+"\nreturn relationshipLabelsForCurrentUser;")(state)().get(targetId);
}
function person(id,gender,birth_date){const p={id,full_name:id,gender};if(birth_date)p.birth_date=birth_date;return p;}
function parentLink(person_id,related_person_id){return {person_id,related_person_id,relationship_type:"parent"};}
function spouseLink(person_id,related_person_id){return {person_id,related_person_id,relationship_type:"spouse"};}
{
 const p=[person("gp","male","1950-01-01"),person("dad","male","1980-01-01"),person("uncle","male","1978-01-01"),person("younger","male","1982-01-01"),person("unknown","male"),person("me","male","2004-01-01")];
 const r=[parentLink("gp","dad"),parentLink("gp","uncle"),parentLink("gp","younger"),parentLink("gp","unknown"),parentLink("dad","me")];
 assert.equal(relationLabel("me",p,r,"uncle"),"பெரியப்பா");
 assert.equal(relationLabel("me",p,r,"younger"),"சித்தப்பா");
 assert.equal(relationLabel("me",p,r,"unknown"),"தந்தையின் சகோதரர் (வயது உறுதி இல்லை)");
}
{
 const p=[person("gp","male","1950-01-01"),person("dad","male","1978-01-01"),person("aunt","female","1980-01-01"),person("me","male","2000-01-01"),person("om","male","1998-01-01"),person("ym","male","2002-01-01"),person("of","female","1997-01-01"),person("yf","female","2003-01-01"),person("uf","female")];
 const r=[parentLink("gp","dad"),parentLink("gp","aunt"),parentLink("dad","me"),parentLink("aunt","om"),parentLink("aunt","ym"),parentLink("aunt","of"),parentLink("aunt","yf"),parentLink("aunt","uf")];
 assert.equal(relationLabel("me",p,r,"om"),"அத்தான் (அத்தை மகன்)");
 assert.equal(relationLabel("me",p,r,"ym"),"மச்சான் (அத்தை மகன்)");
 assert.equal(relationLabel("me",p,r,"of"),"அண்ணி (அத்தை மகள்)");
 assert.equal(relationLabel("me",p,r,"yf"),"மச்சினி (அத்தை மகள்)");
 assert.equal(relationLabel("me",p,r,"uf"),"அத்தை மகள் (வயது உறுதி இல்லை)");
}
{
 const p=[person("gp","male","1950-01-01"),person("dad","male","1980-01-01"),person("uncle","male","1975-01-01"),person("me","male","2000-01-01"),person("cousin","male","1998-01-01")];
 const r=[parentLink("gp","dad"),parentLink("gp","uncle"),parentLink("dad","me"),parentLink("uncle","cousin")];
 assert.equal(relationLabel("me",p,r,"cousin"),"அண்ணன் (பெரியப்பா மகன்)");
}
{
 const p=[person("gm","female","1950-01-01"),person("mom","female","1980-01-01"),person("uncle","male","1978-01-01"),person("me","female","2000-01-01"),person("om","male","1998-01-01"),person("yf","female","2002-01-01")];
 const r=[parentLink("gm","mom"),parentLink("gm","uncle"),parentLink("mom","me"),parentLink("uncle","om"),parentLink("uncle","yf")];
 assert.equal(relationLabel("me",p,r,"om"),"அத்தான் (மாமா மகன்)");
 assert.equal(relationLabel("me",p,r,"yf"),"மச்சினி (மாமா மகள்)");
}
{
 const p=[person("me","male","2000-01-01"),person("wife","female","2001-01-01"),person("wp","male","1970-01-01"),person("wb","male","1998-01-01"),person("son","male","1997-01-01"),person("me2","female","2000-01-01"),person("husband","male","2001-01-01"),person("hp","female","1970-01-01"),person("hs","female","1998-01-01"),person("daughter","female","2002-01-01")];
 const r=[spouseLink("me","wife"),parentLink("wp","wife"),parentLink("wp","wb"),parentLink("wb","son"),spouseLink("me2","husband"),parentLink("hp","husband"),parentLink("hp","hs"),parentLink("hs","daughter")];
 assert.equal(relationLabel("me",p,r,"son"),"அத்தான் (மனைவியின் சகோதரர் மகன்)");
 assert.equal(relationLabel("me2",p,r,"daughter"),"மச்சினி (கணவரின் சகோதரி மகள்)");
}
{
 const p=[person("gp","male","1950-01-01"),person("dad","male","1975-01-01"),person("me","female","2000-01-01"),person("sis","female","1998-01-01"),person("husband","male","1997-01-01"),person("nephew","male","2020-01-01")];
 const r=[parentLink("gp","dad"),parentLink("dad","me"),parentLink("dad","sis"),spouseLink("sis","husband"),parentLink("sis","nephew")];
 assert.equal(relationLabel("me",p,r,"husband"),"சகலை");
 assert.equal(relationLabel("me",p,r,"nephew"),"அக்கா மகன்");
}

{
 const people=[person("biological-dad","male","1975-01-01"),person("me","female","2000-01-01"),person("step-mom","female","1978-01-01")];
 const edges=[parentLink("biological-dad","me"),spouseLink("biological-dad","step-mom")];
 assert.equal(relationLabel("me",people,edges,"step-mom","en"),"Stepmother");
 assert.equal(relationLabel("me",people,edges,"step-mom","ta"),"மாற்றாந்தாய்");
}


{
 // Siblings of the paternal grandfather: age is compared with the grandfather.
 const people=[
  person("great-grandpa","male","1920-01-01"),
  person("grandpa","male","1950-01-01"),
  person("older-brother","male","1948-01-01"),
  person("younger-brother","male","1952-01-01"),
  person("unknown-brother","male"),
  person("older-sister","female","1945-01-01"),
  person("younger-sister","female","1955-01-01"),
  person("unknown-sister","female"),
  person("dad","male","1980-01-01"),
  person("me","female","2005-01-01")
 ];
 const relationships=[
  parentLink("great-grandpa","grandpa"),parentLink("great-grandpa","older-brother"),
  parentLink("great-grandpa","younger-brother"),parentLink("great-grandpa","unknown-brother"),
  parentLink("great-grandpa","older-sister"),parentLink("great-grandpa","younger-sister"),
  parentLink("great-grandpa","unknown-sister"),parentLink("grandpa","dad"),parentLink("dad","me")
 ];
 assert.equal(relationLabel("me",people,relationships,"older-brother","en"),"Older Grandfather");
 assert.equal(relationLabel("me",people,relationships,"younger-brother","en"),"Younger Grandfather");
 assert.equal(relationLabel("me",people,relationships,"unknown-brother","en"),"Grandfather");
 assert.equal(relationLabel("me",people,relationships,"older-sister","en"),"Older Grandmother");
 assert.equal(relationLabel("me",people,relationships,"younger-sister","en"),"Younger Grandmother");
 assert.equal(relationLabel("me",people,relationships,"unknown-sister","en"),"Grandmother");
 assert.equal(relationLabel("me",people,relationships,"older-brother","ta"),"பெரிய தாத்தா");
 assert.equal(relationLabel("me",people,relationships,"younger-brother","ta"),"சின்ன தாத்தா");
 assert.equal(relationLabel("me",people,relationships,"unknown-brother","ta"),"தாத்தா");
 assert.equal(relationLabel("me",people,relationships,"older-sister","ta"),"பெரிய பாட்டி");
 assert.equal(relationLabel("me",people,relationships,"younger-sister","ta"),"சின்ன பாட்டி");
 assert.equal(relationLabel("me",people,relationships,"unknown-sister","ta"),"பாட்டி");
}


{
 // A brother's wife uses அண்ணி / கொழுந்தியாள்; a wife's sister's husband is சகலை.
 const people=[
  person("grandpa","male","1950-01-01"),person("dad","male","1975-01-01"),
  person("me","female","2000-01-01"),person("older-brother","male","1997-01-01"),
  person("younger-brother","male","2002-01-01"),person("older-brother-wife","female","1998-01-01"),
  person("younger-brother-wife","female","2003-01-01"),
  person("me2","male","2000-01-01"),person("wife","female","2001-01-01"),
  person("wife-parent","female","1970-01-01"),person("wife-sister","female","1998-01-01"),
  person("wife-sister-husband","male","1997-01-01")
 ];
 const relationships=[
  parentLink("grandpa","dad"),parentLink("dad","me"),parentLink("dad","older-brother"),parentLink("dad","younger-brother"),
  spouseLink("older-brother","older-brother-wife"),spouseLink("younger-brother","younger-brother-wife"),
  spouseLink("me2","wife"),parentLink("wife-parent","wife"),parentLink("wife-parent","wife-sister"),spouseLink("wife-sister","wife-sister-husband")
 ];
 assert.equal(relationLabel("me",people,relationships,"older-brother-wife"),"அண்ணி");
 assert.equal(relationLabel("me",people,relationships,"younger-brother-wife"),"கொழுந்தியாள்");
 assert.equal(relationLabel("me2",people,relationships,"wife-sister-husband"),"சகலை");
}

console.log("Uravu clean-app and Tamil relationship smoke checks passed.");
