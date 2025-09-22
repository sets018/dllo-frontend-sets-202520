// Verifica que si hubo autenticacion, sino redirige al login
if (localStorage.getItem("authenticated") !== "1") {
  window.location.href = "index.html";
}

// Variables globales asociadas a elementos del dom
const todoForm = document.getElementById("todoForm");
const todoInput = document.getElementById("todoInput");
const todoList = document.getElementById("todoList");
const todoError = document.getElementById("todoError");
const logoutBtn = document.getElementById("logoutBtn");

const LOCAL_KEY = "todos";
let apiTodos = []; // Tareas externas que ya vienen de la api, no editables

// Logout, devuelve al login y elimina autenticacion
logoutBtn.onclick = function () {
  localStorage.removeItem("authenticated");
  window.location.href = "index.html";
};

// funciones Helpers para manejar LocalStorage
function loadTodos() {
  return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
}
function saveTodos(todos) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(todos));
}
function nextId() {
  const todos = loadTodos();
  return todos.length > 0 ? Math.max(...todos.map(t => t.id || 0)) + 1 : 1;
}

// Validaciones de inputs
function validarTexto(text, todos, ignoreId = null) {
  text = text.trim();
  if (!text) return "Text cannot be empty";
  if (/^\d+$/.test(text)) return "Text cannot be only numbers";
  if (text.length < 10) return "Text must be at least 10 characters";
  const repetido = todos.some(t =>
    t.text.trim().toLowerCase() === text.toLowerCase() &&
    t.id !== ignoreId
  );
  if (repetido) return "Duplicate texts are not allowed";
  return "";
}
function mostrarError(msg) {
  todoError.textContent = msg;
  setTimeout(() => (todoError.textContent = ""), 15000);
}

// Mostrar tareas en el DOM
function renderTodos() {
  const locales = loadTodos();
  let allTodos = [...locales, ...apiTodos];
  allTodos.sort((a, b) => b.createdAt - a.createdAt);

  todoList.innerHTML = "";
  allTodos.forEach(todo => {
    const li = document.createElement("li");
  li.className = "todo-item" + (todo.done ? " done" : "");
  li.dataset.id = todo.id;

    // Checkbox done (solo locales)
    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = todo.done;
    check.disabled = !!todo.external;
    check.className = "toggle-done";

    // Texto de la tarea
    const textSpan = document.createElement("span");
    textSpan.textContent = todo.text;
    if (todo.done) textSpan.classList.add("done");
    if (todo.external) {
      textSpan.title = "Tarea importada de la API";
      textSpan.style.fontStyle = "italic";
    }

    // Mostrar fechas (creado/editado)
    const fecha = document.createElement("small");
    fecha.textContent =
      "Created: " + new Date(todo.createdAt).toLocaleString() +
      " | Edited: " + new Date(todo.updatedAt).toLocaleString();

    // Acciones (solo locales: editar y eliminar)
    const actions = document.createElement("div");
    if (!todo.external) {
      const editBtn = document.createElement("button");
      editBtn.textContent = "✎";
      editBtn.className = "edit";
      editBtn.title = "Editar tarea";
      actions.appendChild(editBtn);

      const delBtn = document.createElement("button");
      delBtn.textContent = "🗑";
      delBtn.className = "delete";
      delBtn.title = "Eliminar tarea";
      actions.appendChild(delBtn);
    }

    li.appendChild(check);
    li.appendChild(textSpan);
    li.appendChild(fecha);
    li.appendChild(actions);

    todoList.appendChild(li);
  });
}

// CRUD
todoForm.onsubmit = function (e) {
  e.preventDefault();
  const texto = todoInput.value.trim();
  const locales = loadTodos();

  const error = validarTexto(texto, locales);
  if (error) {
    mostrarError(error);
    return;
  }

  const ahora = Date.now();
  const nuevoTodo = {
    id: nextId(),
    text: texto,
    done: false,
    createdAt: ahora,
    updatedAt: ahora
  };

  locales.push(nuevoTodo);
  saveTodos(locales);
  todoInput.value = "";
  renderTodos();
};

// Actualizar (edit y done) y Eliminar
todoList.onclick = function (e) {
  const li = e.target.closest("li");
  if (!li) return;
  const id = Number(li.dataset.id);

  // Encuentra solo en tareas locales (no de API)
  const locales = loadTodos();
  const idx = locales.findIndex(t => t.id === id);
  if (idx === -1) return;

  if (e.target.classList.contains("edit")) {
    // Editar el 'text'
    const textoActual = locales[idx].text;
    const nuevoTexto = prompt("Editar tarea:", textoActual);
    if (nuevoTexto === null) return;
    const err = validarTexto(nuevoTexto, locales, id);
    if (err) {
      mostrarError(err);
      return;
    }
    locales[idx].text = nuevoTexto.trim();
    locales[idx].updatedAt = Date.now();
    saveTodos(locales);
    renderTodos();

  } else if (e.target.classList.contains("delete")) {
    // Eliminar
    if (confirm("¿Seguro que quieres eliminar esta tarea?")) {
      locales.splice(idx, 1);
      saveTodos(locales);
      renderTodos();
    }

  } else if (e.target.classList.contains("toggle-done")) {
    // Marcar como hecha/no hecha
    locales[idx].done = e.target.checked;
    locales[idx].updatedAt = Date.now();
    saveTodos(locales);
    renderTodos();
  }
};

// Fetch a la API externa y mostrar debajo de las propias 
async function cargarExternas() {
  try {
  const r = await fetch("https://dummyjson.com/c/28e8-a101-4223-a35c");
    const data = await r.json();
    apiTodos = (Array.isArray(data) ? data : []).map(t => ({
      ...t,
      external: true
    }));
    console.log(data); // <-- Aqui si funciona
  } catch (e) {
    apiTodos = [];
  } finally {
    renderTodos();
  }
  
}

cargarExternas();
renderTodos();