import { loadTasks, saveTasks } from './storage.js';

// orden de las columnas, lo uso para las flechas de mover
const STATUSES = ['todo', 'doing', 'done'];

let tasks = loadTasks();
let searchText = '';

const form = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const prioritySelect = document.getElementById('task-priority');
const searchInput = document.getElementById('search');
const template = document.getElementById('task-template');
const columns = document.querySelectorAll('.column');

// ---------- cambios en las tareas ----------

// cada vez que cambia algo guardo y vuelvo a pintar todo el tablero
function update(newTasks) {
  tasks = newTasks;
  saveTasks(tasks);
  render();
}

function addTask(title, priority) {
  // crypto.randomUUID genera un id unico, asi no se repiten
  const task = { id: crypto.randomUUID(), title, priority, status: 'todo' };
  update([...tasks, task]);
}

function deleteTask(id) {
  update(tasks.filter((task) => task.id !== id));
}

function moveTask(id, newStatus) {
  update(tasks.map((task) => (task.id === id ? { ...task, status: newStatus } : task)));
}

function renameTask(id, newTitle) {
  update(tasks.map((task) => (task.id === id ? { ...task, title: newTitle } : task)));
}

// ---------- pintar ----------

function createTaskElement(task) {
  // cloneNode(true) copia el template con todo lo que tiene adentro
  const li = template.content.firstElementChild.cloneNode(true);
  li.dataset.id = task.id;
  li.classList.add(`priority-${task.priority}`);

  li.querySelector('.priority').textContent = task.priority;
  li.querySelector('.task-title').textContent = task.title;

  const index = STATUSES.indexOf(task.status);
  // en la primera columna no se puede ir a la izquierda ni en la ultima a la derecha
  li.querySelector('.move-left').disabled = index === 0;
  li.querySelector('.move-right').disabled = index === STATUSES.length - 1;

  return li;
}

function render() {
  columns.forEach((column) => {
    const status = column.dataset.status;
    const list = column.querySelector('.task-list');
    const columnTasks = tasks.filter((task) => task.status === status);
    const visibleTasks = columnTasks.filter((task) =>
      task.title.toLowerCase().includes(searchText),
    );

    list.innerHTML = '';
    visibleTasks.forEach((task) => list.appendChild(createTaskElement(task)));

    if (columnTasks.length === 0) {
      list.innerHTML = '<li class="empty">Arrastra tareas aquí</li>';
    } else if (visibleTasks.length === 0) {
      list.innerHTML = '<li class="empty">Sin resultados</li>';
    }

    column.querySelector('.count').textContent = columnTasks.length;
  });
}

// ---------- formulario y busqueda ----------

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;

  addTask(title, prioritySelect.value);
  titleInput.value = '';
  titleInput.focus();
});

searchInput.addEventListener('input', () => {
  searchText = searchInput.value.trim().toLowerCase();
  render();
});

// ---------- clicks dentro de las tareas ----------

// en vez de ponerle un listener a cada boton le pongo uno solo al tablero
// y con closest veo a que tarea le dieron click (event delegation)
document.querySelector('.board').addEventListener('click', (e) => {
  const taskEl = e.target.closest('.task');
  if (!taskEl) return;

  const id = taskEl.dataset.id;
  const task = tasks.find((t) => t.id === id);
  const index = STATUSES.indexOf(task.status);

  if (e.target.closest('.delete')) {
    if (confirm(`¿Borrar "${task.title}"?`)) deleteTask(id);
  } else if (e.target.closest('.move-left')) {
    moveTask(id, STATUSES[index - 1]);
  } else if (e.target.closest('.move-right')) {
    moveTask(id, STATUSES[index + 1]);
  }
});

// doble clic en el texto para editar la tarea
document.querySelector('.board').addEventListener('dblclick', (e) => {
  const titleEl = e.target.closest('.task-title');
  if (!titleEl) return;

  const id = titleEl.closest('.task').dataset.id;
  // contentEditable deja escribir directo sobre el parrafo
  titleEl.contentEditable = 'true';
  titleEl.focus();

  // seleccionar todo el texto para que sea mas facil reemplazarlo
  document.getSelection().selectAllChildren(titleEl);

  function finish(save) {
    titleEl.contentEditable = 'false';
    const newTitle = titleEl.textContent.trim();
    if (save && newTitle) {
      renameTask(id, newTitle);
    } else {
      render(); // si quedo vacio o cancelo vuelve el texto de antes
    }
  }

  titleEl.addEventListener('blur', () => finish(true), { once: true });
  titleEl.addEventListener('keydown', function onKey(ev) {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      titleEl.removeEventListener('keydown', onKey);
      titleEl.blur();
    } else if (ev.key === 'Escape') {
      titleEl.removeEventListener('keydown', onKey);
      titleEl.textContent = '';
      titleEl.blur();
    }
  });
});

// ---------- drag and drop ----------

let draggedId = null;

document.addEventListener('dragstart', (e) => {
  const taskEl = e.target.closest?.('.task');
  if (!taskEl) return;

  draggedId = taskEl.dataset.id;
  taskEl.classList.add('dragging');
  // firefox no deja arrastrar si no se le pone algo al dataTransfer
  e.dataTransfer.setData('text/plain', draggedId);
  e.dataTransfer.effectAllowed = 'move';
});

document.addEventListener('dragend', (e) => {
  e.target.closest?.('.task')?.classList.remove('dragging');
  columns.forEach((column) => column.classList.remove('drag-over'));
  draggedId = null;
});

columns.forEach((column) => {
  // por defecto el navegador no deja soltar cosas, preventDefault en dragover lo permite
  column.addEventListener('dragover', (e) => {
    if (!draggedId) return;
    e.preventDefault();
    column.classList.add('drag-over');
  });

  column.addEventListener('dragleave', (e) => {
    // dragleave tambien salta al pasar por encima de los hijos, por eso reviso relatedTarget
    if (!column.contains(e.relatedTarget)) {
      column.classList.remove('drag-over');
    }
  });

  column.addEventListener('drop', (e) => {
    e.preventDefault();
    column.classList.remove('drag-over');
    if (draggedId) moveTask(draggedId, column.dataset.status);
  });
});

render();
