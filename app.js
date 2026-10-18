(() => {
  "use strict";
  const db = window.supabaseClient;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const state = {
    user: null,
    trees: [],
    memberships: [],
    ownRequests: [],
    activeTree: null,
    activeMembership: null,
    people: [],
    relationships: [],
    members: [],
    requests: [],
    editingPersonId: null,
    language: "en",
    toastTimer: null,
    loadingTree: false
  };

  const words = {
    en: {
      familyTree:"Family tree",familyMembers:"Family members",create:"Create tree",join:"Request access",
      owner:"Owner",admin:"Admin",member:"Member",viewer:"Viewer",parent:"Parents",spouse:"Spouse / partner",
      children:"Children",none:"None linked yet",delete:"Delete",edit:"Edit",removeConnection:"Remove connection",
      noPeople:"This family tree is empty",noPeopleSub:"Add the first family member to begin building your tree.",
      noTrees:"You have not joined any family trees yet.",noTreesSub:"Create one or request access to an existing tree.",
      noBrowse:"No other family trees are available to request.",pending:"Request pending",requested:"Requested",
      viewTree:"Open tree",members:"Members",requestRole:"Request role / link",sendRequest:"Send request",
      requestSent:"Request sent for the owner or an admin to review.",roleChange:"Role change",linkRequest:"Family entry link",
      joinRequest:"Tree access",save:"Save",cancel:"Cancel",approve:"Approve",reject:"Reject",
      noRequests:"No requests need review.",notConnected:"No connection added.",setupError:"The new Uravu database schema is not installed yet. Run supabase/schema.sql in your Supabase SQL Editor.",
      noSearchResults:"No family members match that search.",treeLoadError:"Could not load this family tree."
    },
    ta: {
      familyTree:"குடும்ப மரம்",familyMembers:"குடும்ப உறுப்பினர்கள்",create:"மரத்தை உருவாக்கு",join:"அணுகல் கோரு",
      owner:"உரிமையாளர்",admin:"நிர்வாகி",member:"உறுப்பினர்",viewer:"பார்வையாளர்",parent:"பெற்றோர்",
      spouse:"துணைவர்",children:"பிள்ளைகள்",none:"இணைப்புகள் இல்லை",delete:"நீக்கு",edit:"திருத்து",
      removeConnection:"உறவை நீக்கு",noPeople:"இந்தக் குடும்ப மரம் காலியாக உள்ளது",
      noPeopleSub:"முதல் குடும்ப உறுப்பினரைச் சேர்த்து உங்கள் மரத்தை உருவாக்கத் தொடங்குங்கள்.",
      noTrees:"நீங்கள் இன்னும் எந்தக் குடும்ப மரத்திலும் இணையவில்லை.",
      noTreesSub:"புதிய மரத்தை உருவாக்கவும் அல்லது இருக்கும் மரத்திற்கு அணுகல் கோரவும்.",
      noBrowse:"அணுகல் கோரக்கூடிய வேறு மரங்கள் இல்லை.",pending:"கோரிக்கை நிலுவையில் உள்ளது",
      requested:"கோரப்பட்டது",viewTree:"மரத்தைத் திற",members:"உறுப்பினர்கள்",requestRole:"பங்கு / இணைப்பு கோரு",
      sendRequest:"கோரிக்கையை அனுப்பு",requestSent:"உரிமையாளர் அல்லது நிர்வாகி பரிசீலிக்க கோரிக்கை அனுப்பப்பட்டது.",
      roleChange:"பங்கு மாற்றம்",linkRequest:"குடும்பப் பதிவை இணை",joinRequest:"மர அணுகல்",
      save:"சேமி",cancel:"ரத்து",approve:"ஏற்கவும்",reject:"நிராகரி",noRequests:"பரிசீலிக்க கோரிக்கைகள் இல்லை.",
      notConnected:"உறவு இணைப்பு சேர்க்கப்படவில்லை.",
      setupError:"புதிய Uravu தரவுத்தளம் இன்னும் அமைக்கப்படவில்லை. Supabase SQL Editor-ல் supabase/schema.sql-ஐ இயக்கவும்.",
      noSearchResults:"இந்தத் தேடலுக்கு குடும்ப உறுப்பினர்கள் இல்லை.",treeLoadError:"குடும்ப மரத்தை ஏற்ற முடியவில்லை."
    }
  };

  function t(key) { return (words[state.language] && words[state.language][key]) || words.en[key] || key; }
  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, char => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[char]));
  }
  function initials(name) {
    return String(name || "?").trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join("").toUpperCase() || "?";
  }
  function prettyDate(value) {
    if (!value) return "";
    const date = new Date(value + "T00:00:00");
    return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat(state.language === "ta" ? "ta-IN" : "en-IN", { day:"numeric", month:"short", year:"numeric" }).format(date);
  }
  function roleLabel(role) { return t(role || "viewer"); }
  function isManager() { return Boolean(state.activeMembership && ["owner","admin"].includes(state.activeMembership.role)); }
  function toast(message, isError) {
    const node = $("#toast");
    if (!node) return;
    node.textContent = message;
    node.classList.toggle("error", Boolean(isError));
    node.classList.add("show");
    if (state.toastTimer) clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => node.classList.remove("show"), 3800);
  }
  function setBusy(button, busy, label) {
    if (!button) return;
    if (busy) {
      button.dataset.originalText = button.textContent;
      button.disabled = true;
      button.textContent = label || "Working…";
    } else {
      button.disabled = false;
      if (button.dataset.originalText) button.textContent = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }
  function showDbError(error, context) {
    console.error("Uravu " + (context || "database") + " error:", error);
    const message = String(error?.message || error || "");
    const code = String(error?.code || "");
    if (code === "42P01" || code === "PGRST202" || code === "PGRST205" ||
        /could not find the table|schema cache|function .*uravu_|relation .* does not exist/i.test(message)) {
      toast(t("setupError"), true);
    } else if (/row-level security|permission denied|not allowed/i.test(message)) {
      toast("Database permission blocked this action. Check the Supabase policies in supabase/schema.sql.", true);
    } else {
      toast(message || "Something went wrong. Please try again.", true);
    }
  }
  function requireSignedIn() {
    if (!state.user) { toast("Sign in with Google to continue.", true); return false; }
    return true;
  }
  function callRpc(name, args) {
    if (!db) return Promise.reject(new Error("Supabase client is not initialized."));
    return db.rpc(name, args);
  }

  function renderAuth(user) {
    state.user = user || null;
    $("#signed-out").hidden = Boolean(state.user);
    $("#dashboard").hidden = !state.user;
    $("#header-signin").hidden = Boolean(state.user);
    $("#user-menu").hidden = !state.user;
    $("#welcome-heading").textContent = state.user
      ? "Welcome, " + ((state.user.user_metadata?.full_name || state.user.user_metadata?.name || state.user.email || "there").split(/\s+/)[0])
      : "Welcome to Uravu";
    if (!state.user) {
      state.trees = [];
      state.memberships = [];
      state.ownRequests = [];
      state.activeTree = null;
      state.activeMembership = null;
      state.people = [];
      state.relationships = [];
      state.members = [];
      state.requests = [];
      $("#tree-workspace").hidden = true;
      return;
    }
    refreshDashboard();
  }

  async function refreshDashboard() {
    if (!state.user) return;
    $("#my-tree-list").innerHTML = '<div class="loading-line">Loading your family trees…</div>';
    $("#available-tree-list").innerHTML = '<div class="loading-line">Loading trees…</div>';
    const userId = state.user.id;
    const results = await Promise.all([
      db.from("uravu_family_trees").select("id,name,description,language,created_by,created_at").order("created_at", { ascending:false }),
      db.from("uravu_tree_members").select("tree_id,user_id,role,person_id,display_name,avatar_url,joined_at").eq("user_id", userId),
      db.from("uravu_access_requests").select("id,tree_id,user_id,request_type,requested_role,requested_person_id,message,status,display_name,avatar_url,created_at").eq("user_id", userId).order("created_at", { ascending:false })
    ]);
    const error = results.find(result => result.error)?.error;
    if (error) {
      $("#my-tree-list").innerHTML = '<div class="empty-state"><strong>Could not load family trees</strong>' + escapeHtml(error.message || "Database error") + '</div>';
      $("#available-tree-list").innerHTML = '<div class="empty-state compact">Database setup or permissions need attention.</div>';
      showDbError(error, "dashboard");
      return;
    }
    state.trees = results[0].data || [];
    state.memberships = results[1].data || [];
    state.ownRequests = results[2].data || [];
    renderTreeLists();

    if (state.activeTree) {
      const membership = state.memberships.find(item => item.tree_id === state.activeTree.id);
      if (membership) {
        state.activeMembership = membership;
        await loadWorkspace(state.activeTree.id, false);
      } else {
        state.activeTree = null;
        state.activeMembership = null;
        $("#tree-workspace").hidden = true;
      }
    }
  }

  function renderTreeLists() {
    const myTrees = state.memberships.map(membership => ({
      membership,
      tree: state.trees.find(tree => tree.id === membership.tree_id)
    })).filter(item => item.tree);
    if (!myTrees.length) {
      $("#my-tree-list").innerHTML = '<div class="empty-state"><strong>' + escapeHtml(t("noTrees")) + '</strong>' + escapeHtml(t("noTreesSub")) + '</div>';
    } else {
      $("#my-tree-list").innerHTML = myTrees.map(item => {
        const tree = item.tree, membership = item.membership;
        return '<article class="tree-card"><div class="tree-card-main"><span class="tree-card-icon" aria-hidden="true">⌘</span><div><h3>' +
          escapeHtml(tree.name) + '</h3><p>' + escapeHtml(tree.description || "No description provided.") +
          '</p><div class="tree-card-meta"><span class="role-pill role-' + escapeHtml(membership.role) + '">' +
          escapeHtml(roleLabel(membership.role)) + '</span><span class="role-pill">' + escapeHtml(tree.language === "ta" ? "தமிழ்" : "English") +
          '</span></div></div></div><div class="tree-card-actions"><button type="button" class="primary-button" data-open-tree="' +
          escapeHtml(tree.id) + '">' + escapeHtml(t("viewTree")) + '</button></div></article>';
      }).join("");
    }

    const memberTreeIds = new Set(state.memberships.map(m => m.tree_id));
    const pendingByTree = new Map(state.ownRequests.filter(r => r.status === "pending").map(r => [r.tree_id, r]));
    const search = ($("#tree-search").value || "").trim().toLocaleLowerCase();
    const available = state.trees.filter(tree => !memberTreeIds.has(tree.id) && tree.name.toLocaleLowerCase().includes(search));
    if (!available.length) {
      $("#available-tree-list").innerHTML = '<div class="empty-state compact"><strong>' + escapeHtml(t("noBrowse")) + '</strong></div>';
    } else {
      $("#available-tree-list").innerHTML = available.map(tree => {
        const request = pendingByTree.get(tree.id);
        const action = request
          ? '<span class="status-pill status-pending">' + escapeHtml(t("pending")) + '</span>'
          : '<button class="secondary-button" type="button" data-request-tree="' + escapeHtml(tree.id) + '">' + escapeHtml(t("join")) + '</button>';
        return '<article class="tree-card"><div class="tree-card-main"><span class="tree-card-icon" aria-hidden="true">⌘</span><div><h3>' +
          escapeHtml(tree.name) + '</h3><p>' + escapeHtml(tree.description || "No description provided.") +
          '</p><div class="tree-card-meta"><span class="role-pill">' + escapeHtml(tree.language === "ta" ? "தமிழ்" : "English") +
          '</span></div></div></div><div class="tree-card-actions">' + action + '</div></article>';
      }).join("");
    }
    $$("[data-open-tree]").forEach(button => button.addEventListener("click", () => openTree(button.dataset.openTree)));
    $$("[data-request-tree]").forEach(button => button.addEventListener("click", () => openRequestDialog(button.dataset.requestTree, false)));
  }

  async function createTree(event) {
    event.preventDefault();
    if (!requireSignedIn()) return;
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const name = $("#tree-name").value.trim();
    const description = $("#tree-description").value.trim();
    const language = $("#tree-language").value;
    if (name.length < 2) { toast("Enter a family tree name with at least 2 characters.", true); return; }
    setBusy(button, true, "Creating…");
    const { data, error } = await callRpc("uravu_create_tree", { p_name:name, p_description:description, p_language:language });
    setBusy(button, false);
    if (error) { showDbError(error, "create tree"); return; }
    const treeId = typeof data === "string" ? data : Array.isArray(data) ? data[0] : data?.id;
    form.reset();
    await refreshDashboard();
    if (treeId) await openTree(treeId);
    toast("Family tree created. You are the owner.");
  }

  async function openTree(treeId) {
    const tree = state.trees.find(item => item.id === treeId);
    const membership = state.memberships.find(item => item.tree_id === treeId);
    if (!tree || !membership) { toast("You must be an approved member to open this tree.", true); return; }
    state.activeTree = tree;
    state.activeMembership = membership;
    $("#tree-workspace").hidden = false;
    $("#workspace-title").textContent = tree.name;
    $("#workspace-description").textContent = tree.description || "Family connections across generations.";
    $("#workspace-role").textContent = "YOUR ROLE · " + roleLabel(membership.role).toUpperCase();
    $("#tree-workspace").scrollIntoView({ behavior:"smooth", block:"start" });
    await loadWorkspace(treeId, true);
  }

  async function loadWorkspace(treeId, showLoading) {
    if (!state.user || !state.activeTree || state.activeTree.id !== treeId) return;
    if (showLoading) {
      $("#people-list").innerHTML = '<div class="loading-line">Loading family members from Supabase…</div>';
      $("#tree-members-list").innerHTML = '<div class="loading-line">Loading members…</div>';
    }
    state.loadingTree = true;
    const results = await Promise.all([
      db.from("uravu_people").select("id,tree_id,full_name,tamil_name,gender,birth_date,death_date,notes,created_by,created_at,updated_at").eq("tree_id", treeId).order("full_name"),
      db.from("uravu_relationships").select("id,tree_id,person_id,related_person_id,relationship_type,created_at").eq("tree_id", treeId),
      db.from("uravu_tree_members").select("tree_id,user_id,role,person_id,display_name,avatar_url,joined_at").eq("tree_id", treeId),
      db.from("uravu_access_requests").select("id,tree_id,user_id,request_type,requested_role,requested_person_id,message,status,display_name,avatar_url,created_at").eq("tree_id", treeId).eq("status","pending").order("created_at")
    ]);
    state.loadingTree = false;
    const error = results.find(result => result.error)?.error;
    if (error) { showDbError(error, "tree workspace"); $("#people-list").innerHTML = '<div class="empty-state">' + escapeHtml(t("treeLoadError")) + '</div>'; return; }
    if (!state.activeTree || state.activeTree.id !== treeId) return;
    state.people = results[0].data || [];
    state.relationships = results[1].data || [];
    state.members = results[2].data || [];
    state.requests = results[3].data || [];
    state.activeMembership = state.memberships.find(m => m.tree_id === treeId) || state.activeMembership;
    renderWorkspace();
  }

  function renderWorkspace() {
    if (!state.activeTree || !state.activeMembership) return;
    const manager = isManager();
    const owner = state.activeMembership.role === "owner";
    $("#workspace-role").textContent = "YOUR ROLE · " + roleLabel(state.activeMembership.role).toUpperCase();
    $("#workspace-title").textContent = state.activeTree.name;
    $("#workspace-description").textContent = state.activeTree.description || "Family connections across generations.";
    $("#people-count").textContent = String(state.people.length);
    $("#member-count").textContent = String(state.members.length);
    $("#pending-count").textContent = String(state.requests.length);
    $("#add-person-panel").hidden = !manager;
    $("#member-management-panel").hidden = !manager;
    $("#requests-panel").hidden = !manager;
    $("#delete-tree-zone").hidden = !owner;
    $("#request-role-button").hidden = owner;
    renderPersonConnectOptions();
    renderPeople();
    renderMembers();
    renderRequests();
  }

  function generationMap() {
    const depths = new Map(state.people.map(p => [p.id, 0]));
    const parentEdges = state.relationships.filter(r => r.relationship_type === "parent");
    for (let round = 0; round < state.people.length; round++) {
      let changed = false;
      parentEdges.forEach(edge => {
        const next = Math.min(state.people.length, (depths.get(edge.person_id) || 0) + 1);
        if (depths.has(edge.related_person_id) && next > depths.get(edge.related_person_id)) {
          depths.set(edge.related_person_id, next);
          changed = true;
        }
      });
      if (!changed) break;
    }
    const map = new Map();
    state.people.forEach(p => {
      const level = depths.get(p.id) || 0;
      if (!map.has(level)) map.set(level, []);
      map.get(level).push(p);
    });
    return new Map(Array.from(map.entries()).sort((a,b) => a[0]-b[0]));
  }

  function relationNames(person, type) {
    let ids = [];
    if (type === "parents") ids = state.relationships.filter(r => r.relationship_type === "parent" && r.related_person_id === person.id).map(r => r.person_id);
    if (type === "children") ids = state.relationships.filter(r => r.relationship_type === "parent" && r.person_id === person.id).map(r => r.related_person_id);
    if (type === "spouses") ids = state.relationships.filter(r => r.relationship_type === "spouse" && (r.person_id === person.id || r.related_person_id === person.id)).map(r => r.person_id === person.id ? r.related_person_id : r.person_id);
    return Array.from(new Set(ids)).map(id => state.people.find(p => p.id === id)).filter(Boolean);
  }

  function renderPersonConnectOptions() {
    const select = $("#connect-person");
    if (!select) return;
    const old = select.value;
    select.innerHTML = '<option value="">No connection yet</option>' + state.people
      .filter(p => p.id !== state.editingPersonId)
      .map(p => '<option value="' + escapeHtml(p.id) + '">' + escapeHtml(p.full_name) + (p.tamil_name ? " · " + escapeHtml(p.tamil_name) : "") + '</option>').join("");
    if (old && state.people.some(p => p.id === old && p.id !== state.editingPersonId)) select.value = old;
  }

  function renderPeople() {
    const root = $("#people-list");
    const search = ($("#people-search").value || "").trim().toLocaleLowerCase();
    const selected = state.people.filter(person => !search ||
      [person.full_name,person.tamil_name,person.notes].filter(Boolean).join(" ").toLocaleLowerCase().includes(search));
    if (!state.people.length) {
      root.innerHTML = '<div class="empty-state"><strong>' + escapeHtml(t("noPeople")) + '</strong>' + escapeHtml(t("noPeopleSub")) + '</div>';
      return;
    }
    if (!selected.length) { root.innerHTML = '<div class="empty-state">' + escapeHtml(t("noSearchResults")) + '</div>'; return; }
    const levels = generationMap();
    const grouped = new Map();
    levels.forEach((people, level) => {
      const filtered = people.filter(person => selected.some(p => p.id === person.id));
      if (filtered.length) grouped.set(level, filtered);
    });
    const maxLevel = Math.max(0, ...Array.from(grouped.keys()));
    root.innerHTML = Array.from(grouped.entries()).map(([level, people]) =>
      '<section class="generation-group"><p class="generation-label">Generation ' + (level + 1) + ' of ' + (maxLevel + 1) + '</p><div class="people-grid">' +
      people.map(renderPersonCard).join("") + '</div></section>'
    ).join("");
    $$("[data-edit-person]").forEach(button => button.addEventListener("click", () => beginEditPerson(button.dataset.editPerson)));
    $$("[data-delete-person]").forEach(button => button.addEventListener("click", () => deletePerson(button.dataset.deletePerson)));
    $$("[data-remove-relationship]").forEach(button => button.addEventListener("click", () => deleteRelationship(button.dataset.removeRelationship)));
  }

  function renderPersonCard(person) {
    const parents = relationNames(person, "parents");
    const spouses = relationNames(person, "spouses");
    const children = relationNames(person, "children");
    const genderClass = person.gender === "female" ? "female" : person.gender === "other" ? "other" : "";
    const assigned = state.members.find(member => member.person_id === person.id);
    const detailBits = [];
    if (person.birth_date) detailBits.push("Born " + prettyDate(person.birth_date));
    if (person.death_date) detailBits.push("Died " + prettyDate(person.death_date));
    const connection = (label, related) => {
      if (!related.length) return "";
      return '<div class="connection-line"><strong>' + escapeHtml(label) + '</strong>' +
        related.map(item => escapeHtml(item.full_name)).join(", ") + '</div>';
    };
    const relationshipChips = state.relationships.filter(r => r.person_id === person.id || r.related_person_id === person.id)
      .map(r => {
        const otherId = r.person_id === person.id ? r.related_person_id : r.person_id;
        const other = state.people.find(p => p.id === otherId);
        if (!other) return "";
        const label = r.relationship_type === "spouse" ? "Spouse" :
          (r.person_id === person.id ? "Parent of " : "Child of ") + other.full_name;
        return '<span class="connection-line">' + escapeHtml(label) +
          (isManager() ? ' <button type="button" class="text-action" data-remove-relationship="' + escapeHtml(r.id) + '">×</button>' : '') +
          '</span>';
      }).join("");
    return '<article class="person-card"><div class="person-card-top"><span class="person-avatar ' + genderClass + '">' +
      escapeHtml(initials(person.full_name)) + '</span><div><h4>' + escapeHtml(person.full_name) +
      '</h4>' + (person.tamil_name ? '<div class="tamil-name">' + escapeHtml(person.tamil_name) + '</div>' : '') + '</div></div>' +
      (detailBits.length ? '<div class="person-meta">' + detailBits.map(escapeHtml).join(" · ") + '</div>' : '') +
      (person.notes ? '<div class="person-meta">' + escapeHtml(person.notes) + '</div>' : '') +
      (assigned ? '<span class="unassigned-pill">Linked account: ' + escapeHtml(assigned.display_name || "Family member") + '</span>' : '') +
      ((parents.length || spouses.length || children.length) ? '<div class="person-connections">' + connection(t("parent"), parents) +
        connection(t("spouse"), spouses) + connection(t("children"), children) + '</div>' : (relationshipChips ? '<div class="person-connections">' + relationshipChips + '</div>' : '')) +
      (isManager() ? '<div class="person-card-actions"><button class="secondary-button" type="button" data-edit-person="' + escapeHtml(person.id) + '">' + escapeHtml(t("edit")) +
        '</button><button class="danger-button" type="button" data-delete-person="' + escapeHtml(person.id) + '">' + escapeHtml(t("delete")) + '</button></div>' : '') +
      '</article>';
  }

  function renderMembers() {
    const root = $("#tree-members-list");
    if (!isManager()) { root.innerHTML = ""; return; }
    const owner = state.activeMembership.role === "owner";
    if (!state.members.length) { root.innerHTML = '<div class="empty-state">No members yet.</div>'; return; }
    root.innerHTML = state.members.map(member => {
      const targetIsOwner = member.role === "owner";
      const targetIsAdmin = member.role === "admin";
      const roleControl = targetIsOwner || (!owner && targetIsAdmin)
        ? '<span class="role-pill role-' + escapeHtml(member.role) + '">' + escapeHtml(roleLabel(member.role)) + '</span>'
        : '<label class="inline-control"><span class="tiny-label">Role</span><select class="form-input" data-member-role="' + escapeHtml(member.user_id) + '">' +
          ['viewer','member'].concat(owner ? ['admin'] : []).map(role => '<option value="' + role + '"' + (role === member.role ? ' selected' : '') + '>' + escapeHtml(roleLabel(role)) + '</option>').join("") +
          '</select></label>';
      const assignedId = member.person_id || "";
      const assignedControl = '<label class="inline-control"><span class="tiny-label">Assigned family entry</span><select class="form-input" data-member-person="' + escapeHtml(member.user_id) + '">' +
        '<option value="">Not linked</option>' + state.people.filter(person => !state.members.some(other => other.person_id === person.id && other.user_id !== member.user_id))
        .map(person => '<option value="' + escapeHtml(person.id) + '"' + (assignedId === person.id ? ' selected' : '') + '>' + escapeHtml(person.full_name) + '</option>').join("") +
        '</select></label>';
      return '<div class="member-row"><div class="member-identity"><span class="person-avatar">' + escapeHtml(initials(member.display_name)) +
        '</span><div><strong>' + escapeHtml(member.display_name || "Family member") + '</strong><small>' +
        (member.user_id === state.user.id ? "You · " : "") + escapeHtml(member.user_id === state.user.id ? (state.user.email || "Signed in") : "Approved member") +
        '</small></div></div>' + roleControl + '<div class="member-controls">' + assignedControl + '</div></div>';
    }).join("");
    $$("[data-member-role]").forEach(select => select.addEventListener("change", async () => {
      const { error } = await callRpc("uravu_set_member_role", {
        p_tree_id:state.activeTree.id, p_user_id:select.dataset.memberRole, p_role:select.value
      });
      if (error) { showDbError(error, "change role"); await loadWorkspace(state.activeTree.id, false); return; }
      toast("Member role updated.");
      await refreshDashboard();
    }));
    $$("[data-member-person]").forEach(select => select.addEventListener("change", async () => {
      const value = select.value || null;
      const { error } = await callRpc("uravu_assign_member_person", {
        p_tree_id:state.activeTree.id, p_user_id:select.dataset.memberPerson, p_person_id:value
      });
      if (error) { showDbError(error, "assign family entry"); await loadWorkspace(state.activeTree.id, false); return; }
      toast(value ? "Family entry assigned to the account." : "Family entry unlinked.");
      await loadWorkspace(state.activeTree.id, false);
    }));
  }

  function renderRequests() {
    const root = $("#tree-requests-list");
    if (!isManager()) { root.innerHTML = ""; return; }
    if (!state.requests.length) {
      root.innerHTML = '<div class="empty-state"><strong>' + escapeHtml(t("noRequests")) + '</strong>New join, role and linking requests will appear here.</div>';
      return;
    }
    const owner = state.activeMembership.role === "owner";
    root.innerHTML = state.requests.map(request => {
      let typeLabel = request.request_type === "join" ? t("joinRequest") :
        request.request_type === "link" ? t("linkRequest") : t("roleChange");
      const requestedPerson = state.people.find(person => person.id === request.requested_person_id);
      const requestedRole = request.requested_role || "viewer";
      const roleOptions = ['viewer','member'].concat(owner ? ['admin'] : []);
      const roleSelect = '<label class="inline-control"><span class="tiny-label">Assign role</span><select class="form-input" data-review-role="' +
        escapeHtml(request.id) + '">' + roleOptions.map(role => '<option value="' + role + '"' +
        ((role === requestedRole && role !== "admin" || (owner && role === requestedRole)) ? ' selected' : '') + '>' +
        escapeHtml(roleLabel(role)) + '</option>').join("") + '</select></label>';
      return '<article class="request-row"><div><div class="request-identity"><span class="person-avatar">' +
        escapeHtml(initials(request.display_name)) + '</span><div><strong>' + escapeHtml(request.display_name || "Family member") +
        '</strong><small>' + escapeHtml(typeLabel) + ' · ' + escapeHtml(roleLabel(requestedRole)) + '</small></div></div>' +
        '<p class="request-copy">' + escapeHtml(request.message || "No message added.") +
        (requestedPerson ? '<br>Requested family entry: <strong>' + escapeHtml(requestedPerson.full_name) + '</strong>' : '') +
        '</p></div>' + roleSelect + '<div class="request-actions"><button class="primary-button" type="button" data-review-request="' +
        escapeHtml(request.id) + '" data-decision="approve">' + escapeHtml(t("approve")) +
        '</button><button class="danger-button" type="button" data-review-request="' + escapeHtml(request.id) +
        '" data-decision="reject">' + escapeHtml(t("reject")) + '</button></div></article>';
    }).join("");
    $$("[data-review-request]").forEach(button => button.addEventListener("click", () => reviewRequest(button.dataset.reviewRequest, button.dataset.decision, button)));
  }

  async function reviewRequest(requestId, decision, button) {
    const select = $('[data-review-role="' + CSS.escape(requestId) + '"]');
    const role = select?.value || "viewer";
    setBusy(button, true, decision === "approve" ? "Approving…" : "Rejecting…");
    const { error } = await callRpc("uravu_review_tree_request", {
      p_request_id:requestId, p_decision:decision, p_role:role
    });
    setBusy(button, false);
    if (error) { showDbError(error, "review request"); return; }
    toast(decision === "approve" ? "Request approved and role assigned." : "Request rejected.");
    await refreshDashboard();
  }

  function openRequestDialog(treeId, isMember) {
    const tree = state.trees.find(item => item.id === treeId);
    if (!tree) { toast("Family tree not found.", true); return; }
    const membership = state.memberships.find(item => item.tree_id === treeId);
    const currentRole = membership?.role || "viewer";
    if (membership?.role === "owner") { toast("As the owner, use Manage members to link your own family entry.", true); return; }
    const roleOptions = ['viewer','member','admin'].map(role =>
      '<option value="' + role + '"' + (role === currentRole ? ' selected' : '') + '>' + escapeHtml(roleLabel(role)) + '</option>').join("");
    const personOptions = ['<option value="">No entry selected</option>'].concat(
      state.people.filter(person => !state.members.some(member => member.person_id === person.id && member.user_id !== state.user.id))
        .map(person => '<option value="' + escapeHtml(person.id) + '">' + escapeHtml(person.full_name) + '</option>')
    ).join("");
    $("#request-modal-title").textContent = isMember ? "Request a role change or family-entry link" : "Request access to " + tree.name;
    $("#request-modal-description").textContent = isMember
      ? "The tree owner or an admin will review this request."
      : "Choose the role you want to request. The owner or an admin decides what to approve.";
    $("#request-modal-body").innerHTML =
      '<form id="access-request-form">' +
      '<label class="field-label" for="request-role">Requested role</label><select class="form-input" id="request-role" required>' +
      roleOptions + '</select>' +
      (isMember ? '<label class="field-label" for="request-person">Request to link your account to a family member</label><select class="form-input" id="request-person">' +
        personOptions + '</select>' : '') +
      '<label class="field-label" for="request-message">Message <span class="optional">Optional</span></label><textarea class="form-input form-textarea" id="request-message" maxlength="1000" placeholder="Explain your request briefly"></textarea>' +
      '<div class="modal-actions"><button class="secondary-button" id="cancel-access-request" type="button">' + escapeHtml(t("cancel")) +
      '</button><button class="primary-button" type="submit">' + escapeHtml(t("sendRequest")) + '</button></div></form>';
    $("#request-modal").hidden = false;
    $("#cancel-access-request").addEventListener("click", closeRequestDialog);
    $("#access-request-form").addEventListener("submit", async event => {
      event.preventDefault();
      const submitButton = event.currentTarget.querySelector('button[type="submit"]');
      const requestedRole = $("#request-role").value;
      const requestedPerson = isMember ? ($("#request-person").value || null) : null;
      const message = $("#request-message").value.trim();
      setBusy(submitButton, true, "Sending…");
      const { error } = await callRpc("uravu_request_tree_access", {
        p_tree_id:treeId, p_message:message, p_requested_role:requestedRole, p_requested_person_id:requestedPerson
      });
      setBusy(submitButton, false);
      if (error) { showDbError(error, "request access"); return; }
      closeRequestDialog();
      toast(t("requestSent"));
      await refreshDashboard();
      if (state.activeTree?.id === treeId) await loadWorkspace(treeId, false);
    });
  }

  function closeRequestDialog() { $("#request-modal").hidden = true; $("#request-modal-body").innerHTML = ""; }

  function clearPersonForm() {
    state.editingPersonId = null;
    $("#person-form").reset();
    $("#person-form-title").textContent = "Add a family member";
    $("#save-person-button").textContent = "Add family member";
    $("#cancel-edit-button").hidden = true;
    renderPersonConnectOptions();
  }

  function beginEditPerson(personId) {
    const person = state.people.find(item => item.id === personId);
    if (!person || !isManager()) return;
    state.editingPersonId = personId;
    $("#person-name").value = person.full_name || "";
    $("#person-tamil").value = person.tamil_name || "";
    $("#person-gender").value = person.gender || "";
    $("#person-birth").value = person.birth_date || "";
    $("#person-death").value = person.death_date || "";
    $("#person-notes").value = person.notes || "";
    $("#person-form-title").textContent = "Edit family member";
    $("#save-person-button").textContent = "Save changes";
    $("#cancel-edit-button").hidden = false;
    $("#add-person-panel").scrollIntoView({ behavior:"smooth", block:"start" });
    $("#person-name").focus();
    renderPersonConnectOptions();
  }

  async function savePerson(event) {
    event.preventDefault();
    if (!isManager() || !state.activeTree) return;
    const button = $("#save-person-button");
    const data = {
      full_name:$("#person-name").value.trim(),
      tamil_name:$("#person-tamil").value.trim() || null,
      gender:$("#person-gender").value || null,
      birth_date:$("#person-birth").value || null,
      death_date:$("#person-death").value || null,
      notes:$("#person-notes").value.trim() || null
    };
    if (!data.full_name) { toast("A name is required.", true); return; }
    if (data.birth_date && data.death_date && data.death_date < data.birth_date) {
      toast("Date of death cannot be earlier than date of birth.", true); return;
    }
    const connectedId = $("#connect-person").value || null;
    const connectionType = $("#connect-type").value;
    setBusy(button, true, "Saving…");
    let personId = state.editingPersonId;
    let error = null;
    if (personId) {
      const result = await db.from("uravu_people").update(data).eq("id", personId).eq("tree_id", state.activeTree.id).select("id").single();
      error = result.error;
    } else {
      const result = await db.from("uravu_people").insert({
        tree_id:state.activeTree.id, created_by:state.user.id, ...data
      }).select("id").single();
      error = result.error;
      personId = result.data?.id;
    }
    if (!error && connectedId && personId) {
      const linked = await callRpc("uravu_link_people", {
        p_tree_id:state.activeTree.id, p_person_id:personId,
        p_related_person_id:connectedId, p_relationship_type:connectionType
      });
      error = linked.error;
    }
    setBusy(button, false);
    if (error) { showDbError(error, "save family member"); return; }
    clearPersonForm();
    toast(state.editingPersonId ? "Family member updated." : "Family member added.");
    await loadWorkspace(state.activeTree.id, false);
  }

  async function deletePerson(personId) {
    const person = state.people.find(item => item.id === personId);
    if (!person || !isManager()) return;
    if (!window.confirm("Delete " + person.full_name + " and their family connections? Accounts linked to this entry will be unlinked.")) return;
    const { error } = await db.from("uravu_people").delete().eq("id", personId).eq("tree_id", state.activeTree.id);
    if (error) { showDbError(error, "delete person"); return; }
    toast("Family member and connections deleted.");
    await loadWorkspace(state.activeTree.id, false);
  }

  async function deleteRelationship(relationshipId) {
    if (!isManager() || !window.confirm("Remove this family connection?")) return;
    const { error } = await db.from("uravu_relationships").delete().eq("id", relationshipId).eq("tree_id", state.activeTree.id);
    if (error) { showDbError(error, "remove connection"); return; }
    toast("Family connection removed.");
    await loadWorkspace(state.activeTree.id, false);
  }

  async function deleteTree() {
    if (!state.activeTree || state.activeMembership?.role !== "owner") return;
    const name = state.activeTree.name;
    if (!window.confirm('Permanently delete "' + name + '" and all of its family members, relationships, member assignments, and requests? This cannot be undone.')) return;
    const { error } = await callRpc("uravu_delete_tree", { p_tree_id:state.activeTree.id });
    if (error) { showDbError(error, "delete tree"); return; }
    state.activeTree = null;
    state.activeMembership = null;
    $("#tree-workspace").hidden = true;
    toast("Family tree deleted.");
    await refreshDashboard();
  }

  function setLanguage() {
    state.language = state.language === "en" ? "ta" : "en";
    document.documentElement.lang = state.language;
    $("#language-button").textContent = state.language === "en" ? "தமிழ்" : "English";
    renderTreeLists();
    if (state.activeTree) renderWorkspace();
  }

  function bindEvents() {
    $("#create-tree-form").addEventListener("submit", createTree);
    $("#refresh-button").addEventListener("click", refreshDashboard);
    $("#tree-search").addEventListener("input", renderTreeLists);
    $("#people-search").addEventListener("input", renderPeople);
    $("#person-form").addEventListener("submit", savePerson);
    $("#cancel-edit-button").addEventListener("click", clearPersonForm);
    $("#request-role-button").addEventListener("click", () => {
      if (state.activeTree) openRequestDialog(state.activeTree.id, true);
    });
    $("#close-tree-button").addEventListener("click", () => {
      state.activeTree = null;
      state.activeMembership = null;
      $("#tree-workspace").hidden = true;
    });
    $("#delete-tree-button").addEventListener("click", deleteTree);
    $("#language-button").addEventListener("click", setLanguage);
    $("#request-modal-close").addEventListener("click", closeRequestDialog);
    $("#request-modal").addEventListener("click", event => {
      if (event.target.id === "request-modal") closeRequestDialog();
    });
  }

  async function start() {
    if (!db) {
      $("#signed-out").hidden = false;
      $("#dashboard").hidden = true;
      toast("Supabase client is missing. Check supabase-config.js.", true);
      return;
    }
    bindEvents();
    document.addEventListener("uravu:auth", event => renderAuth(event.detail?.user || null));
    if (window.uravuAuth?.ready) {
      const user = await window.uravuAuth.ready;
      renderAuth(user || null);
    } else {
      renderAuth(null);
    }
  }

  start();
})();
