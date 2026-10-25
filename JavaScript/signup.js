document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.auth-card form');
  if (!form) return;
  form.noValidate = true;
  const get = id => document.getElementById(id);
  const first = get('first-name'), last = get('last-name'), email = get('email');
  const phone = get('phone'), status = get('status');
  const resume = get('resumeUpload'), password = get('pwd'), confirm = get('pwd-confirm');
  const terms = form.querySelector('.checkbox-row input[type="checkbox"]');
  const submit = form.querySelector('button[type="submit"]');
  JobHubAuth.passwordEye(password);
  JobHubAuth.passwordEye(confirm);
  const cap = JobHubAuth.captcha(form);
  JobHubAuth.initErrors(form);
  // Browser storage cannot safely retain a resume file. Validate file only.
  resume.addEventListener('change', () => {
    const label = form.querySelector('.file-label span');
    if (label) label.textContent = resume.files[0]?.name || 'Choose Resume File';
  });
  const strength = document.createElement('div');
  strength.className = 'jobhub-hint';
  password.closest('.form-group').appendChild(strength);
  password.addEventListener('input', () => {
    const p = password.value;
    const count = [p.length >= 8, /[A-Z]/.test(p), /[a-z]/.test(p), /\d/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
    strength.textContent = p ? `Password strength: ${count <= 2 ? 'Weak' : count < 5 ? 'Medium' : 'Strong'}` : '';
  });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (submit.disabled) return;
    const name1 = first.value.trim(), name2 = last.value.trim();
    const mail = email.value.trim().toLowerCase();
    const pwd = password.value;
    const fail = (field, text) => { JobHubAuth.message(field, text); JobHubAuth.toast(text, true); };
    if (!name1) return fail(first, 'Enter your first name.');
    if (!name2) return fail(last, 'Enter your last name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return fail(email, 'Enter a valid email address.');
    if (JobHubAuth.users().some(user => user.email === mail)) return fail(email, 'This email is already registered. Please log in.');
    if (!status.value) return fail(status, 'Please select your current status.');
    if (!resume.files.length) return fail(resume, 'Please select your resume.');
    const file = resume.files[0];
    if (!/\.(pdf|doc|docx)$/i.test(file.name)) return fail(resume, 'Upload a PDF, DOC or DOCX file.');
    if (file.size > 5 * 1024 * 1024) return fail(resume, 'Resume must be 5 MB or smaller.');
    if (!(pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /\d/.test(pwd) && /[^A-Za-z0-9]/.test(pwd))) return fail(password, 'Use 8+ characters, uppercase, lowercase, number and symbol.');
    if (pwd !== confirm.value) return fail(confirm, 'Passwords do not match.');
    if (!cap.valid()) { fail(cap.field, 'Incorrect CAPTCHA. Please try again.'); cap.refresh(); return; }
    if (!terms.checked) return fail(terms, 'Please agree to the terms to continue.');
    submit.disabled = true;
    try {
      const salt = JobHubAuth.randomId();
      const passwordHash = await JobHubAuth.hashPassword(pwd, salt);
      const registered = JobHubAuth.users();
      if (registered.some(user => user.email === mail)) return fail(email, 'This email is already registered. Please log in.');
      registered.push({
        id: JobHubAuth.randomId(), name: `${name1} ${name2}`, firstName: name1, lastName: name2,
        email: mail, phone: phone.value.trim(), status: status.value,
        resumeName: file.name, passwordSalt: salt, passwordHash,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem(JobHubAuth.USERS_KEY, JSON.stringify(registered));
      sessionStorage.setItem(JobHubAuth.PREFILL_KEY, mail);
      JobHubAuth.toast('Account created successfully! Redirecting to login...');
      setTimeout(() => window.location.href = 'login.html', 1300);
    } catch (err) {
      console.error(err);
      JobHubAuth.toast('Could not save account. Use HTTPS or localhost and enable browser storage.', true);
    } finally { submit.disabled = false; }
  });
});
