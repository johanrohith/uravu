/* Uravu PWA starter — demo data only. Production auth, database access and role enforcement must be server-side. */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const translations = {
  en: {
    prototype:'Prototype',duplicateLikely:'A likely duplicate was found; opened the existing entry.',possibleDuplicate:'A person with the same name may already exist:',addAnyway:'Add as a separate person anyway?',members:'Approved members',workspace:'YOUR FAMILY WORKSPACE',familyTree:'Family tree',headingSubtitle:'Every generation, connected.',requests:'Requests',addPerson:'Add person',searchPlaceholder:'Search names or relationship...',fit:'Fit',collapse:'Collapse',export:'Export',johanFamily:"Your family",peopleAcross:'people across',generations:'generations',noResults:'No matching family members',tryAnother:'Try another name or relationship.',yourEntry:'Your entry',living:'Living',deceased:'Deceased',selectedPerson:'SELECTED PERSON',personDetails:'Person details',relationshipLookup:'Relationship lookup',relationshipLookupSub:'Names are calculated from family connections.',findYourRelation:'How are you related to',viewRelation:'View relation',recentActivity:'Recent activity',recentActivitySub:'A simple history of tree changes.',prototypeNote:'No family data is shown yet. Sign in with Google; shared family-tree storage is not connected yet.',profile:'Profile',relationship:'Relationship to you',status:'Status',born:'Born',died:'Died',contact:'Contact',place:'Hometown',about:'About',familyLinks:'Family connections',parents:'Parents',spouses:'Spouse',children:'Children',editDetails:'Edit details',suggestCorrection:'Suggest correction',role:'Member role',owner:'Owner',admin:'Admin',member:'Member',viewer:'Viewer',livingStatus:'Living',deceasedStatus:'Deceased',notProvided:'Not provided',private:'Private',familyOnly:'Tree members',visibleToAll:'All tree members',editPerson:'Edit person',addNewPerson:'Add a family member',connectTo:'Connect this person to',connectionType:'Connection type',parentOf:'Parent of selected person',childOf:'Child of selected person',partnerOf:'Spouse of selected person',nameEnglish:'Name in English',nameTamil:'Name in Tamil',gender:'Gender (optional)',male:'Male',female:'Female',other:'Other / unspecified',birthDate:'Date of birth (optional)',deathDate:'Date of death (optional)',approximate:'Date is approximate',livingField:'This person is living',phone:'Phone number (optional)',email:'Email (optional)',hometown:'Hometown (optional)',birthPlace:'Place of birth (optional)',currentCity:'Current city (optional)',siblingOrderField:'Order among siblings (optional)',occupation:'Occupation (optional)',aboutPerson:'Short note (optional)',detailsVisibility:'Profile details visible to',saveChanges:'Save changes',cancel:'Cancel',savePerson:'Add person',deletePerson:'Delete person',confirmDelete:'Delete this person and their connections?',corrections:'Correction requests',joinRequests:'Join requests',pending:'Pending',approve:'Approve',reject:'Reject',approveAs:'Approve as',requestJoinText:'wants to join this family tree.',requestLinkText:'asked to link their account to a family entry.',noRequests:'There are no pending requests.',requestSubmitted:'Correction request added for the owner/admin to review.',requestApproved:'Request approved.',requestRejected:'Request rejected.',entryLinked:'Account link is part of the prototype flow.',settings:'Settings',language:'Language',privacy:'Profile visibility defaults',phonePrivacy:'Contact information is visible only to people allowed by the profile settings.',notifications:'Notifications',notificationsText:'Join requests, link requests and correction decisions appear here in the prototype.',close:'Close',treeActions:'Tree actions',expandAll:'Expand all branches',collapseAll:'Collapse all branches',fitTree:'Fit tree to view',exportDone:'Tree exported as an SVG file.',saved:'Saved in this prototype only.',added:'Family member added.',deleted:'Family member deleted.',cannotDeleteSelf:'Your own linked entry cannot be deleted here.',linkedEntry:'Linked to your account',unlinkedEntry:'No account linked',searchResults:'Search result',toYou:'To you',toThem:'You are to them',youAre:'You',notConnected:'No relationship path found in this tree.',directFamily:'Biological / legal family connection',relationshipPath:'Relationship path',activityAdded:'added a family member',activityEdited:'updated profile details',activityApproved:'approved a request',activityCorrection:'submitted a correction request',justNow:'Just now',minutesAgo:'minutes ago',minutesAgoPlural:'minutes ago',changeRole:'Change role',roleOwnerNote:'Only the owner can appoint or remove administrators.',permissions:'Permissions',permissionNote:'Owner and admins can maintain tree connections. A member can edit their own linked entry. Viewers can view permitted details only.',accountManagement:'Membership',visibility:'Visibility',personNotFound:'Person not found.',correctedField:'What needs correcting?',correctionPlaceholder:'Describe the suggested correction...',submitRequest:'Submit request',profileVisibility:'Profile visibility',treeVisibility:'Tree information',confidential:'Private by default',requestType:'Request type',linkPerson:'Link to an existing person',joinTree:'Join this tree',pendingStatus:'Awaiting review',roleSaved:'Member role updated.',languageSaved:'Language updated.',unknown:'Unknown',exportTitle:'Uravu family tree',familyName:'Your family',noContact:'No contact details added.',femaleRelationNote:'Relationship terms are generated from the family structure and available details.',delete:'Delete',none:'None',helpText:'Optional fields can be left blank.',generation:'generation',generationsPlural:'generations',requestTitleJoin:'Family tree access',requestTitleLink:'Link a person entry',entryClaimed:'This entry is already linked to an account.',assignMember:'Assign role',memberCanEdit:'Members can edit the details of the person entry linked to their account.',privacyInfo:'Contact details and personal notes are restricted by profile visibility.',searchRelationHint:'Try “மாமா”, “uncle”, “அக்கா”, or a name.',openProfile:'Open profile',selectPerson:'Select a person',approx:'Approx.',birthPlace:'Birthplace',currentCity:'Current city',genderNotSet:'Not specified',notLinked:'No linked account',relationUnavailable:'Relationship not available',noRelation:'Not related through a known path',exportFallback:'If your device asks, choose Save to Files.',correct:'Correct',unknownDate:'Unknown / approximate date',publicVisibility:'All members',adminOnly:'Owner and admins',memberAndAdmins:'This member, owner and admins',editOwnOnly:'You can edit this entry because it is linked to your account.',notOwnEntry:'Only the linked member can edit their own profile details.',profileUpdated:'Profile details updated.',connectionAdded:'Connection added.',branchExpand:'Expand / collapse descendants',roleChanged:'Role changed to',requestReviewed:'Request reviewed.',treeFull:'Family tree',optional:'Optional',ageOrder:'Sibling birth order',older:'Older',younger:'Younger',first:'First / oldest',second:'Second',third:'Third',fourth:'Fourth',fifth:'Fifth',visibilityRestricted:'Restricted',makeCorrection:'Suggest an update for this person',chooseRole:'Choose a role',setLanguage:'Choose interface language',english:'English',tamil:'தமிழ்',joinPersonTitle:'Member assignment',linkedTo:'Linked person entry',assignEntry:'Link person entry (optional)',requestRole:'Initial role',assignRoleHelp:'New joiners start as Viewers. The owner can appoint admins. Members can edit only the person entry linked to their account.',approveJoin:'Approve as Viewer',link:'Link entry',profilePhoto:'Profile photo URL (optional)',nameRequired:'Enter at least one name in English or Tamil.',pickConnection:'Choose a family connection.',familyNameSubtitle:'Connected across generations',notSet:'Not set',requestRoleTitle:'Role assignments',noActivity:'No activity yet.',partner:'Spouse / partner',father:'Father',mother:'Mother',son:'Son',daughter:'Daughter',grandfather:'Grandfather',grandmother:'Grandmother',greatGrandfather:'Great-grandfather',greatGrandmother:'Great-grandmother',elderBrother:'Elder brother',youngerBrother:'Younger brother',elderSister:'Elder sister',youngerSister:'Younger sister',uncle:'Uncle',aunt:'Aunt',paternalUncleElder:'Father’s elder brother',paternalUncleYounger:'Father’s younger brother',paternalAunt:'Father’s sister',maternalUncle:'Mother’s brother',maternalAuntElder:'Mother’s elder sister',maternalAuntYounger:'Mother’s younger sister',cousin:'Cousin',maleCousin:'Male cousin',femaleCousin:'Female cousin',nieceNephew:'Niece / nephew',inLaw:'In-law',brotherInLaw:'Brother-in-law',sisterInLaw:'Sister-in-law',grandchild:'Grandchild',greatGrandchild:'Great-grandchild',relative:'Relative',spouse:'Spouse',paternalSide:'Paternal side',maternalSide:'Maternal side',fatherSide:'Father’s side',motherSide:'Mother’s side',partnerLabel:'Partner',parentLabel:'Parent',childLabel:'Child'
  },
  ta: {
    prototype:'முன்மாதிரி',duplicateLikely:'இதே நபராக இருக்கலாம்; ஏற்கனவே உள்ள பதிவைத் திறந்துள்ளோம்.',possibleDuplicate:'இதே பெயரில் ஏற்கனவே ஒருவர் இருக்கலாம்:',addAnyway:'தனியான நபராக இருந்தால் தொடரவும்?',members:'ஏற்கப்பட்ட உறுப்பினர்கள்',workspace:'உங்கள் குடும்பப் பகுதி',familyTree:'குடும்ப மரம்',headingSubtitle:'தலைமுறைகளை இணைக்கும் உறவுகள்.',requests:'கோரிக்கைகள்',addPerson:'உறவைச் சேர்',searchPlaceholder:'பெயர் அல்லது உறவுமுறையைத் தேடு...',fit:'பொருத்து',collapse:'சுருக்கு',export:'ஏற்றுமதி',johanFamily:'உங்கள் குடும்பம்',peopleAcross:'உறவுகள் ·',generations:'தலைமுறைகள்',noResults:'பொருந்தும் உறவுகள் இல்லை',tryAnother:'வேறு பெயர் அல்லது உறவுமுறையைத் தேடுங்கள்.',yourEntry:'உங்கள் பதிவு',living:'உயிருடன்',deceased:'மறைந்தவர்',selectedPerson:'தேர்ந்தெடுக்கப்பட்டவர்',personDetails:'உறவினர் விவரங்கள்',relationshipLookup:'உறவுமுறை தேடல்',relationshipLookupSub:'குடும்ப இணைப்புகளிலிருந்து உறவுமுறை கணக்கிடப்படும்.',findYourRelation:'உங்களுக்கு என்ன உறவு?',viewRelation:'உறவைக் காண்',recentActivity:'சமீபத்திய செயல்கள்',recentActivitySub:'குடும்ப மரத்தில் செய்யப்பட்ட மாற்றங்கள்.',prototypeNote:'மாதிரி குடும்பத் தரவுடன் இயங்கும் முன்மாதிரி. வெளியிடுவதற்கு முன் தொலைபேசி OTP, பகிரப்பட்ட தரவுத்தளம் மற்றும் சர்வர் அனுமதிகள் இணைக்கப்பட வேண்டும்.',profile:'சுயவிவரம்',relationship:'உங்களுக்கான உறவு',status:'நிலை',born:'பிறந்த தேதி',died:'இறந்த தேதி',contact:'தொடர்பு',place:'ஊர்',about:'குறிப்பு',familyLinks:'குடும்ப இணைப்புகள்',parents:'பெற்றோர்',spouses:'வாழ்க்கைத்துணைவர்',children:'பிள்ளைகள்',editDetails:'விவரங்களைத் திருத்து',suggestCorrection:'திருத்தத்தைப் பரிந்துரை',role:'உறுப்பினர் பங்கு',owner:'உரிமையாளர்',admin:'நிர்வாகி',member:'உறுப்பினர்',viewer:'பார்வையாளர்',livingStatus:'உயிருடன்',deceasedStatus:'மறைந்தவர்',notProvided:'வழங்கப்படவில்லை',private:'தனிப்பட்டது',familyOnly:'குடும்ப உறுப்பினர்கள்',visibleToAll:'அனைத்து குடும்ப உறுப்பினர்கள்',editPerson:'உறவினர் விவரங்களைத் திருத்து',addNewPerson:'குடும்ப உறுப்பினரைச் சேர்',connectTo:'இந்த நபரை இணைக்கவும்',connectionType:'உறவு இணைப்பு',parentOf:'தேர்ந்தெடுத்தவரின் பெற்றோர்',childOf:'தேர்ந்தெடுத்தவரின் பிள்ளை',partnerOf:'தேர்ந்தெடுத்தவரின் வாழ்க்கைத்துணைவர்',nameEnglish:'ஆங்கிலப் பெயர்',nameTamil:'தமிழ்ப் பெயர்',gender:'பாலினம் (விருப்பம்)',male:'ஆண்',female:'பெண்',other:'குறிப்பிட வேண்டாம்',birthDate:'பிறந்த தேதி (விருப்பம்)',deathDate:'இறந்த தேதி (விருப்பம்)',approximate:'தேதி தோராயமானது',livingField:'இந்த நபர் உயிருடன் உள்ளார்',phone:'தொலைபேசி எண் (விருப்பம்)',email:'மின்னஞ்சல் (விருப்பம்)',hometown:'சொந்த ஊர் (விருப்பம்)',birthPlace:'பிறந்த இடம் (விருப்பம்)',currentCity:'தற்போதைய நகரம் (விருப்பம்)',siblingOrderField:'உடன்பிறப்புகளில் வரிசை (விருப்பம்)',occupation:'தொழில் (விருப்பம்)',aboutPerson:'சிறு குறிப்பு (விருப்பம்)',detailsVisibility:'விவரங்களைக் காணக்கூடியவர்கள்',saveChanges:'மாற்றங்களைச் சேமி',cancel:'ரத்து செய்',savePerson:'உறவைச் சேர்',deletePerson:'உறவை நீக்கு',confirmDelete:'இந்த மாதிரி குடும்ப மரத்திலிருந்து இந்த நபரையும் அவரின் இணைப்புகளையும் நீக்கவா?',corrections:'திருத்தக் கோரிக்கைகள்',joinRequests:'சேரும் கோரிக்கைகள்',pending:'நிலுவையில்',approve:'ஏற்கவும்',reject:'நிராகரி',approveAs:'இந்தப் பங்கில் ஏற்கவும்',requestJoinText:'இந்தக் குடும்ப மரத்தில் இணைய விரும்புகிறார்.',requestLinkText:'தனது கணக்கை குடும்ப உறுப்பினர் பதிவுடன் இணைக்கக் கோரியுள்ளார்.',noRequests:'நிலுவையில் கோரிக்கைகள் இல்லை.',requestSubmitted:'நிர்வாகி அல்லது உரிமையாளர் பார்க்க திருத்தக் கோரிக்கை சேர்க்கப்பட்டது.',requestApproved:'கோரிக்கை ஏற்கப்பட்டது.',requestRejected:'கோரிக்கை நிராகரிக்கப்பட்டது.',entryLinked:'கணக்கு இணைப்பு இந்த முன்மாதிரியில் மட்டும் காட்டப்படுகிறது.',settings:'அமைப்புகள்',language:'மொழி',privacy:'விவரங்களின் இயல்புநிலைத் தனியுரிமை',phonePrivacy:'தொலைபேசி மற்றும் தொடர்பு விவரங்கள் அனுமதிக்கப்பட்டவர்களுக்கு மட்டுமே தெரியும்.',notifications:'அறிவிப்புகள்',notificationsText:'சேருதல், இணைத்தல் மற்றும் திருத்த முடிவுகள் இந்த முன்மாதிரியில் இங்கு காணப்படும்.',close:'மூடு',treeActions:'குடும்ப மர செயல்கள்',expandAll:'அனைத்துக் கிளைகளையும் விரி',collapseAll:'அனைத்துக் கிளைகளையும் சுருக்கு',fitTree:'முழு மரத்தையும் காட்டு',exportDone:'குடும்ப மரம் SVG கோப்பாக ஏற்றுமதி செய்யப்பட்டது.',saved:'இந்த முன்மாதிரியில் மட்டும் சேமிக்கப்பட்டது.',added:'குடும்ப உறுப்பினர் சேர்க்கப்பட்டார்.',deleted:'குடும்ப உறுப்பினர் நீக்கப்பட்டார்.',cannotDeleteSelf:'உங்கள் சொந்த பதிவை இங்கே நீக்க முடியாது.',roleSaved:'உறுப்பினர் பங்கு மாற்றப்பட்டது.',languageSaved:'மொழி மாற்றப்பட்டது.',unknown:'தெரியவில்லை',exportTitle:'உறவு குடும்ப மரம்',familyName:'உங்கள் குடும்பம்',noContact:'தொடர்பு விவரங்கள் சேர்க்கப்படவில்லை.',femaleRelationNote:'குடும்ப இணைப்புகள் மற்றும் கிடைக்கும் விவரங்களின் அடிப்படையில் உறவுமுறை கணக்கிடப்படும்.',delete:'நீக்கு',none:'இல்லை',helpText:'விருப்பத் தகவல்களை காலியாக விடலாம்.',generation:'தலைமுறை',generationsPlural:'தலைமுறைகள்',requestTitleJoin:'குடும்ப மர அணுகல்',requestTitleLink:'ஒருவரின் பதிவை இணை',entryClaimed:'இந்தப் பதிவு ஏற்கனவே ஒரு கணக்குடன் இணைக்கப்பட்டுள்ளது.',assignMember:'பங்கை ஒதுக்கு',memberCanEdit:'தங்கள் கணக்குடன் இணைக்கப்பட்ட நபரின் விவரங்களை உறுப்பினர்கள் திருத்தலாம்.',privacyInfo:'தொடர்பு விவரங்கள் மற்றும் தனிப்பட்ட குறிப்புகள் அனுமதிகளால் கட்டுப்படுத்தப்படும்.',searchRelationHint:'“மாமா”, “uncle”, “அக்கா” அல்லது பெயரைத் தேடுங்கள்.',openProfile:'சுயவிவரத்தைத் திற',selectPerson:'ஒரு நபரைத் தேர்ந்தெடுக்கவும்',approx:'தோராயம்',birthPlace:'பிறந்த இடம்',currentCity:'தற்போதைய நகரம்',genderNotSet:'குறிப்பிடப்படவில்லை',notLinked:'கணக்கு இணைக்கப்படவில்லை',relationUnavailable:'உறவு கணக்கிட முடியவில்லை',noRelation:'இந்த மரத்தில் உறவுப் பாதை இல்லை',directFamily:'உயிரியல் / சட்டப்பூர்வ குடும்ப உறவு',relationshipPath:'உறவுப் பாதை',activityAdded:'குடும்ப உறுப்பினரைச் சேர்த்தார்',activityEdited:'விவரங்களை மாற்றினார்',activityApproved:'கோரிக்கையை ஏற்றார்',activityCorrection:'திருத்தக் கோரிக்கையைச் சமர்ப்பித்தார்',justNow:'இப்போது',minutesAgo:'நிமிடங்களுக்கு முன்',minutesAgoPlural:'நிமிடங்களுக்கு முன்',changeRole:'பங்கை மாற்று',roleOwnerNote:'நிர்வாகிகளை நியமிக்க அல்லது நீக்க உரிமையாளருக்கு மட்டுமே அனுமதி.',permissions:'அனுமதிகள்',permissionNote:'உரிமையாளர் மற்றும் நிர்வாகிகள் குடும்ப இணைப்புகளை பராமரிக்கலாம். உறுப்பினர் தங்களுடன் இணைக்கப்பட்ட பதிவைத் திருத்தலாம். பார்வையாளர்கள் அனுமதிக்கப்பட்ட விவரங்களை மட்டுமே பார்க்கலாம்.',visibility:'தெரிவுத்தன்மை',profileVisibility:'விவரத் தெரிவுத்தன்மை',confidential:'இயல்பாக தனிப்பட்டது',requestType:'கோரிக்கை வகை',linkPerson:'ஏற்கனவே உள்ள பதிவை இணை',joinTree:'இந்தக் குடும்ப மரத்தில் சேர்',pendingStatus:'மதிப்பாய்வுக்காக காத்திருக்கிறது',roleChanged:'பங்கு மாற்றப்பட்டது:',requestReviewed:'கோரிக்கை பரிசீலிக்கப்பட்டது.',treeFull:'குடும்ப மரம்',optional:'விருப்பம்',partner:'துணைவர்',father:'அப்பா',mother:'அம்மா',son:'மகன்',daughter:'மகள்',grandfather:'தாத்தா',grandmother:'பாட்டி',greatGrandfather:'பூட்டன் / கொள்ளுத் தாத்தா',greatGrandmother:'பூட்டி / கொள்ளுப் பாட்டி',elderBrother:'அண்ணன்',youngerBrother:'தம்பி',elderSister:'அக்கா',youngerSister:'தங்கை',uncle:'மாமா / சித்தப்பா / பெரியப்பா',aunt:'அத்தை / சித்தி / பெரியம்மா',paternalUncleElder:'அப்பாவின் அண்ணன்',paternalUncleYounger:'அப்பாவின் தம்பி',paternalAunt:'அப்பாவின் சகோதரி',maternalUncle:'அம்மாவின் சகோதரர்',maternalAuntElder:'அம்மாவின் அக்கா',maternalAuntYounger:'அம்மாவின் தங்கை',cousin:'உடன்பிறப்புச் சார்ந்த / மாமன்-அத்தை வழி உறவு',maleCousin:'ஆண் உறவுச் சகோதரர்',femaleCousin:'பெண் உறவுச் சகோதரி',nieceNephew:'மருமகள் / மருமகன்',inLaw:'திருமண உறவு',brotherInLaw:'மச்சான்',sisterInLaw:'மச்சினி',grandchild:'பேரன் / பேத்தி',greatGrandchild:'கொள்ளுப் பேரன் / கொள்ளுப் பேத்தி',relative:'உறவினர்',spouse:'துணைவர்',paternalSide:'தந்தை வழி',maternalSide:'தாய் வழி',fatherSide:'அப்பா வழி',motherSide:'அம்மா வழி',partnerLabel:'துணைவர்',parentLabel:'பெற்றோர்',childLabel:'பிள்ளை'
  }
};

// Relationship graph is modelled only with parent-child and spouse connections.
// Kinship terms are calculated from paths, gender, and sibling order; they are never stored per pair.
let people = [];
let language = 'en';
try { language = localStorage.getItem('uravu-language') || 'en'; } catch (_) {}
let selectedId = null;
let sessionUserId = null;
let requests = [];
let activities = [];
let collapsed = new Set();
let zoom = .84;
let pan = {x:0,y:0};
let dragState = null;
let detailsDefaults = {phone:'members',email:'members',hometown:'members',occupation:'members',about:'members'};

function t(key){return (translations[language] && translations[language][key]) || translations.en[key] || key;}
function person(id){return people.find(p=>p.id===id);}
function displayName(p){if(!p)return '';return language==='ta'?(p.ta||p.en):(p.en||p.ta);}
function secondaryName(p){if(!p)return '';const other=language==='ta'?p.en:p.ta;return other&&other!==displayName(p)?other:'';}
function shortName(p){return displayName(p).trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase();}
function isAdmin(){const p=person(sessionUserId);return !!p && ['owner','admin'].includes(p.role);}
function isOwner(){return person(sessionUserId)?.role==='owner';}
function canEditAny(){return isAdmin();}
function canEditSelected(p){return canEditAny() || (p && p.id===sessionUserId && p.accountLinked && p.role==='member');}
function safe(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function dateValue(p, key){if(!p?.[key])return '';return p[key];}
function dateDisplay(p,key){if(!p?.[key])return t('notProvided');if(p[`${key}Approx`])return `${t('approx')} ${p[key]}`;return p[key];}
function parentsOf(id){const p=person(id);return (p?.parents||[]).map(person).filter(Boolean);}
function childrenOf(id){return people.filter(p=>(p.parents||[]).includes(id));}
function partnersOf(id){const p=person(id);return (p?.partners||[]).map(person).filter(Boolean);}
function commonParents(a,b){const pa=person(a)?.parents||[],pb=person(b)?.parents||[];return pa.filter(id=>pb.includes(id));}
function arePartners(a,b){return (person(a)?.partners||[]).includes(b)||(person(b)?.partners||[]).includes(a);}
function ancestorsOf(id){let result=[],seen=new Set(),queue=[{id,depth:0}];while(queue.length){const cur=queue.shift();for(const pid of person(cur.id)?.parents||[]){if(!seen.has(pid)){seen.add(pid);result.push({id:pid,depth:cur.depth+1});queue.push({id:pid,depth:cur.depth+1});}}}return result;}
function descendantIds(id){const out=new Set(),q=[id];while(q.length){const curr=q.shift();for(const child of childrenOf(curr)){if(!out.has(child.id)){out.add(child.id);q.push(child.id);}}}return out;}
function pathBetween(start,end){if(start===end)return [start];const ids=people.map(p=>p.id),q=[[start]],seen=new Set([start]);while(q.length){const path=q.shift(),last=path[path.length-1];if(last===end)return path;const neighbours=new Set([...(person(last)?.parents||[]),...childrenOf(last).map(p=>p.id),...(person(last)?.partners||[])]);for(const next of neighbours){if(!seen.has(next)&&ids.includes(next)){seen.add(next);q.push([...path,next]);}}}return null;}
function siblingRank(id, parentId){
  const siblings=people.filter(p=>(p.parents||[]).includes(parentId));
  siblings.sort((a,b)=>{
    const ad=a.birth?new Date(a.birth).getTime():0,bd=b.birth?new Date(b.birth).getTime():0;
    if(ad&&bd&&ad!==bd)return ad-bd;
    return (a.siblingOrder||99)-(b.siblingOrder||99);
  });
  return siblings.findIndex(p=>p.id===id);
}
function relationResult(fromId,toId,allowPartnerInference=true){
  // Relationship labels are derived from graph edges, never assigned per person pair.
  if(fromId===toId)return {en:'You',ta:'நீங்கள்',path:[fromId],kind:'self'};
  const from=person(fromId),to=person(toId);if(!from||!to)return null;
  const path=pathBetween(fromId,toId);if(!path)return null;
  const fromParents=parentsOf(fromId),toParents=parentsOf(toId);
  if(toParents.some(p=>p.id===fromId))return {en:to.gender==='m'?'Son':to.gender==='f'?'Daughter':'Child',ta:to.gender==='m'?'மகன்':to.gender==='f'?'மகள்':'பிள்ளை',kind:'child',path};
  if(fromParents.some(p=>p.id===toId))return {en:to.gender==='m'?'Father':to.gender==='f'?'Mother':'Parent',ta:to.gender==='m'?'அப்பா':to.gender==='f'?'அம்மா':'பெற்றோர்',kind:'parent',path};
  if(arePartners(fromId,toId))return {en:to.gender==='m'?'Husband':to.gender==='f'?'Wife':'Spouse',ta:'துணைவர்',kind:'spouse',path};
  const sharedDirect=commonParents(fromId,toId);
  if(sharedDirect.length){
    const older=compareAge(to,from)<0;
    return {en:to.gender==='m'?(older?'Elder brother':'Younger brother'):(older?'Elder sister':'Younger sister'),ta:to.gender==='m'?(older?'அண்ணன்':'தம்பி'):(older?'அக்கா':'தங்கை'),kind:'sibling',path};
  }
  // Ancestors and descendants.
  const toAncestors=ancestorsOf(toId),fromAncestors=ancestorsOf(fromId);
  const toIsAncestor=fromAncestors.find(a=>a.id===toId);if(toIsAncestor)return ancestorLabel(to,toIsAncestor.depth,path);
  const toIsDescendant=toAncestors.find(a=>a.id===fromId);if(toIsDescendant)return descendantLabel(to,toIsDescendant.depth,path);

  // Aunts and uncles: if `to` is a sibling of one of `from`'s parents, side + gender + age order set the term.
  for(const parent of fromParents){
    if(!commonParents(parent.id,toId).length)continue;
    const older=compareAge(to,parent)<0;
    if(parent.gender==='m'){
      if(to.gender==='m')return {en:older?'Father’s elder brother':'Father’s younger brother',ta:older?'பெரியப்பா':'சித்தப்பா',kind:older?'paternal-uncle-elder':'paternal-uncle-younger',path};
      if(to.gender==='f')return {en:'Father’s sister',ta:'அத்தை',kind:'paternal-aunt',path};
    } else if(parent.gender==='f'){
      if(to.gender==='m')return {en:'Mother’s brother',ta:'மாமா',kind:'maternal-uncle',path};
      if(to.gender==='f')return {en:older?'Mother’s elder sister':'Mother’s younger sister',ta:older?'பெரியம்மா':'சித்தி',kind:older?'maternal-aunt-elder':'maternal-aunt-younger',path};
    }
  }

  // Spouses of parents' siblings retain a relationship derived through their spouse.
  if(allowPartnerInference) for(const partnerId of to.partners||[]){
    const partnerRelation=relationResult(fromId,partnerId,false);
    if(!partnerRelation)continue;
    if(partnerRelation.kind==='paternal-uncle-elder')return {en:'Wife of father’s elder brother',ta:'பெரியம்மா',kind:'paternal-uncle-spouse',path};
    if(partnerRelation.kind==='paternal-uncle-younger')return {en:'Wife of father’s younger brother',ta:'சித்தி',kind:'paternal-uncle-spouse',path};
    if(partnerRelation.kind==='paternal-aunt')return {en:'Father’s sister’s husband',ta:'மாமா',kind:'paternal-aunt-spouse',path};
    if(partnerRelation.kind==='maternal-uncle')return {en:'Mother’s brother’s wife',ta:'மாமி',kind:'maternal-uncle-spouse',path};
    if(partnerRelation.kind==='maternal-aunt-elder')return {en:'Mother’s elder sister’s husband',ta:'மாமா',kind:'maternal-aunt-spouse',path};
    if(partnerRelation.kind==='maternal-aunt-younger')return {en:'Mother’s younger sister’s husband',ta:'மாமா',kind:'maternal-aunt-spouse',path};
  }

  // A person whose parent is your sibling is a niece or nephew.
  for(const theirParent of toParents){
    if(commonParents(fromId,theirParent.id).length){
      return {en:to.gender==='m'?'Nephew':'Niece',ta:to.gender==='m'?'மருமகன்':'மருமகள்',kind:'niece-nephew',path};
    }
  }

  // Cousins: their parents are siblings. Parallel cousins are commonly addressed as siblings;
  // cross-cousins may use மச்சான் / மச்சினி in the appropriate branch. Family-specific variants can override.
  for(const parentA of fromParents){
    for(const parentB of toParents){
      if(!commonParents(parentA.id,parentB.id).length)continue;
      const cross=parentA.gender!==parentB.gender;
      if(cross)return {en:to.gender==='m'?'Cross-cousin / machan':'Cross-cousin / machini',ta:to.gender==='m'?'மச்சான்':'மச்சினி',kind:'cross-cousin',path};
      const older=compareAge(to,from)<0;
      return {en:to.gender==='m'?(older?'Elder cousin (addressed as brother)':'Younger cousin (addressed as brother)'):(older?'Elder cousin (addressed as sister)':'Younger cousin (addressed as sister)'),ta:to.gender==='m'?(older?'அண்ணன்':'தம்பி'):(older?'அக்கா':'தங்கை'),kind:'parallel-cousin',path};
    }
  }

  // Find the closest common ancestor for more distant blood relationships.
  const fromAncestorDepth=new Map(fromAncestors.map(a=>[a.id,a.depth]));
  const shared=toAncestors.filter(a=>fromAncestorDepth.has(a.id)).sort((a,b)=>(a.depth+fromAncestorDepth.get(a.id))-(b.depth+fromAncestorDepth.get(b.id)))[0];
  if(shared){
    const fromDepth=fromAncestorDepth.get(shared.id),toDepth=shared.depth;
    if(fromDepth===2&&toDepth===2)return {en:to.gender==='m'?'Cousin (male)':'Cousin (female)',ta:to.gender==='m'?'உறவுச் சகோதரர்':'உறவுச் சகோதரி',kind:'cousin',path};
    return {en:'Extended relative',ta:'தொலை உறவினர்',kind:'extended-relative',path};
  }
  return {en:'Relative',ta:'உறவினர்',kind:'relative',path};
}
function compareAge(a,b){
  const ad=a?.birth?new Date(a.birth).getTime():NaN,bd=b?.birth?new Date(b.birth).getTime():NaN;
  if(Number.isFinite(ad)&&Number.isFinite(bd)&&ad!==bd)return ad-bd;
  return (a?.siblingOrder||99)-(b?.siblingOrder||99);
}
function ancestorLabel(p,depth,path){
  if(depth===1)return {en:p.gender==='m'?'Father':'Mother',ta:p.gender==='m'?'அப்பா':'அம்மா',kind:'parent',path};
  if(depth===2)return {en:p.gender==='m'?'Grandfather':'Grandmother',ta:p.gender==='m'?'தாத்தா':'பாட்டி',kind:'grandparent',path};
  if(depth===3)return {en:p.gender==='m'?'Great-grandfather':'Great-grandmother',ta:p.gender==='m'?'கொள்ளுத் தாத்தா':'கொள்ளுப் பாட்டி',kind:'great-grandparent',path};
  return {en:`${depth-1}× great-${p.gender==='m'?'grandfather':'grandmother'}`,ta:p.gender==='m'?'மூதாதையர்':'மூதாதையர்',kind:'ancestor',path};
}
function descendantLabel(p,depth,path){
  if(depth===1)return {en:p.gender==='m'?'Son':'Daughter',ta:p.gender==='m'?'மகன்':'மகள்',kind:'child',path};
  if(depth===2)return {en:p.gender==='m'?'Grandson':'Granddaughter',ta:p.gender==='m'?'பேரன்':'பேத்தி',kind:'grandchild',path};
  if(depth===3)return {en:p.gender==='m'?'Great-grandson':'Great-granddaughter',ta:p.gender==='m'?'கொள்ளுப் பேரன்':'கொள்ளுப் பேத்தி',kind:'great-grandchild',path};
  return {en:'Descendant',ta:'வழித்தோன்றல்',kind:'descendant',path};
}
function effectiveRelation(fromId,toId){return relationResult(fromId,toId);}
function relationAliases(rel){
  if(!rel)return '';
  const aliases={
    'paternal-uncle-elder':'uncle paternal uncle elder uncle பெரியப்பா',
    'paternal-uncle-younger':'uncle paternal uncle younger uncle சித்தப்பா',
    'paternal-aunt':'aunt paternal aunt அத்தை',
    'maternal-uncle':'uncle maternal uncle மாமா',
    'maternal-aunt-elder':'aunt maternal aunt elder பெரியம்மா',
    'maternal-aunt-younger':'aunt maternal aunt younger சித்தி',
    'paternal-uncle-spouse':'aunt uncle in-law பெரியம்மா சித்தி',
    'paternal-aunt-spouse':'uncle in-law மாமா',
    'maternal-uncle-spouse':'aunt in-law மாமி',
    'maternal-aunt-spouse':'uncle in-law மாமா',
    'cross-cousin':'cousin cross cousin machan machini மச்சான் மச்சினி',
    'parallel-cousin':'cousin parallel cousin அண்ணன் அக்கா தம்பி தங்கை',
    'sibling':'sibling brother sister அண்ணன் அக்கா தம்பி தங்கை',
    'grandparent':'grandparent grandfather grandmother தாத்தா பாட்டி',
    'great-grandparent':'great grandparent கொள்ளுத் தாத்தா கொள்ளுப் பாட்டி',
    'niece-nephew':'niece nephew மருமகன் மருமகள்'
  };
  return aliases[rel.kind]||'';
}
function allTextFor(p){const rel=effectiveRelation(sessionUserId,p.id);return [p.en,p.ta,rel?.en,rel?.ta,relationAliases(rel),p.status==='deceased'?t('deceasedStatus'):t('livingStatus')].filter(Boolean).join(' ').toLocaleLowerCase();}
function applyTranslations(){
  document.documentElement.lang=language;
  $$('[data-i18n]').forEach(el=>{const key=el.getAttribute('data-i18n');if(t(key))el.textContent=t(key);});
  $$('[data-i18n-placeholder]').forEach(el=>{const key=el.getAttribute('data-i18n-placeholder');el.placeholder=t(key);});
  $$('.lang-button').forEach(b=>{const active=b.dataset.lang===language;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  renderTree();renderProfile();renderLookupOptions();renderActivity();
}
function visiblePeopleSet(){
  const hidden=new Set();
  for(const id of collapsed){for(const childId of descendantIds(id))hidden.add(childId);}
  // Keep a person visible if it is independently selected or is an ancestor/partner of selected, except descendants hidden by collapse.
  return new Set(people.filter(p=>!hidden.has(p.id)).map(p=>p.id));
}
function renderTree(){
  const nodes=$('#tree-nodes'),svg=$('#tree-lines');nodes.innerHTML='';svg.innerHTML='';
  const visible=visiblePeopleSet();
  $('#people-count').textContent=people.length;
  const generations=estimateGenerations();$('#generation-count').textContent=generations;
  const query=$('#member-search').value.trim().toLocaleLowerCase();
  const matches=query?people.filter(p=>allTextFor(p).includes(query)):[];
  $('#empty-search').hidden=!(query&&matches.length===0);
  const matched=new Set(matches.map(p=>p.id));
  const nodeW=142,nodeH=74;
  // Spouse connectors
  const edgeSeen=new Set();
  people.forEach(p=>{
    if(!visible.has(p.id))return;
    (p.partners||[]).forEach(pid=>{
      if(!visible.has(pid))return;const other=person(pid);if(!other)return;const key=[p.id,pid].sort().join('|');if(edgeSeen.has(key))return;edgeSeen.add(key);
      const aX=p.x+nodeW/2,aY=p.y+nodeH/2,bX=other.x+nodeW/2,bY=other.y+nodeH/2;
      if(Math.abs(aY-bY)<25){svg.insertAdjacentHTML('beforeend',`<path class="partner-line" d="M ${Math.min(aX,bX)} ${aY} H ${Math.max(aX,bX)}"/>`);}
    });
  });
  // Parent-child connectors, with a short vertical-horizontal-vertical orthogonal path.
  people.forEach(child=>{
    if(!visible.has(child.id))return;
    const parents=(child.parents||[]).map(person).filter(p=>p&&visible.has(p.id));
    if(!parents.length)return;
    const cx=child.x+nodeW/2,cy=child.y;
    if(parents.length===1){const p=parents[0],px=p.x+nodeW/2,py=p.y+nodeH;const mid=py+(cy-py)*.5;svg.insertAdjacentHTML('beforeend',`<path d="M ${px} ${py} V ${mid} H ${cx} V ${cy}"/>`);}
    else{
      const pxs=parents.map(p=>p.x+nodeW/2),topY=Math.max(...parents.map(p=>p.y+nodeH)),midY=topY+Math.max(10,(cy-topY)*.5),minX=Math.min(...pxs),maxX=Math.max(...pxs);
      parents.forEach(p=>{const px=p.x+nodeW/2,py=p.y+nodeH;svg.insertAdjacentHTML('beforeend',`<path d="M ${px} ${py} V ${midY}"/>`);});
      svg.insertAdjacentHTML('beforeend',`<path d="M ${minX} ${midY} H ${maxX} M ${cx} ${midY} V ${cy}"/>`);
    }
  });
  people.forEach(p=>{
    if(!visible.has(p.id))return;
    const r=effectiveRelation(sessionUserId,p.id);const isMe=p.id===sessionUserId;
    const div=document.createElement('div');div.className='tree-node'+(isMe?' you':'')+(selectedId===p.id?' selected':'')+(matched.has(p.id)?' search-match':'');div.style.left=`${p.x}px`;div.style.top=`${p.y}px`;div.dataset.id=p.id;div.setAttribute('role','button');div.setAttribute('tabindex','0');div.setAttribute('aria-label',`${displayName(p)} — ${language==='ta'?r?.ta:r?.en}`);
    const avatarClass=p.gender==='f'?'female':p.gender==='m'?'':'other';
    div.innerHTML=`<span class="node-avatar ${avatarClass}">${safe(shortName(p))}</span><span class="node-main"><span class="node-name">${safe(displayName(p))}</span><span class="node-relation">${safe(language==='ta'?(r?.ta||t('relative')):(r?.en||t('relative')))}</span></span><i class="node-indicator ${p.status==='deceased'?'deceased':''}"></i>`;
    div.addEventListener('click',()=>selectPerson(p.id));div.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectPerson(p.id);}});
    const children=childrenOf(p.id);if(children.length){const btn=document.createElement('button');btn.className='node-expand';btn.title=t('branchExpand');btn.setAttribute('aria-label',t('branchExpand'));btn.innerHTML=`<svg viewBox="0 0 24 24"><path d="${collapsed.has(p.id)?'M12 5v14M5 12h14':'M5 12h14'}"/></svg>`;btn.addEventListener('click',e=>{e.stopPropagation();if(collapsed.has(p.id))collapsed.delete(p.id);else collapsed.add(p.id);renderTree();applyPanZoom();});div.append(btn);}
    nodes.append(div);
  });
  applyPanZoom();
}
function estimateGenerations(){const depths=new Map();const roots=people.filter(p=>!p.parents?.length).map(p=>p.id);roots.forEach(id=>depths.set(id,0));let changed=true;let it=0;while(changed&&it++<100){changed=false;people.forEach(p=>{if(p.parents?.length){const vals=p.parents.map(id=>depths.get(id)).filter(Number.isFinite);if(vals.length){const d=Math.max(...vals)+1;if(depths.get(p.id)!==d){depths.set(p.id,d);changed=true;}}}});}return (Math.max(0,...depths.values())+1)||1;}
function applyPanZoom(){const canvas=$('#tree-canvas');canvas.style.transform=`translate(${pan.x}px,${pan.y}px) scale(${zoom})`;$('#zoom-value').textContent=`${Math.round(zoom*100)}%`;}
function centerOn(id){const p=person(id);if(!p)return;const viewport=$('#tree-viewport');const nodeX=p.x+71,nodeY=p.y+37;pan.x=viewport.clientWidth/2-nodeX*zoom;pan.y=viewport.clientHeight/2-nodeY*zoom;applyPanZoom();}
function fitTree(){const viewport=$('#tree-viewport');if(!people.length){zoom=.84;pan={x:0,y:0};applyPanZoom();return;}const maxX=Math.max(...people.map(p=>p.x+142)),maxY=Math.max(...people.map(p=>p.y+74));zoom=Math.min(viewport.clientWidth/Math.max(1,maxX+20),viewport.clientHeight/Math.max(1,maxY+20),.95);zoom=Math.max(.4,zoom);pan.x=(viewport.clientWidth-(maxX*zoom))/2;pan.y=10;applyPanZoom();}
function selectPerson(id){selectedId=id;renderTree();renderProfile();if(window.matchMedia('(max-width: 820px)').matches)$('#side-panel').classList.add('mobile-open');}
function renderProfile(){
  const p=person(selectedId);const root=$('#profile-content');if(!p){root.innerHTML=`<div class="no-profile">${safe(t('personNotFound'))}</div>`;return;}
  const rel=effectiveRelation(sessionUserId,p.id);const isMe=p.id===sessionUserId;const name=displayName(p),secondary=secondaryName(p);const canEdit=canEditSelected(p);const ownerAdmin=canEditAny();
  const genderCls=p.gender==='f'?'female':p.gender==='m'?'':'other';
  const roleHtml=p.accountLinked?`<span class="pill">${safe(t(p.role||'member'))}</span>`:'';
  let content=`<div class="profile-hero"><div class="profile-avatar ${genderCls}">${safe(shortName(p))}</div><div><h3 class="profile-name">${safe(name)}</h3>${secondary?`<div class="profile-name-ta">${safe(secondary)}</div>`:''}<div class="profile-relation">${safe(isMe?t('youAre'):(language==='ta'?rel?.ta:rel?.en)||t('relative'))}</div></div></div><div class="profile-badges"><span class="pill ${p.status==='deceased'?'deceased':'status'}">${safe(t(p.status==='deceased'?'deceasedStatus':'livingStatus'))}</span>${isMe?`<span class="pill">${safe(t('yourEntry'))}</span>`:''}${roleHtml}</div>`;
  content+=`<div class="info-section"><div class="info-section-title"><span>${safe(t('profile'))}</span>${canEdit?`<button class="subtle-button" id="edit-profile-button" aria-label="${safe(t('editDetails'))}" title="${safe(t('editDetails'))}"><svg viewBox="0 0 24 24"><path d="m15 5 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15.2 4 20Z"/></svg></button>`:''}</div>`;
  const contactPriv=p.detailsVisibility||'private';
  const canViewDetails=isMe||ownerAdmin||contactPriv==='members';
  if(canViewDetails){
    content+=infoRow('born',p.birth?dateDisplay(p,'birth'):t('notProvided'));
    if(p.status==='deceased')content+=infoRow('died',p.death?dateDisplay(p,'death'):t('notProvided'));
    content+=infoRow('place',p.hometown||t('notProvided'));
    if(p.birthPlace)content+=infoRow('birthPlace',p.birthPlace);
    if(p.currentCity)content+=infoRow('currentCity',p.currentCity);
    if(p.occupation)content+=infoRow('occupation',p.occupation);
  }
  content+=`</div>`;
  const parents=parentsOf(p.id),children=childrenOf(p.id),partners=partnersOf(p.id);
  content+=`<div class="info-section"><div class="info-section-title"><span>${safe(t('familyLinks'))}</span></div>${linkRow('parents',parents)}${linkRow('spouses',partners)}${linkRow('children',children)}</div>`;
  const canViewContacts=isMe||ownerAdmin||contactPriv==='members';
  if(canViewContacts&&(p.phone||p.email)){
    content+=`<div class="info-section"><div class="info-section-title"><span>${safe(t('contact'))}</span></div>${p.phone?infoRow('phone',p.phone):''}${p.email?infoRow('email',p.email):''}</div>`;
  }
  if(p.about&&(isMe||ownerAdmin||contactPriv==='members'))content+=`<div class="info-section"><div class="info-section-title"><span>${safe(t('about'))}</span></div><p style="font-size:11px;color:#657168;line-height:1.55;margin:0">${safe(p.about)}</p></div>`;
  if(p.accountLinked){content+=`<div class="info-section"><div class="info-section-title"><span>${safe(t('role'))}</span>${ownerAdmin&&p.id!==sessionUserId?`<select id="role-select" class="form-select" style="width:auto;padding:6px 7px;font-size:10px" aria-label="${safe(t('changeRole'))}">${['viewer','member','admin'].filter(r=>r!=='admin'||isOwner()).map(r=>`<option value="${r}" ${p.role===r?'selected':''}>${safe(t(r))}</option>`).join('')}</select>`:''}</div><p class="form-help">${safe(t(p.id===sessionUserId?'editOwnOnly':'notOwnEntry'))}</p></div>`;}
  content+=`<div class="profile-actions">${canEdit?`<button class="secondary-button small-button" id="edit-details-action"><svg viewBox="0 0 24 24"><path d="m15 5 4 4M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15.2 4 20Z"/></svg>${safe(t('editDetails'))}</button>`:`<button class="secondary-button small-button" id="correction-action">${safe(t('suggestCorrection'))}</button>`}${canEditAny()&&!isMe?`<button class="secondary-button small-button danger-button" id="delete-person-action">${safe(t('deletePerson'))}</button>`:''}</div>`;
  root.innerHTML=content;
  $('#edit-profile-button')?.addEventListener('click',()=>openPersonForm(p.id));$('#edit-details-action')?.addEventListener('click',()=>openPersonForm(p.id));$('#correction-action')?.addEventListener('click',()=>openCorrection(p.id));$('#delete-person-action')?.addEventListener('click',()=>deletePerson(p.id));
  $('#role-select')?.addEventListener('change',e=>changeRole(p.id,e.target.value));
  $$('.profile-link',root).forEach(btn=>btn.addEventListener('click',()=>selectPerson(btn.dataset.id)));
}
function infoRow(key,value){return `<div class="info-row"><span class="info-label">${safe(t(key))}</span><span class="info-value">${safe(value)}</span></div>`;}
function linkRow(key,arr){const labels=arr.length?arr.map(p=>`<button type="button" class="profile-link" data-id="${safe(p.id)}" style="border:0;background:transparent;padding:0;color:#426a50;font-size:10px;text-align:right;cursor:pointer">${safe(displayName(p))}</button>`).join('<span style="color:#a6aea7">, </span>'):`<span class="info-value">${safe(t('none'))}</span>`;return `<div class="info-row"><span class="info-label">${safe(t(key))}</span><span class="info-value" style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">${labels}</span></div>`;}
function renderLookupOptions(){const sel=$('#lookup-select');if(!sel)return;const old=sel.value;sel.innerHTML=people.filter(p=>p.id!==sessionUserId).sort((a,b)=>displayName(a).localeCompare(displayName(b))).map(p=>`<option value="${safe(p.id)}">${safe(displayName(p))} — ${safe((language==='ta'?effectiveRelation(sessionUserId,p.id)?.ta:effectiveRelation(sessionUserId,p.id)?.en)||t('relative'))}</option>`).join('');if(old&&person(old))sel.value=old;}
function renderActivity(){const root=$('#activity-list');if(!root)return;if(!activities.length){root.innerHTML=`<p class="form-help">${safe(t('noActivity'))}</p>`;return;}root.innerHTML=activities.slice(0,4).map(a=>{const icon=a.type==='add'?'M12 5v14M5 12h14':a.type==='correction'?'M4 20l4-.8L19 8a2.8 2.8 0 0 0-4-4L4 15.2 4 20Z':'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z';const text=a.type==='add'?t('activityAdded'):a.type==='correction'?t('activityCorrection'):t('activityEdited');const mins=Math.max(0,Math.floor((Date.now()-a.time)/60000));const time=mins<1?t('justNow'):`${mins} ${t('minutesAgo')}`;return `<div class="activity-item"><span class="activity-icon"><svg viewBox="0 0 24 24"><path d="${icon}"/></svg></span><div class="activity-copy"><p><strong>${safe(a.person)}</strong> ${safe(text)}</p><small>${safe(time)}</small></div></div>`;}).join('');}
function addActivity(type,name){activities.unshift({type,person:name,time:Date.now()});renderActivity();}
function openModal(title,body,eyebrow='FAMILY TREE'){ $('#modal-title').textContent=title;$('#modal-eyebrow').textContent=eyebrow;$('#modal-content').innerHTML=body;$('#modal-backdrop').hidden=false;$('#modal-close').focus();}
function closeModal(){$('#modal-backdrop').hidden=true;$('#modal-content').innerHTML='';}
function openPersonForm(id=null){
  const p=id?person(id):null; if(p&&!canEditSelected(p)){toast(t('notOwnEntry'));return;}
  const selected=person(selectedId)||person(sessionUserId);const isNew=!p;
  const connectionOptions=people.filter(x=>x.id!==p?.id).map(x=>`<option value="${safe(x.id)}" ${x.id===selected?.id?'selected':''}>${safe(displayName(x))}</option>`).join('');
  const get=(key)=>p?.[key]||'';
  const living=p?p.status!=='deceased':true;
  const body=`<form id="person-form">
    ${isNew?`<div class="form-field"><label class="field-label" for="connect-person">${safe(t('connectTo'))}</label><select id="connect-person" class="form-select" required>${connectionOptions}</select></div><div class="form-field"><label class="field-label" for="connection-type">${safe(t('connectionType'))}</label><select id="connection-type" class="form-select" required><option value="child">${safe(t('childOf'))}</option><option value="parent">${safe(t('parentOf'))}</option><option value="partner">${safe(t('partnerOf'))}</option></select></div>`:''}
    <div class="field-grid"><div class="form-field"><label class="field-label" for="person-en">${safe(t('nameEnglish'))}</label><input class="form-input" id="person-en" value="${safe(get('en'))}" autocomplete="off"></div><div class="form-field"><label class="field-label" for="person-ta">${safe(t('nameTamil'))}</label><input class="form-input" id="person-ta" value="${safe(get('ta'))}" autocomplete="off"></div></div>
    <div class="field-grid"><div class="form-field"><label class="field-label" for="person-gender">${safe(t('gender'))}</label><select id="person-gender" class="form-select"><option value="">${safe(t('genderNotSet'))}</option><option value="m" ${get('gender')==='m'?'selected':''}>${safe(t('male'))}</option><option value="f" ${get('gender')==='f'?'selected':''}>${safe(t('female'))}</option><option value="x" ${get('gender')==='x'?'selected':''}>${safe(t('other'))}</option></select></div><div class="form-field"><label class="field-label" for="person-status">${safe(t('status'))}</label><select id="person-status" class="form-select"><option value="living" ${living?'selected':''}>${safe(t('livingStatus'))}</option><option value="deceased" ${!living?'selected':''}>${safe(t('deceasedStatus'))}</option></select></div></div>
    <div class="field-grid"><div class="form-field"><label class="field-label" for="person-birth">${safe(t('birthDate'))}</label><input class="form-input" id="person-birth" value="${safe(get('birth'))}" placeholder="YYYY or YYYY-MM-DD"><label class="form-check" style="margin-top:7px"><input type="checkbox" id="person-birth-approx" ${p?.birthApprox?'checked':''}>${safe(t('approximate'))}</label></div><div class="form-field"><label class="field-label" for="person-death">${safe(t('deathDate'))}</label><input class="form-input" id="person-death" value="${safe(get('death'))}" placeholder="YYYY or YYYY-MM-DD"><label class="form-check" style="margin-top:7px"><input type="checkbox" id="person-death-approx" ${p?.deathApprox?'checked':''}>${safe(t('approximate'))}</label></div></div>
    <div class="field-grid"><div class="form-field"><label class="field-label" for="person-phone">${safe(t('phone'))}</label><input class="form-input" id="person-phone" value="${safe(get('phone'))}" autocomplete="off"></div><div class="form-field"><label class="field-label" for="person-email">${safe(t('email'))}</label><input class="form-input" id="person-email" value="${safe(get('email'))}" type="email" autocomplete="off"></div></div>
    <div class="field-grid"><div class="form-field"><label class="field-label" for="person-hometown">${safe(t('hometown'))}</label><input class="form-input" id="person-hometown" value="${safe(get('hometown'))}"></div><div class="form-field"><label class="field-label" for="person-birth-place">${safe(t('birthPlace'))}</label><input class="form-input" id="person-birth-place" value="${safe(get('birthPlace'))}"></div></div><div class="field-grid"><div class="form-field"><label class="field-label" for="person-current-city">${safe(t('currentCity'))}</label><input class="form-input" id="person-current-city" value="${safe(get('currentCity'))}"></div><div class="form-field"><label class="field-label" for="person-occupation">${safe(t('occupation'))}</label><input class="form-input" id="person-occupation" value="${safe(get('occupation'))}"></div></div><div class="form-field"><label class="field-label" for="person-order">${safe(t('siblingOrderField'))}</label><input class="form-input" id="person-order" value="${safe(get('siblingOrder')||'')}" type="number" min="1" step="1"><p class="form-help">Use birth date when known; this helps calculate elder/younger relations when exact dates are unavailable.</p></div>
    <div class="form-field"><label class="field-label" for="person-about">${safe(t('aboutPerson'))}</label><textarea class="form-textarea" id="person-about">${safe(get('about'))}</textarea></div>
    <div class="form-field"><label class="field-label" for="person-visibility">${safe(t('detailsVisibility'))}</label><select class="form-select" id="person-visibility"><option value="private" ${(!get('detailsVisibility')||get('detailsVisibility')==='private')?'selected':''}>${safe(t('private'))}</option><option value="members" ${(!get('detailsVisibility')||get('detailsVisibility')==='members')?'selected':''}>${safe(t('familyOnly'))}</option><option value="admins" ${get('detailsVisibility')==='admins'?'selected':''}>${safe(t('adminOnly'))}</option></select><p class="form-help">${safe(t('privacyInfo'))}</p></div>
    <p class="form-help">${safe(t('helpText'))}</p><div class="modal-actions"><button type="button" class="secondary-button" id="form-cancel">${safe(t('cancel'))}</button><button class="primary-button" type="submit">${safe(isNew?t('savePerson'):t('saveChanges'))}</button></div>
  </form>`;
  openModal(isNew?t('addNewPerson'):t('editPerson'),body);
  $('#form-cancel').addEventListener('click',closeModal);
  $('#person-form').addEventListener('submit',e=>{e.preventDefault();savePersonForm(id);});
  $('#connection-type')?.addEventListener('change',e=>{$('#connect-person').setAttribute('aria-label',t('connectTo'));});
}
function generateId(){return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;}
function savePersonForm(existingId){
  const en=$('#person-en').value.trim(),ta=$('#person-ta').value.trim();if(!en&&!ta){toast(t('nameRequired'));return;}
  const status=$('#person-status').value;const data={en:en||ta,ta:ta||en,gender:$('#person-gender').value||'x',status,birth:$('#person-birth').value.trim(),birthApprox:$('#person-birth-approx').checked,death:$('#person-death').value.trim(),deathApprox:$('#person-death-approx').checked,phone:$('#person-phone').value.trim(),email:$('#person-email').value.trim(),hometown:$('#person-hometown').value.trim(),birthPlace:$('#person-birth-place').value.trim(),currentCity:$('#person-current-city').value.trim(),siblingOrder:Number($('#person-order').value)||99,occupation:$('#person-occupation').value.trim(),about:$('#person-about').value.trim(),detailsVisibility:$('#person-visibility').value};
  if(existingId){const p=person(existingId);Object.assign(p,data);addActivity('edit',displayName(p));toast(t('profileUpdated'));selectedId=existingId;}
  else{
    const targetId=$('#connect-person').value,kind=$('#connection-type').value,target=person(targetId);if(!target){toast(t('pickConnection'));return;}
    const normalizeName=v=>String(v||'').trim().toLocaleLowerCase().replace(/\s+/g,' ');
    const duplicate=people.find(existing=>{
      if(normalizeName(en)&&normalizeName(en)===normalizeName(existing.en))return true;
      if(normalizeName(ta)&&normalizeName(ta)===normalizeName(existing.ta))return true;
      return false;
    });
    if(duplicate){
      const sameBirth=data.birth&&duplicate.birth&&data.birth===duplicate.birth;
      const sameConnection=(kind==='child'&&((duplicate.parents||[]).includes(target.id)||partnersOf(target.id).some(partner=>(duplicate.parents||[]).includes(partner.id))))||(kind==='parent'&&(target.parents||[]).includes(duplicate.id))||(kind==='partner'&&arePartners(target.id,duplicate.id));
      if(sameBirth||sameConnection){closeModal();selectPerson(duplicate.id);toast(t('duplicateLikely'));return;}
      const keepSeparate=confirm(`${t('possibleDuplicate')} ${displayName(duplicate)}. ${t('addAnyway')}`);if(!keepSeparate)return;
    }
    const node={id:generateId(),...data,parents:[],partners:[],x:target.x+165,y:target.y+140,siblingOrder:people.length+1,accountLinked:false};
    if(kind==='child'){node.parents=[target.id,...partnersOf(target.id).map(p=>p.id).slice(0,1)];}
    else if(kind==='parent'){node.parents=[];target.parents=[...new Set([...(target.parents||[]),node.id])];}
    else{node.partners=[target.id];target.partners=[...new Set([...(target.partners||[]),node.id])];node.y=target.y;node.x=target.x+155;}
    // Move a newly-added item into a clear area in the canvas, retaining the connection model.
    node.x=Math.max(20,Math.min(1020,node.x));node.y=Math.max(30,Math.min(650,node.y));people.push(node);selectedId=node.id;addActivity('add',displayName(node));toast(t('added'));
  }
  closeModal();renderTree();renderProfile();renderLookupOptions();centerOn(selectedId);
}
function changeRole(id,role){const p=person(id);if(!p||!p.accountLinked)return;if(role==='admin'&&!isOwner()){toast(t('roleOwnerNote'));renderProfile();return;}if(p.role==='owner'&&id!==sessionUserId){toast(t('roleOwnerNote'));renderProfile();return;}if((p.role==='admin'||role==='admin')&&!isOwner()){toast(t('roleOwnerNote'));renderProfile();return;}p.role=role;addActivity('edit',displayName(p));renderProfile();toast(`${t('roleChanged')} ${t(role)}.`);}
function deletePerson(id){const p=person(id);if(!p)return;if(id===sessionUserId){toast(t('cannotDeleteSelf'));return;}if(!canEditAny()){toast(t('permissionNote'));return;}if(!confirm(t('confirmDelete')))return;people=people.filter(x=>x.id!==id);people.forEach(x=>{x.parents=(x.parents||[]).filter(pid=>pid!==id);x.partners=(x.partners||[]).filter(pid=>pid!==id);});collapsed.delete(id);selectedId=sessionUserId;addActivity('edit',displayName(p));renderTree();renderProfile();renderLookupOptions();toast(t('deleted'));}
function openCorrection(id){const p=person(id);if(!p)return;openModal(t('suggestCorrection'),`<form id="correction-form"><div class="form-field"><label class="field-label" for="correction-target">${safe(t('selectedPerson'))}</label><input class="form-input" id="correction-target" value="${safe(displayName(p))}" disabled></div><div class="form-field"><label class="field-label" for="correction-text">${safe(t('correctedField'))}</label><textarea class="form-textarea" id="correction-text" placeholder="${safe(t('correctionPlaceholder'))}" required></textarea></div><div class="modal-actions"><button type="button" class="secondary-button" id="form-cancel">${safe(t('cancel'))}</button><button type="submit" class="primary-button">${safe(t('submitRequest'))}</button></div></form>`);$('#form-cancel').addEventListener('click',closeModal);$('#correction-form').addEventListener('submit',e=>{e.preventDefault();requests.unshift({id:generateId(),type:'correction',name:displayName(p),personId:id,detail:$('#correction-text').value.trim(),status:'pending',created:Date.now()});closeModal();$('#request-count').textContent=requests.filter(r=>r.status==='pending').length;addActivity('correction',displayName(p));toast(t('requestSubmitted'));});}
function openRequests(){
  const pending=requests.filter(r=>r.status==='pending');
  const approvedMembers=requests.filter(r=>r.type==='join'&&r.status==='approved');
  const pendingCards=pending.length?pending.map(r=>{
    const title=r.type==='join'?t('requestTitleJoin'):r.type==='link'?t('requestTitleLink'):t('corrections');
    const desc=r.type==='join'?t('requestJoinText'):r.type==='link'?t('requestLinkText'):r.detail||'';
    const personLine=r.type==='link'&&r.personId?`<p><strong>${safe(t('linkedTo'))}:</strong> ${safe(displayName(person(r.personId)))}</p>`:'';
    const roleSelect=r.type==='join'?`<div class="form-field"><label class="field-label" for="role-${safe(r.id)}">${safe(t('requestRole'))}</label><select class="form-select request-role" id="role-${safe(r.id)}" data-id="${safe(r.id)}"><option value="viewer" selected>${safe(t('viewer'))}</option><option value="member">${safe(t('member'))}</option>${isOwner()?`<option value="admin">${safe(t('admin'))}</option>`:''}</select></div>`:'';
    return `<div class="request-card"><h3>${safe(title)} · ${safe(r.name)}</h3><p>${safe(desc)}</p>${personLine}${roleSelect}<div class="request-actions"><button class="primary-button request-approve" data-id="${safe(r.id)}">${safe(t('approve'))}</button><button class="secondary-button request-reject" data-id="${safe(r.id)}">${safe(t('reject'))}</button></div></div>`;
  }).join(''):`<div class="no-profile"><svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>${safe(t('noRequests'))}</div>`;
  const approvedCards=approvedMembers.length?`<div class="divider"></div><h3 style="margin:14px 0 10px">${safe(t('members'))}</h3>`+approvedMembers.map(r=>`<div class="request-card"><h3>${safe(r.name)}</h3><p>${safe(t('notLinked'))} · ${safe(t(r.role||'viewer'))}</p>${isOwner()||(['viewer','member'].includes(r.role||'viewer')&&isAdmin())?`<div class="form-field"><label class="field-label" for="approved-role-${safe(r.id)}">${safe(t('changeRole'))}</label><select class="form-select approved-role" id="approved-role-${safe(r.id)}" data-id="${safe(r.id)}"><option value="viewer" ${(r.role||'viewer')==='viewer'?'selected':''}>${safe(t('viewer'))}</option><option value="member" ${r.role==='member'?'selected':''}>${safe(t('member'))}</option>${isOwner()?`<option value="admin" ${r.role==='admin'?'selected':''}>${safe(t('admin'))}</option>`:''}</select></div>`:''}<p class="form-help">${safe(t('assignRoleHelp'))}</p></div>`).join(''):'';
  openModal(t('requests'),`<h3 style="margin:0 0 10px">${safe(t('pending'))}</h3>${pendingCards}${approvedCards}<p class="form-help">${safe(t('assignRoleHelp'))}</p><div class="modal-actions"><button class="secondary-button" id="requests-close">${safe(t('close'))}</button></div>`);
  $('#requests-close').addEventListener('click',closeModal);
  $$('.request-approve').forEach(btn=>btn.addEventListener('click',()=>{
    const r=requests.find(r=>r.id===btn.dataset.id);if(!r)return;
    if(r.type==='join'){r.role=$(`#role-${CSS.escape(r.id)}`)?.value||'viewer';if(r.role==='admin'&&!isOwner()){r.role='viewer';}r.status='approved';r.detail=`Approved as ${r.role}`;}
    else if(r.type==='link'){r.status='approved';const linkedPerson=person(r.personId);if(linkedPerson){linkedPerson.accountLinked=true;linkedPerson.role=linkedPerson.role||'member';}}
    else r.status='approved';
    addActivity('edit',r.name);$('#request-count').textContent=requests.filter(x=>x.status==='pending').length;toast(t('requestApproved'));openRequests();
  }));
  $$('.request-reject').forEach(btn=>btn.addEventListener('click',()=>{const r=requests.find(r=>r.id===btn.dataset.id);if(r)r.status='rejected';$('#request-count').textContent=requests.filter(x=>x.status==='pending').length;toast(t('requestRejected'));openRequests();}));
  $$('.approved-role').forEach(sel=>sel.addEventListener('change',()=>{const r=requests.find(r=>r.id===sel.dataset.id);if(!r)return;const proposed=sel.value;if((r.role==='admin'||proposed==='admin')&&!isOwner()){toast(t('roleOwnerNote'));openRequests();return;}r.role=proposed;toast(t('roleSaved'));openRequests();}));
}
function openSettings(){
  const body=`<div class="settings-row"><div><strong>${safe(t('language'))}</strong><small>${safe(t('setLanguage'))}</small></div><select id="settings-language"><option value="en" ${language==='en'?'selected':''}>English</option><option value="ta" ${language==='ta'?'selected':''}>தமிழ்</option></select></div><div class="settings-row"><div><strong>${safe(t('privacy'))}</strong><small>${safe(t('privacyInfo'))}</small></div><select id="default-visibility"><option value="private" selected>${safe(t('private'))}</option><option value="members">${safe(t('familyOnly'))}</option><option value="admins">${safe(t('adminOnly'))}</option></select></div><div class="settings-row"><div><strong>${safe(t('notifications'))}</strong><small>${safe(t('notificationsText'))}</small></div><span class="role-chip">ON</span></div><div class="divider"></div><p class="form-help">${safe(t('permissionNote'))}</p><p class="form-help">${safe(t('roleOwnerNote'))}</p><div class="modal-actions"><button type="button" class="primary-button" id="settings-save">${safe(t('saveChanges'))}</button></div>`;
  openModal(t('settings'),body);$('#settings-save').addEventListener('click',()=>{language=$('#settings-language').value;try { localStorage.setItem('uravu-language',language); } catch (_) {}const val=$('#default-visibility').value;detailsDefaults={phone:val,email:val,hometown:val,occupation:val,about:val};closeModal();applyTranslations();toast(t('languageSaved'));});
}
function openTreeMenu(){openModal(t('treeActions'),`<div class="tree-menu-panel"><button id="menu-expand">${safe(t('expandAll'))}</button><button id="menu-collapse">${safe(t('collapseAll'))}</button><button id="menu-fit">${safe(t('fitTree'))}</button><button id="menu-export">${safe(t('export'))}</button></div><div class="modal-actions"><button class="secondary-button" id="menu-close">${safe(t('close'))}</button></div>`);$('#menu-close').addEventListener('click',closeModal);$('#menu-expand').addEventListener('click',()=>{collapsed.clear();closeModal();renderTree();});$('#menu-collapse').addEventListener('click',()=>{people.filter(p=>childrenOf(p.id).length).forEach(p=>collapsed.add(p.id));closeModal();renderTree();});$('#menu-fit').addEventListener('click',()=>{closeModal();fitTree();});$('#menu-export').addEventListener('click',()=>{closeModal();exportTree();});}
function exportTree(){
  const w=1300,h=Math.max(760,...people.map(p=>p.y+105));const rows=[];rows.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#fbfcfa"/><text x="28" y="30" font-size="19" font-family="sans-serif" font-weight="700" fill="#235d47">${safe(t('exportTitle'))}</text>`);
  const drawn=new Set();people.forEach(child=>{const childX=child.x+71,childY=child.y;for(const pid of child.parents||[]){const par=person(pid);if(!par)continue;const px=par.x+71,py=par.y+74;const mid=py+(childY-py)*.5;rows.push(`<path d="M ${px} ${py} V ${mid} H ${childX} V ${childY}" fill="none" stroke="#cbd8cd" stroke-width="2"/>`);}for(const pid of child.partners||[]){const key=[pid,child.id].sort().join('|');if(drawn.has(key))continue;drawn.add(key);const other=person(pid);if(other&&Math.abs(other.y-child.y)<20)rows.push(`<path d="M ${child.x+71} ${child.y+37} H ${other.x+71}" fill="none" stroke="#d6c9e6" stroke-width="2" stroke-dasharray="4 4"/>`);}});
  people.forEach(p=>{const name=safe(language==='ta'?(p.ta||p.en):(p.en||p.ta));const rel=effectiveRelation(sessionUserId,p.id);const relation=safe(language==='ta'?rel?.ta:rel?.en);const fill=p.id===sessionUserId?'#f0f7f1':'#ffffff';const stroke=p.id===sessionUserId?'#4b9369':'#e0e6df';rows.push(`<g><rect x="${p.x}" y="${p.y}" width="142" height="74" rx="12" fill="${fill}" stroke="${stroke}"/><text x="${p.x+10}" y="${p.y+29}" font-size="11" font-family="sans-serif" font-weight="700" fill="#1e2823">${name.slice(0,22)}</text><text x="${p.x+10}" y="${p.y+51}" font-size="9" font-family="sans-serif" fill="#849087">${relation.slice(0,24)}</text></g>`);});rows.push('</svg>');const blob=new Blob([rows.join('')],{type:'image/svg+xml;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='uravu-family-tree.svg';document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);toast(t('exportDone'));}
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2700);}

// Search and keyboard affordances.
$('#member-search').addEventListener('input',()=>{renderTree();const q=$('#member-search').value.trim().toLocaleLowerCase();if(q){const first=people.find(p=>allTextFor(p).includes(q));if(first){selectedId=first.id;renderProfile();}}});
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#member-search').focus();}if(e.key==='Escape'){closeModal();$('#side-panel').classList.remove('mobile-open');}});
$('#fit-button').addEventListener('click',fitTree);
$('#collapse-button').addEventListener('click',()=>{const ids=people.filter(p=>childrenOf(p.id).length).map(p=>p.id);const allCollapsed=ids.every(id=>collapsed.has(id));if(allCollapsed)collapsed.clear();else ids.forEach(id=>collapsed.add(id));renderTree();});
$('#zoom-in').addEventListener('click',()=>{zoom=Math.min(1.45,zoom+.1);applyPanZoom();});$('#zoom-out').addEventListener('click',()=>{zoom=Math.max(.35,zoom-.1);applyPanZoom();});
$('#tree-viewport').addEventListener('pointerdown',e=>{if(e.target.closest('.tree-node'))return;dragState={x:e.clientX,y:e.clientY,px:pan.x,py:pan.y};$('#tree-viewport').classList.add('dragging');$('#tree-viewport').setPointerCapture(e.pointerId);});
$('#tree-viewport').addEventListener('pointermove',e=>{if(!dragState)return;pan.x=dragState.px+(e.clientX-dragState.x);pan.y=dragState.py+(e.clientY-dragState.y);applyPanZoom();});
const stopDrag=e=>{dragState=null;$('#tree-viewport').classList.remove('dragging');};$('#tree-viewport').addEventListener('pointerup',stopDrag);$('#tree-viewport').addEventListener('pointercancel',stopDrag);
$('#tree-viewport').addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();zoom=Math.max(.35,Math.min(1.45,zoom+(e.deltaY<0?.06:-.06)));applyPanZoom();}},{passive:false});
$('#requests-button').addEventListener('click',openRequests);$('#add-person-button').addEventListener('click',()=>{toast('Family-tree storage is not connected yet. No changes have been saved.');});$('#settings-button').addEventListener('click',openSettings);$('#tree-menu-button').addEventListener('click',openTreeMenu);$('#export-button').addEventListener('click',exportTree);$('#modal-close').addEventListener('click',closeModal);$('#modal-backdrop').addEventListener('click',e=>{if(e.target.id==='modal-backdrop')closeModal();});$('#close-profile').addEventListener('click',()=>$('#side-panel').classList.remove('mobile-open'));
$('#account-button').addEventListener('click',()=>{if(sessionUserId){selectedId=sessionUserId;renderTree();renderProfile();}});
$('#lookup-button').addEventListener('click',()=>{const id=$('#lookup-select').value;const p=person(id);if(!p)return;const toYou=effectiveRelation(sessionUserId,id),toThem=effectiveRelation(id,sessionUserId);const root=$('#lookup-result');root.hidden=false;root.innerHTML=`<strong>${safe(language==='ta'?toYou?.ta:toYou?.en)} · ${safe(displayName(p))}</strong><span>${safe(t('toYou'))}: ${safe(language==='ta'?toYou?.ta:toYou?.en)} &nbsp;·&nbsp; ${safe(t('toThem'))}: ${safe(language==='ta'?toThem?.ta:toThem?.en)}</span>${toYou?.path?`<span style="margin-top:5px">${safe(t('relationshipPath'))}: ${toYou.path.map(pid=>displayName(person(pid))).join(' → ')}</span>`:''}`;selectPerson(id);});
$$('.lang-button').forEach(btn=>btn.addEventListener('click',()=>{language=btn.dataset.lang;try { localStorage.setItem('uravu-language',language); } catch (_) {}applyTranslations();}));

// Responsive initial positioning, PWA service worker registration.
function initialLayout(){applyTranslations();$('#request-count').textContent=requests.filter(r=>r.status==='pending').length;requestAnimationFrame(()=>{if(sessionUserId&&window.matchMedia('(max-width:820px)').matches){zoom=.72;centerOn(sessionUserId);}else{fitTree();}});}
window.addEventListener('resize',()=>{if(!window.matchMedia('(max-width:820px)').matches)$('#side-panel').classList.remove('mobile-open');});
if('serviceWorker' in navigator && location.protocol.startsWith('http'))navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
initialLayout();
