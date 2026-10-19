// guardar y cargar las tareas del localStorage

const KEY = 'kanban:tareas';

// tareas de ejemplo para que la primera vez no salga el tablero vacio
const EXAMPLE_TASKS = [
  { id: '1', title: 'Arrastra esta tarea a otra columna', priority: 'media', status: 'todo' },
  { id: '2', title: 'Doble clic en el texto para editarlo', priority: 'baja', status: 'todo' },
  { id: '3', title: 'Estudiar drag and drop de HTML5', priority: 'alta', status: 'doing' },
  { id: '4', title: 'Crear el tablero', priority: 'media', status: 'done' },
];

export function loadTasks() {
  try {
    const saved = localStorage.getItem(KEY);
    // localStorage guarda texto, JSON.parse lo vuelve a convertir en array
    return saved ? JSON.parse(saved) : EXAMPLE_TASKS;
  } catch {
    // si el json esta dañado o el navegador no deja leer arranco con los de ejemplo
    return EXAMPLE_TASKS;
  }
}

export function saveTasks(tasks) {
  try {
    localStorage.setItem(KEY, JSON.stringify(tasks));
  } catch {
    // en modo incognito a veces falla, la app sigue funcionando igual
  }
}
