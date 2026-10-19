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
    editMode: false,
    language: (() => { try { return localStorage.getItem("uravu-language") === "ta" ? "ta" : "en"; } catch (_) { return "en"; } })(),
    toastTimer: null,
    loadingTree: false,
    partialDatesSupported: null,
    treeZoom: 1,
    treeBaseWidth: 0,
    treeBaseHeight: 0,
    openPanels: new Set()
  };

  const words = {
    en: {
      familyTree:"Family tree",familyMembers:"Family members",create:"Create tree",join:"Request access",
      owner:"Owner",member:"Member",parent:"Parents",spouse:"Spouse / partner",
      children:"Children",none:"None linked yet",delete:"Delete",edit:"Edit",removeConnection:"Remove connection",
      noPeople:"This family tree is empty",noPeopleSub:"Add the first family member to begin building your tree.",
      noTrees:"You have not joined any family trees yet.",noTreesSub:"Create one or request access to an existing tree.",
      noBrowse:"No other family trees are available to request.",pending:"Request pending",requested:"Requested",
      viewTree:"Open tree",members:"Members",requestRole:"Request a family record",sendRequest:"Send request",
      requestSent:"Request sent for review.",roleChange:"Family record request",linkRequest:"Family entry link",
      joinRequest:"Tree access",save:"Save",cancel:"Cancel",approve:"Approve",reject:"Reject",
      noRequests:"No requests need review.",notConnected:"No connection added.",setupError:"The new Uravu database schema is not installed yet. Run supabase/schema.sql in your Supabase SQL Editor.",
      noSearchResults:"No family members match that search.",treeLoadError:"Could not load this family tree."
    },
    ta: {
      familyTree:"குடும்ப மரம்",familyMembers:"குடும்ப உறுப்பினர்கள்",create:"மரத்தை உருவாக்கு",join:"அணுகல் கோரு",
      owner:"உரிமையாளர்",member:"உறுப்பினர்",parent:"பெற்றோர்",
      spouse:"துணைவர்",children:"பிள்ளைகள்",none:"இணைப்புகள் இல்லை",delete:"நீக்கு",edit:"திருத்து",
      removeConnection:"உறவை நீக்கு",noPeople:"இந்தக் குடும்ப மரம் காலியாக உள்ளது",
      noPeopleSub:"முதல் குடும்ப உறுப்பினரைச் சேர்த்து உங்கள் மரத்தை உருவாக்கத் தொடங்குங்கள்.",
      noTrees:"நீங்கள் இன்னும் எந்தக் குடும்ப மரத்திலும் இணையவில்லை.",
      noTreesSub:"புதிய மரத்தை உருவாக்கவும் அல்லது இருக்கும் மரத்திற்கு அணுகல் கோரவும்.",
      noBrowse:"அணுகல் கோரக்கூடிய வேறு மரங்கள் இல்லை.",pending:"கோரிக்கை நிலுவையில் உள்ளது",
      requested:"கோரப்பட்டது",viewTree:"மரத்தைத் திற",members:"உறுப்பினர்கள்",requestRole:"குடும்பப் பதிவைக் கோரு",
      sendRequest:"கோரிக்கையை அனுப்பு",requestSent:"கோரிக்கை பரிசீலனைக்கு அனுப்பப்பட்டது.",
      roleChange:"குடும்பப் பதிவு கோரிக்கை",linkRequest:"குடும்பப் பதிவை இணை",joinRequest:"மர அணுகல்",
      save:"சேமி",cancel:"ரத்து",approve:"ஏற்கவும்",reject:"நிராகரி",noRequests:"பரிசீலிக்க கோரிக்கைகள் இல்லை.",
      notConnected:"உறவு இணைப்பு சேர்க்கப்படவில்லை.",
      setupError:"புதிய Uravu தரவுத்தளம் இன்னும் அமைக்கப்படவில்லை. Supabase SQL Editor-ல் supabase/schema.sql-ஐ இயக்கவும்.",
      noSearchResults:"இந்தத் தேடலுக்கு குடும்ப உறுப்பினர்கள் இல்லை.",treeLoadError:"குடும்ப மரத்தை ஏற்ற முடியவில்லை."
    }
  };


  const interfaceTranslations = {"Uravu — Family tree":"உறவு — குடும்ப மரம்","Uravu home":"உறவு முகப்பு","Change language":"மொழியை மாற்று","Sign in with Google":"Google மூலம் உள்நுழைக","Sign out":"வெளியேறு","YOUR FAMILY, CONNECTED":"உங்கள் குடும்பம், ஒன்றிணைந்து","Every generation has a story.":"ஒவ்வொரு தலைமுறைக்கும் ஒரு கதை உண்டு.","Build your family tree, preserve names and relationships, and invite family members to contribute with the right permissions.":"உங்கள் குடும்ப மரத்தை உருவாக்கி, பெயர்களையும் உறவுகளையும் பாதுகாத்து, சரியான அனுமதிகளுடன் குடும்ப உறுப்பினர்களைப் பங்களிக்க அழைக்கவும்.","Continue with Google":"Google மூலம் தொடரவும்","Your family tree is private to its members. Nothing is shown here until you sign in and open or create a tree.":"உங்கள் குடும்ப மரத்தை அதன் உறுப்பினர்கள் மட்டுமே பார்க்க முடியும். உள்நுழைந்து ஒரு மரத்தைத் திறக்கும் அல்லது உருவாக்கும் வரை இங்கு எதுவும் காட்டப்படாது.","Generation":"தலைமுறை","before us":"நமக்கு முன்","Parents &":"பெற்றோர் மற்றும்","guardians":"பாதுகாவலர்கள்","You":"நீங்கள்","and yours":"உங்கள் குடும்பம்","The next":"அடுத்த","generation":"தலைமுறை","YOUR FAMILY WORKSPACE":"உங்கள் குடும்பப் பணியிடம்","Welcome to Uravu":"உறவுக்கு வரவேற்கிறோம்","Create a tree or request access to one that already exists.":"புதிய குடும்ப மரத்தை உருவாக்கவும் அல்லது ஏற்கனவே உள்ள மரத்திற்கு அணுகலைக் கோரவும்.","Create a family tree":"குடும்ப மரத்தை உருவாக்கு","Start a new family space. You become its owner.":"புதிய குடும்ப இடத்தைத் தொடங்குங்கள். அதன் உரிமையாளர் நீங்களாக இருப்பீர்கள்.","Family tree name":"குடும்ப மரத்தின் பெயர்","e.g. The Kumar family":"எ.கா. குமார் குடும்பம்","Description":"விளக்கம்","Optional":"விருப்பத்தேர்வு","A short note about this family tree":"இந்தக் குடும்ப மரத்தைப் பற்றிய சிறு குறிப்பு","Primary language":"முதன்மை மொழி","Create tree":"மரத்தை உருவாக்கு","Find a family tree":"குடும்ப மரத்தைக் கண்டுபிடி","Request access and ask for the role you need.":"அணுகலைக் கோரி, உங்களுக்குத் தேவையான பங்கைக் கேளுங்கள்.","Search trees":"குடும்ப மரங்களைத் தேடு","Search by tree name...":"குடும்ப மரத்தின் பெயரால் தேடுங்கள்...","Loading available trees…":"கிடைக்கும் குடும்ப மரங்கள் ஏற்றப்படுகின்றன…","YOUR MEMBERSHIPS":"உங்கள் உறுப்பினர் நிலைகள்","My family trees":"எனது குடும்ப மரங்கள்","Refresh":"புதுப்பி","Loading your trees…":"உங்கள் குடும்ப மரங்கள் ஏற்றப்படுகின்றன…","Loading trees…":"குடும்ப மரங்கள் ஏற்றப்படுகின்றன…","TREE MEMBER":"குடும்ப மர உறுப்பினர்","Family tree":"குடும்ப மரம்","Request role / link":"பங்கு / இணைப்பைக் கோரு","Close tree":"மரத்தை மூடு","Tree accounts":"மரக் கணக்குகள்","Pending requests":"நிலுவையிலுள்ள கோரிக்கைகள்","TREE EDITING":"குடும்ப மரத் திருத்தம்","Add a family member":"குடும்ப உறுப்பினரைச் சேர்","Cancel edit":"திருத்தத்தை ரத்து செய்","Name":"பெயர்","Full name":"முழுப் பெயர்","Tamil name":"தமிழ்ப் பெயர்","Gender":"பாலினம்","Not specified":"குறிப்பிடப்படவில்லை","Male":"ஆண்","Female":"பெண்","Other / prefer not to say":"மற்றவை / தெரிவிக்க விருப்பமில்லை","Date of birth":"பிறந்த தேதி","Date of death":"இறந்த தேதி","Connect to someone":"ஒருவருடன் இணை","No connection yet":"இன்னும் உறவு இணைக்கப்படவில்லை","Relationship to them":"அவருடனான உறவு","Child of selected person":"தேர்ந்தெடுத்த நபரின் பிள்ளை","Parent of selected person":"தேர்ந்தெடுத்த நபரின் பெற்றோர்","Spouse / partner":"துணைவர் / துணைவி","Notes":"குறிப்புகள்","Additional details (avoid sensitive information)":"கூடுதல் விவரங்கள் (முக்கியமான தனிப்பட்ட தகவல்களைத் தவிர்க்கவும்)","FAMILY TREE":"குடும்ப மரம்","Search names…":"பெயர்களைத் தேடு…","Reset view":"காட்சியை மீட்டமை","Fit tree":"மரத்தைப் பொருத்து","Zoom out":"சிறிதாக்கு","Zoom in":"பெரிதாக்கு","Full screen":"முழுத்திரை","Exit full screen":"முழுத்திரையிலிருந்து வெளியேறு","Pinch to zoom · drag to move · Ctrl + scroll to zoom":"பெரிதாக்க இரண்டு விரல்களைப் பயன்படுத்தவும் · நகர்த்த இழுக்கவும்","ACCESS CONTROL":"அணுகல் கட்டுப்பாடு","Manage members":"உறுப்பினர்களை நிர்வகி","Change roles and link an account to a family member. Only the owner can grant or remove admin access.":"பங்குகளை மாற்றி, கணக்கை குடும்ப உறுப்பினருடன் இணைக்கவும். நிர்வாகி அணுகலை வழங்கவோ நீக்கவோ உரிமையாளருக்கு மட்டுமே அதிகாரம் உண்டு.","NEEDS REVIEW":"பரிசீலனை தேவை","Access, role and linking requests":"அணுகல், பங்கு மற்றும் இணைப்புக் கோரிக்கைகள்","Review each request and choose the role to assign. Only the owner can make someone an admin.":"ஒவ்வொரு கோரிக்கையையும் பரிசீலித்து வழங்க வேண்டிய பங்கைத் தேர்ந்தெடுக்கவும். ஒருவரை நிர்வாகியாக்க உரிமையாளருக்கு மட்டுமே அதிகாரம் உண்டு.","Delete this family tree":"இந்தக் குடும்ப மரத்தை நீக்கு","This permanently deletes its people, relationships, memberships and requests.":"இதனால் அதன் உறுப்பினர்கள், உறவுகள், உறுப்பினர் நிலைகள் மற்றும் கோரிக்கைகள் நிரந்தரமாக நீக்கப்படும்.","FAMILY TREE REQUEST":"குடும்ப மரக் கோரிக்கை","Request access":"அணுகலைக் கோரு","Close":"மூடு","Uravu could not start":"உறவைத் தொடங்க முடியவில்லை","One of the app files did not load.":"செயலியின் கோப்புகளில் ஒன்று ஏற்றப்படவில்லை.","Try again":"மீண்டும் முயற்சி செய்","Uravu could not start because a required file or service could not load. Refresh the page or try again later.":"தேவையான கோப்பு அல்லது சேவை ஏற்றப்படாததால் உறவைத் தொடங்க முடியவில்லை. பக்கத்தைப் புதுப்பிக்கவும் அல்லது சிறிது நேரம் கழித்து முயற்சிக்கவும்.","Could not load family trees":"குடும்ப மரங்களை ஏற்ற முடியவில்லை","Database setup or permissions need attention.":"தரவுத்தள அமைப்பு அல்லது அனுமதிகளைச் சரிபார்க்க வேண்டும்.","No description provided.":"விளக்கம் வழங்கப்படவில்லை.","Loading family members from Supabase…":"Supabase-இலிருந்து குடும்ப உறுப்பினர்கள் ஏற்றப்படுகின்றனர்…","Loading members…":"உறுப்பினர்கள் ஏற்றப்படுகின்றனர்…","No members yet.":"இதுவரை உறுப்பினர்கள் இல்லை.","Role":"பங்கு","Assigned family entry":"ஒதுக்கப்பட்ட குடும்பப் பதிவு","Not linked":"இணைக்கப்படவில்லை","Family member":"குடும்ப உறுப்பினர்","Signed in":"உள்நுழைந்துள்ளார்","Approved member":"ஒப்புதல் பெற்ற உறுப்பினர்","Assign role":"பங்கை ஒதுக்கு","No message added.":"செய்தி எதுவும் சேர்க்கப்படவில்லை.","Requested family entry:":"கோரப்பட்ட குடும்பப் பதிவு:","New join, role and linking requests will appear here.":"புதிய இணைப்பு, பங்கு மற்றும் இணைப்புக் கோரிக்கைகள் இங்கே தோன்றும்.","Remove connection":"உறவு இணைப்பை நீக்கு","No connections yet":"இன்னும் உறவுகள் இல்லை","Linked account:":"இணைக்கப்பட்ட கணக்கு:","Born":"பிறப்பு","Died":"இறப்பு","Spouse / partner:":"துணைவர் / துணைவி:","Parent of:":"பெற்றோர்:","Child of:":"பிள்ளை:","Request approved and role assigned.":"கோரிக்கை ஏற்கப்பட்டு பங்கு ஒதுக்கப்பட்டது.","Request rejected.":"கோரிக்கை நிராகரிக்கப்பட்டது.","Member role updated.":"உறுப்பினரின் பங்கு புதுப்பிக்கப்பட்டது.","Family entry assigned to the account.":"குடும்பப் பதிவு கணக்குடன் இணைக்கப்பட்டது.","Family entry unlinked.":"குடும்பப் பதிவு கணக்கிலிருந்து துண்டிக்கப்பட்டது.","Family member updated.":"குடும்ப உறுப்பினர் விவரங்கள் புதுப்பிக்கப்பட்டன.","Family member added.":"குடும்ப உறுப்பினர் சேர்க்கப்பட்டார்.","Family member and connections deleted.":"குடும்ப உறுப்பினரும் அவருடைய உறவு இணைப்புகளும் நீக்கப்பட்டன.","Family connection removed.":"குடும்ப உறவு இணைப்பு நீக்கப்பட்டது.","Family tree deleted.":"குடும்ப மரம் நீக்கப்பட்டது.","Enter a family tree name with at least 2 characters.":"குடும்ப மரத்தின் பெயர் குறைந்தது 2 எழுத்துகள் கொண்டிருக்க வேண்டும்.","Creating…":"உருவாக்கப்படுகிறது…","Family tree created. You are the owner.":"குடும்ப மரம் உருவாக்கப்பட்டது. நீங்கள் அதன் உரிமையாளர்.","You must be an approved member to open this tree.":"இந்த மரத்தைத் திறக்க ஒப்புதல் பெற்ற உறுப்பினராக இருக்க வேண்டும்.","Family connections across generations.":"தலைமுறைகளைக் கடந்து இணையும் குடும்ப உறவுகள்.","Your tree access request is awaiting review. You can submit a family-record request if needed.":"உங்கள் குடும்ப மர அணுகல் கோரிக்கை பரிசீலனைக்காகக் காத்திருக்கிறது. தேவைப்பட்டால் புதுப்பிக்கப்பட்ட கோரிக்கையை அனுப்பலாம்.","Your family-entry link request is awaiting review. You can submit an updated request if needed.":"உங்கள் குடும்பப் பதிவு இணைப்புக் கோரிக்கை பரிசீலனைக்காகக் காத்திருக்கிறது. தேவைப்பட்டால் புதுப்பிக்கப்பட்ட கோரிக்கையை அனுப்பலாம்.","Your role-change request is awaiting review. You can submit an updated request if needed.":"உங்கள் பங்கு மாற்றக் கோரிக்கை பரிசீலனைக்காகக் காத்திருக்கிறது. தேவைப்பட்டால் புதுப்பிக்கப்பட்ட கோரிக்கையை அனுப்பலாம்.","A name is required.":"பெயர் அவசியம்.","Date of death cannot be earlier than date of birth.":"இறந்த தேதி, பிறந்த தேதிக்கு முந்தையதாக இருக்க முடியாது.","Saving…":"சேமிக்கப்படுகிறது…","Approving…":"ஏற்கப்படுகிறது…","Rejecting…":"நிராகரிக்கப்படுகிறது…","Sending…":"அனுப்பப்படுகிறது…","Request a role change or family-entry link":"பங்கு மாற்றம் அல்லது குடும்பப் பதிவு இணைப்பைக் கோரு","The owner or a member linked to a family record will review this request.":"இந்தக் கோரிக்கையை குடும்ப மர உரிமையாளர் அல்லது நிர்வாகி பரிசீலிப்பார்.","Choose the role you want to request. The owner or an admin decides what to approve.":"நீங்கள் கோர விரும்பும் பங்கைத் தேர்ந்தெடுக்கவும். எதை ஏற்க வேண்டும் என்பதை உரிமையாளர் அல்லது நிர்வாகி தீர்மானிப்பார்.","Requested role":"கோரப்படும் பங்கு","Request to link your account to a family member":"உங்கள் கணக்கை ஒரு குடும்ப உறுப்பினருடன் இணைக்கக் கோரு","Message":"செய்தி","Explain your request briefly":"உங்கள் கோரிக்கையைச் சுருக்கமாக விளக்குங்கள்","Send request":"கோரிக்கையை அனுப்பு","Request sent for the owner or an admin to review.":"உரிமையாளர் அல்லது நிர்வாகி பரிசீலிக்கக் கோரிக்கை அனுப்பப்பட்டது.","Add family member":"குடும்ப உறுப்பினரைச் சேர்","Edit family member":"குடும்ப உறுப்பினரைத் திருத்து","Save changes":"மாற்றங்களைச் சேமி","This family tree is empty":"இந்தக் குடும்ப மரம் காலியாக உள்ளது","Add the first family member to begin building your tree.":"குடும்ப மரத்தை உருவாக்கத் தொடங்க முதல் உறுப்பினரைச் சேர்க்கவும்.","You have not joined any family trees yet.":"நீங்கள் இன்னும் எந்தக் குடும்ப மரத்திலும் இணையவில்லை.","Create one or request access to an existing tree.":"புதிய மரத்தை உருவாக்கவும் அல்லது இருக்கும் மரத்திற்கு அணுகலைக் கோரவும்.","No other family trees are available to request.":"அணுகல் கோர வேறு குடும்ப மரங்கள் இல்லை.","Request pending":"கோரிக்கை நிலுவையில் உள்ளது","Requested":"கோரப்பட்டது","Open tree":"மரத்தைத் திற","Members":"உறுப்பினர்கள்","Save":"சேமி","Cancel":"ரத்து செய்","Approve":"ஏற்கவும்","Reject":"நிராகரி","No requests need review.":"பரிசீலிக்க வேண்டிய கோரிக்கைகள் இல்லை.","No connection added.":"உறவு இணைப்பு சேர்க்கப்படவில்லை.","The new Uravu database schema is not installed yet. Run supabase/schema.sql in your Supabase SQL Editor.":"Uravu-வின் புதிய தரவுத்தள அமைப்பு இன்னும் நிறுவப்படவில்லை. Supabase SQL Editor-ல் supabase/schema.sql-ஐ இயக்கவும்.","Database permission blocked this action. Check the Supabase policies in supabase/schema.sql.":"தரவுத்தள அனுமதி இந்தச் செயலைத் தடுத்தது. supabase/schema.sql-இல் உள்ள Supabase கொள்கைகளைச் சரிபார்க்கவும்.","Something went wrong. Please try again.":"ஏதோ தவறு ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.","Sign in with Google to continue.":"தொடர Google மூலம் உள்நுழைக.","Supabase client is not initialized.":"Supabase கிளையன்ட் தொடங்கப்படவில்லை.","Supabase client is missing. Check supabase-config.js.":"Supabase கிளையன்ட் இல்லை. supabase-config.js-ஐச் சரிபார்க்கவும்.","Uravu could not connect to Supabase. Check supabase-config.js.":"Uravu-வால் Supabase-உடன் இணைக்க முடியவில்லை. supabase-config.js-ஐச் சரிபார்க்கவும்.","Delete this family connection?":"இந்தக் குடும்ப உறவு இணைப்பை நீக்கவா?","As the owner, use Manage members to link your own family entry.":"உரிமையாளராக, உங்கள் குடும்பப் பதிவை இணைக்க உறுப்பினர்களை நிர்வகி என்பதைப் பயன்படுத்தவும்.","Family tree not found.":"குடும்ப மரத்தைக் காணவில்லை.","Could not load this family tree.":"இந்தக் குடும்ப மரத்தை ஏற்ற முடியவில்லை."};
  interfaceTranslations["YOUR ROLE"] = "உங்கள் பங்கு";
  interfaceTranslations["Family members"] = "குடும்ப உறுப்பினர்கள்";
  interfaceTranslations["Delete tree"] = "மரத்தை நீக்கு";
  Object.assign(interfaceTranslations, {
    "Deceased":"நினைவில் வாழ்பவர்",
    "Connections":"இணைப்புகள்",
    "Select a family member":"குடும்ப உறுப்பினரைத் தேர்ந்தெடுக்கவும்",
    "Select relationship":"உறவைத் தேர்ந்தெடுக்கவும்",
    "Connect to someone":"ஒருவருடன் இணைக்கவும்",
    "Relationship to them":"அவருடனான உறவு",
    "Choose both a family member and relationship to add a connection.":"இணைப்பைச் சேர்க்க குடும்ப உறுப்பினரையும் உறவையும் தேர்ந்தெடுக்கவும்.",
    "Enter the date of death when Living in Memory is checked.":"இறந்தவர் என்பதைத் தேர்ந்தெடுத்தால் இறந்த தேதியை உள்ளிடவும்.",
    "No connections yet.":"இன்னும் இணைப்புகள் இல்லை.",
    "Remove connection: ":"இணைப்பை நீக்கு: ",
    "Parent":"பெற்றோர்",
    "Child":"பிள்ளை",
    "Spouse / partner":"துணைவர் / துணைவி",
    "Remove":"நீக்கு"
  });

  Object.assign(interfaceTranslations, {
    "Date formats: YYYY, YYYY-MM, YYYY-MM-DD, or MM-DD":"தேதி வடிவங்கள்: YYYY, YYYY-MM, YYYY-MM-DD அல்லது MM-DD",
    "Add a connection":"இணைப்பைச் சேர்",
    "Add connection":"இணைப்பைச் சேர்",
    "Adding connection…":"இணைப்பு சேர்க்கப்படுகிறது…",
    "Use YYYY, YYYY-MM, YYYY-MM-DD, or MM-DD for dates.":"தேதிகளுக்கு YYYY, YYYY-MM, YYYY-MM-DD அல்லது MM-DD பயன்படுத்தவும்.",
    "Run supabase/partial-dates-migration.sql in Supabase before saving partial dates or a death with an unknown date.":"பகுதி தேதிகள் அல்லது தேதி தெரியாத இறப்பு நிலையைச் சேமிக்கும் முன் Supabase-ல் supabase/partial-dates-migration.sql-ஐ இயக்கவும்.",
    "Deceased":"நினைவில் வாழ்பவர்",
    "Died / status":"இறந்த தேதி / நிலை"
  });

  Object.assign(interfaceTranslations, {
    "English Name":"ஆங்கிலப் பெயர்",
    "Full English name":"முழு ஆங்கிலப் பெயர்",
    "Request a family record":"குடும்பப் பதிவைக் கோரு",
    "The owner or a linked member will review this request.":"இந்தக் கோரிக்கையை உரிமையாளர் அல்லது பதிவுடன் இணைக்கப்பட்ட உறுப்பினர் பரிசீலிப்பார்.",
    "The owner or a member already linked to a family record can review your request.":"கோரிக்கையை உரிமையாளர் அல்லது ஏற்கனவே குடும்பப் பதிவுடன் இணைக்கப்பட்ட உறுப்பினர் பரிசீலிப்பார்.",
    "Request to join this family tree. The Owner or a linked Member can review your request.":"குடும்ப மரத்தில் இணையக் கோருங்கள். உரிமையாளர் அல்லது இணைக்கப்பட்ட உறுப்பினர் உங்கள் கோரிக்கையைப் பரிசீலிப்பார்.",
    "As the owner, use Manage members to link your family entry.":"உரிமையாளராக, உங்கள் குடும்பப் பதிவை இணைக்க உறுப்பினர்களை நிர்வகி என்பதைப் பயன்படுத்தவும்.",
    "No family record requested yet.":"இதுவரை குடும்பப் பதிவு கோரப்படவில்லை.",
    "Family record to link to your account":"உங்கள் கணக்குடன் இணைக்க வேண்டிய குடும்பப் பதிவு",
    "Select a family record to request.":"கோருவதற்கு ஒரு குடும்பப் பதிவைத் தேர்ந்தெடுக்கவும்.",
    "The owner or a member linked to a family record will review this request.":"இந்தக் கோரிக்கையை உரிமையாளர் அல்லது பதிவுடன் இணைக்கப்பட்ட உறுப்பினர் பரிசீலிப்பார்.",
    "Link member accounts to family records. The owner assigns records; members can edit once their account is linked.":"குடும்பக் கணக்குகளைப் பதிவுகளுடன் இணைக்கவும். உரிமையாளர் பதிவுகளை ஒதுக்குவார்; இணைக்கப்பட்ட உறுப்பினர்கள் பதிவுகளைத் திருத்தலாம்.",
    "The owner or a member linked to a family record can approve or reject requests.":"உரிமையாளர் அல்லது குடும்பப் பதிவுடன் இணைக்கப்பட்ட உறுப்பினர் கோரிக்கைகளை ஏற்க அல்லது நிராகரிக்கலாம்.",
    "Only the owner can review family-record assignment requests.":"குடும்பப் பதிவு ஒதுக்கீட்டுக் கோரிக்கைகளை உரிமையாளர் மட்டுமே பரிசீலிக்க முடியும்.",
    "Add a family member":"குடும்ப உறுப்பினரைச் சேர்"
  });

  Object.assign(interfaceTranslations, {
    "English Name":"ஆங்கிலப் பெயர்",
    "Full English name":"முழு ஆங்கிலப் பெயர்",
    "Tamil name":"தமிழ்ப் பெயர்",
    "Gender":"பாலினம்",
    "Choose a date":"தேதியைத் தேர்ந்தெடுக்கவும்",
    "Calendar":"நாட்காட்டி",
    "Enter DD-MM-YYYY, MM-YYYY, YYYY, DD-MM or MM. Use the calendar for a full date.":"DD-MM-YYYY, MM-YYYY, YYYY, DD-MM அல்லது MM உள்ளிடவும். முழுத் தேதிக்கு நாட்காட்டியைப் பயன்படுத்தவும்.",
    "Access requests":"அணுகல் கோரிக்கைகள்",
    "Linking requests":"இணைப்புக் கோரிக்கைகள்",
    "Review requests to join this family tree.":"இந்தக் குடும்ப மரத்தில் இணைய வரும் கோரிக்கைகளைப் பரிசீலிக்கவும்.",
    "Review requests to link an account to an existing family record.":"கணக்கை ஏற்கனவே உள்ள குடும்பப் பதிவுடன் இணைக்க வரும் கோரிக்கைகளைப் பரிசீலிக்கவும்.",
    "Request a record link":"குடும்பப் பதிவுடன் இணைக்கக் கோரு",
    "Linked family record":"இணைக்கப்பட்ட குடும்பப் பதிவு",
    "Select a record":"பதிவைத் தேர்ந்தெடுக்கவும்",
    "Only the owner can unlink a member account.":"உறுப்பினர் கணக்கின் இணைப்பை உரிமையாளர் மட்டுமே நீக்க முடியும்.",
    "English name is required.":"ஆங்கிலப் பெயர் அவசியம்.",
    "Tamil name is required.":"தமிழ்ப் பெயர் அவசியம்.",
    "Select a gender.":"பாலினத்தைத் தேர்ந்தெடுக்கவும்.",
    "Enter full dates as DD-MM-YYYY. Partial dates may be entered as MM-YYYY, YYYY, DD-MM or MM.":"முழுத் தேதிக்கு DD-MM-YYYY வடிவத்தைப் பயன்படுத்தவும். பகுதி தேதிகளுக்கு MM-YYYY, YYYY, DD-MM அல்லது MM பயன்படுத்தலாம்.",
    "Your account is already linked to a family record.":"உங்கள் கணக்கு ஏற்கனவே குடும்பப் பதிவுடன் இணைக்கப்பட்டுள்ளது.",
    "Manage member accounts":"உறுப்பினர் கணக்குகளை நிர்வகி",
    "Link member accounts to family records. The owner assigns records; members can edit once their account is linked.":"உறுப்பினர் கணக்குகளை குடும்பப் பதிவுகளுடன் இணைக்கவும். இணைக்கப்பட்ட உறுப்பினர்கள் குடும்ப விவரங்களைத் திருத்தலாம்.",
    "Review membership and record-link requests.":"உறுப்பினர் மற்றும் குடும்பப் பதிவு இணைப்புக் கோரிக்கைகளைப் பரிசீலிக்கவும்.",
    "Select gender":"பாலினத்தைத் தேர்ந்தெடுக்கவும்",
    "Family tree access":"குடும்ப மர அணுகல்",
    "Family record linking":"குடும்பப் பதிவு இணைப்பு",
    "Your access request is awaiting review.":"உங்கள் அணுகல் கோரிக்கை பரிசீலனையில் உள்ளது.",
    "Your family-record linking request is awaiting review.":"உங்கள் குடும்பப் பதிவு இணைப்புக் கோரிக்கை பரிசீலனையில் உள்ளது."
  });

  Object.assign(interfaceTranslations, {
    "Manage family records, relationships and membership.":"குடும்பப் பதிவுகள், உறவுகள் மற்றும் உறுப்பினர் இணைப்புகளை நிர்வகிக்கவும்.",
    "Search for a family tree and request membership.":"குடும்ப மரத்தைத் தேடி உறுப்பினராக இணையக் கோருங்கள்.",
    "Member accounts":"உறுப்பினர் கணக்குகள்",
    "Link an account to an existing family record, or add a new record above and link it here. Linked members can maintain family records and relationships.":"கணக்கை ஏற்கனவே உள்ள குடும்பப் பதிவுடன் இணைக்கவும் அல்லது மேலே புதிய பதிவை உருவாக்கி இங்கே இணைக்கவும். இணைக்கப்பட்ட உறுப்பினர்கள் குடும்பப் பதிவுகளையும் உறவுகளையும் பராமரிக்கலாம்.",
    "Review requests to join this family tree.":"இந்தக் குடும்ப மரத்தில் இணைய வரும் கோரிக்கைகளைப் பரிசீலிக்கவும்.",
    "Review requests to link an account to an existing family record.":"கணக்கை ஏற்கனவே உள்ள குடும்பப் பதிவுடன் இணைக்க வரும் கோரிக்கைகளைப் பரிசீலிக்கவும்.",
    "Choose date of birth":"பிறந்த தேதியைத் தேர்ந்தெடுக்கவும்",
    "Choose date of death":"இறந்த தேதியைத் தேர்ந்தெடுக்கவும்",
    "Family record linked to the member's account.":"உறுப்பினரின் கணக்குடன் குடும்பப் பதிவு இணைக்கப்பட்டது.",
    "Access request approved.":"அணுகல் கோரிக்கை ஏற்கப்பட்டது."
  });

  const tamilToEnglish = {};
  Object.entries(interfaceTranslations).forEach(([english, tamil]) => {
    if (!(tamil in tamilToEnglish)) tamilToEnglish[tamil] = english;
  });

  Object.assign(interfaceTranslations, {
  "Uravugal":"உறவுகள்",
  "SHARED FAMILY TREE":"பகிரப்பட்ட குடும்ப மரம்",
  "Add Family Member":"குடும்ப உறுப்பினரைச் சேர்",
  "Member list":"உறுப்பினர் பட்டியல்",
  "Linking Requests":"இணைப்பு கோரிக்கைகள்",
  "Explore your family’s generations and help keep the records accurate.":"உங்கள் குடும்பத் தலைமுறைகளைப் பார்த்து பதிவுகளைச் சரியாகப் பராமரிக்கவும்.",
  "One shared family tree, across generations.":"தலைமுறைகள் கடந்த ஒரே குடும்ப மரம்.",
  "Choose a record to link":"இணைக்க வேண்டிய பதிவைத் தேர்ந்தெடுக்கவும்",
  "Request to link this account":"இந்தக் கணக்கை இணைக்கக் கோரு",
  "An existing linked family member must confirm the link before you can edit other records.":"மற்ற பதிவுகளைத் திருத்துவதற்கு முன் இணைக்கப்பட்ட குடும்ப உறுப்பினர் ஒருவர் இந்த இணைப்பை உறுதிப்படுத்த வேண்டும்.",
  "OR ADD YOUR OWN RECORD":"அல்லது உங்கள் பதிவைச் சேர்க்கவும்",
  "Your account must be linked to a family record before you can review linking requests.":"இணைப்பு கோரிக்கைகளைப் பரிசீலிக்க, உங்கள் கணக்கு முதலில் குடும்பப் பதிவுடன் இணைக்கப்பட வேண்டும்.",
  "No accounts are linked to a family record yet.":"இதுவரை எந்தக் கணக்கும் குடும்பப் பதிவுடன் இணைக்கப்படவில்லை.",
  "Linked account":"இணைக்கப்பட்ட கணக்கு",
  "You":"நீங்கள்",
  "Your family-record link request is awaiting review.":"உங்கள் குடும்பப் பதிவு இணைப்புக் கோரிக்கை பரிசீலனையில் உள்ளது.",
  "Living in Memory":"நினைவில் வாழ்பவர்",
  "Deceased":"நினைவில் வாழ்பவர்",
  "No family record requested yet.":"இதுவரை குடும்பப் பதிவு கோரப்படவில்லை.",
  "Create your own family record first, or sign in with an existing family account.":"முதலில் உங்கள் குடும்பப் பதிவை உருவாக்கவும் அல்லது ஏற்கனவே உள்ள குடும்பக் கணக்கில் உள்நுழையவும்.",
  "Your account is already linked to a family record.":"உங்கள் கணக்கு ஏற்கனவே குடும்பப் பதிவுடன் இணைக்கப்பட்டுள்ளது.",
  "This is my newly created family record.":"இது நான் புதிதாக உருவாக்கிய குடும்பப் பதிவு."
});

tamilToEnglish["உறவுகள்"] = "Uravugal";
  tamilToEnglish["நினைவில் வாழ்பவர்"] = "Living in Memory";

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

  function datePartsValid(year, month, day) {
    const date = new Date(Date.UTC(year, month - 1, day));
    return month >= 1 && month <= 12 && day >= 1 &&
      date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }

  function parsePartialDate(value, options = {}) {
    const raw = String(value || "").trim();
    const stored = Boolean(options.stored);
    if (!raw) return { valid:true, value:null, date:null, precision:null };
    let match;

    if ((match = raw.match(/^(\d{4})$/))) {
      return { valid:true, value:match[1], date:null, precision:"year" };
    }

    // New preferred input format: DD-MM-YYYY.
    if (!stored && (match = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/))) {
      const day = Number(match[1]), month = Number(match[2]), year = Number(match[3]);
      if (!datePartsValid(year, month, day)) return { valid:false };
      const canonical = match[3] + "-" + match[2] + "-" + match[1];
      return { valid:true, value:canonical, date:canonical, precision:"day" };
    }

    // ISO full date is accepted for calendar inputs and compatibility with previously saved entries.
    if ((match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/))) {
      const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
      if (!datePartsValid(year, month, day)) return { valid:false };
      return { valid:true, value:match[1] + "-" + match[2] + "-" + match[3], date:match[1] + "-" + match[2] + "-" + match[3], precision:"day" };
    }

    // Canonical month/year (YYYY-MM) and user-facing month/year (MM-YYYY).
    if ((match = raw.match(/^(\d{4})-(\d{2})$/))) {
      const month = Number(match[2]);
      return month >= 1 && month <= 12
        ? { valid:true, value:match[1] + "-" + match[2], date:null, precision:"month-year" }
        : { valid:false };
    }
    if (!stored && (match = raw.match(/^(\d{2})-(\d{4})$/))) {
      const month = Number(match[1]);
      return month >= 1 && month <= 12
        ? { valid:true, value:match[2] + "-" + match[1], date:null, precision:"month-year" }
        : { valid:false };
    }

    if ((match = raw.match(/^(\d{2})-(\d{2})$/))) {
      const first = Number(match[1]), second = Number(match[2]);
      let month, day;
      if (stored) {
        // Stored month/day values from earlier builds are canonical MM-DD.
        month = first; day = second;
      } else if (first > 12 && second >= 1 && second <= 12) {
        day = first; month = second;
      } else if (second > 12 && first >= 1 && first <= 12) {
        // Continue accepting legacy MM-DD input when its order is unambiguous.
        month = first; day = second;
      } else {
        // For ambiguous text, use the requested DD-MM convention.
        day = first; month = second;
      }
      if (month < 1 || month > 12 || day < 1 || !datePartsValid(2000, month, day)) return { valid:false };
      return { valid:true, value:String(month).padStart(2,"0") + "-" + String(day).padStart(2,"0"), date:null, precision:"month-day" };
    }

    if ((match = raw.match(/^(\d{2})$/))) {
      const month = Number(match[1]);
      return month >= 1 && month <= 12
        ? { valid:true, value:match[1], date:null, precision:"month" }
        : { valid:false };
    }
    return { valid:false };
  }

  function formatDateEntry(value) {
    if (!value) return "";
    const parsed = parsePartialDate(value, { stored:true });
    if (!parsed.valid) return String(value);
    if (parsed.precision === "day") {
      const [year, month, day] = parsed.value.split("-");
      return day + "-" + month + "-" + year;
    }
    if (parsed.precision === "month-year") {
      const [year, month] = parsed.value.split("-");
      return month + "-" + year;
    }
    if (parsed.precision === "month-day") {
      const [month, day] = parsed.value.split("-");
      return day + "-" + month;
    }
    return parsed.value;
  }

  function syncCalendarFromText(textId, calendarId) {
    const textInput = $("#" + textId);
    const calendar = $("#" + calendarId);
    if (!textInput || !calendar) return;
    const parsed = parsePartialDate(textInput.value);
    calendar.value = parsed.valid && parsed.precision === "day" ? (parsed.date || "") : "";
  }

  function syncTextFromCalendar(calendarId, textId) {
    const calendar = $("#" + calendarId);
    const textInput = $("#" + textId);
    if (!calendar || !textInput) return;
    if (!calendar.value) {
      textInput.value = "";
      return;
    }
    const [year, month, day] = calendar.value.split("-");
    textInput.value = day + "-" + month + "-" + year;
  }

  function formatFamilyDate(value) {
    if (!value) return "";
    const parsed = parsePartialDate(value, { stored:true });
    if (!parsed.valid) return String(value);
    if (parsed.precision === "day") return formatDateEntry(parsed.value);
    const locale = state.language === "ta" ? "ta-IN" : "en-IN";
    if (parsed.precision === "year") return parsed.value;
    if (parsed.precision === "month-year") {
      const [year, month] = parsed.value.split("-").map(Number);
      return new Intl.DateTimeFormat(locale, { month:"short", year:"numeric", timeZone:"UTC" })
        .format(new Date(Date.UTC(year, month - 1, 1)));
    }
    if (parsed.precision === "month-day") {
      const [month, day] = parsed.value.split("-").map(Number);
      return String(day).padStart(2,"0") + "-" + String(month).padStart(2,"0");
    }
    if (parsed.precision === "month") {
      const month = Number(parsed.value);
      return new Intl.DateTimeFormat(locale, { month:"long", timeZone:"UTC" })
        .format(new Date(Date.UTC(2000, month - 1, 1)));
    }
    return parsed.value;
  }

  function isPersonDeceased(person) {
    return Boolean(person && (person.is_deceased || person.death_date || person.death_date_text));
  }

  function collectPersonFormData() {
    const fullName = $("#person-name").value.trim();
    const tamilName = $("#person-tamil").value.trim();
    const gender = $("#person-gender").value;
    if (!fullName) { toast("English name is required.", true); $("#person-name").focus(); return null; }
    if (!tamilName) { toast("Tamil name is required.", true); $("#person-tamil").focus(); return null; }
    if (!gender) { toast("Select a gender.", true); $("#person-gender").focus(); return null; }
    const birth = parsePartialDate($("#person-birth").value);
    const deceased = $("#person-deceased").checked;
    const death = deceased ? parsePartialDate($("#person-death").value) : { valid:true, value:null, date:null, precision:null };
    if (!birth.valid || !death.valid) {
      toast("Use DD-MM-YYYY for full dates. Partial dates may be entered as MM-YYYY, YYYY, DD-MM or MM.", true);
      return null;
    }
    if (birth.precision === "day" && death.precision === "day" && death.date < birth.date) {
      toast("Date of death cannot be earlier than date of birth.", true);
      return null;
    }
    if (state.partialDatesSupported === false &&
        ((birth.value && birth.precision !== "day") ||
         (deceased && !death.value) ||
         (death.value && death.precision !== "day"))) {
      toast("Run supabase/partial-dates-migration.sql in Supabase before saving partial dates or a death with an unknown date.", true);
      return null;
    }

    const data = {
      full_name:fullName,
      tamil_name:tamilName,
      gender:gender,
      birth_date:birth.date || null,
      death_date:deceased ? (death.date || null) : null,
      notes:$("#person-notes").value.trim() || null
    };
    if (state.partialDatesSupported !== false) {
      data.birth_date_text = birth.value;
      data.death_date_text = deceased ? death.value : null;
      data.is_deceased = deceased;
    }
    return data;
  }
  function roleLabel(role) { return t(role || "member"); }
  function isOwner() { return Boolean(state.activeMembership && state.activeMembership.role === "owner"); }
  function isManager() {
    return Boolean(state.activeMembership && state.activeMembership.person_id);
  }
  function linkedPersonIds() {
    return new Set(state.members.filter(member => member.person_id).map(member => member.person_id));
  }
  function canEditPerson(person) {
    if (!person || !state.user) return false;
    if (state.activeMembership?.person_id === person.id) return true;
    const linked = linkedPersonIds();
    if (!isManager() && person.is_self_record && person.created_by === state.user.id && !linked.has(person.id)) return true;
    return isManager() && !linked.has(person.id);
  }
  function canDeletePerson(person) {
    if (!person || !state.user) return false;
    const linked = linkedPersonIds();
    if (linked.has(person.id)) return false;
    if (!isManager() && person.is_self_record && person.created_by === state.user.id) return true;
    return isManager();
  }
  function canCreatePerson() {
    return Boolean(state.user && state.activeTree &&
      (isManager() || (!requestPendingForUser() && !state.people.some(person => person.created_by === state.user.id && person.is_self_record))));
  }
  function displayTreeName(tree = state.activeTree) {
    return state.language === "ta" ? "உறவுகள்" : (tree?.name || "Uravugal");
  }
  function requestPendingForUser() {
    return state.ownRequests.find(request => request.tree_id === state.activeTree?.id && request.status === "pending");
  }
  async function requestLinkToPerson(personId, message = "") {
    if (!state.user || !state.activeTree || !personId) return { error: new Error("Select a family record.") };
    if (isManager()) {
      toast("Your account is already linked to a family record.", true);
      return { error: new Error("Already linked.") };
    }
    const result = await callRpc("uravu_request_tree_access", {
      p_tree_id: state.activeTree.id, p_message: message,
      p_requested_role: "member", p_requested_person_id: personId
    });
    if (result.error) { showDbError(result.error, "request family record link"); return result; }
    toast(t("requestSent"));
    await refreshDashboard();
    return result;
  }
  function renderExistingLinkOptions() {
    const select = $("#request-person");
    if (!select) return;
    const previous = select.value;
    const linked = linkedPersonIds();
    const ownRecord = state.people.find(person => person.created_by === state.user?.id && person.is_self_record);
    select.innerHTML = '<option value="">' +
      escapeHtml(state.language === "ta" ? "இணைக்க வேண்டிய பதிவைத் தேர்ந்தெடுக்கவும்" : "Choose a record to link") +
      '</option>' + state.people.filter(person => !linked.has(person.id) && (!ownRecord || person.id === ownRecord.id)).map(person =>
        '<option value="' + escapeHtml(person.id) + '">' + escapeHtml(person.full_name) +
        (person.tamil_name ? " · " + escapeHtml(person.tamil_name) : "") + '</option>'
      ).join("");
    if (previous && state.people.some(person => person.id === previous) && !linked.has(previous)) select.value = previous;
    const form = $("#link-existing-form");
    if (form) form.hidden = isManager();
    const pending = requestPendingForUser();
    const button = $("#request-existing-link-button");
    if (button) button.disabled = isManager() || Boolean(pending);
    const shouldPauseCreation = !isManager() && !ownRecord && Boolean(pending);
    const personForm = $("#person-form");
    const divider = $("#self-record-divider");
    if (personForm) personForm.hidden = shouldPauseCreation;
    if (divider) divider.hidden = shouldPauseCreation;
  }
  function syncEditModeButton() {
    const button = $("#toggle-edit-mode");
    if (!button) return;
    const enabled = Boolean(state.editMode);
    const label = state.language === "ta"
      ? (enabled ? "திருத்தும் முறை · ON" : "திருத்தும் முறை · OFF")
      : (enabled ? "Edit mode · ON" : "Edit mode · OFF");
    button.classList.toggle("is-on", enabled);
    button.classList.toggle("is-off", !enabled);
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute("aria-label", label);
    button.title = label;
    button.textContent = label;
  }

  function togglePanel(panelId) {
    if (state.openPanels.has(panelId)) {
      state.openPanels.delete(panelId);
    } else {
      state.openPanels.clear();
      state.openPanels.add(panelId);
      if (panelId === "add-person-panel") {
        if (isManager()) clearPersonForm();
        else {
          const ownRecord = state.people.find(person => person.created_by === state.user?.id && person.is_self_record);
          if (ownRecord) beginEditPerson(ownRecord.id);
          else clearPersonForm();
        }
      }
    }
    renderWorkspace();
    if (state.openPanels.has(panelId)) $("#" + panelId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function closePanel(panelId) {
    state.openPanels.delete(panelId);
    if (panelId === "add-person-panel") clearPersonForm();
    renderWorkspace();
  }

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
      state.openPanels.clear();
      $("#tree-workspace").hidden = true;
      $("#dashboard").classList.remove("tree-open");
      return;
    }
    refreshDashboard();
  }

  async function refreshDashboard() {
    if (!state.user || !db) return;
    const mainResult = await db.from("uravu_family_trees")
      .select("id,name,description,language,created_by,created_at,is_main")
      .eq("is_main", true).limit(1).maybeSingle();
    if (mainResult.error) { showDbError(mainResult.error, "load main family tree"); return; }
    const tree = mainResult.data;
    if (!tree) {
      toast(state.language === "ta"
        ? "முக்கிய குடும்ப மரம் இன்னும் அமைக்கப்படவில்லை. Supabase இடமாற்றத்தை இயக்கவும்."
        : "The main family tree is not configured yet. Apply the single-tree Supabase migration.", true);
      return;
    }
    const [membershipResult, ownRequestResult] = await Promise.all([
      db.from("uravu_tree_members").select("tree_id,user_id,role,person_id,display_name,avatar_url,joined_at")
        .eq("tree_id", tree.id).eq("user_id", state.user.id),
      db.from("uravu_access_requests")
        .select("id,tree_id,user_id,request_type,requested_role,requested_person_id,message,status,display_name,avatar_url,created_at")
        .eq("tree_id", tree.id).eq("user_id", state.user.id).eq("status", "pending").order("created_at", { ascending:false })
    ]);
    const error = membershipResult.error || ownRequestResult.error;
    if (error) { showDbError(error, "load main family tree"); return; }
    state.trees = [tree];
    state.memberships = membershipResult.data || [];
    state.ownRequests = ownRequestResult.data || [];
    state.activeTree = tree;
    state.activeMembership = state.memberships[0] || null;
    $("#tree-workspace").hidden = false;
    $("#dashboard").classList.add("tree-open");
    $("#workspace-title").textContent = displayTreeName(tree);
    $("#workspace-description").textContent = state.language === "ta"
      ? "தலைமுறைகள் கடந்த ஒரே குடும்ப மரம்."
      : "One shared family tree, across generations.";
    await loadWorkspace(tree.id, !state.people.length);
  }

  function renderTreeLists() {
    if (!state.activeTree) return;
    $("#workspace-title").textContent = displayTreeName(state.activeTree);
    $("#workspace-description").textContent = state.language === "ta"
      ? "தலைமுறைகள் கடந்த ஒரே குடும்ப மரம்."
      : "One shared family tree, across generations.";
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
    if (!state.activeTree || state.activeTree.id !== treeId) await refreshDashboard();
    if (!state.activeTree) return;
    $("#tree-workspace").hidden = false;
    $("#dashboard").classList.add("tree-open");
    $("#workspace-title").textContent = displayTreeName(state.activeTree);
    await loadWorkspace(state.activeTree.id, true);
  }

  async function loadWorkspace(treeId, showLoading) {
    if (!state.user || !state.activeTree || state.activeTree.id !== treeId) return;
    if (showLoading) {
      $("#family-tree-viewport").hidden = true;
      $("#people-empty").hidden = false;
      $("#people-empty").textContent = "Loading family members…";
      $("#tree-members-list").innerHTML = '<div class="loading-line">Loading members…</div>';
    }
    state.loadingTree = true;
    const results = await Promise.all([
      db.from("uravu_people").select("id,tree_id,full_name,tamil_name,gender,birth_date,birth_date_text,death_date,death_date_text,is_deceased,is_self_record,notes,created_by,created_at,updated_at").eq("tree_id", treeId).order("full_name"),
      db.from("uravu_relationships").select("id,tree_id,person_id,related_person_id,relationship_type,created_at").eq("tree_id", treeId),
      db.from("uravu_tree_members").select("tree_id,user_id,role,person_id,display_name,avatar_url,joined_at").eq("tree_id", treeId),
      db.from("uravu_access_requests").select("id,tree_id,user_id,request_type,requested_role,requested_person_id,message,status,display_name,avatar_url,created_at").eq("tree_id", treeId).eq("request_type","link").eq("status","pending").order("created_at")
    ]);
    state.loadingTree = false;
    if (results[0].error && /(birth_date_text|death_date_text|is_deceased|schema cache)/i.test(String(results[0].error.message || results[0].error))) {
      const legacyPeople = await db.from("uravu_people")
        .select("id,tree_id,full_name,tamil_name,gender,birth_date,death_date,is_self_record,notes,created_by,created_at,updated_at")
        .eq("tree_id", treeId).order("full_name");
      results[0] = legacyPeople;
      state.partialDatesSupported = false;
    } else if (!results[0].error) {
      state.partialDatesSupported = true;
    }
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
    state.activeMembership = state.memberships.find(m => m.tree_id === treeId) || null;

    renderWorkspace();
  }

  function renderWorkspace() {
    if (!state.activeTree) return;
    $("#workspace-role").textContent = state.language === "ta" ? "பகிரப்பட்ட குடும்ப மரம்" : "SHARED FAMILY TREE";
    $("#workspace-title").textContent = displayTreeName(state.activeTree);
    $("#workspace-description").textContent = state.language === "ta"
      ? "தலைமுறைகள் கடந்த ஒரே குடும்ப மரம்."
      : "One shared family tree, across generations.";
    $("#people-count").textContent = String(state.people.length);
    $("#member-count").textContent = String(state.members.filter(member => member.person_id).length);
    $("#pending-count").textContent = String(state.requests.length);
    const ownPending = requestPendingForUser();
    const status = $("#member-request-status");
    status.hidden = !ownPending;
    status.textContent = ownPending
      ? (state.language === "ta" ? "உங்கள் குடும்பப் பதிவை இணைக்கும் கோரிக்கை பரிசீலனையில் உள்ளது." : "Your family-record link request is awaiting review.")
      : "";
    $("#add-person-panel").hidden = !state.openPanels.has("add-person-panel");
    $("#member-management-panel").hidden = !state.openPanels.has("member-management-panel");
    $("#linking-requests-panel").hidden = !state.openPanels.has("linking-requests-panel");
    syncEditModeButton();
    renderPersonConnectOptions();
    renderEditorConnections();
    renderExistingLinkOptions();
    renderPeople();
    renderMembers();
    renderRequests();
  }

  function generationMap() {
    // Spouses and co-parents share a generation unit. Resolve these family groups
    // first, then calculate generations from parent -> child edges between groups.
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

    const parentEdges = state.relationships.filter(edge =>
      edge.relationship_type === "parent" && parent.has(edge.person_id) && parent.has(edge.related_person_id)
    );

    state.relationships
      .filter(edge => edge.relationship_type === "spouse")
      .forEach(edge => unite(edge.person_id, edge.related_person_id));

    // Parents of one child share a generation row, but this does not imply a
    // spouse relationship and does not group their cards in the visual layout.
    const parentsByChild = new Map();
    parentEdges.forEach(edge => {
      if (!parentsByChild.has(edge.related_person_id)) parentsByChild.set(edge.related_person_id, []);
      parentsByChild.get(edge.related_person_id).push(edge.person_id);
    });
    parentsByChild.forEach(parentIds => {
      for (let index = 1; index < parentIds.length; index++) {
        unite(parentIds[0], parentIds[index]);
      }
    });

    const groups = new Map();
    state.people.forEach(person => {
      const root = find(person.id);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root).push(person.id);
    });

    const depths = new Map(Array.from(groups.keys(), id => [id, 0]));
    // Relax only across distinct family-generation groups. The bounded passes avoid hanging
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
    const labels=new Map(),egoMember=state.members.find(member=>member.user_id===state.user?.id&&member.person_id);
    if(!egoMember)return labels;
    const egoId=egoMember.person_id,byId=new Map(state.people.map(person=>[person.id,person]));
    if(!byId.has(egoId))return labels;
    const parentsByChild=new Map(),childrenByParent=new Map(),spousesByPerson=new Map();
    const add=(map,id,relatedId)=>{if(!map.has(id))map.set(id,new Set());map.get(id).add(relatedId);};
    state.relationships.forEach(edge=>{
      if(edge.relationship_type==="parent"){add(parentsByChild,edge.related_person_id,edge.person_id);add(childrenByParent,edge.person_id,edge.related_person_id);}
      else if(edge.relationship_type==="spouse"){add(spousesByPerson,edge.person_id,edge.related_person_id);add(spousesByPerson,edge.related_person_id,edge.person_id);}
    });
    // Treat an explicitly recorded parent's spouse as a co-parent for relationship
    // labels and displayed lineage, without saving synthetic relationship rows.
    Array.from(childrenByParent.entries()).forEach(([parentId, childIds]) => {
      (spousesByPerson.get(parentId) || new Set()).forEach(spouseId => {
        Array.from(childIds).forEach(childId => {
          if (spouseId === childId) return;
          add(parentsByChild, childId, spouseId);
          add(childrenByParent, spouseId, childId);
        });
      });
    });
    const parentsOf=id=>parentsByChild.get(id)||new Set(),childrenOf=id=>childrenByParent.get(id)||new Set(),spousesOf=id=>spousesByPerson.get(id)||new Set(),array=v=>Array.from(v||[]);
    const distances=(startId,nextIds)=>{const map=new Map([[startId,0]]),pending=[startId];for(let i=0;i<pending.length;i++){const current=pending[i],nextDistance=map.get(current)+1;array(nextIds(current)).forEach(id=>{const old=map.get(id);if(old===undefined||nextDistance<old){map.set(id,nextDistance);pending.push(id);}});}return map;};
    const ancestors=distances(egoId,parentsOf);
    for(let round=0;round<state.people.length;round++){let changed=false;array(ancestors.entries()).forEach(([id,d])=>{if(d<2)return;array(spousesOf(id)).forEach(spouseId=>{const old=ancestors.get(spouseId);if(old===undefined||d<old){ancestors.set(spouseId,d);changed=true;}});});if(!changed)break;}
    const bloodAncestors=distances(egoId,parentsOf),descendants=distances(egoId,childrenOf);
    const siblingsOf=id=>new Set(array(parentsOf(id)).flatMap(pid=>array(childrenOf(pid))).filter(otherId=>otherId!==id));
    const gender=p=>p?.gender||"",fullBirthDate=p=>typeof p?.birth_date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(p.birth_date);
    const age=(p,anchor)=>!fullBirthDate(p)||!fullBirthDate(anchor)||p.birth_date===anchor.birth_date?"unknown":p.birth_date<anchor.birth_date?"older":"younger";
    const siblingTamil=(p,anchor)=>{const order=age(p,anchor);if(gender(p)==="male")return order==="older"?"அண்ணன்":order==="younger"?"தம்பி":"சகோதரர் (வயது உறுதி இல்லை)";if(gender(p)==="female")return order==="older"?"அக்கா":order==="younger"?"தங்கை":"சகோதரி (வயது உறுதி இல்லை)";return "சகோதரர் / சகோதரி";};
    const siblingEnglish=p=>gender(p)==="male"?"Brother":gender(p)==="female"?"Sister":"Sibling",gendered=(p,male,female,other)=>gender(p)==="male"?male:gender(p)==="female"?female:other;
    const ordinal=n=>["","first","second","third","fourth","fifth","sixth","seventh","eighth","ninth","tenth"][n]||(n+(n%10===1&&n%100!==11?"st":n%10===2&&n%100!==12?"nd":n%10===3&&n%100!==13?"rd":"th"));
    const ageNotSure="(வயது உறுதி இல்லை)",englishAgeNotSure="(Age not sure)";
    const ego=byId.get(egoId),egoParents=array(parentsOf(egoId)),egoChildren=array(childrenOf(egoId)),egoSiblings=siblingsOf(egoId),egoSpouses=array(spousesOf(egoId));
    function parentSiblingDetails(siblingId,parentId){
      const sibling=byId.get(siblingId),parent=byId.get(parentId);if(!sibling||!parent)return null;
      const order=age(sibling,parent),pg=gender(parent),sg=gender(sibling);
      let english="Parent's sibling",tamil="பெற்றோரின் சகோதரர் / சகோதரி",parallel=false,cross=false,pathEnglish="parent's sibling",pathTamil="பெற்றோரின் சகோதரர் / சகோதரி";
      if(pg==="male"&&sg==="male"){parallel=true;english=order==="older"?"Paternal uncle (older)":order==="younger"?"Paternal uncle (younger)":"Paternal uncle "+englishAgeNotSure;tamil=order==="older"?"பெரியப்பா":order==="younger"?"சித்தப்பா":"தந்தையின் சகோதரர் "+ageNotSure;pathEnglish=order==="older"?"father's elder brother":order==="younger"?"father's younger brother":"father's brother";pathTamil=tamil;}
      else if(pg==="male"&&sg==="female"){cross=true;english="Paternal aunt";tamil="அத்தை";pathEnglish="father's sister";pathTamil="அத்தை";}
      else if(pg==="female"&&sg==="female"){parallel=true;english=order==="older"?"Maternal aunt (older)":order==="younger"?"Maternal aunt (younger)":"Maternal aunt "+englishAgeNotSure;tamil=order==="older"?"பெரியம்மா":order==="younger"?"சித்தி":"தாயின் சகோதரி "+ageNotSure;pathEnglish=order==="older"?"mother's elder sister":order==="younger"?"mother's younger sister":"mother's sister";pathTamil=tamil;}
      else if(pg==="female"&&sg==="male"){cross=true;english="Maternal uncle";tamil="மாமா";pathEnglish="mother's brother";pathTamil="மாமா";}
      return {sibling,parent,age:order,parentGender:pg,siblingGender:sg,parallel,cross,english,tamil,pathEnglish,pathTamil};
    }
    const parentSiblingConnections=[];
    array(new Set(egoParents.flatMap(pid=>array(siblingsOf(pid))))).forEach(sid=>egoParents.forEach(pid=>{if(siblingsOf(pid).has(sid))parentSiblingConnections.push({siblingId:sid,parentId:pid,details:parentSiblingDetails(sid,pid)});}));
    const parentSiblingFor=id=>parentSiblingConnections.find(x=>x.siblingId===id);
    // A grandparent's siblings use age relative to that grandparent, not relative to you.
    const grandparentSiblingConnections=[];
    const directBiologicalGrandparents=array(bloodAncestors.entries()).filter(([,distance])=>distance===2);
    const grandparentSpouseIds = new Set(directBiologicalGrandparents.flatMap(([grandparentId]) => array(spousesOf(grandparentId))));
    directBiologicalGrandparents.forEach(([grandparentId])=>{
      const grandparent=byId.get(grandparentId);
      if(!grandparent)return;
      array(siblingsOf(grandparentId)).forEach(siblingId=>{
        const sibling=byId.get(siblingId);
        if(!sibling)return;
        const order=age(sibling,grandparent);
        const isMale=gender(sibling)==="male";
        const isFemale=gender(sibling)==="female";
        if(!isMale&&!isFemale)return;
        const english=isMale
          ? order==="older"?"Older Grandfather":order==="younger"?"Younger Grandfather":"Grandfather"
          : order==="older"?"Older Grandmother":order==="younger"?"Younger Grandmother":"Grandmother";
        const tamil=isMale
          ? order==="older"?"பெரிய தாத்தா":order==="younger"?"சின்ன தாத்தா":"தாத்தா"
          : order==="older"?"பெரிய பாட்டி":order==="younger"?"சின்ன பாட்டி":"பாட்டி";
        const paths=[];
        egoParents.forEach(parentId=>{
          if(!parentsOf(parentId).has(grandparentId))return;
          const parent=byId.get(parentId);
          const siblingTerm=isMale
            ? order==="older"?"Elder Brother":order==="younger"?"Younger Brother":"Brother"
            : order==="older"?"Elder Sister":order==="younger"?"Younger Sister":"Sister";
          paths.push({
            english:[gendered(parent,"Father","Mother","Parent"),gendered(grandparent,"Father","Mother","Parent"),siblingTerm].join(" → "),
            tamil:[gender(parent)==="male"?"அப்பா":"அம்மா",gender(grandparent)==="male"?"தாத்தா":"பாட்டி",tamil].join(" → ")
          });
        });
        grandparentSiblingConnections.push({siblingId,grandparentId,order,english,tamil,paths});
      });
    });
    const grandparentSiblingFor=id=>grandparentSiblingConnections.find(x=>x.siblingId===id);
    function parentSiblingSpouseDetails(id){
      for(const c of parentSiblingConnections){
        if(!spousesOf(c.siblingId).has(id))continue;
        const sibling=c.details?.sibling,parent=c.details?.parent,sp=byId.get(id);if(!sibling||!parent||!sp)continue;
        const order=c.details.age,pg=gender(parent),sg=gender(sibling),spg=gender(sp);
        if(pg==="male"&&sg==="male"&&spg==="female")return {tamil:order==="older"?"பெரியம்மா":order==="younger"?"சித்தி":"தந்தையின் சகோதரரின் மனைவி "+ageNotSure,english:order==="older"?"Paternal uncle's wife (older branch)":order==="younger"?"Paternal uncle's wife (younger branch)":"Paternal uncle's wife "+englishAgeNotSure};
        if(pg==="male"&&sg==="female"&&spg==="male")return {tamil:"மாமா",english:"Paternal aunt's husband"};
        if(pg==="female"&&sg==="female"&&spg==="male")return {tamil:order==="older"?"பெரியப்பா":order==="younger"?"சித்தப்பா":"தாயின் சகோதரியின் கணவர் "+ageNotSure,english:order==="older"?"Maternal aunt's husband (older branch)":order==="younger"?"Maternal aunt's husband (younger branch)":"Maternal aunt's husband "+englishAgeNotSure};
        if(pg==="female"&&sg==="male"&&spg==="female")return {tamil:"அத்தை",english:"Maternal uncle's wife"};
      }return null;
    }
    function cousinBranchFor(id){for(const cp of array(parentsOf(id)))for(const ep of egoParents)if(siblingsOf(ep).has(cp)){const details=parentSiblingDetails(cp,ep);if(details)return {details};}return null;}
    function cousinLabels(person,branch){
      const d=branch.details,pathEn=d.pathEnglish+"'s "+gendered(person,"son","daughter","child"),pathTa=d.pathTamil+" "+gendered(person,"மகன்","மகள்","பிள்ளை"),order=age(person,ego);
      let english="First cousin ("+pathEn+")",tamil=pathTa;const ageUnknown=d.age==="unknown"||order==="unknown";if(ageUnknown)english+=" "+englishAgeNotSure;
      if(d.parallel){if(order==="older")tamil=(gender(person)==="male"?"அண்ணன்":gender(person)==="female"?"அக்கா":"சகோதரர் / சகோதரி")+" ("+pathTa+")";else if(order==="younger")tamil=(gender(person)==="male"?"தம்பி":gender(person)==="female"?"தங்கை":"சகோதரர் / சகோதரி")+" ("+pathTa+")";else tamil=(gender(person)==="male"?"சகோதரர்":gender(person)==="female"?"சகோதரி":"சகோதரர் / சகோதரி")+" ("+pathTa.replace(" "+ageNotSure,"")+"; வயது உறுதி இல்லை)";}
      else if(d.cross){if(order==="older")tamil=(gender(person)==="male"?"அத்தான்":gender(person)==="female"?"அண்ணி":pathTa)+" ("+pathTa+")";else if(order==="younger")tamil=(gender(person)==="male"?"மச்சான்":gender(person)==="female"?"மச்சினி":pathTa)+" ("+pathTa+")";else tamil=pathTa.replace(" "+ageNotSure,"")+" "+ageNotSure;}
      else tamil=pathTa.replace(/ \\(வயது உறுதி இல்லை\\)/g,"")+(ageUnknown?" "+ageNotSure:"");return {english,tamil};
    }
    const connected=new Set([egoId]),queue=[egoId];
    for(let i=0;i<queue.length;i++){const cur=queue[i];[...array(parentsOf(cur)),...array(childrenOf(cur)),...array(spousesOf(cur))].forEach(id=>{if(!connected.has(id)){connected.add(id);queue.push(id);}});}
    for(const person of state.people){
      const id=person.id;let english="",tamil="";
      if(id===egoId){english="You";tamil="நீங்கள்";}
      else if(egoSpouses.includes(id)){if(gender(ego)==="male"&&gender(person)==="female"){english="Wife";tamil="மனைவி";}else if(gender(ego)==="female"&&gender(person)==="male"){english="Husband";tamil="கணவர்";}else{english="Spouse / partner";tamil="துணைவர் / துணைவி";}}
      else if(egoParents.includes(id)){english=gendered(person,"Father","Mother","Parent");tamil=gender(person)==="male"?"தந்தை":gender(person)==="female"?"தாய்":"பெற்றோர்";}
      else if(egoChildren.includes(id)){english=gendered(person,"Son","Daughter","Child");tamil=gender(person)==="male"?"மகன்":gender(person)==="female"?"மகள்":"பிள்ளை";}
      else if(egoSiblings.has(id)){english=siblingEnglish(person);tamil=siblingTamil(person,ego);}
      else if((ancestors.has(id)&&ancestors.get(id)===2)||grandparentSpouseIds.has(id)){english=gendered(person,"Grandfather","Grandmother","Grandparent");tamil=gender(person)==="male"?"தாத்தா":gender(person)==="female"?"பாட்டி":"தாத்தா / பாட்டி";}
      else if(ancestors.has(id)&&ancestors.get(id)>=3){const d=ancestors.get(id),prefix="great-".repeat(d-2),cap=prefix.charAt(0).toUpperCase()+prefix.slice(1);english=gendered(person,cap+"grandfather",cap+"grandmother",cap+"grandparent");tamil=d===3?gendered(person,"கொள்ளுத்தாத்தா","கொள்ளுப்பாட்டி","கொள்ளு முன்னோர்"):gendered(person,"தாத்தா ("+d+" தலைமுறைகள் மேலே)","பாட்டி ("+d+" தலைமுறைகள் மேலே)","முன்னோர் ("+d+" தலைமுறைகள் மேலே)");}
      else if(descendants.has(id)&&descendants.get(id)===2){english=gendered(person,"Grandson","Granddaughter","Grandchild");tamil=gender(person)==="male"?"பேரன்":gender(person)==="female"?"பேத்தி":"பேரக்குழந்தை";}
      else if(descendants.has(id)&&descendants.get(id)>=3){const d=descendants.get(id),prefix="great-".repeat(d-2),cap=prefix.charAt(0).toUpperCase()+prefix.slice(1);english=gendered(person,cap+"grandson",cap+"granddaughter",cap+"grandchild");tamil=d===3?gendered(person,"கொள்ளுப்பேரன்","கொள்ளுப்பேத்தி","கொள்ளுப் பேரக்குழந்தை"):gendered(person,"பேரன் ("+d+" தலைமுறைகள் கீழே)","பேத்தி ("+d+" தலைமுறைகள் கீழே)","பேரக்குழந்தை ("+d+" தலைமுறைகள் கீழே)");}
      else{
        const gs=grandparentSiblingFor(id);if(gs){english=gs.english;tamil=gs.tamil;}
        if(!english){const ps=parentSiblingFor(id);if(ps){english=ps.details.english;tamil=ps.details.tamil;}}
        if(!english){const pss=parentSiblingSpouseDetails(id);if(pss){english=pss.english;tamil=pss.tamil;}}
        if(!english){
          const sibParent=array(parentsOf(id)).find(pid=>egoSiblings.has(pid));
          if(sibParent){const s=byId.get(sibParent),order=age(s,ego),path=gender(s)==="male"?(order==="older"?"older brother":order==="younger"?"younger brother":"brother"):gender(s)==="female"?(order==="older"?"older sister":order==="younger"?"younger sister":"sister"):"sibling";english=gendered(person,"Nephew","Niece","Nibling")+" ("+path+"'s "+gendered(person,"son","daughter","child")+(order==="unknown"?"; Age not sure":"")+")";tamil=(order==="unknown"?(gender(s)==="male"?"சகோதரர்":gender(s)==="female"?"சகோதரி":"சகோதரர் / சகோதரி"):siblingTamil(s,ego))+" "+gendered(person,"மகன்","மகள்","பிள்ளை")+(order==="unknown"?" "+ageNotSure:"");}
        }
        if(!english){const spouseParent=egoSpouses.some(sid=>parentsOf(sid).has(id)),childSpouse=egoChildren.some(cid=>spousesOf(cid).has(id));if(spouseParent){english=gendered(person,"Father-in-law","Mother-in-law","Parent-in-law");tamil=gender(person)==="male"?"மாமனார்":gender(person)==="female"?"மாமியார்":"மாமனார் / மாமியார்";}else if(childSpouse){english=gendered(person,"Son-in-law","Daughter-in-law","Child-in-law");tamil=gender(person)==="male"?"மருமகன்":gender(person)==="female"?"மருமகள்":"மருமகன் / மருமகள்";}}
        if(!english){
          const spId=egoSpouses.find(sid=>siblingsOf(sid).has(id));
          if(spId){const sp=byId.get(spId),order=age(person,sp),rg=gender(person),kind=gender(sp)==="female"&&gender(ego)==="male"?"Wife":gender(sp)==="male"&&gender(ego)==="female"?"Husband":"Spouse",ageText=order==="older"?"elder ":order==="younger"?"younger ":"";english=kind+"'s "+ageText+(rg==="male"?"brother":rg==="female"?"sister":"sibling")+(order==="unknown"&&!(gender(sp)==="male"&&rg==="female")?" "+englishAgeNotSure:"");if(gender(sp)==="female"){if(rg==="male")tamil=order==="older"?"அத்தான்":order==="younger"?"மச்சான்":"மனைவியின் சகோதரர் "+ageNotSure;else if(rg==="female")tamil=order==="older"?"அண்ணி":order==="younger"?"கொழுந்தியாள்":"மனைவியின் சகோதரி "+ageNotSure;}else if(gender(sp)==="male"){if(rg==="male")tamil=order==="older"?"அத்தான்":order==="younger"?"கொழுந்தன்":"கணவரின் சகோதரர் "+ageNotSure;else if(rg==="female")tamil="அண்ணி";}if(!tamil)tamil="துணைவரின் சகோதரர் / சகோதரி";}
        }
        if(!english){
          const sibSpouse=array(egoSiblings).find(sid=>spousesOf(sid).has(id));
          if(sibSpouse){
            const s=byId.get(sibSpouse),order=age(s,ego);
            if(gender(s)==="female"&&gender(person)==="male"){english="Sister's husband";tamil="சகலை";}
            else if(gender(s)==="male"&&gender(person)==="female"){
              english=order==="older"?"Older brother's wife":order==="younger"?"Younger brother's wife":"Brother's wife"+(order==="unknown"?" "+englishAgeNotSure:"");
              tamil=order==="older"?"அண்ணி":order==="younger"?"கொழுந்தியாள்":"சகோதரரின் மனைவி "+ageNotSure;
            }else{english="Sibling's spouse";tamil="சகோதரர் / சகோதரியின் துணைவர்";}
          }
        }
        if(!english){
          // A wife's elder or younger sister's husband is the user's சகலை.
          if(gender(ego)==="male"&&gender(person)==="male"){
            const wifeId=egoSpouses.find(spouseId=>gender(byId.get(spouseId))==="female");
            if(wifeId){
              const wife=byId.get(wifeId);
              const wifeSisterId=array(siblingsOf(wifeId)).find(sisterId=>
                gender(byId.get(sisterId))==="female"&&spousesOf(sisterId).has(id)
              );
              if(wifeSisterId){
                const order=age(byId.get(wifeSisterId),wife);
                english="Wife's "+(order==="older"?"elder ":order==="younger"?"younger ":"")+"sister's husband"+(order==="unknown"?" "+englishAgeNotSure:"");
                tamil="சகலை";
              }
            }
          }
        }
        if(!english){const stepParent=egoParents.some(parentId=>spousesOf(parentId).has(id));if(stepParent){english=gendered(person,"Stepfather","Stepmother","Step-parent");tamil=gender(person)==="male"?"மாற்றாந்தந்தை":gender(person)==="female"?"மாற்றாந்தாய்":"மாற்றாந்தாய் / மாற்றாந்தந்தை";}}
        if(!english){
          const sc=array(parentsOf(id)).map(pid=>({parentId:pid,spouseId:egoSpouses.find(sid=>siblingsOf(sid).has(pid))})).find(x=>x.spouseId);
          if(sc){const sp=byId.get(sc.spouseId),order=age(person,ego),wifeBrotherSon=gender(sp)==="female"&&gender(ego)==="male"&&gender(person)==="male",husbandSisterDaughter=gender(sp)==="male"&&gender(ego)==="female"&&gender(person)==="female";
            if(wifeBrotherSon){english="Wife's brother's son"+(order==="unknown"?" "+englishAgeNotSure:order==="older"?" (older than you)":" (younger than you)");tamil=order==="older"?"அத்தான் (மனைவியின் சகோதரர் மகன்)":order==="younger"?"மச்சான் (மனைவியின் சகோதரர் மகன்)":"மனைவியின் சகோதரர் மகன் "+ageNotSure;}
            else if(husbandSisterDaughter){english="Husband's sister's daughter"+(order==="unknown"?" "+englishAgeNotSure:order==="older"?" (older than you)":" (younger than you)");tamil=order==="older"?"அண்ணி (கணவரின் சகோதரி மகள்)":order==="younger"?"மச்சினி (கணவரின் சகோதரி மகள்)":"கணவரின் சகோதரி மகள் "+ageNotSure;}
            else{const kind=gender(sp)==="female"?"Wife":gender(sp)==="male"?"Husband":"Spouse",sibKind=gender(byId.get(sc.parentId))==="male"?"brother":"sister";english=kind+"'s "+sibKind+"'s "+gendered(person,"son","daughter","child")+(order==="unknown"?" "+englishAgeNotSure:"");tamil=(kind==="Wife"?"மனைவியின் ":"கணவரின் ")+(sibKind==="brother"?"சகோதரர்":"சகோதரி")+" "+gendered(person,"மகன்","மகள்","பிள்ளை")+(order==="unknown"?" "+ageNotSure:"");}
          }
        }
        if(!english){const branch=cousinBranchFor(id);if(branch){const c=cousinLabels(person,branch);english=c.english;tamil=c.tamil;}}
        if(!english&&connected.has(id)){
          const otherAncestors=distances(id,parentsOf),common=array(bloodAncestors.entries()).filter(([aid])=>otherAncestors.has(aid)).map(([aid,egoD])=>({aid,egoD,otherD:otherAncestors.get(aid)})).filter(x=>x.egoD>=2&&x.otherD>=2).sort((a,b)=>Math.max(a.egoD,a.otherD)-Math.max(b.egoD,b.otherD)||(a.egoD+a.otherD)-(b.egoD+b.otherD));
          if(common.length){const n=common[0],degree=Math.max(1,Math.min(n.egoD,n.otherD)-1),removed=Math.abs(n.egoD-n.otherD),degs=["","முதல்","இரண்டாம்","மூன்றாம்","நான்காம்","ஐந்தாம்","ஆறாம்","ஏழாம்","எட்டாம்","ஒன்பதாம்","பத்தாம்"];english=ordinal(degree)+" cousin"+(removed?(removed===1?" once removed":" "+removed+" times removed"):"");tamil=(degs[degree]||(degree+" ஆம்"))+" நிலை உறவினர்"+(removed?" ("+removed+" தலைமுறை வேறுபாடு)":"");}
          else{english="Relative by marriage";tamil="திருமண உறவு";}
        }
      }
      if(english)labels.set(id,state.language==="ta"?tamil:english);
    }
    return labels;
  }
  function renderPersonConnectOptions() {
    const select = $("#connect-person");
    if (!select) return;
    const old = select.value;
    select.innerHTML = '<option value="">' + (state.language === "ta" ? "குடும்ப உறுப்பினரைத் தேர்ந்தெடுக்கவும்" : "Select a family member") + '</option>' + state.people
      .filter(p => p.id !== state.editingPersonId)
      .map(p => '<option value="' + escapeHtml(p.id) + '">' + escapeHtml(p.full_name) + (p.tamil_name ? " · " + escapeHtml(p.tamil_name) : "") + '</option>').join("");
    if (old && state.people.some(p => p.id === old && p.id !== state.editingPersonId)) select.value = old;
  }

  function familyRecordDetailLines(person) {
    const lines = [];
    const birthValue = person.birth_date_text || person.birth_date;
    const deathValue = person.death_date_text || person.death_date;
    if (birthValue) lines.push((state.language === "ta" ? "பிறப்பு " : "Born ") + formatFamilyDate(birthValue));
    if (deathValue) lines.push((state.language === "ta" ? "இறப்பு " : "Died ") + formatFamilyDate(deathValue));
    else if (isPersonDeceased(person)) lines.push(state.language === "ta" ? "நினைவில் வாழ்பவர்" : "Living in Memory");
    return lines;
  }

  function renderPeople() {
    const nodesRoot = $("#family-tree-nodes");
    const linesRoot = $("#family-tree-lines");
    const viewport = $("#family-tree-viewport");
    const canvas = $("#family-tree-canvas");
    const empty = $("#people-empty");
    if (!nodesRoot || !linesRoot || !viewport || !canvas || !empty) return;

    const search = ($("#people-search").value || "").trim().toLocaleLowerCase();
    const selected = state.people.slice();

    if (!state.people.length) {
      viewport.hidden = true;
      empty.hidden = false;
      empty.innerHTML = '<strong>' + escapeHtml(t("noPeople")) + '</strong>' + escapeHtml(t("noPeopleSub"));
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
    const nodeWidth = 270;
    const columnGap = 84;
    const coupleGap = 28;
    const levelUnits = new Map();
    const positions = new Map();
    const byId = new Map(state.people.map(person => [person.id, person]));
    const relationLabels = relationshipLabelsForCurrentUser();
    const countLines = (value, charsPerLine) => String(value || "").split(/\r?\n/)
      .reduce((total, line) => total + Math.max(1, Math.ceil(line.length / charsPerLine)), 0);
    const cardHeightFor = person => {
      const label = relationLabels.get(person.id) || "";
      const nameHeight = Math.max(34,
        countLines(person.full_name, 27) * 19 +
        (person.tamil_name ? 3 + countLines(person.tamil_name, 24) * 15 : 0));
      const labelHeight = label ? 12 + countLines(label, 31) * 15 : 0;
      const detailHeight = familyRecordDetailLines(person).reduce((total, line) =>
        total + countLines(line, 40) * 13 + 2, 0);
      const notesHeight = person.notes && canEditPerson(person)
        ? countLines(person.notes, 40) * 14 + 2 : 0;
      const actionsHeight = state.editMode && canEditPerson(person) ? 32 : 0;
      const blocks = 1 + (label ? 1 : 0) + familyRecordDetailLines(person).length +
        (notesHeight ? 1 : 0) + (actionsHeight ? 1 : 0);
      return Math.max(82, 24 + nameHeight + labelHeight + detailHeight +
        notesHeight + actionsHeight + Math.max(0, blocks - 1) * 5 + 8);
    };
    const cardHeights = new Map(selected.map(person => [person.id, cardHeightFor(person)]));
    const levelByPerson = new Map();
    grouped.forEach((people, level) => people.forEach(person => levelByPerson.set(person.id, level)));
    // A recorded parent's spouse is also treated as a co-parent in the displayed tree.
    // These are virtual layout/display edges only; nothing is written to the database.
    const spousesForLayout = new Map(state.people.map(person => [person.id, new Set()]));
    state.relationships.filter(edge => edge.relationship_type === "spouse").forEach(edge => {
      if (!spousesForLayout.has(edge.person_id) || !spousesForLayout.has(edge.related_person_id)) return;
      spousesForLayout.get(edge.person_id).add(edge.related_person_id);
      spousesForLayout.get(edge.related_person_id).add(edge.person_id);
    });
    const effectiveParentEdges = new Map();
    const addEffectiveParent = (parentId, childId, inferred = false) => {
      if (parentId === childId || !levelByPerson.has(parentId) || !levelByPerson.has(childId)) return;
      const key = parentId + "|" + childId;
      const existing = effectiveParentEdges.get(key);
      if (!existing || (existing.inferred && !inferred)) {
        effectiveParentEdges.set(key, {
          person_id:parentId, related_person_id:childId,
          relationship_type:"parent", inferred
        });
      }
    };
    state.relationships.filter(edge => edge.relationship_type === "parent").forEach(edge => {
      addEffectiveParent(edge.person_id, edge.related_person_id, false);
      (spousesForLayout.get(edge.person_id) || new Set()).forEach(spouseId => {
        addEffectiveParent(spouseId, edge.related_person_id, true);
      });
    });
    const parentEdgesForLayout = Array.from(effectiveParentEdges.values());
    const parentsByChild = new Map();
    parentEdgesForLayout.forEach(edge => {
      if (!parentsByChild.has(edge.related_person_id)) parentsByChild.set(edge.related_person_id, new Set());
      parentsByChild.get(edge.related_person_id).add(edge.person_id);
    });
    const rowYByLevel = new Map();
    let nextRowY = 24;
    levelKeys.forEach(level => {
      rowYByLevel.set(level, nextRowY);
      const tallest = Math.max(70, ...grouped.get(level).map(person => cardHeights.get(person.id) || 80));
      const outgoingFamilies = new Set();
      parentEdgesForLayout.filter(edge =>
        levelByPerson.get(edge.person_id) === level &&
        levelByPerson.get(edge.related_person_id) > level
      ).forEach(edge => {
        outgoingFamilies.add(Array.from(parentsByChild.get(edge.related_person_id) || new Set()).sort().join("|"));
      });
      // Reserve a separate empty vertical lane for each family bus so unrelated
      // connector lines do not overlap or run through the same visual row.
      nextRowY += tallest + Math.max(168, outgoingFamilies.size * 26 + 44);
    });

    const layoutPartners = new Map(state.people.map(person => [person.id, new Set()]));
    const addLayoutPartner = (firstId, secondId) => {
      if (firstId === secondId || !layoutPartners.has(firstId) || !layoutPartners.has(secondId)) return;
      layoutPartners.get(firstId).add(secondId);
      layoutPartners.get(secondId).add(firstId);
    };
    state.relationships.forEach(edge => {
      if (edge.relationship_type === "spouse") addLayoutPartner(edge.person_id, edge.related_person_id);
    });
    const layoutPartnersOf = id => Array.from(layoutPartners.get(id) || new Set());

    levelKeys.forEach(level => {
      const people = grouped.get(level).slice().sort((a, b) => a.full_name.localeCompare(b.full_name));
      const visibleById = new Map(people.map(person => [person.id, person]));
      const used = new Set();
      const units = [];

      // Only people connected by an explicit spouse edge share an adjacent block.
      // Parent-child links are drawn independently, without grouping unrelated records.
      people.forEach(person => {
        if (used.has(person.id)) return;
        const groupIds = [];
        const pending = [person.id];
        used.add(person.id);
        while (pending.length) {
          const currentId = pending.pop();
          groupIds.push(currentId);
          layoutPartnersOf(currentId).forEach(partnerId => {
            if (visibleById.has(partnerId) && !used.has(partnerId)) {
              used.add(partnerId);
              pending.push(partnerId);
            }
          });
        }
        const group = groupIds.map(id => visibleById.get(id)).filter(Boolean)
          .sort((a, b) => a.full_name.localeCompare(b.full_name));
        const width = group.length * nodeWidth + Math.max(0, group.length - 1) * coupleGap;
        units.push({ people:group, width, sortName:group[0]?.full_name || person.full_name });
      });

      // Use the centre of the parents' couple where possible. This keeps each
      // sibling branch underneath its family instead of scattering all cousins
      // in alphabetical order across the generation.
      const parentCenter = unit => {
        const centers = [];
        const seenParentIds = new Set();
        unit.people.forEach(person => {
          parentEdgesForLayout
            .filter(edge => edge.related_person_id === person.id)
            .forEach(edge => {
              const parentPerson = byId.get(edge.person_id);
              if (!parentPerson || seenParentIds.has(parentPerson.id)) return;
              const parentPosition = positions.get(parentPerson.id);
              if (!parentPosition) return;
              const partners = layoutPartnersOf(parentPerson.id)
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
            y: rowYByLevel.get(level) || 24,
            width: nodeWidth,
            height: cardHeights.get(person.id) || 80
          });
        });
        cursorX += unit.width + columnGap;
      });
    });

    // Keep every spouse-connected unit intact when arranging each generation.
    // Sibling families become wide blocks containing whole person+partner units.
    const personUnit = new Map();
    levelUnits.forEach(units => units.forEach(unit => {
      unit.people.forEach(person => personUnit.set(person.id, unit));
    }));

    const parentFamilyByPerson = new Map();
    const familyBucketsByLevel = new Map();
    levelKeys.forEach(level => {
      const buckets = new Map();
      (grouped.get(level) || []).forEach(person => {
        const parentIds = Array.from(parentsByChild.get(person.id) || new Set())
          .filter(parentId => {
            const parentPosition = positions.get(parentId);
            const childPosition = positions.get(person.id);
            return parentPosition && childPosition && parentPosition.y < childPosition.y;
          }).sort();
        if (!parentIds.length) return;
        const key = parentIds.join("|");
        if (!buckets.has(key)) buckets.set(key, { key, parentIds, children:[] });
        buckets.get(key).children.push(person.id);
        parentFamilyByPerson.set(person.id, key);
      });
      familyBucketsByLevel.set(level, buckets);
    });

    // The currently linked member's own sibling family is the strongest grouping
    // anchor. Elsewhere, prefer the sibling set with the most children. This keeps
    // partners adjacent while leaving space for each partner's separate ancestry.
    const activePersonId = state.activeMembership?.person_id ||
      state.members.find(member => member.user_id === state.user?.id && member.person_id)?.person_id || null;
    const activeFamilyKey = activePersonId ? parentFamilyByPerson.get(activePersonId) : null;

    // Measure kinship distance from the linked member using the displayed family
    // graph. When a spouse unit belongs to two sibling families, anchor it to the
    // side that is closer to the active member, then use sibling count as a tie-break.
    const relatednessAdjacency = new Map(state.people.map(person => [person.id, new Set()]));
    const addRelatednessEdge = (a, b) => {
      if (relatednessAdjacency.has(a) && relatednessAdjacency.has(b) && a !== b) {
        relatednessAdjacency.get(a).add(b);
        relatednessAdjacency.get(b).add(a);
      }
    };
    parentEdgesForLayout.forEach(edge => addRelatednessEdge(edge.person_id, edge.related_person_id));
    state.relationships.filter(edge => edge.relationship_type === "spouse")
      .forEach(edge => addRelatednessEdge(edge.person_id, edge.related_person_id));
    const relatednessDistance = new Map();
    if (activePersonId && relatednessAdjacency.has(activePersonId)) {
      const queue = [activePersonId];
      relatednessDistance.set(activePersonId, 0);
      for (let index = 0; index < queue.length; index++) {
        const currentId = queue[index];
        (relatednessAdjacency.get(currentId) || new Set()).forEach(relatedId => {
          if (relatednessDistance.has(relatedId)) return;
          relatednessDistance.set(relatedId, relatednessDistance.get(currentId) + 1);
          queue.push(relatedId);
        });
      }
    }

    const primaryFamilyByUnit = new Map();
    levelKeys.forEach(level => {
      const buckets = familyBucketsByLevel.get(level) || new Map();
      (levelUnits.get(level) || []).forEach(unit => {
        const candidates = Array.from(new Set(unit.people.map(person => parentFamilyByPerson.get(person.id)).filter(Boolean)));
        if (!candidates.length) return;
        let chosenKey = null;
        if (activeFamilyKey && candidates.includes(activeFamilyKey)) {
          chosenKey = activeFamilyKey;
        } else {
          const originalCenter = unit.people.reduce((sum, person) => {
            const position = positions.get(person.id);
            return sum + (position ? position.x + position.width / 2 : 0);
          }, 0) / Math.max(1, unit.people.length);
          candidates.sort((a, b) => {
            const bucketA = buckets.get(a), bucketB = buckets.get(b);
            const memberDistance = key => {
              const distances = unit.people
                .filter(person => parentFamilyByPerson.get(person.id) === key)
                .map(person => relatednessDistance.get(person.id) ?? Infinity);
              return distances.length ? Math.min(...distances) : Infinity;
            };
            const affinityDifference = memberDistance(a) - memberDistance(b);
            if (Number.isFinite(affinityDifference) && affinityDifference !== 0) return affinityDifference;
            if (memberDistance(a) !== memberDistance(b)) {
              return memberDistance(a) === Infinity ? 1 : -1;
            }
            const sizeDifference = (bucketB?.children.length || 0) - (bucketA?.children.length || 0);
            if (sizeDifference) return sizeDifference;
            const centerFor = bucket => {
              if (!bucket) return originalCenter;
              const parentPositions = bucket.parentIds.map(id => positions.get(id)).filter(Boolean);
              return parentPositions.length
                ? parentPositions.reduce((sum, position) => sum + position.x + position.width / 2, 0) / parentPositions.length
                : originalCenter;
            };
            return Math.abs(centerFor(bucketA) - originalCenter) - Math.abs(centerFor(bucketB) - originalCenter) ||
              a.localeCompare(b);
          });
          chosenKey = candidates[0];
        }
        primaryFamilyByUnit.set(unit, chosenKey);
      });
    });

    const familySiblingGap = 58;
    const familyBlockGap = 138;
    levelKeys.forEach(level => {
      const rowY = rowYByLevel.get(level) || 24;
      const buckets = familyBucketsByLevel.get(level) || new Map();
      const blocks = [];
      const ownedUnits = new Set();

      buckets.forEach(bucket => {
        const units = (levelUnits.get(level) || [])
          .filter(unit => primaryFamilyByUnit.get(unit) === bucket.key);
        if (!units.length) return;
        units.forEach(unit => ownedUnits.add(unit));
        units.sort((a, b) => (a.sortName || "").localeCompare(b.sortName || ""));
        const width = units.reduce((sum, unit) => sum + unit.width, 0) +
          Math.max(0, units.length - 1) * familySiblingGap;
        const parentPositions = bucket.parentIds.map(id => positions.get(id)).filter(Boolean);
        const targetCenter = parentPositions.length
          ? parentPositions.reduce((sum, position) => sum + position.x + position.width / 2, 0) / parentPositions.length
          : null;
        const originalLeft = Math.min(...units.flatMap(unit =>
          unit.people.map(person => positions.get(person.id)?.x ?? 0)));
        blocks.push({
          key:bucket.key, units, width, targetCenter, originalLeft,
          desiredLeft:targetCenter == null ? originalLeft : targetCenter - width / 2,
          memberGap:familySiblingGap
        });
      });

      // Ancestors or unlinked roots stay as separate partner units; do not split
      // these into individual cards just to fill the row.
      (levelUnits.get(level) || []).forEach(unit => {
        if (ownedUnits.has(unit)) return;
        const originalLeft = Math.min(...unit.people.map(person => positions.get(person.id)?.x ?? 0));
        blocks.push({
          key:"root:" + (unit.sortName || ""), units:[unit], width:unit.width,
          targetCenter:null, originalLeft, desiredLeft:originalLeft, memberGap:familySiblingGap
        });
      });

      blocks.sort((a, b) => a.desiredLeft - b.desiredLeft || String(a.key).localeCompare(String(b.key)));
      let previousRight = -Infinity;
      blocks.forEach(block => {
        const left = Math.max(block.desiredLeft, previousRight + familyBlockGap);
        let unitLeft = left;
        block.units.forEach(unit => {
          unit.people.forEach((person, index) => {
            const current = positions.get(person.id);
            positions.set(person.id, {
              ...current,
              x:unitLeft + index * (nodeWidth + coupleGap),
              y:rowY
            });
          });
          unitLeft += unit.width + block.memberGap;
        });
        previousRight = left + block.width;
      });
    });

    // Shift the whole graph only enough to give its leftmost record a margin.
    // This preserves every parent-to-children alignment without centring a row.
    const leftmostCard = Math.min(0, ...Array.from(positions.values()).map(position => position.x));
    const treeShiftX = 26 - leftmostCard;
    if (treeShiftX) positions.forEach((position, id) =>
      positions.set(id, { ...position, x:position.x + treeShiftX })
    );
    const widestLevel = Math.max(1, ...Array.from(positions.values()).map(position => position.x + position.width));
    const baseWidth = Math.max(viewport.clientWidth || 760, widestLevel + 26);
    const lowestCardEdge = Math.max(0, ...Array.from(positions.values()).map(position => position.y + position.height));
    const baseHeight = Math.max(290, lowestCardEdge + 48);
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
    const partnerLineByPair = new Map();
    const partnerEdges = state.relationships.filter(edge => edge.relationship_type === "spouse");

    // Draw only explicit partner links. Keep the midpoint and line height so
    // the parent-to-children stem can descend from the partner line itself.
    partnerEdges.forEach(edge => {
      const first = positions.get(edge.person_id);
      const second = positions.get(edge.related_person_id);
      if (!first || !second || first.y !== second.y) return;
      const left = first.x <= second.x ? first : second;
      const right = first.x <= second.x ? second : first;
      const lineY = left.y + 36;
      const lineLeft = left.x + left.width;
      const lineRight = right.x;
      if (lineRight <= lineLeft) return;
      const pairKey = [edge.person_id, edge.related_person_id].sort().join("|");
      const line = {
        centerX: (lineLeft + lineRight) / 2,
        y: lineY
      };
      partnerLineByPair.set(pairKey, line);
      paths.push('<path class="family-line spouse-line" d="M ' +
        lineLeft + ' ' + lineY + ' H ' + lineRight + '"/>');
    });

    // Group each child under the exact set of recorded parents. The horizontal
    // bus is a family connector only: never draw separate lines between siblings.
    const familyChildGroups = new Map();
    parentsByChild.forEach((parentSet, childId) => {
      const child = positions.get(childId);
      const parentIds = Array.from(parentSet).sort();
      const parents = parentIds.map(id => positions.get(id)).filter(Boolean);
      if (!child || !parents.length || !parents.every(parent => parent.y < child.y)) return;
      const key = parentIds.join("|");
      if (!familyChildGroups.has(key)) familyChildGroups.set(key, { parentIds, childIds:[] });
      familyChildGroups.get(key).childIds.push(childId);
    });

    const orderedFamilyGroups = Array.from(familyChildGroups.values()).sort((a, b) => {
      const centerFor = group => {
        const parents = group.parentIds.map(id => positions.get(id)).filter(Boolean);
        return parents.length
          ? parents.reduce((sum, position) => sum + position.x + position.width / 2, 0) / parents.length
          : 0;
      };
      return centerFor(a) - centerFor(b);
    });
    const nextLaneByRowPair = new Map();
    orderedFamilyGroups.forEach(group => {
      const parents = group.parentIds.map(id => positions.get(id)).filter(Boolean);
      const children = group.childIds.map(id => positions.get(id)).filter(Boolean)
        .sort((a, b) => (a.x + a.width / 2) - (b.x + b.width / 2));
      if (!parents.length || !children.length) return;
      if (!parents.every(parent => parent.y === parents[0].y) ||
          !children.every(child => child.y === children[0].y)) return;

      const parentRowY = parents[0].y;
      const parentRowCards = Array.from(positions.values()).filter(position => position.y === parentRowY);
      const parentRowBottom = Math.max(...parentRowCards.map(position => position.y + position.height));
      const childTop = Math.min(...children.map(child => child.y));
      if (childTop <= parentRowBottom + 8) return;

      // Prefer the centre of a recorded partner link. If no partner relationship
      // exists, use the centre of the recorded parent group without inventing a link.
      let partnerLine = null;
      for (let i = 0; i < group.parentIds.length && !partnerLine; i++) {
        for (let j = i + 1; j < group.parentIds.length; j++) {
          const pairKey = [group.parentIds[i], group.parentIds[j]].sort().join("|");
          if (partnerLineByPair.has(pairKey)) {
            partnerLine = partnerLineByPair.get(pairKey);
            break;
          }
        }
      }

      const fallbackParentCenterX = parents.reduce(
        (sum, parent) => sum + parent.x + parent.width / 2, 0
      ) / parents.length;
      const trunkStartX = partnerLine ? partnerLine.centerX : fallbackParentCenterX;
      const trunkStartY = partnerLine ? partnerLine.y : parentRowBottom;
      const childCenters = children.map(child => child.x + child.width / 2);
      const busLeft = Math.min(trunkStartX, ...childCenters);
      const busRight = Math.max(trunkStartX, ...childCenters);
      const rowPairKey = parentRowY + "|" + childTop;
      const laneIndex = nextLaneByRowPair.get(rowPairKey) || 0;
      nextLaneByRowPair.set(rowPairKey, laneIndex + 1);
      const busY = Math.min(childTop - 18, parentRowBottom + 26 + laneIndex * 24);

      // One vertical trunk flows down from the partner link (or parent group),
      // meets a single horizontal child bus, then drops vertically to each child.
      paths.push('<path class="family-line family-parent-stem" d="M ' +
        trunkStartX + ' ' + trunkStartY + ' V ' + busY + '"/>');
      if (busRight - busLeft > 1) {
        paths.push('<path class="family-line family-child-bus" d="M ' +
          busLeft + ' ' + busY + ' H ' + busRight + '"/>');
      }
      children.forEach(child => {
        const childCenterX = child.x + child.width / 2;
        paths.push('<path class="family-line family-child-drop" d="M ' +
          childCenterX + ' ' + busY + ' V ' + child.y + '"/>');
      });
    });

    linesRoot.innerHTML = paths.join("");
    nodesRoot.innerHTML = selected.map(person => renderPersonCard(person, positions.get(person.id), relationLabels.get(person.id))).join("");
    applyTreeCanvasScale(false);
    if (search) {
      const firstMatch = selected.find(person => [person.full_name, person.tamil_name]
        .some(value => String(value || "").toLocaleLowerCase().includes(search)));
      const matchPosition = firstMatch && positions.get(firstMatch.id);
      if (matchPosition) requestAnimationFrame(() => {
        viewport.scrollLeft = Math.max(0, (matchPosition.x + matchPosition.width / 2) * state.treeZoom - viewport.clientWidth / 2);
        viewport.scrollTop = Math.max(0, (matchPosition.y + matchPosition.height / 2) * state.treeZoom - viewport.clientHeight / 2);
      });
    }

    $$("[data-edit-person]").forEach(button => button.addEventListener("click", () => beginEditPerson(button.dataset.editPerson)));
    $$("[data-delete-person]").forEach(button => button.addEventListener("click", () => deletePerson(button.dataset.deletePerson)));
    $$("[data-remove-relationship]").forEach(button => button.addEventListener("click", () => deleteRelationship(button.dataset.removeRelationship)));
    $$("[data-view-person]").forEach(card => {
      card.addEventListener("click", () => openPersonDetails(card.dataset.viewPerson));
      card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPersonDetails(card.dataset.viewPerson);
        }
      });
    });
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


  function highlightSearchMatch(value, query) {
    const text = String(value || "");
    if (!query) return escapeHtml(text);
    const index = text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
    if (index < 0) return escapeHtml(text);
    return escapeHtml(text.slice(0, index)) + '<mark class="search-highlight">' +
      escapeHtml(text.slice(index, index + query.length)) + '</mark>' + escapeHtml(text.slice(index + query.length));
  }

  function renderPersonCard(person, position, relationLabel) {
    if (!position) return "";
    const canEdit = canEditPerson(person);
    const canDelete = canDeletePerson(person);
    const showActions = state.editMode && canEdit;
    const search = ($("#people-search").value || "").trim();
    const searchMatch = Boolean(search && [person.full_name, person.tamil_name]
      .some(value => String(value || "").toLocaleLowerCase().includes(search.toLocaleLowerCase())));
    const genderClass = person.gender === "female" ? "female" : person.gender === "other" ? "other" : "";
    const details = familyRecordDetailLines(person);
    const viewAttributes = showActions ? "" :
      ' data-view-person="' + escapeHtml(person.id) + '" tabindex="0" role="button" aria-label="' +
      escapeHtml((state.language === "ta" ? "உறுப்பினர் விவரங்களைக் காண்க: " : "View member details: ") + person.full_name) + '"';
    return '<article class="family-node-card' + (searchMatch ? ' search-match' : '') + '" style="left:' + position.x + 'px;top:' + position.y + 'px;width:' + position.width + 'px;min-height:' + position.height + 'px"' + viewAttributes + '>' +
      '<div class="person-card-top"><span class="person-avatar ' + genderClass + '">' + escapeHtml(initials(person.full_name)) +
      '</span><div class="graph-person-names"><h4>' + highlightSearchMatch(person.full_name, search) + '</h4>' +
      (person.tamil_name ? '<div class="tamil-name">' + highlightSearchMatch(person.tamil_name, search) + '</div>' : '') + '</div></div>' +
      (relationLabel ? '<div class="graph-relationship-label">' + escapeHtml(relationLabel) + '</div>' : '') +
      (details.length ? details.map(detail => '<div class="person-meta record-meta">' + escapeHtml(detail) + '</div>').join("") : '') +
      (person.notes && canEdit ? '<div class="person-meta graph-notes">' + escapeHtml(person.notes) + '</div>' : '') +
      (showActions ? '<div class="person-card-actions"><button class="secondary-button" type="button" data-edit-person="' + escapeHtml(person.id) + '">' + escapeHtml(t("edit")) +
      '</button>' + (canDelete ? '<button class="danger-button" type="button" data-delete-person="' + escapeHtml(person.id) + '">' + escapeHtml(t("delete")) + '</button>' : '') + '</div>' : '') +
      '</article>';
  }

  function renderMembers() {
    const root = $("#tree-members-list");
    if (!root) return;
    const linkedMembers = state.members.filter(member => member.person_id);
    if (!linkedMembers.length) {
      root.innerHTML = '<div class="empty-state">' +
        (state.language === "ta" ? "இன்னும் குடும்பப் பதிவுடன் இணைக்கப்பட்ட கணக்குகள் இல்லை." : "No accounts are linked to a family record yet.") +
        '</div>';
      return;
    }
    root.innerHTML = linkedMembers.map(member => {
      const person = state.people.find(item => item.id === member.person_id);
      return '<article class="member-row linked-account-row">' +
        '<div class="member-identity"><span class="person-avatar">' + escapeHtml(initials(member.display_name)) +
        '</span><div><strong>' + escapeHtml(member.display_name || (state.language === "ta" ? "குடும்ப உறுப்பினர்" : "Family member")) +
        (member.user_id === state.user?.id ? ' · ' + escapeHtml(state.language === "ta" ? "நீங்கள்" : "You") : '') +
        '</strong><small>' + escapeHtml(state.language === "ta" ? "இணைக்கப்பட்ட கணக்கு" : "Linked account") + '</small></div></div>' +
        '<div class="member-record"><strong>' + escapeHtml(person?.full_name || (state.language === "ta" ? "பதிவு கிடைக்கவில்லை" : "Record unavailable")) +
        '</strong><small>' + escapeHtml(person?.tamil_name || "") + '</small></div></article>';
    }).join("");
  }

  function renderRequests() {
    const root = $("#linking-requests-list");
    if (!root) return;
    if (!isManager()) {
      root.innerHTML = '<div class="empty-state">' +
        (state.language === "ta"
          ? "இணைப்பு கோரிக்கைகளைப் பரிசீலிக்க, உங்கள் கணக்கு முதலில் குடும்பப் பதிவுடன் இணைக்கப்பட வேண்டும்."
          : "Your account must be linked to a family record before you can review linking requests.") +
        '</div>';
      return;
    }
    renderRequestGroup(root, state.requests.filter(request => request.request_type === "link"), "linking");
  }

  function renderRequestGroup(root, requests, kind) {
    if (!root) return;
    if (!isManager()) { root.innerHTML = ""; return; }
    if (!requests.length) {
      root.innerHTML = '<div class="empty-state">' +
        (kind === "access"
          ? (state.language === "ta" ? "அணுகல் கோரிக்கைகள் இல்லை." : "There are no pending access requests.")
          : (state.language === "ta" ? "இணைப்பு கோரிக்கைகள் இல்லை." : "There are no pending linking requests.")) +
        '</div>';
      return;
    }
    root.innerHTML = requests.map(request => {
      const requestedPerson = state.people.find(person => person.id === request.requested_person_id);
      const typeLabel = kind === "access"
        ? (state.language === "ta" ? "குடும்ப மர அணுகல்" : "Family tree access")
        : (state.language === "ta" ? "குடும்பப் பதிவு இணைப்பு" : "Family record linking");
      return '<article class="request-row"><div><div class="request-identity"><span class="person-avatar">' +
        escapeHtml(initials(request.display_name)) + '</span><div><strong>' +
        escapeHtml(request.display_name || (state.language === "ta" ? "குடும்ப உறுப்பினர்" : "Family member")) +
        '</strong><small>' + escapeHtml(typeLabel) + '</small></div></div>' +
        '<p class="request-copy">' + escapeHtml(request.message || (state.language === "ta" ? "குறிப்பு எதுவும் வழங்கப்படவில்லை." : "No additional message provided.")) +
        (requestedPerson ? '<br>' + (state.language === "ta" ? "கோரிய பதிவு: " : "Requested record: ") + '<strong>' + escapeHtml(requestedPerson.full_name) + '</strong>' : '') +
        '</p></div><div class="request-actions"><button class="primary-button" type="button" data-review-request="' +
        escapeHtml(request.id) + '" data-decision="approve">' + escapeHtml(t("approve")) +
        '</button><button class="danger-button" type="button" data-review-request="' + escapeHtml(request.id) +
        '" data-decision="reject">' + escapeHtml(t("reject")) + '</button></div></article>';
    }).join("");
    $$("[data-review-request]").forEach(button => button.addEventListener("click", () => reviewRequest(button.dataset.reviewRequest, button.dataset.decision, button)));
  }

  async function reviewRequest(requestId, decision, button) {
    const role = "member";
    setBusy(button, true, decision === "approve" ? "Approving…" : "Rejecting…");
    const { error } = await callRpc("uravu_review_tree_request", {
      p_request_id:requestId, p_decision:decision, p_role:role
    });
    setBusy(button, false);
    if (error) { showDbError(error, "review request"); return; }
    const reviewed = state.requests.find(request => request.id === requestId);
    toast(decision === "reject" ? "Request rejected." :
      reviewed?.request_type === "link" ? "Family record linked to the member's account." : "Access request approved.");
    await refreshDashboard();
  }

  function openRequestDialog(treeId, isMember) {
    const tree = state.trees.find(item => item.id === treeId);
    if (!tree) { toast("Family tree not found.", true); return; }
    const membership = state.memberships.find(item => item.tree_id === treeId);
    const hasMembership = Boolean(membership);
    if (membership?.role === "owner" || membership?.person_id) {
      toast("Your account is already linked to a family record.", true);
      return;
    }
    const personOptions = ['<option value="">Select a family member</option>'].concat(
      state.people.filter(person => !state.members.some(member =>
        member.person_id === person.id && member.user_id !== state.user.id))
        .map(person => '<option value="' + escapeHtml(person.id) + '">' +
          escapeHtml(person.full_name) + (person.tamil_name ? " · " + escapeHtml(person.tamil_name) : "") + '</option>')
    ).join("");
    const title = hasMembership
      ? (state.language === "ta" ? "குடும்பப் பதிவுடன் இணைக்கக் கோரு" : "Request a record link")
      : translateUiValue("Request access to " + tree.name);
    const description = hasMembership
      ? (state.language === "ta" ? "குடும்பப் பதிவுடன் இணைக்க உங்கள் கோரிக்கையை உரிமையாளர் அல்லது இணைக்கப்பட்ட உறுப்பினர் பரிசீலிப்பார்." : "The Owner or a Member linked to a family record will review your linking request.")
      : (state.language === "ta" ? "குடும்ப மரத்தில் இணையக் கோருங்கள். உரிமையாளர் அல்லது இணைக்கப்பட்ட உறுப்பினர் உங்கள் கோரிக்கையைப் பரிசீலிப்பார்." : "Request to join this family tree. The Owner or a linked Member can review your request.");
    $("#request-modal-title").textContent = title;
    $("#request-modal-description").textContent = description;
    $("#request-modal-body").innerHTML =
      '<form id="access-request-form">' +
      (hasMembership ? '<label class="field-label" for="request-person">' +
        (state.language === "ta" ? "உங்கள் கணக்கை இணைக்க வேண்டிய குடும்பப் பதிவு" : "Family record to link to your account") +
        '</label><select class="form-input" id="request-person" required>' + personOptions + '</select>' : '') +
      '<label class="field-label" for="request-message">' + (state.language === "ta" ? "செய்தி" : "Message") +
        ' <span class="optional">' + escapeHtml(t("Optional")) + '</span></label>' +
      '<textarea class="form-input form-textarea" id="request-message" maxlength="1000" placeholder="' +
        (state.language === "ta" ? "உங்கள் கோரிக்கையைச் சுருக்கமாக விளக்குங்கள்" : "Explain your request briefly") + '"></textarea>' +
      '<div class="modal-actions"><button class="secondary-button" id="cancel-access-request" type="button">' + escapeHtml(t("cancel")) +
      '</button><button class="primary-button" type="submit">' + escapeHtml(t("sendRequest")) + '</button></div></form>';
    $("#request-modal").hidden = false;
    $("#cancel-access-request").addEventListener("click", closeRequestDialog);
    $("#access-request-form").addEventListener("submit", async event => {
      event.preventDefault();
      const submitButton = event.currentTarget.querySelector('button[type="submit"]');
      const requestedPerson = hasMembership ? ($("#request-person").value || null) : null;
      if (hasMembership && !requestedPerson) {
        toast(state.language === "ta" ? "குடும்பப் பதிவைத் தேர்ந்தெடுக்கவும்." : "Select a family record to request.", true);
        return;
      }
      const message = $("#request-message").value.trim();
      setBusy(submitButton, true, "Sending…");
      const { error } = await callRpc("uravu_request_tree_access", {
        p_tree_id:treeId, p_message:message, p_requested_role:"member", p_requested_person_id:requestedPerson
      });
      setBusy(submitButton, false);
      if (error) { showDbError(error, "request access"); return; }
      closeRequestDialog();
      toast(t("requestSent"));
      await refreshDashboard();
      if (state.activeTree?.id === treeId) await loadWorkspace(treeId, false);
    });
  }

  function setPersonDetailRow(rowId, valueId, value) {
    const row = $("#" + rowId);
    const field = $("#" + valueId);
    if (!row || !field) return;
    row.hidden = value == null || value === "";
    field.textContent = value || "";
  }

  function openPersonDetails(personId) {
    const person = state.people.find(item => item.id === personId);
    if (!person) return;
    const modal = $("#person-details-modal");
    if (!modal) return;
    const labels = state.language === "ta"
      ? { eyebrow:"குடும்ப உறுப்பினர்", relation:"உறவு", tamilName:"தமிழ்ப் பெயர்", gender:"பாலினம்", born:"பிறந்த தேதி", died:"இறந்த தேதி", notes:"குறிப்புகள்", close:"மூடு" }
      : { eyebrow:"FAMILY MEMBER", relation:"Relationship", tamilName:"Tamil name", gender:"Gender", born:"Born", died:"Died", notes:"Notes", close:"Close" };
    $("#person-details-eyebrow").textContent = labels.eyebrow;
    $("#person-details-title").textContent = person.full_name;
    $("#person-details-close").setAttribute("aria-label", labels.close);
    $("#person-details-close-footer").textContent = labels.close;
    $("#person-detail-relation-label").textContent = labels.relation;
    $("#person-detail-tamil-label").textContent = labels.tamilName;
    $("#person-detail-gender-label").textContent = labels.gender;
    $("#person-detail-born-label").textContent = labels.born;
    $("#person-detail-died-label").textContent = labels.died;
    $("#person-detail-notes-label").textContent = labels.notes;

    const relation = relationshipLabelsForCurrentUser().get(person.id) || "";
    const gender = person.gender === "male"
      ? (state.language === "ta" ? "ஆண்" : "Male")
      : person.gender === "female"
        ? (state.language === "ta" ? "பெண்" : "Female")
        : person.gender === "other"
          ? (state.language === "ta" ? "மற்றவை" : "Other")
          : "";
    setPersonDetailRow("person-detail-relation-row", "person-detail-relation", relation);
    setPersonDetailRow("person-detail-tamil-row", "person-detail-tamil", person.tamil_name || "");
    setPersonDetailRow("person-detail-gender-row", "person-detail-gender", gender);
    const birthValue = person.birth_date_text || person.birth_date;
    const deathValue = person.death_date_text || person.death_date;
    setPersonDetailRow("person-detail-born-row", "person-detail-born", birthValue ? formatFamilyDate(birthValue) : "");
    setPersonDetailRow("person-detail-died-row", "person-detail-died",
      deathValue ? formatFamilyDate(deathValue) : isPersonDeceased(person) ? (state.language === "ta" ? "இறந்தவர்" : "Deceased") : "");
    setPersonDetailRow("person-detail-notes-row", "person-detail-notes", person.notes || "");
    modal.hidden = false;
    $("#person-details-close").focus();
  }

  function closePersonDetails() {
    const modal = $("#person-details-modal");
    if (modal) modal.hidden = true;
  }

  function closeRequestDialog() { $("#request-modal").hidden = true; $("#request-modal-body").innerHTML = ""; }

  function syncDeathDateField() {
    const checkbox = $("#person-deceased");
    const field = $("#death-date-field");
    if (!checkbox || !field) return;
    field.hidden = !checkbox.checked;
  }

  function renderEditorConnections() {
    const section = $("#person-connections-section");
    const root = $("#person-connections-list");
    const heading = $("#person-connections-heading");
    if (!section || !root || !heading) return;
    const personId = state.editingPersonId;
    if (!personId || !canEditPerson(state.people.find(person => person.id === personId))) {
      section.hidden = true;
      root.innerHTML = "";
      return;
    }

    section.hidden = false;
    heading.textContent = state.language === "ta" ? "இணைப்புகள்" : "Connections";
    const edges = state.relationships.filter(edge =>
      edge.person_id === personId || edge.related_person_id === personId
    );
    if (!edges.length) {
      root.innerHTML = '<p class="connections-empty">' +
        (state.language === "ta" ? "இன்னும் இணைப்புகள் இல்லை." : "No connections yet.") + '</p>';
      return;
    }
    root.innerHTML = edges.map(edge => {
      const otherId = edge.person_id === personId ? edge.related_person_id : edge.person_id;
      const other = state.people.find(person => person.id === otherId);
      if (!other) return "";
      let relation = "";
      if (edge.relationship_type === "spouse") {
        relation = state.language === "ta" ? "துணைவர் / துணைவி" : "Spouse / partner";
      } else if (edge.person_id === personId) {
        relation = state.language === "ta" ? "பிள்ளை" : "Child";
      } else {
        relation = state.language === "ta" ? "பெற்றோர்" : "Parent";
      }
      const removeLabel = (state.language === "ta" ? "இணைப்பை நீக்கு: " : "Remove connection: ") + other.full_name;
      return '<div class="person-connection-row"><div class="person-connection-description"><strong>' +
        escapeHtml(relation) + '</strong><span>' + escapeHtml(other.full_name) + '</span></div>' +
        '<button class="text-action" type="button" data-remove-relationship="' + escapeHtml(edge.id) +
        '" aria-label="' + escapeHtml(removeLabel) + '" title="' + escapeHtml(removeLabel) + '">' +
        (state.language === "ta" ? "நீக்கு" : "Remove") + '</button></div>';
    }).join("");
    $$("[data-remove-relationship]").forEach(button => {
      button.addEventListener("click", () => deleteRelationship(button.dataset.removeRelationship));
    });
  }

  function clearPersonForm() {
    state.editingPersonId = null;
    $("#person-form").reset();
    syncDeathDateField();
    syncCalendarFromText("person-birth", "person-birth-calendar");
    syncCalendarFromText("person-death", "person-death-calendar");
    $("#person-form-title").textContent = "Add a family member";
    $("#save-person-button").textContent = "Add family member";
    $("#cancel-edit-button").hidden = true;
    renderPersonConnectOptions();
    renderEditorConnections();
    if (state.activeTree) renderPeople();
  }

  function beginEditPerson(personId) {
    const person = state.people.find(item => item.id === personId);
    if (!person || !canEditPerson(person) || !state.activeTree) return;
    state.openPanels.clear();
    state.openPanels.add("add-person-panel");
    $("#add-person-panel").hidden = false;
    $("#member-management-panel").hidden = true;
    $("#linking-requests-panel").hidden = true;
    $("#toggle-add-person-panel").setAttribute("aria-expanded", "true");
    state.editingPersonId = personId;
    $("#person-name").value = person.full_name || "";
    $("#person-tamil").value = person.tamil_name || "";
    $("#person-gender").value = person.gender || "";
    $("#person-birth").value = formatDateEntry(person.birth_date_text || person.birth_date || "");
    syncCalendarFromText("person-birth", "person-birth-calendar");
    $("#person-deceased").checked = isPersonDeceased(person);
    $("#person-death").value = formatDateEntry(person.death_date_text || person.death_date || "");
    syncCalendarFromText("person-death", "person-death-calendar");
    syncDeathDateField();
    $("#person-notes").value = person.notes || "";
    $("#person-form-title").textContent = "Edit family member";
    $("#save-person-button").textContent = "Save changes";
    $("#cancel-edit-button").hidden = false;
    $("#add-person-panel").scrollIntoView({ behavior:"smooth", block:"start" });
    $("#person-name").focus();
    renderPersonConnectOptions();
    $("#connect-person").value = "";
    $("#connect-type").value = "";
    renderEditorConnections();
  }

  async function savePerson(event) {
    event.preventDefault();
    if (!state.activeTree || (state.editingPersonId ? !canEditPerson(state.people.find(person => person.id === state.editingPersonId)) : !canCreatePerson())) return;
    const data = collectPersonFormData();
    if (!data) return;
    const button = $("#save-person-button");
    setBusy(button, true, "Saving…");
    const wasEditing = Boolean(state.editingPersonId);
    let personId = state.editingPersonId;
    let error = null;
    if (personId) {
      const result = await db.from("uravu_people").update(data).eq("id", personId).eq("tree_id", state.activeTree.id).select("id").single();
      error = result.error;
    } else {
      const result = await db.from("uravu_people").insert({
        tree_id:state.activeTree.id, created_by:state.user.id, is_self_record:!isManager(), ...data
      }).select("id").single();
      error = result.error;
      personId = result.data?.id;
    }
    setBusy(button, false);
    if (error) { showDbError(error, "save family member"); return; }
    clearPersonForm();
    if (!wasEditing && !isManager()) await requestLinkToPerson(personId, "This is my newly created family record.");
    else toast(wasEditing ? "Family member updated." : "Family member added.");
    await loadWorkspace(state.activeTree.id, false);
  }

  async function addConnectionFromForm() {
    if (!state.activeTree || (state.editingPersonId ? !canEditPerson(state.people.find(person => person.id === state.editingPersonId)) : !canCreatePerson())) return;
    const connectedId = $("#connect-person").value || null;
    const relationshipType = $("#connect-type").value || null;
    if (!connectedId || !relationshipType) {
      toast("Choose both a family member and relationship to add a connection.", true);
      return;
    }
    if (connectedId === state.editingPersonId) {
      toast("A person cannot be connected to themselves.", true);
      return;
    }
    const data = collectPersonFormData();
    if (!data) return;

    const button = $("#add-connection-button");
    setBusy(button, true, "Adding connection…");
    const treeId = state.activeTree.id;
    let personId = state.editingPersonId;
    let error = null;

    // For a new entry, save it first so the relationship has a real record ID.
    if (personId) {
      const result = await db.from("uravu_people").update(data)
        .eq("id", personId).eq("tree_id", treeId).select("id").single();
      error = result.error;
    } else {
      const result = await db.from("uravu_people").insert({
        tree_id:treeId, created_by:state.user.id, is_self_record:!isManager(), ...data
      }).select("id").single();
      error = result.error;
      personId = result.data?.id;
      if (!error && personId) {
        state.editingPersonId = personId;
        $("#person-form-title").textContent = "Edit family member";
        $("#save-person-button").textContent = "Save changes";
        $("#cancel-edit-button").hidden = false;
      }
    }

    if (!error && personId) {
      const linked = await callRpc("uravu_link_people", {
        p_tree_id:treeId, p_person_id:personId,
        p_related_person_id:connectedId, p_relationship_type:relationshipType
      });
      error = linked.error;
    }
    setBusy(button, false);
    if (error) {
      showDbError(error, "add family connection");
      await loadWorkspace(treeId, false);
      return;
    }
    clearPersonForm();
    if (!isManager() && personId) await requestLinkToPerson(personId, "This is my newly created family record.");
    else toast("Family connection added.");
    await loadWorkspace(treeId, false);
  }

  async function deletePerson(personId) {
    const person = state.people.find(item => item.id === personId);
    if (!person || !canDeletePerson(person)) return;
    if (!window.confirm(translateUiValue("Delete " + person.full_name + " and their family connections? This cannot be undone."))) return;
    const { error } = await db.from("uravu_people").delete().eq("id", personId).eq("tree_id", state.activeTree.id);
    if (error) { showDbError(error, "delete person"); return; }
    toast("Family member and connections deleted.");
    await loadWorkspace(state.activeTree.id, false);
  }

  async function deleteRelationship(relationshipId) {
    const edge = state.relationships.find(item => item.id === relationshipId);
    const ownRecord = state.people.find(person => person.created_by === state.user?.id &&
      person.is_self_record && !linkedPersonIds().has(person.id));
    const canRemoveOwnEdge = Boolean(ownRecord && edge &&
      (edge.person_id === ownRecord.id || edge.related_person_id === ownRecord.id));
    if ((!isManager() && !canRemoveOwnEdge) || !edge) return;
    if (!window.confirm(state.language === "ta" ? "இந்தக் குடும்ப இணைப்பை நீக்கவா?" : "Remove this family connection?")) return;
    const { error } = await db.from("uravu_relationships").delete().eq("id", relationshipId).eq("tree_id", state.activeTree.id);
    if (error) { showDbError(error, "remove connection"); return; }
    toast(state.language === "ta" ? "குடும்ப உறவு இணைப்பு நீக்கப்பட்டது." : "Family connection removed.");
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
    $("#dashboard").classList.remove("tree-open");
    toast("Family tree deleted.");
    await refreshDashboard();
  }

  function applyLanguage() {
    document.documentElement.lang = state.language;
    document.title = state.language === "ta" ? "உறவு — குடும்ப மரம்" : "Uravu — Family tree";
    $("#language-button").textContent = state.language === "en" ? "தமிழ்" : "English";
    $("#language-button").setAttribute("aria-label", state.language === "ta" ? "மொழியை மாற்று" : "Change language");
    localizeDom(document.body);
    syncEditModeButton();
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
    $("#toggle-add-person-panel").addEventListener("click", () => togglePanel("add-person-panel"));
    $("#toggle-edit-mode").addEventListener("click", () => {
      state.editMode = !state.editMode;
      syncEditModeButton();
      renderPeople();
    });
    $("#toggle-member-list-panel").addEventListener("click", () => togglePanel("member-management-panel"));
    $("#toggle-linking-requests-panel").addEventListener("click", () => togglePanel("linking-requests-panel"));
    Array.from(document.querySelectorAll("[data-close-panel]")).forEach(button => button.addEventListener("click", () => closePanel(button.dataset.closePanel)));
    $("#link-existing-form").addEventListener("submit", async event => {
      event.preventDefault();
      const personId = $("#request-person").value;
      if (!personId) {
        toast(state.language === "ta" ? "குடும்பப் பதிவைத் தேர்ந்தெடுக்கவும்." : "Select a family record to link.", true);
        return;
      }
      const button = $("#request-existing-link-button");
      setBusy(button, true, "Sending…");
      const result = await requestLinkToPerson(personId, "Please confirm that this is my family record.");
      setBusy(button, false);
      if (!result.error && state.activeTree) await loadWorkspace(state.activeTree.id, false);
    });
    $("#people-search").addEventListener("input", renderPeople);
    $("#person-form").addEventListener("submit", savePerson);
    $("#add-connection-button").addEventListener("click", addConnectionFromForm);
    $("#person-deceased").addEventListener("change", syncDeathDateField);
    $("#person-birth").addEventListener("input", () => syncCalendarFromText("person-birth", "person-birth-calendar"));
    $("#person-birth-calendar").addEventListener("change", () => syncTextFromCalendar("person-birth-calendar", "person-birth"));
    $("#person-death").addEventListener("input", () => syncCalendarFromText("person-death", "person-death-calendar"));
    $("#person-death-calendar").addEventListener("change", () => syncTextFromCalendar("person-death-calendar", "person-death"));
    $("#cancel-edit-button").addEventListener("click", clearPersonForm);
    syncDeathDateField();
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
    $("#person-details-close").addEventListener("click", closePersonDetails);
    $("#person-details-close-footer").addEventListener("click", closePersonDetails);
    $("#person-details-modal").addEventListener("click", event => {
      if (event.target.id === "person-details-modal") closePersonDetails();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closePersonDetails();
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
