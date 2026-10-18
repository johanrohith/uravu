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
    language: (() => { try { return localStorage.getItem("uravu-language") === "ta" ? "ta" : "en"; } catch (_) { return "en"; } })(),
    toastTimer: null,
    loadingTree: false,
    treeZoom: 1,
    treeBaseWidth: 0,
    treeBaseHeight: 0
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


  const interfaceTranslations = {"Uravu — Family tree":"உறவு — குடும்ப மரம்","Uravu home":"உறவு முகப்பு","Change language":"மொழியை மாற்று","Sign in with Google":"Google மூலம் உள்நுழைக","Sign out":"வெளியேறு","YOUR FAMILY, CONNECTED":"உங்கள் குடும்பம், ஒன்றிணைந்து","Every generation has a story.":"ஒவ்வொரு தலைமுறைக்கும் ஒரு கதை உண்டு.","Build your family tree, preserve names and relationships, and invite family members to contribute with the right permissions.":"உங்கள் குடும்ப மரத்தை உருவாக்கி, பெயர்களையும் உறவுகளையும் பாதுகாத்து, சரியான அனுமதிகளுடன் குடும்ப உறுப்பினர்களைப் பங்களிக்க அழைக்கவும்.","Continue with Google":"Google மூலம் தொடரவும்","Your family tree is private to its members. Nothing is shown here until you sign in and open or create a tree.":"உங்கள் குடும்ப மரத்தை அதன் உறுப்பினர்கள் மட்டுமே பார்க்க முடியும். உள்நுழைந்து ஒரு மரத்தைத் திறக்கும் அல்லது உருவாக்கும் வரை இங்கு எதுவும் காட்டப்படாது.","Generation":"தலைமுறை","before us":"நமக்கு முன்","Parents &":"பெற்றோர் மற்றும்","guardians":"பாதுகாவலர்கள்","You":"நீங்கள்","and yours":"உங்கள் குடும்பம்","The next":"அடுத்த","generation":"தலைமுறை","YOUR FAMILY WORKSPACE":"உங்கள் குடும்பப் பணியிடம்","Welcome to Uravu":"உறவுக்கு வரவேற்கிறோம்","Create a tree or request access to one that already exists.":"புதிய குடும்ப மரத்தை உருவாக்கவும் அல்லது ஏற்கனவே உள்ள மரத்திற்கு அணுகலைக் கோரவும்.","Family data is loaded from Supabase, not browser cache":"குடும்பத் தரவு உலாவி தற்காலிக நினைவகத்திலிருந்து அல்ல, Supabase-இலிருந்து ஏற்றப்படுகிறது","Create a family tree":"குடும்ப மரத்தை உருவாக்கு","Start a new family space. You become its owner.":"புதிய குடும்ப இடத்தைத் தொடங்குங்கள். அதன் உரிமையாளர் நீங்களாக இருப்பீர்கள்.","Family tree name":"குடும்ப மரத்தின் பெயர்","e.g. The Kumar family":"எ.கா. குமார் குடும்பம்","Description":"விளக்கம்","Optional":"விருப்பத்தேர்வு","A short note about this family tree":"இந்தக் குடும்ப மரத்தைப் பற்றிய சிறு குறிப்பு","Primary language":"முதன்மை மொழி","Create tree":"மரத்தை உருவாக்கு","Find a family tree":"குடும்ப மரத்தைக் கண்டுபிடி","Request access and ask for the role you need.":"அணுகலைக் கோரி, உங்களுக்குத் தேவையான பங்கைக் கேளுங்கள்.","Search trees":"குடும்ப மரங்களைத் தேடு","Search by tree name...":"குடும்ப மரத்தின் பெயரால் தேடுங்கள்...","Loading available trees…":"கிடைக்கும் குடும்ப மரங்கள் ஏற்றப்படுகின்றன…","YOUR MEMBERSHIPS":"உங்கள் உறுப்பினர் நிலைகள்","My family trees":"எனது குடும்ப மரங்கள்","Refresh":"புதுப்பி","Loading your trees…":"உங்கள் குடும்ப மரங்கள் ஏற்றப்படுகின்றன…","Loading trees…":"குடும்ப மரங்கள் ஏற்றப்படுகின்றன…","TREE MEMBER":"குடும்ப மர உறுப்பினர்","Family tree":"குடும்ப மரம்","Request role / link":"பங்கு / இணைப்பைக் கோரு","Close tree":"மரத்தை மூடு","Tree accounts":"மரக் கணக்குகள்","Pending requests":"நிலுவையிலுள்ள கோரிக்கைகள்","TREE EDITING":"குடும்ப மரத் திருத்தம்","Add a family member":"குடும்ப உறுப்பினரைச் சேர்","Cancel edit":"திருத்தத்தை ரத்து செய்","Name":"பெயர்","Full name":"முழுப் பெயர்","Tamil name":"தமிழ்ப் பெயர்","Gender":"பாலினம்","Not specified":"குறிப்பிடப்படவில்லை","Male":"ஆண்","Female":"பெண்","Other / prefer not to say":"மற்றவை / தெரிவிக்க விருப்பமில்லை","Date of birth":"பிறந்த தேதி","Date of death":"இறந்த தேதி","Connect to someone":"ஒருவருடன் இணை","No connection yet":"இன்னும் உறவு இணைக்கப்படவில்லை","Relationship to them":"அவருடனான உறவு","Child of selected person":"தேர்ந்தெடுத்த நபரின் பிள்ளை","Parent of selected person":"தேர்ந்தெடுத்த நபரின் பெற்றோர்","Spouse / partner":"துணைவர் / துணைவி","Notes":"குறிப்புகள்","Additional details (avoid sensitive information)":"கூடுதல் விவரங்கள் (முக்கியமான தனிப்பட்ட தகவல்களைத் தவிர்க்கவும்)","FAMILY TREE":"குடும்ப மரம்","Search names…":"பெயர்களைத் தேடு…","Reset view":"காட்சியை மீட்டமை","Fit tree":"மரத்தைப் பொருத்து","Zoom out":"சிறிதாக்கு","Zoom in":"பெரிதாக்கு","Full screen":"முழுத்திரை","Exit full screen":"முழுத்திரையிலிருந்து வெளியேறு","Pinch to zoom · drag to move · Ctrl + scroll to zoom":"பெரிதாக்க இரண்டு விரல்களைப் பயன்படுத்தவும் · நகர்த்த இழுக்கவும்","ACCESS CONTROL":"அணுகல் கட்டுப்பாடு","Manage members":"உறுப்பினர்களை நிர்வகி","Change roles and link an account to a family member. Only the owner can grant or remove admin access.":"பங்குகளை மாற்றி, கணக்கை குடும்ப உறுப்பினருடன் இணைக்கவும். நிர்வாகி அணுகலை வழங்கவோ நீக்கவோ உரிமையாளருக்கு மட்டுமே அதிகாரம் உண்டு.","NEEDS REVIEW":"பரிசீலனை தேவை","Access, role and linking requests":"அணுகல், பங்கு மற்றும் இணைப்புக் கோரிக்கைகள்","Review each request and choose the role to assign. Only the owner can make someone an admin.":"ஒவ்வொரு கோரிக்கையையும் பரிசீலித்து வழங்க வேண்டிய பங்கைத் தேர்ந்தெடுக்கவும். ஒருவரை நிர்வாகியாக்க உரிமையாளருக்கு மட்டுமே அதிகாரம் உண்டு.","Delete this family tree":"இந்தக் குடும்ப மரத்தை நீக்கு","This permanently deletes its people, relationships, memberships and requests.":"இதனால் அதன் உறுப்பினர்கள், உறவுகள், உறுப்பினர் நிலைகள் மற்றும் கோரிக்கைகள் நிரந்தரமாக நீக்கப்படும்.","FAMILY TREE REQUEST":"குடும்ப மரக் கோரிக்கை","Request access":"அணுகலைக் கோரு","Close":"மூடு","Uravu could not start":"உறவைத் தொடங்க முடியவில்லை","One of the app files did not load.":"செயலியின் கோப்புகளில் ஒன்று ஏற்றப்படவில்லை.","Try again":"மீண்டும் முயற்சி செய்","Uravu could not start because a required file or service could not load. Refresh the page or try again later.":"தேவையான கோப்பு அல்லது சேவை ஏற்றப்படாததால் உறவைத் தொடங்க முடியவில்லை. பக்கத்தைப் புதுப்பிக்கவும் அல்லது சிறிது நேரம் கழித்து முயற்சிக்கவும்.","Could not load family trees":"குடும்ப மரங்களை ஏற்ற முடியவில்லை","Database setup or permissions need attention.":"தரவுத்தள அமைப்பு அல்லது அனுமதிகளைச் சரிபார்க்க வேண்டும்.","No description provided.":"விளக்கம் வழங்கப்படவில்லை.","Loading family members from Supabase…":"Supabase-இலிருந்து குடும்ப உறுப்பினர்கள் ஏற்றப்படுகின்றனர்…","Loading members…":"உறுப்பினர்கள் ஏற்றப்படுகின்றனர்…","No members yet.":"இதுவரை உறுப்பினர்கள் இல்லை.","Role":"பங்கு","Assigned family entry":"ஒதுக்கப்பட்ட குடும்பப் பதிவு","Not linked":"இணைக்கப்படவில்லை","Family member":"குடும்ப உறுப்பினர்","Signed in":"உள்நுழைந்துள்ளார்","Approved member":"ஒப்புதல் பெற்ற உறுப்பினர்","Assign role":"பங்கை ஒதுக்கு","No message added.":"செய்தி எதுவும் சேர்க்கப்படவில்லை.","Requested family entry:":"கோரப்பட்ட குடும்பப் பதிவு:","New join, role and linking requests will appear here.":"புதிய இணைப்பு, பங்கு மற்றும் இணைப்புக் கோரிக்கைகள் இங்கே தோன்றும்.","Remove connection":"உறவு இணைப்பை நீக்கு","No connections yet":"இன்னும் உறவுகள் இல்லை","Linked account:":"இணைக்கப்பட்ட கணக்கு:","Born":"பிறப்பு","Died":"இறப்பு","Spouse / partner:":"துணைவர் / துணைவி:","Parent of:":"பெற்றோர்:","Child of:":"பிள்ளை:","Request approved and role assigned.":"கோரிக்கை ஏற்கப்பட்டு பங்கு ஒதுக்கப்பட்டது.","Request rejected.":"கோரிக்கை நிராகரிக்கப்பட்டது.","Member role updated.":"உறுப்பினரின் பங்கு புதுப்பிக்கப்பட்டது.","Family entry assigned to the account.":"குடும்பப் பதிவு கணக்குடன் இணைக்கப்பட்டது.","Family entry unlinked.":"குடும்பப் பதிவு கணக்கிலிருந்து துண்டிக்கப்பட்டது.","Family member updated.":"குடும்ப உறுப்பினர் விவரங்கள் புதுப்பிக்கப்பட்டன.","Family member added.":"குடும்ப உறுப்பினர் சேர்க்கப்பட்டார்.","Family member and connections deleted.":"குடும்ப உறுப்பினரும் அவருடைய உறவு இணைப்புகளும் நீக்கப்பட்டன.","Family connection removed.":"குடும்ப உறவு இணைப்பு நீக்கப்பட்டது.","Family tree deleted.":"குடும்ப மரம் நீக்கப்பட்டது.","Enter a family tree name with at least 2 characters.":"குடும்ப மரத்தின் பெயர் குறைந்தது 2 எழுத்துகள் கொண்டிருக்க வேண்டும்.","Creating…":"உருவாக்கப்படுகிறது…","Family tree created. You are the owner.":"குடும்ப மரம் உருவாக்கப்பட்டது. நீங்கள் அதன் உரிமையாளர்.","You must be an approved member to open this tree.":"இந்த மரத்தைத் திறக்க ஒப்புதல் பெற்ற உறுப்பினராக இருக்க வேண்டும்.","Family connections across generations.":"தலைமுறைகளைக் கடந்து இணையும் குடும்ப உறவுகள்.","Your tree access request is awaiting review. You can submit an updated request if needed.":"உங்கள் குடும்ப மர அணுகல் கோரிக்கை பரிசீலனைக்காகக் காத்திருக்கிறது. தேவைப்பட்டால் புதுப்பிக்கப்பட்ட கோரிக்கையை அனுப்பலாம்.","Your family-entry link request is awaiting review. You can submit an updated request if needed.":"உங்கள் குடும்பப் பதிவு இணைப்புக் கோரிக்கை பரிசீலனைக்காகக் காத்திருக்கிறது. தேவைப்பட்டால் புதுப்பிக்கப்பட்ட கோரிக்கையை அனுப்பலாம்.","Your role-change request is awaiting review. You can submit an updated request if needed.":"உங்கள் பங்கு மாற்றக் கோரிக்கை பரிசீலனைக்காகக் காத்திருக்கிறது. தேவைப்பட்டால் புதுப்பிக்கப்பட்ட கோரிக்கையை அனுப்பலாம்.","A name is required.":"பெயர் அவசியம்.","Date of death cannot be earlier than date of birth.":"இறந்த தேதி, பிறந்த தேதிக்கு முந்தையதாக இருக்க முடியாது.","Saving…":"சேமிக்கப்படுகிறது…","Approving…":"ஏற்கப்படுகிறது…","Rejecting…":"நிராகரிக்கப்படுகிறது…","Sending…":"அனுப்பப்படுகிறது…","Request a role change or family-entry link":"பங்கு மாற்றம் அல்லது குடும்பப் பதிவு இணைப்பைக் கோரு","The tree owner or an admin will review this request.":"இந்தக் கோரிக்கையை குடும்ப மர உரிமையாளர் அல்லது நிர்வாகி பரிசீலிப்பார்.","Choose the role you want to request. The owner or an admin decides what to approve.":"நீங்கள் கோர விரும்பும் பங்கைத் தேர்ந்தெடுக்கவும். எதை ஏற்க வேண்டும் என்பதை உரிமையாளர் அல்லது நிர்வாகி தீர்மானிப்பார்.","Requested role":"கோரப்படும் பங்கு","Request to link your account to a family member":"உங்கள் கணக்கை ஒரு குடும்ப உறுப்பினருடன் இணைக்கக் கோரு","Message":"செய்தி","Explain your request briefly":"உங்கள் கோரிக்கையைச் சுருக்கமாக விளக்குங்கள்","Send request":"கோரிக்கையை அனுப்பு","Request sent for the owner or an admin to review.":"உரிமையாளர் அல்லது நிர்வாகி பரிசீலிக்கக் கோரிக்கை அனுப்பப்பட்டது.","Add family member":"குடும்ப உறுப்பினரைச் சேர்","Edit family member":"குடும்ப உறுப்பினரைத் திருத்து","Save changes":"மாற்றங்களைச் சேமி","This family tree is empty":"இந்தக் குடும்ப மரம் காலியாக உள்ளது","Add the first family member to begin building your tree.":"குடும்ப மரத்தை உருவாக்கத் தொடங்க முதல் உறுப்பினரைச் சேர்க்கவும்.","You have not joined any family trees yet.":"நீங்கள் இன்னும் எந்தக் குடும்ப மரத்திலும் இணையவில்லை.","Create one or request access to an existing tree.":"புதிய மரத்தை உருவாக்கவும் அல்லது இருக்கும் மரத்திற்கு அணுகலைக் கோரவும்.","No other family trees are available to request.":"அணுகல் கோர வேறு குடும்ப மரங்கள் இல்லை.","Request pending":"கோரிக்கை நிலுவையில் உள்ளது","Requested":"கோரப்பட்டது","Open tree":"மரத்தைத் திற","Members":"உறுப்பினர்கள்","Save":"சேமி","Cancel":"ரத்து செய்","Approve":"ஏற்கவும்","Reject":"நிராகரி","No requests need review.":"பரிசீலிக்க வேண்டிய கோரிக்கைகள் இல்லை.","No connection added.":"உறவு இணைப்பு சேர்க்கப்படவில்லை.","The new Uravu database schema is not installed yet. Run supabase/schema.sql in your Supabase SQL Editor.":"Uravu-வின் புதிய தரவுத்தள அமைப்பு இன்னும் நிறுவப்படவில்லை. Supabase SQL Editor-ல் supabase/schema.sql-ஐ இயக்கவும்.","Database permission blocked this action. Check the Supabase policies in supabase/schema.sql.":"தரவுத்தள அனுமதி இந்தச் செயலைத் தடுத்தது. supabase/schema.sql-இல் உள்ள Supabase கொள்கைகளைச் சரிபார்க்கவும்.","Something went wrong. Please try again.":"ஏதோ தவறு ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.","Sign in with Google to continue.":"தொடர Google மூலம் உள்நுழைக.","Supabase client is not initialized.":"Supabase கிளையன்ட் தொடங்கப்படவில்லை.","Supabase client is missing. Check supabase-config.js.":"Supabase கிளையன்ட் இல்லை. supabase-config.js-ஐச் சரிபார்க்கவும்.","Uravu could not connect to Supabase. Check supabase-config.js.":"Uravu-வால் Supabase-உடன் இணைக்க முடியவில்லை. supabase-config.js-ஐச் சரிபார்க்கவும்.","Delete this family connection?":"இந்தக் குடும்ப உறவு இணைப்பை நீக்கவா?","As the owner, use Manage members to link your own family entry.":"உரிமையாளராக, உங்கள் குடும்பப் பதிவை இணைக்க உறுப்பினர்களை நிர்வகி என்பதைப் பயன்படுத்தவும்.","Family tree not found.":"குடும்ப மரத்தைக் காணவில்லை.","Could not load this family tree.":"இந்தக் குடும்ப மரத்தை ஏற்ற முடியவில்லை."};
  interfaceTranslations["YOUR ROLE"] = "உங்கள் பங்கு";
  interfaceTranslations["Family members"] = "குடும்ப உறுப்பினர்கள்";
  interfaceTranslations["Delete tree"] = "மரத்தை நீக்கு";
  const tamilToEnglish = {};
  Object.entries(interfaceTranslations).forEach(([english, tamil]) => {
    if (!(tamil in tamilToEnglish)) tamilToEnglish[tamil] = english;
  });

  function translateUiValue(value) {
    const raw = String(value == null ? "" : value);
    const trimmed = raw.trim();
    const leading = raw.match(/^\s*/)?.[0] || "";
    const trailing = raw.match(/\s*$/)?.[0] || "";
    if (!trimmed) return raw;
    let translated = state.language === "ta" ? (interfaceTranslations[trimmed] || trimmed) : (tamilToEnglish[trimmed] || trimmed);
    if (translated === trimmed) {
      if (state.language === "ta") {
        const patterns = [
          [/^Welcome, (.+)$/, "வணக்கம், $1"],
          [/^Request access to (.+)$/, "$1 அணுகலைக் கோரு"],
          [/^Linked account: (.+)$/, "இணைக்கப்பட்ட கணக்கு: $1"],
          [/^Spouse \/ partner: (.+)$/, "துணைவர் / துணைவி: $1"],
          [/^Parent of: (.+)$/, "பெற்றோர்: $1"],
          [/^Child of: (.+)$/, "பிள்ளை: $1"],
          [/^Born (.+)$/, "பிறப்பு $1"],
          [/^Died (.+)$/, "இறப்பு $1"],
          [/^Google sign-in failed: (.+)$/, "Google உள்நுழைவு தோல்வியடைந்தது: $1"],
          [/^Sign-out failed: (.+)$/, "வெளியேறுதல் தோல்வியடைந்தது: $1"],
          [/^You · (.+)$/, "நீங்கள் · $1"],
          [/^Delete (.+) and their family connections\? Accounts linked to this entry will be unlinked\.$/, "$1 மற்றும் அவர்களின் குடும்ப உறவுகளை நீக்கவா? இந்தப் பதிவுடன் இணைக்கப்பட்ட கணக்குகள் துண்டிக்கப்படும்."],
          [/^Permanently delete "(.+)" and all of its family members, relationships, member assignments, and requests\? This cannot be undone\.$/, '"$1" மற்றும் அதன் அனைத்து குடும்ப உறுப்பினர்கள், உறவுகள், உறுப்பினர் ஒதுக்கீடுகள், கோரிக்கைகள் அனைத்தையும் நிரந்தரமாக நீக்கவா? இதை மீட்டெடுக்க முடியாது.']
        ];
        for (const [pattern, replacement] of patterns) if (pattern.test(trimmed)) { translated = trimmed.replace(pattern, replacement); break; }
        if (/^YOUR ROLE · (.+)$/.test(trimmed)) {
          const role = trimmed.slice("YOUR ROLE · ".length);
          translated = "உங்கள் பங்கு · " + (interfaceTranslations[role] || role);
        }
      } else {
        const patterns = [
          [/^வணக்கம், (.+)$/, "Welcome, $1"],
          [/^(.+) அணுகலைக் கோரு$/, "Request access to $1"],
          [/^இணைக்கப்பட்ட கணக்கு: (.+)$/, "Linked account: $1"],
          [/^துணைவர் \/ துணைவி: (.+)$/, "Spouse / partner: $1"],
          [/^பெற்றோர்: (.+)$/, "Parent of: $1"],
          [/^பிள்ளை: (.+)$/, "Child of: $1"],
          [/^பிறப்பு (.+)$/, "Born $1"],
          [/^இறப்பு (.+)$/, "Died $1"],
          [/^Google உள்நுழைவு தோல்வியடைந்தது: (.+)$/, "Google sign-in failed: $1"],
          [/^வெளியேறுதல் தோல்வியடைந்தது: (.+)$/, "Sign-out failed: $1"],
          [/^நீங்கள் · (.+)$/, "You · $1"],
          [/^(.+) மற்றும் அவர்களின் குடும்ப உறவுகளை நீக்கவா\? இந்தப் பதிவுடன் இணைக்கப்பட்ட கணக்குகள் துண்டிக்கப்படும்\.$/, "Delete $1 and their family connections? Accounts linked to this entry will be unlinked."],
          [/^"(.+)" மற்றும் அதன் அனைத்து குடும்ப உறுப்பினர்கள், உறவுகள், உறுப்பினர் ஒதுக்கீடுகள், கோரிக்கைகள் அனைத்தையும் நிரந்தரமாக நீக்கவா\? இதை மீட்டெடுக்க முடியாது\.$/, 'Permanently delete "$1" and all of its family members, relationships, member assignments, and requests? This cannot be undone.']
        ];
        for (const [pattern, replacement] of patterns) if (pattern.test(trimmed)) { translated = trimmed.replace(pattern, replacement); break; }
        if (/^உங்கள் பங்கு · (.+)$/.test(trimmed)) {
          const role = trimmed.slice("உங்கள் பங்கு · ".length);
          translated = "YOUR ROLE · " + (tamilToEnglish[role] || role);
        }
      }
    }
    return leading + translated + trailing;
  }

  function localizeDom(root) {
    if (!root) return;
    const doc = root.ownerDocument || document;
    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement && /^(SCRIPT|STYLE|NOSCRIPT)$/i.test(node.parentElement.tagName)) continue;
      const next = translateUiValue(node.nodeValue);
      if (next !== node.nodeValue) node.nodeValue = next;
    }
    root.querySelectorAll?.("*").forEach(element => ["placeholder", "aria-label", "title"].forEach(attribute => {
      if (!element.hasAttribute(attribute)) return;
      const value = element.getAttribute(attribute);
      const next = translateUiValue(value);
      if (next !== value) element.setAttribute(attribute, next);
    }));
  }

  function installLanguageObserver() {
    if (window.uravuLanguageObserver || !document.body) return;
    window.uravuLanguageObserver = new MutationObserver(records => records.forEach(record => {
      if (record.type === "characterData") {
        const target = record.target;
        if (target.parentElement && !/^(SCRIPT|STYLE|NOSCRIPT)$/i.test(target.parentElement.tagName)) {
          const next = translateUiValue(target.nodeValue);
          if (next !== target.nodeValue) target.nodeValue = next;
        }
      } else if (record.type === "childList") {
        record.addedNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            const next = translateUiValue(node.nodeValue);
            if (next !== node.nodeValue) node.nodeValue = next;
          } else if (node.nodeType === Node.ELEMENT_NODE && !/^(SCRIPT|STYLE|NOSCRIPT)$/i.test(node.tagName)) localizeDom(node);
        });
      } else if (record.type === "attributes") {
        const current = record.target.getAttribute(record.attributeName);
        if (current == null) return;
        const next = translateUiValue(current);
        if (next !== current) record.target.setAttribute(record.attributeName, next);
      }
    }));
    window.uravuLanguageObserver.observe(document.body, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:["placeholder","aria-label","title"]});
  }


  function t(key) { return translateUiValue((words[state.language] && words[state.language][key]) || words.en[key] || key); }
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
    node.textContent = translateUiValue(message);
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
      button.textContent = translateUiValue(label || "Working…");
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
      toast(translateUiValue("Database permission blocked this action. Check the Supabase policies in supabase/schema.sql."), true);
    } else {
      // Arbitrary Supabase messages are useful in the console, but keep the visible UI in Tamil.
      toast(state.language === "ta" ? "Something went wrong. Please try again." : (message || "Something went wrong. Please try again."), true);
    }
  }
  function requireSignedIn() {
    if (!state.user) { toast(t("Sign in with Google to continue."), true); return false; }
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
      ? translateUiValue("Welcome, " + ((state.user.user_metadata?.full_name || state.user.user_metadata?.name || state.user.email || "there").split(/\s+/)[0]))
      : t("Welcome to Uravu");
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
    $("#workspace-role").textContent = t("YOUR ROLE") + " · " + roleLabel(membership.role).toUpperCase();
    $("#tree-workspace").scrollIntoView({ behavior:"smooth", block:"start" });
    await loadWorkspace(treeId, true);
  }

  async function loadWorkspace(treeId, showLoading) {
    if (!state.user || !state.activeTree || state.activeTree.id !== treeId) return;
    if (showLoading) {
      $("#family-tree-viewport").hidden = true;
      $("#people-empty").hidden = false;
      $("#people-empty").textContent = "Loading family members from Supabase…";
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
    if (error) {
      showDbError(error, "tree workspace");
      $("#family-tree-viewport").hidden = true;
      $("#people-empty").hidden = false;
      $("#people-empty").textContent = t("treeLoadError");
      return;
    }
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
    $("#workspace-role").textContent = t("YOUR ROLE") + " · " + roleLabel(state.activeMembership.role).toUpperCase();
    $("#workspace-title").textContent = state.activeTree.name;
    $("#workspace-description").textContent = state.activeTree.description || "Family connections across generations.";
    $("#people-count").textContent = String(state.people.length);
    $("#member-count").textContent = String(state.members.length);
    $("#pending-count").textContent = String(manager ? state.requests.length : state.ownRequests.filter(request => request.tree_id === state.activeTree.id && request.status === "pending").length);
    const ownPending = state.ownRequests.find(request => request.tree_id === state.activeTree.id && request.status === "pending");
    const ownStatus = $("#member-request-status");
    ownStatus.hidden = !ownPending;
    ownStatus.textContent = ownPending
      ? "Your " + (ownPending.request_type === "join" ? "tree access" : ownPending.request_type === "link" ? "family-entry link" : "role-change") + " request is awaiting review. You can submit an updated request if needed."
      : "";
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
    // A spouse pair is a single generation unit. Resolve partner groups first,
    // then calculate generations from parent -> child edges between those groups.
    const parent = new Map(state.people.map(person => [person.id, person.id]));
    const find = id => {
      let root = id;
      while (parent.get(root) !== root) root = parent.get(root);
      while (parent.get(id) !== id) {
        const next = parent.get(id);
        parent.set(id, root);
        id = next;
      }
      return root;
    };
    const unite = (a, b) => {
      if (!parent.has(a) || !parent.has(b)) return;
      const rootA = find(a), rootB = find(b);
      if (rootA !== rootB) parent.set(rootB, rootA);
    };

    state.relationships
      .filter(edge => edge.relationship_type === "spouse")
      .forEach(edge => unite(edge.person_id, edge.related_person_id));

    const groups = new Map();
    state.people.forEach(person => {
      const root = find(person.id);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root).push(person.id);
    });

    const depths = new Map(Array.from(groups.keys(), id => [id, 0]));
    const parentEdges = state.relationships.filter(edge =>
      edge.relationship_type === "parent" && parent.has(edge.person_id) && parent.has(edge.related_person_id)
    );
    // Relax only across distinct spouse groups. The bounded passes avoid hanging
    // on malformed/cyclic data while still placing descendants below ancestors.
    for (let round = 0; round < groups.size; round++) {
      let changed = false;
      parentEdges.forEach(edge => {
        const parentGroup = find(edge.person_id);
        const childGroup = find(edge.related_person_id);
        if (parentGroup === childGroup) return;
        const next = Math.min(groups.size, (depths.get(parentGroup) || 0) + 1);
        if (next > (depths.get(childGroup) || 0)) {
          depths.set(childGroup, next);
          changed = true;
        }
      });
      if (!changed) break;
    }

    const result = new Map();
    state.people.forEach(person => {
      const level = depths.get(find(person.id)) || 0;
      if (!result.has(level)) result.set(level, []);
      result.get(level).push(person);
    });
    return new Map(Array.from(result.entries()).sort((a, b) => a[0] - b[0]));
  }

  function relationNames(person, type) {
    let ids = [];
    if (type === "parents") ids = state.relationships.filter(r => r.relationship_type === "parent" && r.related_person_id === person.id).map(r => r.person_id);
    if (type === "children") ids = state.relationships.filter(r => r.relationship_type === "parent" && r.person_id === person.id).map(r => r.related_person_id);
    if (type === "spouses") ids = state.relationships.filter(r => r.relationship_type === "spouse" && (r.person_id === person.id || r.related_person_id === person.id)).map(r => r.person_id === person.id ? r.related_person_id : r.person_id);
    return Array.from(new Set(ids)).map(id => state.people.find(p => p.id === id)).filter(Boolean);
  }

  function relationshipLabelsForCurrentUser() {
    const labels = new Map();
    const egoMember = state.members.find(member => member.user_id === state.user?.id && member.person_id);
    if (!egoMember) return labels;
    const egoId = egoMember.person_id;
    const byId = new Map(state.people.map(person => [person.id, person]));
    if (!byId.has(egoId)) return labels;

    const parentsByChild = new Map();
    const childrenByParent = new Map();
    const spousesByPerson = new Map();
    const add = (map, id, relatedId) => {
      if (!map.has(id)) map.set(id, new Set());
      map.get(id).add(relatedId);
    };
    state.relationships.forEach(edge => {
      if (edge.relationship_type === "parent") {
        add(parentsByChild, edge.related_person_id, edge.person_id);
        add(childrenByParent, edge.person_id, edge.related_person_id);
      } else if (edge.relationship_type === "spouse") {
        add(spousesByPerson, edge.person_id, edge.related_person_id);
        add(spousesByPerson, edge.related_person_id, edge.person_id);
      }
    });
    const parentsOf = id => parentsByChild.get(id) || new Set();
    const childrenOf = id => childrenByParent.get(id) || new Set();
    const spousesOf = id => spousesByPerson.get(id) || new Set();
    const toArray = values => Array.from(values || []);
    const grandparentsOf = id => new Set(toArray(parentsOf(id)).flatMap(parentId => toArray(parentsOf(parentId))));
    const siblingsOf = id => new Set(toArray(parentsOf(id)).flatMap(parentId => toArray(childrenOf(parentId))).filter(otherId => otherId !== id));
    const gender = person => person?.gender || "";
    const olderThan = (a, b) => Boolean(a?.birth_date && b?.birth_date && a.birth_date < b.birth_date);
    const tamilSibling = (person, anchor) => {
      if (gender(person) === "male") return olderThan(person, anchor) ? "அண்ணன்" : "தம்பி";
      if (gender(person) === "female") return olderThan(person, anchor) ? "அக்கா" : "தங்கை";
      return "சகோதரர் / சகோதரி";
    };
    const englishSibling = person => gender(person) === "male" ? "Brother" : gender(person) === "female" ? "Sister" : "Sibling";
    const gendered = (person, male, female, other) =>
      gender(person) === "male" ? male : gender(person) === "female" ? female : other;

    // Build reachability once, so disconnected or not-yet-linked entries are not
    // incorrectly labelled as relatives.
    const connected = new Set([egoId]);
    const queue = [egoId];
    for (let index = 0; index < queue.length; index++) {
      const current = queue[index];
      const nextIds = [
        ...toArray(parentsOf(current)), ...toArray(childrenOf(current)), ...toArray(spousesOf(current))
      ];
      nextIds.forEach(id => {
        if (!connected.has(id)) { connected.add(id); queue.push(id); }
      });
    }
    const ego = byId.get(egoId);
    const egoParents = toArray(parentsOf(egoId));
    const egoChildren = toArray(childrenOf(egoId));
    const egoSiblings = siblingsOf(egoId);
    const egoGrandparents = grandparentsOf(egoId);
    const egoSpouses = toArray(spousesOf(egoId));

    for (const person of state.people) {
      const id = person.id;
      let english = "";
      let tamil = "";
      if (id === egoId) {
        english = "You"; tamil = "நீங்கள்";
      } else if (spousesOf(egoId).has(id)) {
        english = gendered(person, "Husband", "Wife", "Spouse / partner");
        tamil = gender(person) === "male" ? "கணவர்" : gender(person) === "female" ? "மனைவி" : "துணைவர்";
      } else if (egoParents.includes(id)) {
        english = gendered(person, "Father", "Mother", "Parent");
        tamil = gender(person) === "male" ? "தந்தை" : gender(person) === "female" ? "தாய்" : "பெற்றோர்";
      } else if (egoChildren.includes(id)) {
        english = gendered(person, "Son", "Daughter", "Child");
        tamil = gender(person) === "male" ? "மகன்" : gender(person) === "female" ? "மகள்" : "பிள்ளை";
      } else if (egoSiblings.has(id)) {
        english = englishSibling(person);
        tamil = tamilSibling(person, ego);
      } else if (egoGrandparents.has(id)) {
        english = gendered(person, "Grandfather", "Grandmother", "Grandparent");
        tamil = gender(person) === "male" ? "தாத்தா" : gender(person) === "female" ? "பாட்டி" : "தாத்தா / பாட்டி";
      } else if (egoChildren.some(childId => childrenOf(childId).has(id))) {
        english = gendered(person, "Grandson", "Granddaughter", "Grandchild");
        tamil = gender(person) === "male" ? "பேரன்" : gender(person) === "female" ? "பேத்தி" : "பேரக்குழந்தை";
      } else {
        const parentSibling = egoParents.find(parentId => siblingsOf(parentId).has(id));
        if (parentSibling) {
          const parentPerson = byId.get(parentSibling);
          if (gender(person) === "male") {
            english = "Uncle";
            if (gender(parentPerson) === "female") tamil = "மாமா";
            else if (gender(parentPerson) === "male" && person.birth_date && parentPerson.birth_date)
              tamil = olderThan(person, parentPerson) ? "பெரியப்பா" : "சித்தப்பா";
            else tamil = "தந்தைவழி மாமா";
          } else if (gender(person) === "female") {
            english = "Aunt";
            if (gender(parentPerson) === "male") tamil = "அத்தை";
            else if (gender(parentPerson) === "female" && person.birth_date && parentPerson.birth_date)
              tamil = olderThan(person, parentPerson) ? "பெரியம்மா" : "சித்தி";
            else tamil = "தாய்வழி அத்தை";
          }
        }

        if (!english) {
          const siblingParent = toArray(parentsOf(id)).find(parentId => egoSiblings.has(parentId));
          if (siblingParent) {
            const sibling = byId.get(siblingParent);
            english = gendered(person, "Nephew", "Niece", "Nibling");
            tamil = tamilSibling(sibling, ego) + (gender(person) === "male" ? " மகன்" : gender(person) === "female" ? " மகள்" : " பிள்ளை");
          }
        }

        if (!english) {
          const spouseParent = egoSpouses.some(spouseId => parentsOf(spouseId).has(id));
          const childSpouse = egoChildren.some(childId => spousesOf(childId).has(id));
          const spouseSibling = egoSpouses.some(spouseId => siblingsOf(spouseId).has(id));
          const siblingSpouse = Array.from(egoSiblings).some(siblingId => spousesOf(siblingId).has(id));
          const stepParent = egoParents.some(parentId => spousesOf(parentId).has(id));
          if (spouseParent) {
            english = gendered(person, "Father-in-law", "Mother-in-law", "Parent-in-law");
            tamil = gender(person) === "male" ? "மாமனார்" : gender(person) === "female" ? "மாமியார்" : "மாமனார் / மாமியார்";
          } else if (childSpouse) {
            english = gendered(person, "Son-in-law", "Daughter-in-law", "Child-in-law");
            tamil = gender(person) === "male" ? "மருமகன்" : gender(person) === "female" ? "மருமகள்" : "மருமகன் / மருமகள்";
          } else if (spouseSibling || siblingSpouse) {
            english = gendered(person, "Brother-in-law", "Sister-in-law", "Sibling-in-law");
            tamil = gender(person) === "male" ? "மைத்துனர்" : gender(person) === "female" ? "மைத்துனி" : "மைத்துனர் / மைத்துனி";
          } else if (stepParent) {
            english = gendered(person, "Stepfather", "Stepmother", "Step-parent");
            tamil = gender(person) === "male" ? "மாற்றாந்தந்தை" : gender(person) === "female" ? "மாற்றாந்தாய்" : "மாற்றாந்தாய் / மாற்றாந்தந்தை";
          }
        }

        if (!english && connected.has(id)) {
          const sharesGrandparent = Array.from(grandparentsOf(id)).some(grandparentId => egoGrandparents.has(grandparentId));
          if (sharesGrandparent) {
            english = "Cousin";
            tamil = gender(person) === "male" ? "ஒன்றுவிட்ட சகோதரர்" : gender(person) === "female" ? "ஒன்றுவிட்ட சகோதரி" : "ஒன்றுவிட்ட உறவினர்";
          } else {
            english = "Relative";
            tamil = "உறவினர்";
          }
        }
      }
      if (english) labels.set(id, state.language === "ta" ? tamil : english);
    }
    return labels;
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
    const nodesRoot = $("#family-tree-nodes");
    const linesRoot = $("#family-tree-lines");
    const viewport = $("#family-tree-viewport");
    const canvas = $("#family-tree-canvas");
    const empty = $("#people-empty");
    if (!nodesRoot || !linesRoot || !viewport || !canvas || !empty) return;

    const search = ($("#people-search").value || "").trim().toLocaleLowerCase();
    const selected = state.people.filter(person => !search ||
      [person.full_name, person.tamil_name, person.notes].filter(Boolean).join(" ").toLocaleLowerCase().includes(search));

    if (!state.people.length || !selected.length) {
      viewport.hidden = true;
      empty.hidden = false;
      empty.innerHTML = !state.people.length
        ? '<strong>' + escapeHtml(t("noPeople")) + '</strong>' + escapeHtml(t("noPeopleSub"))
        : escapeHtml(t("noSearchResults"));
      nodesRoot.innerHTML = "";
      linesRoot.innerHTML = "";
      return;
    }

    viewport.hidden = false;
    empty.hidden = true;

    // Lay out all visible entries into generation rows, treating married/partner
    // people as a single unit before ordering each row.
    const selectedIds = new Set(selected.map(person => person.id));
    const levels = generationMap();
    const grouped = new Map();
    levels.forEach((people, level) => {
      const visible = people.filter(person => selectedIds.has(person.id));
      if (visible.length) grouped.set(level, visible);
    });
    const levelKeys = Array.from(grouped.keys()).sort((a, b) => a - b);
    if (!levelKeys.length) return;

    const minLevel = levelKeys[0];
    const maxLevel = levelKeys[levelKeys.length - 1];
    const nodeWidth = 236;
    const nodeHeight = 210;
    const columnGap = 44;
    const coupleGap = 18;
    const rowHeight = 302;
    const levelUnits = new Map();
    const positions = new Map();
    const byId = new Map(state.people.map(person => [person.id, person]));
    const spouseOf = id => state.relationships
      .filter(edge => edge.relationship_type === "spouse" && (edge.person_id === id || edge.related_person_id === id))
      .map(edge => edge.person_id === id ? edge.related_person_id : edge.person_id);

    levelKeys.forEach(level => {
      const people = grouped.get(level).slice().sort((a, b) => a.full_name.localeCompare(b.full_name));
      const visibleById = new Map(people.map(person => [person.id, person]));
      const used = new Set();
      const units = [];

      people.forEach(person => {
        if (used.has(person.id)) return;
        const partner = spouseOf(person.id)
          .map(id => visibleById.get(id))
          .find(candidate => candidate && !used.has(candidate.id) && candidate.id !== person.id);
        if (partner) {
          used.add(person.id);
          used.add(partner.id);
          const pair = [person, partner].sort((a, b) => a.full_name.localeCompare(b.full_name));
          units.push({ people: pair, width: nodeWidth * 2 + coupleGap, sortName: pair[0].full_name });
        } else {
          used.add(person.id);
          units.push({ people: [person], width: nodeWidth, sortName: person.full_name });
        }
      });

      // Use the centre of the parents' couple where possible. This keeps each
      // sibling branch underneath its family instead of scattering all cousins
      // in alphabetical order across the generation.
      const parentCenter = unit => {
        const centers = [];
        const seenParentIds = new Set();
        unit.people.forEach(person => {
          state.relationships
            .filter(edge => edge.relationship_type === "parent" && edge.related_person_id === person.id)
            .forEach(edge => {
              const parentPerson = byId.get(edge.person_id);
              if (!parentPerson || seenParentIds.has(parentPerson.id)) return;
              const parentPosition = positions.get(parentPerson.id);
              if (!parentPosition) return;
              const partners = spouseOf(parentPerson.id)
                .map(id => ({ id, position: positions.get(id) }))
                .filter(item => item.position && item.position.y === parentPosition.y);
              if (partners.length) {
                const couplePeople = [parentPosition, ...partners.map(item => item.position)];
                const ids = [parentPerson.id, ...partners.map(item => item.id)];
                ids.forEach(id => seenParentIds.add(id));
                centers.push(couplePeople.reduce((sum, pos) => sum + pos.x + pos.width / 2, 0) / couplePeople.length);
              } else {
                seenParentIds.add(parentPerson.id);
                centers.push(parentPosition.x + parentPosition.width / 2);
              }
            });
        });
        return centers.length ? centers.reduce((sum, center) => sum + center, 0) / centers.length : null;
      };

      units.sort((a, b) => {
        const ac = parentCenter(a), bc = parentCenter(b);
        if (ac != null && bc != null && Math.abs(ac - bc) > 1) return ac - bc;
        if (ac != null && bc == null) return -1;
        if (ac == null && bc != null) return 1;
        return a.sortName.localeCompare(b.sortName);
      });
      levelUnits.set(level, units);

      let cursorX = 26;
      units.forEach(unit => {
        unit.people.forEach((person, index) => {
          positions.set(person.id, {
            x: cursorX + index * (nodeWidth + coupleGap),
            y: 24 + (level - minLevel) * rowHeight,
            width: nodeWidth,
            height: nodeHeight
          });
        });
        cursorX += unit.width + columnGap;
      });
    });

    const widestLevel = Math.max(1, ...Array.from(levelUnits.values()).map(units =>
      units.reduce((sum, unit) => sum + unit.width, 0) + Math.max(0, units.length - 1) * columnGap
    ));
    const baseWidth = Math.max(viewport.clientWidth || 760, widestLevel + 52);
    const baseHeight = Math.max(290, (maxLevel - minLevel) * rowHeight + nodeHeight + 54);
    state.treeBaseWidth = baseWidth;
    state.treeBaseHeight = baseHeight;

    // The canvas is a scrollable spacer; its two layers scale together so
    // scrollbars, card hit targets, and relationship lines stay aligned.
    canvas.style.minWidth = "0";
    canvas.style.minHeight = "0";
    nodesRoot.style.left = "0";
    nodesRoot.style.top = "0";
    nodesRoot.style.right = "auto";
    nodesRoot.style.bottom = "auto";
    nodesRoot.style.width = baseWidth + "px";
    nodesRoot.style.height = baseHeight + "px";
    linesRoot.style.left = "0";
    linesRoot.style.top = "0";
    linesRoot.style.right = "auto";
    linesRoot.style.bottom = "auto";
    linesRoot.style.width = baseWidth + "px";
    linesRoot.style.height = baseHeight + "px";
    linesRoot.setAttribute("viewBox", "0 0 " + baseWidth + " " + baseHeight);
    linesRoot.setAttribute("width", String(baseWidth));
    linesRoot.setAttribute("height", String(baseHeight));

    const paths = [];
    state.relationships.filter(edge => edge.relationship_type === "parent").forEach(edge => {
      const parent = positions.get(edge.person_id);
      const child = positions.get(edge.related_person_id);
      if (!parent || !child || child.y <= parent.y) return;
      const startX = parent.x + parent.width / 2;
      const startY = parent.y + parent.height;
      const endX = child.x + child.width / 2;
      const endY = child.y;
      const middleY = startY + Math.max(14, (endY - startY) / 2);
      paths.push('<path class="family-line" d="M ' + startX + ' ' + startY + ' V ' + middleY + ' H ' + endX + ' V ' + endY + '"/>');
    });
    state.relationships.filter(edge => edge.relationship_type === "spouse").forEach(edge => {
      const first = positions.get(edge.person_id);
      const second = positions.get(edge.related_person_id);
      if (!first || !second || first.y !== second.y) return;
      const left = first.x < second.x ? first : second;
      const right = first.x < second.x ? second : first;
      if (Math.abs((left.x + left.width) - right.x) > coupleGap + 2) return;
      paths.push('<path class="family-line spouse-line" d="M ' +
        (left.x + left.width) + ' ' + (left.y + 36) + ' H ' + right.x + '"/>');
    });

    linesRoot.innerHTML = paths.join("");
    const relationLabels = relationshipLabelsForCurrentUser();
    nodesRoot.innerHTML = selected.map(person => renderPersonCard(person, positions.get(person.id), relationLabels.get(person.id))).join("");
    applyTreeCanvasScale(false);

    $$("[data-edit-person]").forEach(button => button.addEventListener("click", () => beginEditPerson(button.dataset.editPerson)));
    $$("[data-delete-person]").forEach(button => button.addEventListener("click", () => deletePerson(button.dataset.deletePerson)));
    $$("[data-remove-relationship]").forEach(button => button.addEventListener("click", () => deleteRelationship(button.dataset.removeRelationship)));
  }

  function applyTreeCanvasScale(preservePosition = true, anchorX, anchorY) {
    const viewport = $("#family-tree-viewport");
    const canvas = $("#family-tree-canvas");
    const nodesRoot = $("#family-tree-nodes");
    const linesRoot = $("#family-tree-lines");
    if (!viewport || !canvas || !nodesRoot || !linesRoot || !state.treeBaseWidth || !state.treeBaseHeight) return;
    const scale = Math.max(0.25, Math.min(2.5, state.treeZoom || 1));
    const oldWidth = Number(canvas.dataset.scaledWidth || state.treeBaseWidth * scale);
    const oldScale = oldWidth / state.treeBaseWidth;
    const ax = Number.isFinite(anchorX) ? anchorX : viewport.clientWidth / 2;
    const ay = Number.isFinite(anchorY) ? anchorY : viewport.clientHeight / 2;
    const worldX = (viewport.scrollLeft + ax) / (oldScale || 1);
    const worldY = (viewport.scrollTop + ay) / (oldScale || 1);

    state.treeZoom = scale;
    nodesRoot.style.transformOrigin = "0 0";
    nodesRoot.style.transform = "scale(" + scale + ")";
    linesRoot.style.transformOrigin = "0 0";
    linesRoot.style.transform = "scale(" + scale + ")";
    canvas.style.width = Math.ceil(state.treeBaseWidth * scale) + "px";
    canvas.style.height = Math.ceil(state.treeBaseHeight * scale) + "px";
    canvas.dataset.scaledWidth = String(state.treeBaseWidth * scale);
    const level = $("#tree-zoom-level");
    if (level) level.textContent = Math.round(scale * 100) + "%";

    if (preservePosition) {
      viewport.scrollLeft = Math.max(0, worldX * scale - ax);
      viewport.scrollTop = Math.max(0, worldY * scale - ay);
    }
  }

  function setTreeZoom(nextScale, anchorX, anchorY) {
    state.treeZoom = Math.max(0.25, Math.min(2.5, Number(nextScale) || 1));
    applyTreeCanvasScale(true, anchorX, anchorY);
  }

  function fitTreeToView() {
    const viewport = $("#family-tree-viewport");
    if (!viewport || !state.treeBaseWidth || !state.treeBaseHeight) return;
    const availableWidth = Math.max(100, viewport.clientWidth - 36);
    const availableHeight = Math.max(100, viewport.clientHeight - 36);
    const fitScale = Math.max(0.25, Math.min(1, availableWidth / state.treeBaseWidth, availableHeight / state.treeBaseHeight));
    state.treeZoom = fitScale;
    applyTreeCanvasScale(false);
    viewport.scrollTo({ left: 0, top: 0, behavior: "smooth" });
  }

  function toggleTreeFullscreen() {
    const panel = $(".people-panel");
    if (!panel) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
      return;
    }
    if (panel.requestFullscreen) {
      panel.requestFullscreen().catch(error => {
        console.warn("Uravu fullscreen is unavailable:", error);
        toast("Full screen is not available in this browser.", true);
      });
    } else {
      toast("Full screen is not available in this browser.", true);
    }
  }

  function bindTreeGestures() {
    const viewport = $("#family-tree-viewport");
    if (!viewport || viewport.dataset.gesturesBound === "1") return;
    viewport.dataset.gesturesBound = "1";
    const pointers = new Map();
    let lastDragPoint = null;
    let pinchStartDistance = 0;
    let pinchStartScale = 1;
    let moved = false;
    let suppressClickUntil = 0;

    const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    const localPoint = event => {
      const rect = viewport.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    viewport.addEventListener("pointerdown", event => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (event.target.closest("button,input,select,textarea,a")) return;
      const point = localPoint(event);
      pointers.set(event.pointerId, point);
      try { viewport.setPointerCapture(event.pointerId); } catch (_) {}
      moved = false;
      if (pointers.size === 1) {
        lastDragPoint = point;
      } else if (pointers.size === 2) {
        const pair = Array.from(pointers.values());
        pinchStartDistance = Math.max(1, distance(pair[0], pair[1]));
        pinchStartScale = state.treeZoom;
        lastDragPoint = null;
      }
    });

    viewport.addEventListener("pointermove", event => {
      if (!pointers.has(event.pointerId)) return;
      const point = localPoint(event);
      pointers.set(event.pointerId, point);
      if (pointers.size >= 2) {
        const pair = Array.from(pointers.values()).slice(0, 2);
        const middle = midpoint(pair[0], pair[1]);
        const rect = viewport.getBoundingClientRect();
        const nextScale = pinchStartScale * distance(pair[0], pair[1]) / pinchStartDistance;
        setTreeZoom(nextScale, middle.x, middle.y);
        moved = true;
        suppressClickUntil = Date.now() + 350;
        event.preventDefault();
      } else if (pointers.size === 1 && lastDragPoint) {
        const dx = point.x - lastDragPoint.x;
        const dy = point.y - lastDragPoint.y;
        if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
        if (moved) {
          viewport.scrollLeft -= dx;
          viewport.scrollTop -= dy;
          suppressClickUntil = Date.now() + 350;
          event.preventDefault();
        }
        lastDragPoint = point;
      }
    });

    const finishPointer = event => {
      pointers.delete(event.pointerId);
      try { if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId); } catch (_) {}
      if (pointers.size === 1) {
        lastDragPoint = Array.from(pointers.values())[0];
        pinchStartDistance = 0;
      } else {
        lastDragPoint = null;
        pinchStartDistance = 0;
      }
    };
    viewport.addEventListener("pointerup", finishPointer);
    viewport.addEventListener("pointercancel", finishPointer);
    viewport.addEventListener("lostpointercapture", finishPointer);
    viewport.addEventListener("click", event => {
      if (Date.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
        suppressClickUntil = 0;
      }
    }, true);
    viewport.addEventListener("wheel", event => {
      if (!(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      setTreeZoom(state.treeZoom * (event.deltaY < 0 ? 1.1 : 1 / 1.1), event.clientX - rect.left, event.clientY - rect.top);
    }, { passive: false });
  }


  function renderPersonCard(person, position, relationLabel) {
    if (!position) return "";
    const genderClass = person.gender === "female" ? "female" : person.gender === "other" ? "other" : "";
    const details = [];
    if (person.birth_date) details.push((state.language === "ta" ? "பிறப்பு " : "Born ") + prettyDate(person.birth_date));
    if (person.death_date) details.push((state.language === "ta" ? "இறப்பு " : "Died ") + prettyDate(person.death_date));
    return '<article class="family-node-card" style="left:' + position.x + 'px;top:' + position.y + 'px;width:' + position.width + 'px;height:' + position.height + 'px">' +
      '<div class="person-card-top"><span class="person-avatar ' + genderClass + '">' + escapeHtml(initials(person.full_name)) +
      '</span><div class="graph-person-names"><h4>' + escapeHtml(person.full_name) + '</h4>' +
      (person.tamil_name ? '<div class="tamil-name">' + escapeHtml(person.tamil_name) + '</div>' : '') + '</div></div>' +
      (relationLabel ? '<div class="graph-relationship-label">' + escapeHtml(relationLabel) + '</div>' : '') +
      (details.length ? '<div class="person-meta">' + details.map(escapeHtml).join(" · ") + '</div>' : '') +
      (person.notes ? '<div class="person-meta graph-notes">' + escapeHtml(person.notes) + '</div>' : '') +
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
        (role === ((!owner && requestedRole === "admin") ? "member" : requestedRole) ? ' selected' : '') + '>' +
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
    $("#request-modal-title").textContent = isMember ? t("Request a role change or family-entry link") : translateUiValue("Request access to " + tree.name);
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

  async function syncSpouseChildLinks(personId, connectedId, relationshipType) {
    if (!personId || !connectedId || !state.activeTree) return null;
    const treeId = state.activeTree.id;
    const existingParentLinks = state.relationships.filter(edge => edge.relationship_type === "parent");
    const hasParentLink = (parentId, childId) => existingParentLinks.some(edge =>
      edge.person_id === parentId && edge.related_person_id === childId
    );
    const linkAsParent = async (parentId, childId) => {
      if (!parentId || !childId || parentId === childId || hasParentLink(parentId, childId)) return null;
      const result = await callRpc("uravu_link_people", {
        p_tree_id:treeId,
        p_person_id:parentId,
        p_related_person_id:childId,
        p_relationship_type:"parent_of"
      });
      return result.error || null;
    };

    if (relationshipType === "spouse_of") {
      // When a spouse is added, link them to the existing children of either
      // partner so a child's two parents stay connected in the family graph.
      const children = new Set(existingParentLinks
        .filter(edge => edge.person_id === personId || edge.person_id === connectedId)
        .map(edge => edge.related_person_id));
      for (const childId of children) {
        for (const parentId of [personId, connectedId]) {
          const error = await linkAsParent(parentId, childId);
          if (error) return error;
        }
      }
      return null;
    }

    const parentId = relationshipType === "child_of" ? connectedId : personId;
    const childId = relationshipType === "child_of" ? personId : connectedId;
    const spouseIds = new Set();
    state.relationships.filter(edge => edge.relationship_type === "spouse" &&
      (edge.person_id === parentId || edge.related_person_id === parentId))
      .forEach(edge => spouseIds.add(edge.person_id === parentId ? edge.related_person_id : edge.person_id));

    // If a child is connected to one parent, add the corresponding parent link
    // for that parent's spouse as well.
    for (const spouseId of spouseIds) {
      const error = await linkAsParent(spouseId, childId);
      if (error) return error;
    }
    return null;
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
    const wasEditing = Boolean(state.editingPersonId);
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
    if (error) {
      setBusy(button, false);
      showDbError(error, "save family member");
      return;
    }
    let linkError = null;
    if (connectedId && personId) {
      const linked = await callRpc("uravu_link_people", {
        p_tree_id:state.activeTree.id, p_person_id:personId,
        p_related_person_id:connectedId, p_relationship_type:connectionType
      });
      linkError = linked.error;
      if (!linkError) linkError = await syncSpouseChildLinks(personId, connectedId, connectionType);
    }
    setBusy(button, false);
    clearPersonForm();
    if (linkError) {
      showDbError(linkError, "save family connection");
      await loadWorkspace(state.activeTree.id, false);
      return;
    }
    toast(wasEditing ? "Family member updated." : "Family member added.");
    await loadWorkspace(state.activeTree.id, false);
  }

  async function deletePerson(personId) {
    const person = state.people.find(item => item.id === personId);
    if (!person || !isManager()) return;
    if (!window.confirm(translateUiValue("Delete " + person.full_name + " and their family connections? Accounts linked to this entry will be unlinked."))) return;
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
    if (!window.confirm(translateUiValue('Permanently delete "' + name + '" and all of its family members, relationships, member assignments, and requests? This cannot be undone.'))) return;
    const { error } = await callRpc("uravu_delete_tree", { p_tree_id:state.activeTree.id });
    if (error) { showDbError(error, "delete tree"); return; }
    state.activeTree = null;
    state.activeMembership = null;
    $("#tree-workspace").hidden = true;
    toast("Family tree deleted.");
    await refreshDashboard();
  }

  function applyLanguage() {
    document.documentElement.lang = state.language;
    document.title = state.language === "ta" ? "உறவு — குடும்ப மரம்" : "Uravu — Family tree";
    $("#language-button").textContent = state.language === "en" ? "தமிழ்" : "English";
    $("#language-button").setAttribute("aria-label", state.language === "ta" ? "மொழியை மாற்று" : "Change language");
    localizeDom(document.body);
  }

  function setLanguage() {
    state.language = state.language === "en" ? "ta" : "en";
    try { localStorage.setItem("uravu-language", state.language); } catch (_) {}
    applyLanguage();
    renderTreeLists();
    if (state.activeTree) renderWorkspace();
    localizeDom(document.body);
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
    $("#fit-tree-button").addEventListener("click", fitTreeToView);
    $("#tree-zoom-out").addEventListener("click", () => setTreeZoom(state.treeZoom / 1.2));
    $("#tree-zoom-in").addEventListener("click", () => setTreeZoom(state.treeZoom * 1.2));
    $("#tree-fullscreen-button").addEventListener("click", toggleTreeFullscreen);
    document.addEventListener("fullscreenchange", () => {
      const button = $("#tree-fullscreen-button");
      if (button) {
        const active = document.fullscreenElement === $(".people-panel");
        button.textContent = active ? "Exit full screen" : "Full screen";
        button.setAttribute("aria-label", active ? "Exit full screen" : "Full screen");
      }
      window.requestAnimationFrame(() => {
        if (state.treeBaseWidth) applyTreeCanvasScale(false);
      });
    });
    bindTreeGestures();
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
    installLanguageObserver();
    applyLanguage();
    window.uravuTranslate = translateUiValue;
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
