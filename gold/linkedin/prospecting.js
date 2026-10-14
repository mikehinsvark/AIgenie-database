'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const audiences = {
    clients: {
      roles: ['Owner','CEO','CFO','President','Founder','Partner','Managing Director','Principal','Managing Partner','Controller','COO','VP Finance'],
      label: 'Pick one title to start', kicker: 'BUSINESS CLIENTS',
      heading: 'Start with people\nyou already know.',
      description: 'Look for owners and decision-makers whose business you can understand before offering a relevant resource.',
      tip: 'For CEOs, explore priorities and growth. For CFOs, ask about costs and review processes. Let their needs guide the conversation.',
      offerTip: 'Discuss the need first. Eligibility, costs, and results depend on the business and the program.'
    },
    partners: {
      roles: ['CPA','Accountant','Payroll','Insurance broker','Business consultant','Financial adviser','Chamber of commerce'],
      label: 'Choose a potential referral relationship', kicker: 'STRATEGIC ALLIANCES',
      heading: 'Find complementary\nways to help.',
      description: 'Look for trusted advisers who serve the kinds of businesses you understand. Explore shared priorities and a useful reason to stay in touch.',
      tip: 'Ask who they help and what needs they see. A relevant introduction can be more useful than a service pitch.',
      offerTip: 'Keep the focus on a mutual fit and useful introductions. Discuss any referral arrangement separately and clearly.'
    },
    opportunity: {
      roles: ['Looking for a Sales Opportunity','Seeking a Sales Opportunity','Sales professional'],
      label: 'Try a phrase, then read the profile', kicker: 'SALES OPPORTUNITIES',
      heading: 'Read the interest.\nAsk what it means.',
      description: 'Search these phrases as keywords, then check the profile and ask what the person wants to explore. A match does not confirm their current interest.',
      tip: 'Open to Work describes job interests. It does not establish interest in a referral business. Confirm the person’s goals before sharing an opportunity.',
      offerTip: 'Use this invitation only after they express interest. Review current responsibilities, costs, qualifications, and compensation terms together; do not imply guaranteed earnings.'
    }
  };
  let currentAudience = 'clients';
  let currentRole = 'Owner';
  let toastTimer;
  const fieldValue = (id, fallback) => $(id).value.trim() || fallback;
  const quoteTerm = term => /\s/.test(term) ? `"${term}"` : term;

  function updateSearch() {
    const keyword = $('#search-keyword').value.replace(/["“”]/g, '').trim();
    const query = quoteTerm(currentRole) + (keyword ? ` AND ${quoteTerm(keyword)}` : '');
    $('#search-query').textContent = query;
    const url = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
    $('#people-search').href = url;
    $('#plan-search').href = url;
  }

  function updateMessages() {
    const sender = fieldValue('#sender-name', '[Your Name]');
    const first = fieldValue('#first-name', '[First Name]');
    const company = fieldValue('#company-name', '[Company]');
    const detail = fieldValue('#shared-detail', '[Genuine detail]');
    const note = `${first}, I’m expanding my network with like-minded professionals. Your work at ${company} caught my eye. I’d enjoy connecting. — ${sender}`;
    $('#message-connect').textContent = note;
    const count = Array.from(note).length;
    $('#note-count').textContent = `${count} characters${count > 200 ? ' · Shorten for accounts with a 200-character limit.' : ' · A short, friendly starting point.'}`;
    $('#message-rapport').textContent = `Thanks for connecting, ${first}. I noticed ${detail}.\n\nI enjoy exchanging useful ideas with like-minded professionals and making introductions when there’s a good fit.\n\nWhat are you focused on at ${company} right now?\n\n— ${sender}`;
    const offers = {
      clients: `${first}, based on what you shared, would you be open to a short overview of how Dreams Business Resources helps owners explore business costs, employee benefits, and potential tax-credit opportunities?\n\nIf it looks relevant for ${company}, we can decide whether a conversation makes sense.\n\n— ${sender}`,
      partners: `${first}, I’d enjoy learning more about the clients you help at ${company} and the needs you see most often.\n\nI work with business owners through Dreams Business Resources. There may be useful introductions or complementary resources we can share when there’s a good fit.\n\nWould you be open to a brief conversation to compare notes?\n\n— ${sender}`,
      opportunity: `${first}, you mentioned you’re open to exploring sales opportunities. Would you like a short overview of the work and resources available through Dreams Business Resources?\n\nWe can review the current responsibilities, training, costs, qualifications, and compensation terms to see whether it fits what you’re looking for.\n\nWould it be useful if I shared the overview first?\n\n— ${sender}`
    };
    $('#message-offer').textContent = offers[currentAudience];
    $('#message-b2b-one').textContent = `Hey ${first} — I noticed ${detail} at ${company}.\n\nI work with business owners who want a clearer view of operating costs, employee benefits, and potential tax-credit opportunities.\n\nWould you be opposed to me sending over a quick overview?`;
    $('#message-b2b-two').textContent = `Hi ${first} — when did ${company} last review whether its current activities might qualify for R&D tax credits?\n\nIf a fresh look would be useful, I can share an overview of the review process and the information a qualified specialist would need.\n\nWould that be relevant to your priorities right now?`;
  }

  function setAudience(key) {
    if (!audiences[key]) return;
    currentAudience = key;
    const config = audiences[key];
    currentRole = config.roles[0];
    $$('[data-audience]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.audience === key)));
    $('#role-label').textContent = config.label;
    $('#audience-kicker').textContent = config.kicker;
    $('#audience-heading').textContent = config.heading;
    $('#audience-description').textContent = config.description;
    $('#audience-tip').textContent = config.tip;
    $('#offer-tip').textContent = config.offerTip;
    $('#opportunity-overview').hidden = key !== 'opportunity';
    const roleButtons = config.roles.map(role => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.role = role;
      button.textContent = role;
      button.setAttribute('aria-pressed', String(role === currentRole));
      return button;
    });
    $('#role-chips').replaceChildren(...roleButtons);
    updateSearch();
    updateMessages();
  }

  function toast(message) {
    clearTimeout(toastTimer);
    $('#prospect-toast').textContent = message;
    $('#prospect-toast').classList.add('show');
    toastTimer = setTimeout(() => $('#prospect-toast').classList.remove('show'), 3000);
  }

  async function copyText(id) {
    const target = document.getElementById(id);
    if (!target) return;
    const text = target.textContent.trim();
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      toast('Copied. Make it your own before you send.');
    } catch {
      $('#copy-fallback-text').value = text;
      $('#copy-dialog').showModal();
      $('#copy-fallback-text').focus();
      $('#copy-fallback-text').select();
    }
  }

  const menu = $('#mobile-menu');
  const sidebar = $('#prospect-sidebar');
  function setMenu(open) {
    sidebar.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  }
  menu.addEventListener('click', () => setMenu(!sidebar.classList.contains('open')));
  document.addEventListener('click', event => {
    const audience = event.target.closest('[data-audience]');
    if (audience) setAudience(audience.dataset.audience);
    const role = event.target.closest('[data-role]');
    if (role) {
      currentRole = role.dataset.role;
      $$('[data-role]').forEach(button => button.setAttribute('aria-pressed', String(button === role)));
      updateSearch();
    }
    const copy = event.target.closest('[data-copy]');
    if (copy) copyText(copy.dataset.copy);
    if (event.target.closest('[data-open-art]')) $('#roadmap-dialog').showModal();
    if (event.target.closest('[data-close-art]')) $('#roadmap-dialog').close();
    if (event.target.closest('[data-close-copy]')) $('#copy-dialog').close();
    if ((!sidebar.contains(event.target) && !menu.contains(event.target)) || event.target.closest('#prospect-sidebar a')) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && sidebar.classList.contains('open')) { setMenu(false); menu.focus(); }
  });
  $('#search-keyword').addEventListener('input', updateSearch);
  $$('.personalize-fields input').forEach(input => input.addEventListener('input', updateMessages));
  $$('[data-plan-step]').forEach(checkbox => checkbox.addEventListener('change', () => {
    const complete = $$('[data-plan-step]:checked').length;
    $('#plan-progress').textContent = `${complete} of 5 steps complete${complete === 5 ? ' · A thoughtful start.' : ''}`;
    $('#plan-bar').style.width = `${complete * 20}%`;
  }));
  updateMessages();
})();
