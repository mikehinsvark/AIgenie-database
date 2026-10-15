(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const menu = $('#mobile-menu'), sidebar = $('#playbook-sidebar');
  const mobile = matchMedia('(max-width:760px)');
  function setMenu(open) {
    sidebar.classList.toggle('open',open);
    sidebar.inert = mobile.matches && !open;
    menu.setAttribute('aria-expanded',String(open));
    menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');
  }
  setMenu(false);
  mobile.addEventListener('change',()=>setMenu(false));
  menu.addEventListener('click',()=>setMenu(!sidebar.classList.contains('open')));
  $('[data-close-nav]').addEventListener('click',()=>{setMenu(false);menu.focus();});
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&sidebar.classList.contains('open')) {setMenu(false);menu.focus();}
  });
  let timer;
  function toast(text) {clearTimeout(timer);$('#pb-toast').textContent=text;$('#pb-toast').classList.add('show');timer=setTimeout(()=>$('#pb-toast').classList.remove('show'),3500);}
  async function copy(id) {
    const target=document.getElementById(id);
    if(!target)return;
    const value=target.textContent.trim();
    try {await navigator.clipboard.writeText(value);toast('Copied. Make it your own before you send.');}
    catch {$('#pb-copy-text').value=value;$('#pb-copy-dialog').showModal();$('#pb-copy-text').focus();$('#pb-copy-text').select();}
  }
  function selectTab(button) {
    const group=button.closest('[role="tablist"]');
    group.querySelectorAll('[role="tab"]').forEach(tab=>{
      const active=tab===button;
      tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden=!active;
    });
  }
  document.addEventListener('click',event=>{
    const copyButton=event.target.closest('[data-copy]');if(copyButton)copy(copyButton.dataset.copy);
    const tab=event.target.closest('[role="tab"]');if(tab)selectTab(tab);
    if(event.target.closest('[data-close-copy]'))$('#pb-copy-dialog').close();
    if(sidebar.classList.contains('open')&&!sidebar.contains(event.target)&&!menu.contains(event.target))setMenu(false);
    if(event.target.closest('#playbook-sidebar a'))setMenu(false);
  });
  $$('[role="tablist"]').forEach(group=>group.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    const tabs=[...group.querySelectorAll('[role="tab"]')],i=tabs.indexOf(document.activeElement);if(i<0)return;
    event.preventDefault();
    const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(i+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
    selectTab(tabs[next]);tabs[next].focus();
  }));
  $$('[data-checklist]').forEach(group=>{
    const checks=[...group.querySelectorAll('input[type="checkbox"]')];
    const update=()=>{const n=checks.filter(x=>x.checked).length;group.querySelector('progress').value=n;group.querySelector('[data-progress-label]').textContent=`${n} of ${checks.length} ready${n===checks.length?' · You have a plan.':''}`;};
    checks.forEach(c=>c.addEventListener('change',update));update();
  });
  const scriptTemplates=$$('[data-personalized]').map(el=>[el,el.textContent]);
  function personalize(){
    const fields=Object.fromEntries($$('[data-personalize]').map(el=>[el.dataset.personalize,el.value.trim()]));
    scriptTemplates.forEach(([el,text])=>{el.textContent=text.replace(/\[Your Name\]|\[First Name\]|\[Shared Detail\]/g,key=>fields[key]||key);});
  }
  $$('[data-personalize]').forEach(el=>el.addEventListener('input',personalize));
  const city=$('#event-city');
  if(city)city.addEventListener('input',()=>{
    const place=city.value.trim();
    $('#chamber-search').href='https://www.google.com/search?q='+encodeURIComponent((place||'local')+' chamber of commerce events');
    $('#association-search').href='https://www.google.com/search?q='+encodeURIComponent((place||'local')+' business networking events');
  });
  const conversations={
    costs:['Operating costs','“Which business expense would you most like to understand better this year?”','Ask what they have already reviewed, who helps them evaluate options, and what would make a second look worthwhile.'],
    people:['Employees & benefits','“What is working well for your team, and where are you getting the most questions?”','Listen for their experience with recruiting, retention, benefits, and the time spent administering programs.'],
    growth:['Growth & cash flow','“What is your biggest priority for the business over the next few months?”','Ask what is making progress difficult, what they have already tried, and who should be part of the next conversation.']
  };
  $$('[data-conversation]').forEach(button=>button.addEventListener('click',()=>{
    $$('[data-conversation]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    const [title,opener,note]=conversations[button.dataset.conversation];
    $('#conversation-title').textContent=title;$('#conversation-opener').textContent=opener;$('#conversation-note').textContent=note;
  }));
  const visit=$('#walk-area');
  if(visit){
    const update=()=>{
      const area=visit.value.trim()||'[Business district]';
      const day=$('#walk-day').value;const n=Number($('#walk-stops').value);
      $('#walk-plan-title').textContent=`${day} · ${n} planned stops`;
      $('#walk-plan-text').textContent=`Area: ${area}\nPlan: Visit ${n} businesses during a quiet service window.\nBring: Connect Cards, a working link, and a place to take notes.\nAt each stop: Ask whether it is a good time; keep the introduction brief.\nAfter each conversation: Record the name, business, shared detail, and agreed next step.\nFollow-up: Send the resource you promised through the channel they agreed to use.`;
    };
    [visit,$('#walk-day'),$('#walk-stops')].forEach(el=>el.addEventListener('input',update));update();
  }
  const cost=$('#cloud-cost');
  if(cost){
    const money=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(value);
    const read=id=>{const raw=$(id).value;const n=Number(raw);return raw.trim()!==''&&Number.isFinite(n)&&n>=0?n:null;};
    const update=()=>{
      const base=read('#cloud-cost'),usage=read('#cloud-usage'),setup=read('#cloud-setup'),contribution=read('#cloud-contribution');
      if([base,usage,setup].some(x=>x===null)){$('#cloud-total').textContent='Enter valid costs';$('#cloud-first').textContent='Use zero for a cost that does not apply.';$('#cloud-cover').textContent='Complete the costs to see the scenario.';return;}
      const monthly=base+usage;
      $('#cloud-total').textContent=money(monthly)+'/month';
      $('#cloud-first').textContent=`First month including setup: ${money(monthly+setup)}. Ongoing annual cost: ${money(monthly*12)}.`;
      $('#cloud-cover').textContent=contribution===null||contribution===0?'Enter a positive net contribution to calculate cost coverage.':`${Math.ceil(monthly/contribution)} completed sale${Math.ceil(monthly/contribution)===1?'':'s'} at ${money(contribution)} net contribution each would cover this monthly cost.`;
    };
    $$('[data-cloud-cost]').forEach(el=>el.addEventListener('input',update));update();
  }
})();
