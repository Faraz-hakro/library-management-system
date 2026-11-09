const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const STORAGE_KEY = "libra_library_data_v1";
const defaultData = {
  admin: "Shahzaib Ali",
  books: [
    {id:"B-1001",title:"Atomic Habits",author:"James Clear",isbn:"9780735211292",category:"Self Development",copies:5},
    {id:"B-1002",title:"Clean Code",author:"Robert C. Martin",isbn:"9780132350884",category:"Technology",copies:3},
    {id:"B-1003",title:"The Alchemist",author:"Paulo Coelho",isbn:"9780061122415",category:"Fiction",copies:4},
    {id:"B-1004",title:"Deep Learning",author:"Ian Goodfellow",isbn:"9780262035613",category:"Technology",copies:2},
    {id:"B-1005",title:"A Brief History of Time",author:"Stephen Hawking",isbn:"9780553380163",category:"Science",copies:3}
  ],
  members: [
    {id:"M-2001",name:"Ayesha Khan",email:"ayesha@example.com",joined:"2026-10-12"},
    {id:"M-2002",name:"Ahmed Raza",email:"ahmed@example.com",joined:"2026-10-18"},
    {id:"M-2003",name:"Sara Ali",email:"sara@example.com",joined:"2026-10-25"}
  ],
  loans: []
};
let data = loadData();
let modalMode = "";
let editingId = null;

function loadData(){
  try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : structuredClone(defaultData); }
  catch { return structuredClone(defaultData); }
}
function saveData(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function escapeHTML(value=""){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function todayISO(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function formatDate(date){if(!date)return "—";return new Date(date+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});}
function initials(name){return name.split(/\s+/).map(p=>p[0]).join("").slice(0,2).toUpperCase();}
function availableCopies(book){return Math.max(0,book.copies-data.loans.filter(l=>l.bookId===book.id&&l.status==="Issued").length);}
function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2600);}
function syncAdmin(){const name=data.admin||"Library Admin";$("#sidebarAdminName").textContent=name;$("#pageTitle").innerHTML=`Good day, ${escapeHTML(name.split(" ")[0])} <span>✦</span>`;$$(".top-avatar,.avatar").forEach(el=>el.textContent=initials(name));}
function render(){
  syncAdmin();
  const issued=data.loans.filter(l=>l.status==="Issued").length;
  $("#totalBooks").textContent=data.books.reduce((n,b)=>n+b.copies,0);
  $("#issuedBooks").textContent=issued;
  $("#availableBooks").textContent=data.books.reduce((n,b)=>n+availableCopies(b),0);
  $("#totalMembers").textContent=data.members.length;
  $("#bookNavCount").textContent=data.books.length;
  $("#activeLoans").textContent=issued;
  $("#returnedLoans").textContent=data.loans.filter(l=>l.status==="Returned").length;
  $("#overdueLoans").textContent=data.loans.filter(l=>l.status==="Issued"&&l.dueDate<todayISO()).length;
  renderBooks(); renderMembers(); renderLoans(); renderRecent(); renderSnapshot(); renderCategories();
}
function renderBooks(){
  const q=($("#bookSearch")?.value||"").toLowerCase(), cat=$("#categoryFilter")?.value||"all";
  const list=data.books.filter(b=>(`${b.title} ${b.author} ${b.isbn} ${b.id}`.toLowerCase().includes(q))&&(cat==="all"||b.category===cat));
  $("#booksTable").innerHTML=list.map(b=>`<tr><td><div class="book-cell"><span class="book-cover">▤</span><span><strong>${escapeHTML(b.title)}</strong><small>${escapeHTML(b.author)}</small></span></div></td><td>${escapeHTML(b.isbn||"—")}</td><td>${escapeHTML(b.category)}</td><td>${b.copies}</td><td><span class="status-pill ${availableCopies(b)>0?"status-available":"status-issued"}">${availableCopies(b)} available</span></td><td><button class="action-btn" data-edit-book="${b.id}">Edit</button><button class="action-btn danger" data-delete-book="${b.id}">Delete</button></td></tr>`).join("");
  toggleEmpty("#booksEmpty","#booksTable",list.length);
}
function renderMembers(){
  const q=($("#memberSearch")?.value||"").toLowerCase();
  const list=data.members.filter(m=>`${m.name} ${m.email} ${m.id}`.toLowerCase().includes(q));
  $("#membersTable").innerHTML=list.map(m=>{const count=data.loans.filter(l=>l.memberId===m.id&&l.status==="Issued").length;return `<tr><td><div class="member-cell"><span class="member-avatar">${initials(m.name)}</span><strong>${escapeHTML(m.name)}</strong></div></td><td>${m.id}</td><td>${escapeHTML(m.email)}</td><td>${formatDate(m.joined)}</td><td>${count}</td><td><button class="action-btn" data-edit-member="${m.id}">Edit</button><button class="action-btn danger" data-delete-member="${m.id}">Delete</button></td></tr>`}).join("");
  toggleEmpty("#membersEmpty","#membersTable",list.length);
}
function loanStatus(l){return l.status==="Returned"?"Returned":l.dueDate<todayISO()?"Overdue":"Issued";}
function renderLoans(){
  const q=($("#loanSearch")?.value||"").toLowerCase();
  const list=[...data.loans].reverse().filter(l=>{const b=data.books.find(x=>x.id===l.bookId),m=data.members.find(x=>x.id===l.memberId);return `${b?.title||""} ${m?.name||""}`.toLowerCase().includes(q)});
  $("#loansTable").innerHTML=list.map(l=>{const b=data.books.find(x=>x.id===l.bookId),m=data.members.find(x=>x.id===l.memberId),status=loanStatus(l);return `<tr><td><strong>${escapeHTML(b?.title||"Removed book")}</strong></td><td>${escapeHTML(m?.name||"Removed member")}</td><td>${formatDate(l.issueDate)}</td><td>${formatDate(l.dueDate)}</td><td><span class="status-pill ${status==="Returned"?"status-returned":status==="Overdue"?"status-overdue":"status-issued"}">${status}</span></td><td>${l.status==="Issued"?`<button class="action-btn" data-return-loan="${l.id}">Return book</button>`:"—"}</td></tr>`}).join("");
  toggleEmpty("#loansEmpty","#loansTable",list.length);
}
function toggleEmpty(empty,table,count){$(empty).classList.toggle("show",count===0);$(table).parentElement.style.display=count===0?"none":"block";}
function renderRecent(){
  const list=[...data.loans].reverse().slice(0,4);
  $("#recentActivity").innerHTML=list.map(l=>{const b=data.books.find(x=>x.id===l.bookId),m=data.members.find(x=>x.id===l.memberId);return `<tr><td><strong>${escapeHTML(b?.title||"Book")}</strong></td><td>${escapeHTML(m?.name||"Member")}</td><td>${formatDate(l.issueDate)}</td><td><span class="status-pill ${l.status==="Returned"?"status-returned":"status-issued"}">${l.status}</span></td></tr>`}).join("");
  $("#activityEmpty").classList.toggle("show",list.length===0);$("#recentActivity").parentElement.parentElement.style.display=list.length?"":"none";
}
function renderSnapshot(){
  const cats={};data.books.forEach(b=>cats[b.category]=(cats[b.category]||0)+b.copies);
  const entries=Object.entries(cats).slice(0,6);
  $("#collectionSnapshot").innerHTML=entries.length?entries.map(([c,n])=>`<div class="collection-item"><strong>${escapeHTML(c)}</strong><span>${n} copies</span></div>`).join():'<p class="stat-note">Add books to see your collection summary.</p>';
}
function renderCategories(){
  const select=$("#categoryFilter"),current=select.value,cats=[...new Set(data.books.map(b=>b.category))].sort();
  select.innerHTML='<option value="all">All categories</option>'+cats.map(c=>`<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join("");
  select.value=cats.includes(current)?current:"all";
}
function navigate(view){
  $$(".view-panel").forEach(v=>v.classList.remove("active"));$(`#${view}View`).classList.add("active");
  $$(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  const label={dashboard:"Dashboard",books:"Books",members:"Members",circulation:"Issue & Return"}[view];
  $("#breadcrumbTitle").textContent=label;$("#pageTitle").innerHTML= view==="dashboard"?`Good day, ${escapeHTML((data.admin||"Admin").split(" ")[0])} <span>✦</span>`:label;
  $("#pageSubtitle").textContent={dashboard:"Here’s what’s happening in your library today.",books:"Browse, search and maintain your book collection.",members:"Keep your reader information organized.",circulation:"Track active loans and completed returns."}[view];
  $("#addPrimaryBtn").style.display=view==="dashboard"||view==="books"?"inline-flex":"none";
  $("#addPrimaryBtn").innerHTML=view==="books"?"＋ Add new book":"＋ Add new book";
  $("#sidebar").classList.remove("open");
}
function field(name,label,type="text",value="",required=true,full=false,options=[]){
  let control=type==="select"?`<select name="${name}" ${required?"required":""}>${options.map(o=>`<option value="${escapeHTML(o)}" ${o===value?"selected":""}>${escapeHTML(o)}</option>`).join("")}</select>`:`<input name="${name}" type="${type}" value="${escapeHTML(value)}" ${required?"required":""} ${type==="number"?'min="1"':''}>`;
  return `<div class="field ${full?"full":""}"><label>${label}</label>${control}</div>`;
}
function openModal(mode,record=null){
  modalMode=mode;editingId=record?.id||null;let title="",html="";
  if(mode==="book"){title=record?"Edit book":"Add new book";html=field("title","BOOK TITLE","text",record?.title||"",true,true)+field("author","AUTHOR","text",record?.author||"")+field("isbn","ISBN","text",record?.isbn||"")+field("category","CATEGORY","select",record?.category||"Technology",true,false,["Technology","Science","Fiction","Self Development","History","Education","Other"])+field("copies","TOTAL COPIES","number",record?.copies??1);}
  if(mode==="member"){title=record?"Edit member":"Register new member";html=field("name","FULL NAME","text",record?.name||"",true,true)+field("email","EMAIL ADDRESS","email",record?.email||"",true,true);}
  if(mode==="issue"){title="Issue a book";const available=data.books.filter(b=>availableCopies(b)>0);if(!available.length){toast("No available books to issue. Add copies or return a book first.");return;}if(!data.members.length){toast("Register a member before issuing a book.");return;}html=field("bookId","SELECT BOOK","select",available[0].id,true,true,available.map(b=>b.id+" — "+b.title).map((v,i)=>available[i].id)) .replace(/<option value="([^"]+)">([^<]+)<\/option>/g,(match,val)=>{const b=available.find(x=>x.id===val);return `<option value="${val}">${escapeHTML(b.title)} (${availableCopies(b)} available)</option>`;})+field("memberId","SELECT MEMBER","select",data.members[0].id,true,true,data.members.map(m=>m.id))+field("issueDate","ISSUE DATE","date",todayISO())+field("dueDate","DUE DATE","date",new Date(Date.now()+14*86400000).toISOString().slice(0,10));}
  if(mode==="admin"){title="Administrator profile";html=field("admin","ADMIN NAME","text",data.admin,true,true);}
  $("#modalTitle").textContent=title;$("#modalFields").innerHTML=html;$("#modalBackdrop").classList.add("open");
}
function closeModal(){$("#modalBackdrop").classList.remove("open");$("#modalForm").reset();}
function submitModal(e){
  e.preventDefault();const f=Object.fromEntries(new FormData(e.target).entries());
  if(modalMode==="book"){f.copies=Number(f.copies);if(!f.copies||f.copies<1){toast("Copies must be at least 1.");return;}if(editingId){const old=data.books.find(b=>b.id===editingId);const issued=data.loans.filter(l=>l.bookId===editingId&&l.status==="Issued").length;if(f.copies<issued){toast(`At least ${issued} copies are currently issued.`);return;}Object.assign(old,f);}else data.books.push({id:"B-"+Date.now().toString().slice(-7),...f});toast(editingId?"Book updated":"Book added successfully");}
  if(modalMode==="member"){if(data.members.some(m=>m.email.toLowerCase()===f.email.toLowerCase()&&m.id!==editingId)){toast("A member with this email already exists.");return;}if(editingId)Object.assign(data.members.find(m=>m.id===editingId),f);else data.members.push({id:"M-"+Date.now().toString().slice(-7),...f,joined:todayISO()});toast(editingId?"Member updated":"Member registered");}
  if(modalMode==="issue"){const book=data.books.find(b=>b.id===f.bookId);if(!book||availableCopies(book)<1){toast("This book is no longer available.");return;}if(f.dueDate<f.issueDate){toast("Due date cannot be earlier than issue date.");return;}data.loans.push({id:"L-"+Date.now(),bookId:f.bookId,memberId:f.memberId,issueDate:f.issueDate,dueDate:f.dueDate,status:"Issued"});toast("Book issued successfully");}
  if(modalMode==="admin"){data.admin=f.admin.trim()||"Library Admin";toast("Administrator name updated");}
  saveData();closeModal();render();
}
function deleteBook(id){if(data.loans.some(l=>l.bookId===id&&l.status==="Issued")){toast("Return all issued copies before deleting this book.");return;}if(confirm("Delete this book from the collection?")){data.books=data.books.filter(b=>b.id!==id);saveData();render();toast("Book deleted");}}
function deleteMember(id){if(data.loans.some(l=>l.memberId===id&&l.status==="Issued")){toast("This member has an active loan. Return the book first.");return;}if(confirm("Delete this member?")){data.members=data.members.filter(m=>m.id!==id);saveData();render();toast("Member deleted");}}
function returnLoan(id){const loan=data.loans.find(l=>l.id===id);if(loan&&loan.status==="Issued"){loan.status="Returned";loan.returnDate=todayISO();saveData();render();toast("Book marked as returned");}}

$$(".nav-link").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.view)));
$$("[data-goto]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.goto)));
$("#addPrimaryBtn").addEventListener("click",()=>openModal("book"));
$("#addBookBtn").addEventListener("click",()=>openModal("book"));
$("#addMemberBtn").addEventListener("click",()=>openModal("member"));
$("#issueBookBtn").addEventListener("click",()=>openModal("issue"));
$("#profileBtn").addEventListener("click",()=>openModal("admin"));
$("#topProfileBtn").addEventListener("click",()=>openModal("admin"));
$("#closeModal").addEventListener("click",closeModal);$("#cancelModal").addEventListener("click",closeModal);
$("#modalBackdrop").addEventListener("click",e=>{if(e.target.id==="modalBackdrop")closeModal();});
$("#modalForm").addEventListener("submit",submitModal);
$("#bookSearch").addEventListener("input",renderBooks);$("#categoryFilter").addEventListener("change",renderBooks);
$("#memberSearch").addEventListener("input",renderMembers);$("#loanSearch").addEventListener("input",renderLoans);
$("#mobileMenu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
$("#helpBtn").addEventListener("click",()=>alert("Quick guide:\n1. Add books from the Books section.\n2. Register members.\n3. Issue available books to members.\n4. Use Return book to close an active loan.\n5. Search and filters help you find records quickly."));
document.addEventListener("click",e=>{
  const t=e.target;
  if(t.dataset.editBook){const b=data.books.find(x=>x.id===t.dataset.editBook);openModal("book",b);}
  if(t.dataset.deleteBook)deleteBook(t.dataset.deleteBook);
  if(t.dataset.editMember){const m=data.members.find(x=>x.id===t.dataset.editMember);openModal("member",m);}
  if(t.dataset.deleteMember)deleteMember(t.dataset.deleteMember);
  if(t.dataset.returnLoan)returnLoan(t.dataset.returnLoan);
  if(t.closest("[data-action]")){const action=t.closest("[data-action]").dataset.action;openModal(action==="book"?"book":action==="member"?"member":"issue");}
});
$("#todayLabel").textContent=new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"});
$("#year").textContent=new Date().getFullYear();
render();
