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
const birthOrderMigration = fs.readFileSync(path.join(root, "supabase", "sibling-birth-order-migration.sql"), "utf8");

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

const siblingAgeHelpersSource = extractFunction(
  app,
  "function birthDateParts(person) {",
  "\n  function sortUnitPeopleByParentCenter"
);
const { compareBirthDatesOlderFirst, compareBirthOrderOlderFirst, compareSiblingUnitsByAge,
  buildSiblingOrderPositions, buildSiblingParentContext, findDuplicateSiblingBirthOrder } = new Function(
  siblingAgeHelpersSource + "\nreturn { birthDateParts, compareBirthDatesOlderFirst, compareBirthOrderOlderFirst, compareSiblingUnitsByAge, buildSiblingOrderPositions, buildSiblingParentContext, findDuplicateSiblingBirthOrder };"
)();
{
  assert.ok(compareBirthDatesOlderFirst(
    { birth_date:"1985-06-24" }, { birth_date:"2001-02-03" }
  ) < 0, "Older full birth date must sort first");
  assert.ok(compareBirthDatesOlderFirst(
    { birth_date_text:"24-06-1985" }, { birth_date_text:"03-02-2001" }
  ) < 0, "DD-MM-YYYY text dates must sort oldest first");
  assert.ok(compareBirthDatesOlderFirst(
    { birth_date_text:"06-1985" }, { birth_date_text:"02-2001" }
  ) < 0, "Month-year partial dates must sort oldest first");
  assert.equal(compareBirthDatesOlderFirst(
    { birth_date_text:"1985" }, { birth_date:"1985-06-24" }
  ), 0, "A year-only date must not invent a month/day order within that year");

  const oldSibling = { people:[{ id:"old", full_name:"Z Older", birth_date:"1980-01-01" }] };
  const youngSibling = { people:[{ id:"young", full_name:"A Younger", birth_date:"2000-01-01" }] };
  const parentsByChild = new Map([
    ["old",new Set(["mother","father"])],
    ["young",new Set(["mother","father"])]
  ]);
  assert.ok(compareSiblingUnitsByAge(oldSibling,youngSibling,parentsByChild) < 0,
    "Older sibling must sort before younger sibling despite reverse alphabetical names");

  const halfOlder = { people:[{ id:"half-old", full_name:"Z Half Older", birth_date:"1990-01-01" }] };
  const halfYounger = { people:[{ id:"half-young", full_name:"A Half Younger", birth_date:"2002-01-01" }] };
  const halfSiblingParents = new Map([
    ["half-old",new Set(["mother","other-father"])],
    ["half-young",new Set(["mother","father"])]
  ]);
  assert.ok(compareSiblingUnitsByAge(halfOlder,halfYounger,halfSiblingParents) < 0,
    "Half-siblings who share one parent must still follow age order");

  const unknownSibling = { people:[{ id:"unknown", full_name:"Unknown Age" }] };
  assert.equal(compareSiblingUnitsByAge(unknownSibling,youngSibling,parentsByChild), 0,
    "Unknown birth dates must fall back to existing stable layout ordering");

  const manuallyOlder = { people:[{ id:"manual-old", full_name:"Z Older by Order", birth_order:1 }] };
  const manuallyYounger = { people:[{ id:"manual-young", full_name:"A Younger by Order", birth_order:2 }] };
  const unknownDateParents = new Map([
    ["manual-old",new Set(["mother"])], ["manual-young",new Set(["mother"])]
  ]);
  assert.ok(compareBirthOrderOlderFirst(manuallyOlder.people[0], manuallyYounger.people[0]) < 0,
    "Lower manual birth-order ranks must come first");
  assert.ok(compareSiblingUnitsByAge(manuallyOlder,manuallyYounger,unknownDateParents) < 0,
    "Manual birth order must sort siblings left-to-right even when birth dates are unknown and names sort in the opposite direction");

  const datedOldest = { id:"dated-oldest", full_name:"Oldest by date", birth_date:"1940-01-01" };
  const manuallySecond = { id:"manual-second", full_name:"Unknown date second", birth_order:2 };
  const datedYoungest = { id:"dated-youngest", full_name:"Youngest by date", birth_date:"1970-01-01" };
  const mixedBirthDataParents = new Map([
    [datedOldest.id,new Set(["shared-parent"])],
    [manuallySecond.id,new Set(["shared-parent"])],
    [datedYoungest.id,new Set(["shared-parent"])]
  ]);
  const mixedSiblingPeople = [datedOldest, manuallySecond, datedYoungest];
  const mixedPositions = buildSiblingOrderPositions(mixedSiblingPeople);
  assert.deepEqual(
    [mixedPositions.get(datedOldest.id), mixedPositions.get(manuallySecond.id), mixedPositions.get(datedYoungest.id)],
    [1,2,3],
    "An undated sibling assigned order 2 must be placed after the oldest dated sibling and before the next dated sibling"
  );
  const manualSecondUnit = { people:[manuallySecond] };
  const oldDateUnit = { people:[datedOldest] };
  const youngDateUnit = { people:[datedYoungest] };
  assert.ok(compareSiblingUnitsByAge(oldDateUnit,manualSecondUnit,mixedBirthDataParents,mixedSiblingPeople) < 0);
  assert.ok(compareSiblingUnitsByAge(manualSecondUnit,youngDateUnit,mixedBirthDataParents,mixedSiblingPeople) < 0);

  const dateAlwaysWins = buildSiblingOrderPositions([
    { id:"old-date", full_name:"Older dated", birth_date:"1940-01-01" },
    { id:"young-date", full_name:"Younger dated", birth_date:"1970-01-01", birth_order:1 }
  ]);
  assert.ok(dateAlwaysWins.get("old-date") < dateAlwaysWins.get("young-date"),
    "Known birthdates should sort dated siblings by age even if a dated record also has a manual order value");

  const siblingContext = buildSiblingParentContext([
    { person_id:"parent", related_person_id:"existing", relationship_type:"parent" },
    { person_id:"parent", related_person_id:"candidate", relationship_type:"parent" },
    { person_id:"unrelated-parent", related_person_id:"unrelated", relationship_type:"parent" }
  ]);
  const duplicatePeople = [
    { id:"existing", full_name:"Existing", birth_order:3 },
    { id:"candidate", full_name:"Candidate" },
    { id:"unrelated", full_name:"Unrelated", birth_order:3 }
  ];
  assert.equal(
    findDuplicateSiblingBirthOrder("candidate",3,["parent"],duplicatePeople,siblingContext.parentsByChild)?.id,
    "existing",
    "A duplicate manual order within a shared sibling set must be found"
  );
  assert.equal(
    findDuplicateSiblingBirthOrder("candidate",3,["parent"],duplicatePeople,
      new Map([["unrelated",new Set(["unrelated-parent"])],["existing",new Set(["other-parent"])]])),
    null,
    "The same order number in an unrelated sibling set must not block saving"
  );

  assert.match(html, /id="person-birth-order" type="number" min="1" max="999" step="1"/);
  assert.match(app, /data\.birth_order = birthOrder/);
  assert.match(app, /person\.birth_order == null \? "" : String\(person\.birth_order\)/);
  assert.match(schema, /birth_order integer/);
  assert.ok(birthOrderMigration.includes("add column if not exists birth_order integer"));
  assert.ok(birthOrderMigration.includes("uravu_people_birth_order_check"));
}

const spouseUnitSortSource = extractFunction(
  app,
  "function sortUnitPeopleByParentCenter(unit, parentCenter) {",
  "\n  function renderPeople"
);
const sortUnitPeopleByParentCenter = new Function(
  spouseUnitSortSource + "\nreturn sortUnitPeopleByParentCenter;"
)();
{

  const unit = {
    people:[
      { id:"maternal-grandmother", full_name:"A Grandma" },
      { id:"paternal-grandfather", full_name:"Z Grandpa" }
    ],
    sortName:"A Grandma"
  };
  const centers = new Map([
    ["maternal-grandmother", 760],
    ["paternal-grandfather", 220]
  ]);
  sortUnitPeopleByParentCenter(unit, individual => centers.get(individual.people[0].id) ?? null);
  assert.deepEqual(
    unit.people.map(person => person.id),
    ["paternal-grandfather", "maternal-grandmother"],
    "Spouses should remain adjacent but follow their own ancestral branches left-to-right"
  );
}

const familyBlockTargetCenterSource = extractFunction(
  app,
  "function familyBlockTargetCenter(units, parentPositions) {",
  "\n  function renderPeople"
);
const familyBlockTargetCenter = new Function(
  familyBlockTargetCenterSource + "\nreturn familyBlockTargetCenter;"
)();
{
  const spouseUnit = { width:560, parentCenter:490 };
  assert.equal(
    familyBlockTargetCenter([spouseUnit], [{ x:80, width:270 }]),
    215,
    "A child's sibling block should centre on its recorded parent family, not the spouse's separate ancestral branch"
  );
  assert.equal(
    familyBlockTargetCenter([spouseUnit], [{ x:80, width:270 }, { x:900, width:270 }]),
    625,
    "A two-parent family block should centre directly between those parent records even when a spouse has a distant branch"
  );
  assert.equal(
    familyBlockTargetCenter([{ width:270, parentCenter:null }], [{ x:100, width:270 }, { x:500, width:270 }]),
    435,
    "Unaligned blocks should retain the average of their parent records as a fallback"
  );
}

const layoutAnchorSource = extractFunction(
  app,
  "function chooseTreeLayoutAnchorPersonId(",
  "\n  function treeLayoutAnchorPersonId"
);
const chooseTreeLayoutAnchorPersonId = new Function(
  layoutAnchorSource + "\nreturn chooseTreeLayoutAnchorPersonId;"
)();
{
  const ownerPerson = { id:"owner-person", full_name:"Owner", created_at:"2020-01-01" };
  const otherPerson = { id:"other-person", full_name:"Other", created_at:"2019-01-01" };
  const olderRoot = { id:"older-root", full_name:"Family root", created_at:"2000-01-01" };
  const people = [otherPerson, ownerPerson, olderRoot];
  const members = [
    { user_id:"owner-account", role:"owner", person_id:ownerPerson.id },
    { user_id:"second-account", role:"member", person_id:otherPerson.id }
  ];
  const relationships = [
    { relationship_type:"parent", person_id:olderRoot.id, related_person_id:ownerPerson.id },
    { relationship_type:"parent", person_id:olderRoot.id, related_person_id:otherPerson.id }
  ];
  assert.equal(
    chooseTreeLayoutAnchorPersonId(people, relationships, members),
    ownerPerson.id,
    "Tree layout should use the same linked owner record regardless of which member is signed in"
  );

  const noOwnerLink = [
    { user_id:"owner-account", role:"owner", person_id:null },
    { user_id:"second-account", role:"member", person_id:otherPerson.id }
  ];
  assert.equal(
    chooseTreeLayoutAnchorPersonId(people, relationships, noOwnerLink),
    olderRoot.id,
    "Without an owner link, layout should choose a stable parent-graph root instead of the signed-in member"
  );
}

const inLawRootOrderingSource = extractFunction(
  app,
  "function orderExpandedInLawRootsNearSpouses(",
  "\n  function computeFamilySubtreeLayout"
);
const orderExpandedInLawRootsNearSpouses = new Function(
  inLawRootOrderingSource + "\nreturn orderExpandedInLawRootsNearSpouses;"
)();
{
  const lineagePerson = { id:"lineage-person" };
  const lineageRoot = { people:[lineagePerson] };
  const unrelatedRoot = { people:[{ id:"unrelated-root-person" }] };
  const inLawRoot = { people:[{ id:"in-law-grandparent" }] };
  const inLawParent = { people:[{ id:"in-law-parent" }] };
  const inLawSpouse = { people:[{ id:"in-law-spouse" }] };
  const roots = [lineageRoot, unrelatedRoot, inLawRoot];
  const ordered = orderExpandedInLawRootsNearSpouses(
    roots,
    new Map([[ "in-law-spouse", { spouseId:"lineage-person" } ]]),
    new Map([[ "in-law-spouse", new Set(["in-law-parent"]) ]]),
    new Set(["lineage-person"]),
    new Map([
      ["lineage-person", lineageRoot],
      ["in-law-spouse", inLawSpouse],
      ["in-law-parent", inLawParent],
      ["in-law-grandparent", inLawRoot]
    ]),
    new Map([[inLawParent, inLawRoot]]),
    new Map([[inLawRoot, new Set([inLawParent])]])
  );
  assert.deepEqual(
    ordered,
    [lineageRoot, inLawRoot, unrelatedRoot],
    "A spouse's full ancestral branch should be placed next to the related lineage branch, not left at the far edge"
  );

  const sharedRoot = { people:[{ id:"shared-grandparent" }] };
  const protectedOrder = orderExpandedInLawRootsNearSpouses(
    [lineageRoot, sharedRoot],
    new Map([[ "in-law-spouse", { spouseId:"lineage-person" } ]]),
    new Map([[ "in-law-spouse", new Set(["in-law-parent"]) ]]),
    new Set(["lineage-person"]),
    new Map([
      ["lineage-person", lineageRoot],
      ["in-law-spouse", inLawSpouse],
      ["in-law-parent", sharedRoot]
    ]),
    new Map(),
    new Map([[sharedRoot, new Set([lineageRoot])]])
  );
  assert.deepEqual(
    protectedOrder,
    [lineageRoot, sharedRoot],
    "An ancestral branch containing lineage members must not be moved as a separate in-law block"
  );
}

const nearestPlacementSource = extractFunction(
  app,
  "function placeUnitNearestTarget(",
  "\n  function computeFamilySubtreeLayout"
);
const { placeUnitNearestTarget, placeExpandedPartnerParentsNearSpouses } = new Function(
  nearestPlacementSource + "\nreturn { placeUnitNearestTarget, placeExpandedPartnerParentsNearSpouses };"
)();
{
  const parent = { id:"in-law-parent", full_name:"Spouse parent" };
  const parentUnit = { people:[parent], width:270, sortName:parent.full_name };
  const spouse = { id:"in-law-spouse", full_name:"Spouse" };
  const positions = new Map([
    [parent.id,{ x:900,y:24,width:270,height:82 }],
    ["other-left",{ x:0,y:24,width:270,height:82 }],
    ["other-right",{ x:600,y:24,width:270,height:82 }],
    [spouse.id,{ x:300,y:180,width:270,height:82 }]
  ]);
  const moved = placeExpandedPartnerParentsNearSpouses(
    new Map([[spouse.id,{ spouseId:"lineage-sibling" }]]),
    new Map([[spouse.id,new Set([parent.id])]]),
    new Map([[parent.id,new Set([spouse.id])]]),
    new Set(["lineage-sibling"]),
    new Map([[parent.id,parentUnit],[spouse.id,{ people:[spouse] }]]),
    new Map(),
    new Map(),
    positions,
    20
  );
  assert.equal(moved,1,"A standalone spouse-parent branch should be relocated near the spouse it connects to");
  assert.equal(positions.get(parent.id).x,300,
    "The spouse parent should move to the nearest collision-free spot aligned with the spouse");
  assert.equal(positions.get("other-left").x,0,"Other records on the parent row must not move");
  assert.equal(positions.get("other-right").x,600,"Other records on the parent row must not move");

  const anchoredPositions = new Map([
    [parent.id,{ x:900,y:24,width:270,height:82 }],
    [spouse.id,{ x:300,y:180,width:270,height:82 }]
  ]);
  const anchoredParentUnit = { people:[parent] };
  assert.equal(placeExpandedPartnerParentsNearSpouses(
    new Map([[spouse.id,{ spouseId:"lineage-sibling" }]]),
    new Map([[spouse.id,new Set([parent.id])]]),
    new Map([[parent.id,new Set([spouse.id])]]),
    new Set(["lineage-sibling"]),
    new Map([[parent.id,anchoredParentUnit],[spouse.id,{ people:[spouse] }]]),
    new Map([[anchoredParentUnit,{}]]),
    new Map(),
    anchoredPositions,
    20
  ),0,"Parents with their own family placement must not be moved out of that branch");
}

const expandedPartnerGuardSource = extractFunction(
  app,
  "function shouldUseExpandedInLawFamilyBlock(",
  "\n  function computeFamilySubtreeLayout"
);
const shouldUseExpandedInLawFamilyBlock = new Function(
  expandedPartnerGuardSource + "\nreturn shouldUseExpandedInLawFamilyBlock;"
)();
{
  const siblingWithSpouseParent = {
    people:[{ id:"sibling-in-bloodline" }, { id:"spouse-with-parent" }]
  };
  const lineageIds = new Set(["sibling-in-bloodline"]);
  const familyByPerson = new Map([
    ["sibling-in-bloodline", "shared-sibling-family"],
    ["spouse-with-parent", "spouse-parent-family"]
  ]);
  assert.equal(
    shouldUseExpandedInLawFamilyBlock(
      siblingWithSpouseParent, "spouse-parent-family",
      ["shared-sibling-family", "spouse-parent-family"], lineageIds, familyByPerson
    ),
    false,
    "A spouse's recorded parent must not pull a sibling couple out of its bloodline sibling-order block"
  );

  const lineageRootWithInLawParents = {
    people:[{ id:"lineage-root" }, { id:"spouse-with-family" }]
  };
  assert.equal(
    shouldUseExpandedInLawFamilyBlock(
      lineageRootWithInLawParents, "spouse-family",
      ["spouse-family"], new Set(["lineage-root"]),
      new Map([["spouse-with-family", "spouse-family"]])
    ),
    true,
    "An in-law's family branch should remain displayed when the lineage partner has no own parent-family anchor"
  );
}

const primaryFamilyChooserSource = extractFunction(
  app,
  "function choosePrimaryFamilyKey(unit, candidateKeys, activePersonId,",
  "\n  function renderPeople"
);
const choosePrimaryFamilyKey = new Function(
  primaryFamilyChooserSource + "\nreturn choosePrimaryFamilyKey;"
)();
{
  const unit = {
    people:[
      { id:"daughter", full_name:"Daughter" },
      { id:"husband", full_name:"Husband" }
    ]
  };
  const parentFamilyByPerson = new Map([
    ["daughter", "daughter-family"],
    ["husband", "husband-family"]
  ]);
  const relatednessDistance = new Map([
    ["daughter", 2],
    ["husband", Infinity]
  ]);
  const buckets = new Map([
    ["daughter-family", { parentIds:["daughter-parent"], children:["daughter", "daughter-sibling"] }],
    ["husband-family", { parentIds:["husband-parent"], children:["husband", "husband-brother", "husband-sister"] }]
  ]);
  const positions = new Map([
    ["daughter", { x:300, width:270 }],
    ["husband", { x:598, width:270 }],
    ["daughter-parent", { x:280, width:270 }],
    ["husband-parent", { x:900, width:270 }]
  ]);
  assert.equal(
    choosePrimaryFamilyKey(
      unit, ["husband-family", "daughter-family"], "daughter-side-relative",
      parentFamilyByPerson, relatednessDistance, buckets, positions
    ),
    "daughter-family",
    "A married daughter should stay with her own parent/sibling branch when that is the closer recorded bloodline, even if the spouse's branch has more siblings"
  );
  assert.equal(
    choosePrimaryFamilyKey(
      unit, ["daughter-family", "husband-family"], "husband",
      parentFamilyByPerson, relatednessDistance, buckets, positions
    ),
    "husband-family",
    "When the linked record is one of the spouses, keep the couple anchored to that linked person's own family branch"
  );
}
const relatednessBlock = extractFunction(
  app,
  "const relatednessAdjacency = new Map(",
  "const primaryFamilyByUnit = new Map();"
);
assert.match(relatednessBlock, /state\.relationships\.filter\(edge => edge\.relationship_type === "parent"\)/);
assert.doesNotMatch(relatednessBlock, /relationship_type === "spouse"/);
assert.doesNotMatch(relatednessBlock, /parentEdgesForLayout\.forEach/);

const recordDetailSource = extractFunction(
  app,
  "function familyRecordDetailLines(person) {",
  "\n  function renderPeople"
);
const createRecordDetailLines = new Function(
  "state",
  "formatFamilyDate",
  "isPersonDeceased",
  recordDetailSource + "\nreturn familyRecordDetailLines;"
);
const recordDetails = createRecordDetailLines(
  { language:"en" },
  value => String(value),
  person => Boolean(person.is_deceased)
);
assert.deepEqual(recordDetails({ birth_date_text:"24-06-1985", is_deceased:true }),
  ["Born 24-06-1985", "Living in Memory"]);
assert.deepEqual(recordDetails({ birth_date:"1985-06-24", death_date_text:"01-01-2000" }),
  ["Born 1985-06-24", "Died 01-01-2000"]);
assert.ok(
  app.indexOf("function familyRecordDetailLines(person)") < app.indexOf("function renderPeople()"),
  "The record detail helper must be in scope for both tree layout and card rendering"
);
const renderCardSource = extractFunction(
  app,
  "function renderPersonCard(person, position, relationLabel) {",
  "\n  function renderMembers"
);
assert.match(renderCardSource, /familyRecordDetailLines\(person\)/);
assert.doesNotMatch(renderCardSource, /detailLinesFor/);

const generationMapSource = extractFunction(app, "function generationMap(", "\n  function relationNames");
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
    { id:"grandfather-spouse", full_name:"Grandpa spouse", gender:"female" },
    { id:"grandmother-spouse", full_name:"Grandma spouse", gender:"male" },
    { id:"parent", full_name:"Parent", gender:"other" },
    { id:"me", full_name:"Me", gender:"other" },
    { id:"child", full_name:"Child", gender:"other" },
    { id:"grandchild", full_name:"Grandchild", gender:"other" },
    { id:"great-grandchild", full_name:"Great Grandchild", gender:"other" }
  ],
  relationships: [
    { person_id:"great-grandfather", related_person_id:"grandfather", relationship_type:"parent" },
    { person_id:"great-grandmother", related_person_id:"grandmother", relationship_type:"parent" },
    { person_id:"grandfather", related_person_id:"grandfather-spouse", relationship_type:"spouse" },
    { person_id:"grandmother", related_person_id:"grandmother-spouse", relationship_type:"spouse" },
    { person_id:"grandfather", related_person_id:"parent", relationship_type:"parent" },
    { person_id:"grandmother", related_person_id:"parent", relationship_type:"parent" },
    { person_id:"parent", related_person_id:"me", relationship_type:"parent" },
    { person_id:"me", related_person_id:"child", relationship_type:"parent" },
    { person_id:"child", related_person_id:"grandchild", relationship_type:"parent" },
    { person_id:"grandchild", related_person_id:"great-grandchild", relationship_type:"parent" }
  ]
};
const createGenerationMap = new Function("state", "treeLayoutAnchorPersonId", generationMapSource + "\nreturn generationMap;");
const familyLevels = createGenerationMap(familyState, () => "me")();
const levelOf = id => Array.from(familyLevels.entries()).find(([, people]) => people.some(person => person.id === id))?.[0];
assert.equal(levelOf("grandfather"), levelOf("grandmother"), "Co-parents should share a generation");

const createRelationshipLabeler = new Function("state", "treeLayoutAnchorPersonId", generationMapSource + "\n" + relationshipLabelsSource + "\nreturn relationshipLabelsForCurrentUser;");
const labels = createRelationshipLabeler(familyState, () => "me")();
assert.equal(labels.get("grandfather"), "Grandfather");
assert.equal(labels.get("grandmother"), "Grandmother");
assert.equal(labels.get("grandfather-spouse"), "Grandmother", "A grandfather spouse must be labelled as a grandmother by gender");
assert.equal(labels.get("grandmother-spouse"), "Grandfather", "A grandmother spouse must be labelled as a grandfather by gender");

{
  const inferredParentState = {
    user:{ id:"co-parent-user" },
    language:"en",
    members:[{ user_id:"co-parent-user", person_id:"child" }],
    people:[
      { id:"father", full_name:"Father", gender:"male" },
      { id:"father-spouse", full_name:"Father spouse", gender:"female" },
      { id:"child", full_name:"Child", gender:"other" }
    ],
    relationships:[
      { person_id:"father", related_person_id:"child", relationship_type:"parent" },
      { person_id:"father", related_person_id:"father-spouse", relationship_type:"spouse" }
    ]
  };
  const inferredLabels = createRelationshipLabeler(inferredParentState)();
  assert.equal(inferredLabels.get("father-spouse"), "Mother",
    "A recorded parent's spouse should be labelled as the child's co-parent");
}

assert.equal(labels.get("great-grandfather"), "Great-grandfather");
assert.equal(labels.get("great-grandmother"), "Great-grandmother");
assert.equal(labels.get("great-grandchild"), "Great-grandchild");

familyState.language = "ta";
const tamilLabels = createRelationshipLabeler(familyState, () => "me")();
assert.equal(tamilLabels.get("great-grandfather"), "கொள்ளுத்தாத்தா");
assert.equal(tamilLabels.get("great-grandmother"), "கொள்ளுப்பாட்டி");
assert.equal(tamilLabels.get("grandfather-spouse"), "பாட்டி");
assert.equal(tamilLabels.get("grandmother-spouse"), "தாத்தா");

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
assert.doesNotMatch(app, /uravu_assign_member_person/);
assert.match(app, /function isOwner/);
assert.match(app, /function isManager/);
assert.match(app, /uravu_delete_tree/);
assert.match(app, /family-tree-lines/);
assert.match(app, /family-node-card/);
assert.match(app, /relationshipLabelsForCurrentUser/);
assert.doesNotMatch(app, /function syncSpouseChildLinks/);
assert.doesNotMatch(app, /function backfillExistingSpouseChildren/);
assert.match(app, /clearPersonForm\(\);\s*if \(!wasEditing && !isManager\(\)\) await requestLinkToPerson/);
assert.match(app, /clearPersonForm\(\);\s*if \(!isManager\(\) && personId\) await requestLinkToPerson/);
assert.match(app, /const layoutPartners = new Map/);
assert.doesNotMatch(app, /addLayoutPartner\(parentId, otherId\)/);
assert.match(app, /const showActions = state\.editMode && canEdit/);
assert.match(app, /state\.openPanels\.add\("add-person-panel"\)/);
assert.ok(app.includes("const partnerLineByPair = new Map()"), "Partner connectors must be tracked by the actual partner pair");
assert.match(app, /function groupChildrenByParentIds\(parentsByChild, positions\)/);
assert.ok(app.includes("const familyChildGroups = groupChildrenByParentIds(parentsByChild, positions)"),
  "Children must be grouped by their recorded parents, including a single recorded parent");
assert.ok(app.includes("partnerLine ? partnerLine.centerX : fallbackParentCenterX"), "A family stem should descend from the partner-line midpoint when partners are recorded");
assert.ok(app.includes("family-parent-stem"), "Parent-to-children routing should use a single vertical stem");
assert.ok(app.includes("family-child-bus"), "The shared horizontal line should be a parent-to-children connector");
assert.ok(app.includes("family-child-drop"), "Each child should have its own vertical drop");
assert.ok(!app.includes("const siblingBusGroups = new Map()"), "Do not use sibling-pair connection routing");

assert.match(app, /const spousesForLayout = new Map/);
assert.match(app, /addEffectiveParent\(spouseId, edge.related_person_id, true\)/,
  "A recorded parent's spouse should be displayed as a co-parent");
assert.match(app, /unit\.people\.forEach\(\(person, index\) => \{/,
  "Position each spouse-connected group as an indivisible unit");
assert.match(app, /const parentRowBottom = Math\.max/,
  "Family buses must stay below every card in the parent generation row");

assert.match(html, /id="toggle-edit-mode"/);
assert.match(styles, /\.edit-mode-button\.is-on/);
assert.match(styles, /\.edit-mode-button\.is-off/);
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
assert.match(html, /id="toggle-add-person-panel"/);
assert.match(html, /id="toggle-member-list-panel"/);
assert.match(html, /id="toggle-linking-requests-panel"/);
assert.match(html, /data-close-panel="add-person-panel"/);
assert.match(html, /data-close-panel="member-management-panel"/);
assert.match(html, /data-close-panel="linking-requests-panel"/);
assert.doesNotMatch(html, /id="create-tree-form"|id="close-tree-button"|id="delete-tree-button"/);
assert.match(html, /id="link-existing-form"/);
assert.match(app, /function displayTreeName/);
assert.match(app, /const selected = state\.people\.slice\(\)/);
assert.match(app, /function highlightSearchMatch/);
assert.match(app, /const columnGap = 40/);
assert.match(app, /const coupleGap = 28/);
assert.match(app, /const familySiblingGap = 24/);
assert.match(app, /const familyBlockGap = 40/);
assert.match(app, /is_self_record:!isManager\(\)/);
assert.match(app, /நினைவில் வாழ்பவர்/);
assert.match(app, /Living in Memory/);
assert.match(app, /function canEditPerson/);
assert.match(app, /function canDeletePerson/);
assert.match(singleTreeMigration, /name = 'Uravugal'/);
assert.match(singleTreeMigration, /create policy uravu_people_update_main/);
assert.match(singleTreeMigration, /Only a member already linked to a family record can review linking requests/);
assert.match(singleTreeMigration, /grant update \(/);
assert.match(singleTreeMigration, /uravu_main_tree_id/);
assert.ok(styles.includes(".dashboard.tree-open .action-grid"));
assert.match(app, /parentsByChild\.forEach\(parentIds => \{\s*for \(let index = 1; index < parentIds\.length; index\+\+\) unite\(parentIds\[0\], parentIds\[index\]\);/);
assert.ok(app.includes("const nodeWidth = 270"), "Family cards should be wide enough for personal details");
assert.ok(app.includes('class="person-meta record-meta"'), "Dates and memorial status should use separate readable rows");
assert.ok(app.includes("const familyChildGroups = groupChildrenByParentIds(parentsByChild, positions)"), "Child connectors should be grouped by their actual parent set, including single-parent links");
{

 const source=extractFunction(app,"function familyParentStemStartY(parents, partnerLine) {","\n  function relationNames");
 const familyParentStemStartY=new Function(source+"\nreturn familyParentStemStartY;")();
 assert.equal(familyParentStemStartY([{y:24,height:92}],null),116);
 assert.equal(
   familyParentStemStartY([{y:24,height:92},{y:24,height:160}],null),
   184,
   "For multiple recorded parents, start at the lowest actual parent-card edge"
 );
 assert.equal(familyParentStemStartY([{y:24,height:92}],{y:60}),60,
   "When a partner connector exists, start the stem at that connector");
}
assert.ok(app.includes("Math.max(128, outgoingFamilies.size * 24 + 40)"), "Use a compact generation gap while reserving connector lanes");
assert.ok(app.includes("parentRowBottom + 22 + laneIndex * 24"), "Use compact parallel connector lanes");
assert.ok(!app.includes("V ' + laneY + ' H ' + endX + ' V ' + endY"), "Parent-child links should not be drawn as separate H-shaped routes");
assert.ok(styles.includes(".family-node-card .person-meta.record-meta"), "Card metadata must not be clamped to one line");
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
assert.match(html, /app\.js\?v=[^'"]+/);
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
assert.match(html, /app\.js\?v=[^'"]+/);
assert.match(styles, /graph-relationship-label/);
assert.doesNotMatch(app, /\$\("#people-list"\)/);
assert.match(styles, /\.modal-backdrop/);
assert.match(styles, /\.person-card/);

assert.doesNotMatch(app, /Johan Rohith|S\. Priya|ggf-p|cousin-p1|demo family data/i);
assert.doesNotMatch(app, /localStorage\.(setItem|getItem).*tree/i);
assert.doesNotMatch(worker, /addEventListener\s*\(\s*['"]fetch['"]/i);
assert.doesNotMatch(worker, /caches\.match\(event\.request\)/i);

assert.match(schema, /enable row level security/ig);
assert.ok(schema.includes("role text not null default 'member' check (role in ('owner', 'member'))"));
assert.match(schema, /Only the owner or a member linked to a family record can link accounts/);
assert.match(schema, /uravu_one_pending_request_per_user_tree/);
assert.match(schema, /would create a family-tree cycle/);

function relationLabel(egoId,people,relationships,targetId,language="ta"){
 const state={user:{id:"current-user"},language,members:[{user_id:"current-user",person_id:egoId}],people,relationships};
 return new Function("state",generationMapSource+"\n"+relationshipLabelsSource+"\nreturn relationshipLabelsForCurrentUser;")(state)().get(targetId);
}
function person(id,gender,birth_date){const p={id,full_name:id,gender};if(birth_date)p.birth_date=birth_date;return p;}
function parentLink(person_id,related_person_id){return {person_id,related_person_id,relationship_type:"parent"};}
function spouseLink(person_id,related_person_id){return {person_id,related_person_id,relationship_type:"spouse"};}
{

 const people=[
  person("grandpa","male"),person("father","male"),person("me","male"),person("partner","female"),
  person("partner-parent","male"),person("partner-grandparent","male")
 ];
 const relationships=[
  parentLink("grandpa","father"),parentLink("father","me"),spouseLink("me","partner"),
  parentLink("partner-parent","partner"),parentLink("partner-grandparent","partner-parent")
 ];
 const layoutState={
  user:{id:"current-user"},
  activeMembership:{person_id:"me"},
  members:[{user_id:"current-user",person_id:"me"}],
  people,relationships
 };
 const source=extractFunction(app,"function generationMap(","\n  function groupChildrenByParentIds");
 const generationMap=new Function("state","treeLayoutAnchorPersonId",source+"\nreturn generationMap;")(layoutState,()=>"me");
 const generationOf=id=>{
  for(const [level,records] of generationMap())if(records.some(record=>record.id===id))return level;
  return undefined;
 };
 assert.equal(generationOf("me"),0);
 assert.equal(generationOf("partner"),0);
 assert.equal(generationOf("father"),-1);
 assert.equal(generationOf("partner-parent"),-1);
 assert.equal(generationOf("grandpa"),-2);
 assert.equal(generationOf("partner-grandparent"),-2);
}
{

 const source=extractFunction(app,"function groupChildrenByParentIds(parentsByChild, positions)","\n  function relationNames");
 const groupChildrenByParentIds=new Function(source+"\nreturn groupChildrenByParentIds;")();
 const positions=new Map([
  ["only-parent",{x:0,y:0,width:270}],
  ["child",{x:0,y:180,width:270}]
 ]);
 const groups=groupChildrenByParentIds(
  new Map([["child",new Set(["only-parent"])]]),
  positions
 );
 assert.deepEqual(groups.get("only-parent").parentIds,["only-parent"]);
 assert.deepEqual(groups.get("only-parent").childIds,["child"]);
}

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
 assert.equal(relationLabel("me",people,edges,"step-mom","en"),"Mother",
   "A parent's spouse should be treated as a co-parent in the displayed lineage");
 assert.equal(relationLabel("me",people,edges,"step-mom","ta"),"தாய்");
}

{

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

{
 const people=[person("great-grandpa","male","1920-01-01"),person("grandpa","male","1950-01-01"),
   person("grandma-by-marriage","female","1952-01-01"),person("dad","male","1980-01-01"),person("me","female","2005-01-01")];
 const relationships=[parentLink("great-grandpa","grandpa"),spouseLink("grandpa","grandma-by-marriage"),
   parentLink("grandpa","dad"),parentLink("dad","me")];
 assert.equal(relationLabel("me",people,relationships,"grandma-by-marriage","en"),"Grandmother");
 assert.equal(relationLabel("me",people,relationships,"grandma-by-marriage","ta"),"பாட்டி");
}
{
 const people=[person("gp","male","1950-01-01"),person("dad","male","1980-01-01"),
   person("uncle","male"),person("me","male","2004-01-01"),person("cousin","female")];
 const relationships=[parentLink("gp","dad"),parentLink("gp","uncle"),parentLink("dad","me"),parentLink("uncle","cousin")];
 const en=relationLabel("me",people,relationships,"cousin","en");
 const ta=relationLabel("me",people,relationships,"cousin","ta");
 assert.equal((en.match(/Age not sure/g)||[]).length,1);
 assert.equal((ta.match(/வயது உறுதி இல்லை/g)||[]).length,1);
}

assert.match(app, /const directAncestorIds = new Set\(\[layoutAnchorPersonId\]\)/);
assert.match(app, /const descendantQueue = Array\.from\(directAncestorIds\)/);
assert.match(app, /const legendPersonIds = new Set\(treeLineageIds\)/);
assert.ok(app.includes('$$("[data-delete-person]").forEach'));
assert.doesNotMatch(app, /data-toggle-partner-family/);
assert.ok(app.includes('$("[data-remove-relationship]").forEach'));

assert.match(html, /id="family-branch-legend"/);
assert.doesNotMatch(html, /YOUR FAMILY WORKSPACE|id="welcome-heading"/);
assert.doesNotMatch(html, /SHARED FAMILY TREE|id="workspace-role"/);
assert.match(html, /id="workspace-title">Uravugal</);
assert.match(html, /One shared family tree, across generations\./);
assert.equal((html.match(/<h3>Family tree<\/h3>/g) || []).length, 1);
assert.doesNotMatch(html, /<\/section\s*\n\s*>/, "Section closing tags should not be split across a standalone angle-bracket line");
assert.match(html, /id="link-account-prompt"/);
assert.match(html, /Do you want to know the relation terms for your relations\?/);
assert.match(html, /id="link-form-desktop-target"/);
assert.match(html, /id="link-form-mobile-target"/);
assert.match(html, /id="link-account-desktop-prompt"/);
assert.ok(
  html.indexOf('id="link-form-desktop-target"') > html.indexOf('id="linking-requests-panel"') &&
  html.indexOf('id="link-form-desktop-target"') < html.indexOf('id="link-account-prompt"'),
  "The desktop account-link form should be outside the Add panel and above the family tree"
);
assert.match(app, /desktopPrompt\.hidden = !\(showPrompt && !appView\)/);
assert.match(app, /mobilePrompt\.hidden = !\(showPrompt && appView\)/);
assert.match(html, /id="app-bottom-nav"/);
for (const id of ["app-nav-add", "app-nav-members", "app-nav-requests", "app-nav-edit", "app-nav-profile", "app-nav-signout"]) {
  assert.match(html, new RegExp('id="' + id + '"'));
}
assert.match(app, /function syncLinkFormPlacement\(\)/);
assert.match(app, /function syncAppNavigation\(\)/);
assert.ok(app.includes('$("#app-nav-signout").addEventListener'));
assert.match(styles, /\.app-bottom-nav:not\(\[hidden\]\)/);
assert.match(styles, /\.add-person-panel,\.management-panel,\.requests-panel\{position:fixed/);
assert.match(html, /class="tree-control-actions"/);
assert.ok(
  html.indexOf('id="tree-zoom-out"') < html.indexOf('id="tree-zoom-level"') &&
  html.indexOf('id="tree-zoom-level"') < html.indexOf('id="tree-zoom-in"') &&
  html.indexOf('id="tree-zoom-in"') < html.indexOf('id="fit-tree-button"') &&
  html.indexOf('id="fit-tree-button"') < html.indexOf('id="tree-fullscreen-button"'),
  "Zoom out, zoom level, zoom in, Fit tree and Full screen should be ordered in one control row"
);
assert.match(app, /maxVisibleLegendItems = 4/);
assert.match(app, /data-family-legend-toggle/);
assert.match(styles, /workspace-panel-actions \.secondary-button:not\(\.edit-mode-button\)/);
assert.match(styles, /\.tree-control-actions\s*\{/);
assert.match(styles, /\.family-branch-legend-toggle/);

assert.doesNotMatch(app, /treeExpandedPartnerFamilies/);
assert.match(app, /const expandedPartnerFamiliesByPerson = new Map\(\)/);
assert.match(app, /familyColorForParentIds/);
assert.match(app, /rootFamilyColorByKey/);
assert.match(app, /const expandedFamilyKey = expandedInLaw && parentFamilyByPerson\.get\(expandedInLaw\.id\)/);
assert.doesNotMatch(app, /collapsedInLaw|collapsedFamilyKey|partnerFamilyToggleByPerson/);

assert.match(styles, /\.family-branch-legend/);
assert.doesNotMatch(styles, /\.partner-family-toggle/);

{
 const people=[person("great-grandfather","male","1920-01-01"),person("grandfather","male","1950-01-01"),
   person("grandmother-spouse","female","1952-01-01"),person("father","male","1980-01-01"),person("me","female","2005-01-01")];
 const relationships=[parentLink("great-grandfather","grandfather"),spouseLink("grandfather","grandmother-spouse"),
   parentLink("grandfather","father"),parentLink("father","me")];
 assert.equal(relationLabel("me",people,relationships,"grandmother-spouse","en"),"Grandmother");
 assert.equal(relationLabel("me",people,relationships,"grandmother-spouse","ta"),"பாட்டி");
}
{
 const people=[person("great-grandmother","female","1920-01-01"),person("grandmother","female","1950-01-01"),
   person("grandfather-spouse","male","1952-01-01"),person("mother","female","1980-01-01"),person("me","female","2005-01-01")];
 const relationships=[parentLink("great-grandmother","grandmother"),spouseLink("grandmother","grandfather-spouse"),
   parentLink("grandmother","mother"),parentLink("mother","me")];
 assert.equal(relationLabel("me",people,relationships,"grandfather-spouse","en"),"Grandfather");
 assert.equal(relationLabel("me",people,relationships,"grandfather-spouse","ta"),"தாத்தா");
}
{
 const people=[person("root-great-grandmother","female","1910-01-01"),person("root-great-grandfather-spouse","male","1911-01-01"),
   person("grandparent","female","1940-01-01"),person("parent","female","1970-01-01"),person("me","male","2000-01-01")];
 const relationships=[spouseLink("root-great-grandmother","root-great-grandfather-spouse"),
   parentLink("root-great-grandmother","grandparent"),parentLink("grandparent","parent"),parentLink("parent","me")];
 assert.equal(relationLabel("me",people,relationships,"root-great-grandfather-spouse","en"),"Great-grandfather");
 assert.equal(relationLabel("me",people,relationships,"root-great-grandfather-spouse","ta"),"கொள்ளுத்தாத்தா");
}

{

 const people=[
  person("ancient","male"),person("great-great-grandparent","male"),
  person("great-great-grandparent-sibling","male"),person("great-grandparent","male"),
  person("great-grandparent-sibling","male"),person("grandparent","male"),
  person("grandparent-cousin","female"),person("parent","male"),person("me","female")
 ];
 const relationships=[
  parentLink("ancient","great-great-grandparent"),
  parentLink("ancient","great-great-grandparent-sibling"),
  parentLink("great-great-grandparent","great-grandparent"),
  parentLink("great-great-grandparent","great-grandparent-sibling"),
  parentLink("great-grandparent","grandparent"),
  parentLink("great-grandparent-sibling","grandparent-cousin"),
  parentLink("grandparent","parent"),parentLink("parent","me"),
  parentLink("great-great-grandparent-sibling","great-grandparent-cousin")
 ];
 people.push(person("great-grandparent-cousin","female"));
 assert.equal(relationLabel("me",people,relationships,"grandparent-cousin","en"),"Grandmother");
 assert.equal(relationLabel("me",people,relationships,"grandparent-cousin","ta"),"பாட்டி");
 assert.equal(relationLabel("me",people,relationships,"great-grandparent-cousin","en"),"Great-grandmother");
 assert.equal(relationLabel("me",people,relationships,"great-grandparent-cousin","ta"),"கொள்ளுப்பாட்டி");
}

assert.match(app, /const ancestorGenerationForLabel = new Map\(bloodAncestors\)/);
assert.match(app, /const rootFamilyKeyForPerson = personId =>/);
assert.doesNotMatch(app, /joined-family:/);
assert.match(app, /const visibleRootFamilyKeys = new Set\(\)/);

{
  const computeFamilySubtreeLayout = new Function(
    app.slice(app.indexOf("function computeFamilySubtreeLayout("), app.indexOf("\n  function renderPeople()")) +
      "\nreturn computeFamilySubtreeLayout;"
  )();
  const unit = (id, people, width, sortName=id) => ({id,people:people.map(personId=>({id:personId})),width,sortName});
  const parents = unit("parents",["father","mother"],564,"parents");
  const childA = unit("child-a",["child-a"],270,"child-a");
  const childB = unit("child-b",["child-b"],270,"child-b");
  const layout = computeFamilySubtreeLayout(
    [parents],
    new Map([[parents,new Set([childA,childB])]]),
    new Map([[parents,new Set(["child-a","child-b"])]]),
    270,28,40,
    new Map([[parents,0],[childA,0],[childB,1]])
  );
  assert.equal(
    (layout.personCenters.get("child-a")+layout.personCenters.get("child-b"))/2,
    layout.unitCenters.get(parents),
    "Parents must be centered over the horizontal span of their children"
  );
  assert.ok(layout.personCenters.get("child-b")-layout.personCenters.get("child-a")>=310,
    "Sibling child cards must not overlap");
  const cards = [
    {left:layout.personCenters.get("child-a")-135,right:layout.personCenters.get("child-a")+135},
    {left:layout.personCenters.get("child-b")-135,right:layout.personCenters.get("child-b")+135}
  ];
  assert.ok(cards[0].right<=cards[1].left,"One record must never overlap or cover another");
  assert.match(app, /const familyLayout = computeFamilySubtreeLayout\(/);
  assert.doesNotMatch(app, /const moveUnitOnly/);
  assert.doesNotMatch(app, /familyBusSafeTargetLeft/);
  assert.doesNotMatch(app, /familyBusInterferingUnitIds/);
}

{

  const people = [
    person("great-grandfather", "male", "1920-01-01"),
    person("grandfather", "male", "1950-01-01"),
    person("grandfather-brother", "male"),
    person("grandfather-brothers-wife", "female"),
    person("father", "male", "1980-01-01"),
    person("me", "male", "2004-01-01")
  ];
  const relationships = [
    parentLink("great-grandfather", "grandfather"),
    parentLink("great-grandfather", "grandfather-brother"),
    spouseLink("grandfather-brother", "grandfather-brothers-wife"),
    parentLink("grandfather", "father"),
    parentLink("father", "me")
  ];
  assert.equal(relationLabel("me", people, relationships, "grandfather-brother", "en"), "Grandfather");
  assert.equal(relationLabel("me", people, relationships, "grandfather-brothers-wife", "en"), "Grandmother");
  assert.equal(relationLabel("me", people, relationships, "grandfather-brothers-wife", "ta"), "பாட்டி");
}
{

  const people = [
    person("great-great-grandparent", "male", "1880-01-01"),
    person("great-grandfather", "male", "1910-01-01"),
    person("great-grandfather-brother", "male"),
    person("great-grandfather-brothers-wife", "female"),
    person("grandfather", "male", "1940-01-01"),
    person("father", "male", "1970-01-01"),
    person("me", "female", "2000-01-01")
  ];
  const relationships = [
    parentLink("great-great-grandparent", "great-grandfather"),
    parentLink("great-great-grandparent", "great-grandfather-brother"),
    spouseLink("great-grandfather-brother", "great-grandfather-brothers-wife"),
    parentLink("great-grandfather", "grandfather"),
    parentLink("grandfather", "father"),
    parentLink("father", "me")
  ];
  assert.equal(relationLabel("me", people, relationships, "great-grandfather-brothers-wife", "en"), "Great-grandmother");
  assert.equal(relationLabel("me", people, relationships, "great-grandfather-brothers-wife", "ta"), "கொள்ளுப்பாட்டி");
}
{

  const people = [
    person("grandfather", "male", "1950-01-01"),
    person("father", "male", "1975-01-01"),
    person("me", "male", "2000-01-01"),
    person("sister", "female", "2002-01-01"),
    person("sisters-husband", "male", "2001-01-01")
  ];
  const relationships = [
    parentLink("grandfather", "father"),
    parentLink("father", "me"),
    parentLink("father", "sister"),
    spouseLink("sister", "sisters-husband")
  ];
  assert.equal(relationLabel("me", people, relationships, "sisters-husband", "en"), "Sister's husband");
  assert.equal(relationLabel("me", people, relationships, "sisters-husband", "ta"), "அத்தான்");
}


assert.match(html, /id="app-nav-avatar"/);
assert.match(auth, /getElementById\("app-nav-avatar"\)/);
assert.match(auth, /appAvatarNode\.classList\.toggle\("has-photo", Boolean\(avatar\)\)/);
assert.match(styles, /\.workspace-header\{display:none!important\}/);
assert.match(styles, /\.workspace-stats\{order:-100;display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
assert.match(styles, /#tree-fullscreen-button\{display:none!important\}/);
assert.match(styles, /\.family-branch-legend\{display:none!important\}/);
assert.match(styles, /\.app-nav-avatar\.has-photo svg\{display:none\}/);
assert.match(styles, /\.family-tree-viewport\{flex:1 1 0;width:100%;height:auto;min-height:0;max-height:none/);
assert.match(app, /const familyLinePalette = \[/);
assert.match(app, /function calculateTreeFitScale\(\)/);
assert.match(app, /const isAppView = window\.matchMedia\("\(max-width: 760px\)"\)\.matches/);
assert.match(app, /const minimumFitScale = isAppView \? 0\.01 : 0\.25/);
assert.match(app, /const isAppTreeView = window\.matchMedia\("\(max-width: 760px\)"\)\.matches/);
assert.ok(
  app.indexOf('Object.entries(interfaceTranslations).forEach', app.indexOf('tamilToEnglish["நினைவில் வாழ்பவர்"]')) >
    app.indexOf("Object.assign(interfaceTranslations"),
  "Reverse translations must include every translation added to interfaceTranslations"
);
assert.match(app, /"Family members":"குடும்ப உறுப்பினர்கள்"/);
assert.match(app, /"Don't have your record\? Add a record for you using the \\"Add Family Member\\" button above!"/);
assert.match(app, /"app-nav-members":"உறுப்பினர்"/);
assert.match(html, /uravu-loading-decouple-20261020-1/);
assert.match(html, /id="family-tree-sizer"/);
assert.match(html, /id="mobile-tree-toolbar"/);
assert.match(html, /id="mobile-tree-toolbar-content"/);
assert.match(html, /id="mobile-tree-toolbar-toggle"/);
assert.match(html, /id="mobile-tree-controls-target"/);
assert.match(html, /id="desktop-tree-controls-target"/);
assert.match(app, /function calculateTreeFitScale\(\)/);
assert.match(app, /const minimumScale = appView \? 0\.05 : 0\.25;/);
assert.match(app, /function syncMobileTreeToolbar\(\)/);
assert.match(app, /state\.mobileTreeToolbarCollapsed = !state\.mobileTreeToolbarCollapsed/);
assert.match(styles, /\.mobile-tree-toolbar-content\{display:flex;flex-direction:column;gap:0;min-width:0;max-width:100%;max-height:270px;overflow:hidden;opacity:1;transform:translateY\(0\);transition:max-height \.32s/);
assert.match(styles, /\.mobile-tree-toolbar\.is-collapsed \.mobile-tree-toolbar-content\{max-height:0!important;opacity:0;transform:translateY\(-10px\)/);
assert.match(styles, /\.mobile-tree-toolbar\.is-collapsed \.mobile-tree-toolbar-toggle \.toolbar-arrow-down\{display:block\}/);
assert.match(styles, /body:has\(#dashboard\.tree-open\) \.app-shell>main\{padding-bottom:calc\(69px \+ env\(safe-area-inset-bottom\)\)/);
assert.match(styles, /body:has\(#dashboard\.tree-open\)\{position:relative!important;inset:auto!important;width:100%!important;height:100dvh!important;overflow:hidden!important/);
assert.match(styles, /\.mobile-tree-controls-target \.tree-zoom-controls\{justify-content:flex-start!important;margin-left:0!important\}/);
assert.match(styles, /\.people-panel\{position:relative!important;display:flex!important;flex:1 1 0!important;flex-direction:column!important/);
assert.match(styles, /\.family-tree-viewport\{position:relative!important;inset:auto!important;display:block!important;flex:1 1 0!important/);
assert.match(styles, /\.dashboard\.tree-open\{flex:1 1 0;height:auto;min-height:0\}/);
assert.match(app, /function calculateTreeFitScale\(\)/);
assert.match(app, /state\.treeZoom = Math\.max\(minimumScale, Math\.min\(2\.5, Number\(nextScale\) \|\| 1\)\)/);
assert.match(app, /dataset\.appliedScale/);
assert.match(app, /const sizer = \$\("#family-tree-sizer"\)/);
assert.match(app, /canvas\.style\.transform = "scale\(" \+ scale \+ "\)"/);
assert.match(app, /sizer\.style\.width = Math\.ceil\(state\.treeBaseWidth \* scale\) \+ "px"/);
assert.doesNotMatch(app, /nodesRoot\.style\.transform = "translateZ\(0\) scale\("/);
assert.match(app, /requestAnimationFrame\(\(\) => \{/);
assert.match(app, /const maxLeft = Math\.max\(0, sizer\.offsetWidth - viewport\.clientWidth\)/);
assert.match(styles, /\.mobile-tree-controls-target \.tree-control-actions\{display:flex!important;flex-wrap:nowrap;align-items:center;justify-content:flex-start!important/);
assert.match(styles, /\.family-tree-viewport\{position:relative!important;inset:auto!important;display:block!important;flex:1 1 0!important/);
assert.match(styles, /\.family-tree-canvas\{position:absolute!important;left:0!important;top:0!important/);
assert.match(styles, /\.topbar\{position:relative!important;inset:auto!important;display:flex!important;flex:0 0 56px!important/);

assert.match(styles, /\.family-tree-viewport\{position:relative;z-index:0;isolation:isolate;contain:paint;overflow:auto;overscroll-behavior:contain;max-width:100%;max-height:100%\}/);

console.log("Uravu clean-app and Tamil relationship smoke checks passed.");

assert.match(app, /const hadPreviousTreeLayout = state\.treeBaseWidth > 0 && state\.treeBaseHeight > 0/);
assert.match(app, /else if \(!hadPreviousTreeLayout\) \{\s*\/\/ Preserve the existing web fit-to-tree behaviour\.\s*state\.treeZoom = calculateTreeFitScale\(\)/);
assert.match(styles, /height: 100svh !important/);
assert.match(styles, /touch-action: none !important/);
assert.doesNotMatch(app, /transitionend[\s\S]{0,250}applyTreeCanvasScale\(true\)/);



// Mobile-app-only account focus and panel behavior; keep the web fit-to-tree path.
assert.match(app, /treeInitialViewKey: null/);
assert.match(app, /const shouldFocusMobileInitialView = appView && state\.treeInitialViewKey !== initialViewKey/);
assert.match(app, /if \(!mediaQuery\.matches && state\.treeInitialViewKey !== null\)/);
assert.match(app, /state\.treeZoom = calculateTreeFitScale\(\);\s*applyTreeCanvasScale\(false\);/);
assert.match(app, /state\.treeZoom = focusPosition \? 1 : 0\.4/);
assert.match(app, /if \(search && !shouldFocusMobileInitialView\)/);
assert.match(app, /const showOwnRecordInstruction = appView && Boolean\(/);
assert.match(app, /divider\.hidden = shouldPauseCreation \|\| \(/);
assert.match(app, /signOut\.hidden = hasOpenPanel \? false : !signOut\.hidden/);
assert.match(app, /"MEMBERSHIP":"உறுப்பினர் நிலை"/);
assert.match(app, /"FAMILY RECORDS":"குடும்பப் பதிவுகள்"/);
assert.match(app, /"Confirm requests from people asking to link their account to a family record\."/);
assert.match(html, /class="own-record-instruction"/);
assert.match(html, /uravu-loading-decouple-20261020-1/);
assert.match(styles, /\/\* App-only panel alignment, neutral edit state, and active edit indicator\. \*\//);
assert.match(styles, /\.requests-panel \.section-heading \{\s*display: grid !important;\s*grid-template-columns: minmax\(0, 1fr\) 34px !important;/);
assert.match(styles, /\.app-nav-item\.edit-mode-button\.is-off \{\s*background: transparent !important;\s*border-color: transparent !important;\s*color: #789080 !important;/);
assert.match(styles, /\.app-nav-item\.edit-mode-button\.is-on \{\s*background: #218447 !important;\s*border-color: #218447 !important;\s*color: #fff !important;/);
assert.match(styles, /@media \(max-width: 760px\)/);

assert.match(app, /const watchSideQuery = \(kind, makeQuery\) =>/);
assert.match(app, /const waitForCoreQuery = async query =>/);
assert.match(app, /const isCurrentLoad = \(\) =>/);
assert.match(app, /if \(state\.loadingMembers\)/);
assert.match(app, /if \(state\.loadingRequests\)/);
assert.match(app, /Timed out while loading the family tree/);
assert.match(app, /data-retry-workspace/);
assert.match(app, /const queryTimeoutMs = 15000/);
