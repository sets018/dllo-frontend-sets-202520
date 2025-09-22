// Credenciales validas
const users = [{ username: "admin", password: "admin" }];

//  Redireccion a la pagina del to-do si ya esta autenticado
if (localStorage.getItem("authenticated") === "1") {
  window.location.href = "todo.html";
}

// Logica del login
const form = document.getElementById('loginForm');
const errorMsg = document.getElementById('errorMsg');

form.addEventListener('submit', function(e) {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  const found = users.find(u => u.username === username && u.password === password);
  if (found) {
    localStorage.setItem('authenticated', '1');
    window.location.href = "todo.html";
  } else {
    errorMsg.textContent = "Wrong username or password";
    setTimeout(() => errorMsg.textContent = "", 3000);
  }
});