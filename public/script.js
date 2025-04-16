// script.js atualizado

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const uploadForm = document.getElementById('upload-form');
  const registerForm = document.getElementById('register-form');
  const fileList = document.getElementById('file-list');
  const userNameSpan = document.getElementById('user-name');
  const loginCard = document.getElementById('login-card');
  const portal = document.getElementById('portal');
  const registerContainer = document.querySelector('.register-container');
  const registerSuccess = document.getElementById('register-success');
  const historyContainer = document.querySelector('.history-container');

  let currentUser = null;
  let historyLog = [];

  function addToHistory(action) {
    historyLog.push(action);
    if (currentUser?.role === 'moderador') {
      historyContainer.style.display = 'block';
      historyContainer.innerHTML = `
        <h3>Histórico de atividades</h3>
        <ul>${historyLog.map(h => `<li>${h}</li>`).join('')}</ul>
      `;
    }
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success) {
        currentUser = { username, role: data.role };
        userNameSpan.textContent = username;
        loginCard.style.display = 'none';
        portal.style.display = 'block';

        if (data.role === 'moderador') {
          registerContainer.style.display = 'block';
        }

        addToHistory(`Login realizado por ${username}`);
        loadFiles();
      } else {
        alert('Usuário ou senha inválidos.');
      }
    } catch (error) {
      alert('Erro ao tentar login.');
    }
  });

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(uploadForm);

    const res = await fetch('/upload', {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      alert('Arquivo enviado com sucesso!');
      addToHistory(`${currentUser.username} enviou um arquivo.`);
      uploadForm.reset();
      loadFiles();
    } else {
      alert('Erro ao enviar o arquivo.');
    }
  });

  async function loadFiles() {
    const res = await fetch('/files');
    const files = await res.json();

    fileList.innerHTML = '';
    files.forEach(file => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${file}</span>
        <button onclick="window.location.href='/download/${file}'">Download</button>
        ${currentUser.role === 'moderador' ? `<button class="delete-btn" data-file="${file}">Excluir</button>` : ''}
      `;
      fileList.appendChild(li);
    });

    if (currentUser.role === 'moderador') {
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const filename = btn.getAttribute('data-file');
          const confirmDelete = confirm(`Tem certeza que deseja excluir "${filename}"?`);
          if (confirmDelete) {
            const delRes = await fetch(`/delete/${filename}`, { method: 'DELETE' });
            if (delRes.ok) {
              addToHistory(`${currentUser.username} excluiu o arquivo "${filename}"`);
              loadFiles();
            } else {
              alert('Erro ao excluir o arquivo.');
            }
          }
        });
      });
    }
  }

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newUser = document.getElementById('new-username').value.trim();
    const newPass = document.getElementById('new-password').value.trim();
    const newRole = document.getElementById('new-role').value;

    try {
      const res = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUser, password: newPass, role: newRole })
      });

      const data = await res.json();
      if (data.success) {
        registerSuccess.textContent = `Usuário ${newUser} cadastrado com sucesso!`;
        registerForm.reset();
        addToHistory(`Usuário ${newUser} (${newRole}) cadastrado.`);
      } else {
        registerSuccess.textContent = data.message || 'Erro ao cadastrar usuário.';
      }
    } catch (err) {
      registerSuccess.textContent = 'Erro ao cadastrar usuário.';
    }
  });
});
