// validaciones.js
// Cada regla es una función pura: recibe el valor (y todos los datos)
// y devuelve un mensaje de error, o null si está bien. No toca el DOM.

export const requerido = (msg = 'Este campo es obligatorio.') =>
  (v) => (v === undefined || v === null || String(v).trim() === '' ? msg : null);

export const longitud = (min, max) =>
  (v) => (v.length < min ? `Usa al menos ${min} caracteres.`
    : v.length > max ? `Usa como máximo ${max} caracteres.` : null);

export const formatoCorreo = () =>
  (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
    ? null
    : 'Escribe un correo válido, por ejemplo ana@mail.com.');

export const rangoEntero = (min, max) => (v) => {
  const n = Number(v);
  if (!Number.isInteger(n)) return 'Escribe un número entero.';
  if (n < min) return `El valor mínimo es ${min}.`;
  if (n > max) return `El valor máximo es ${max}.`;
  return null;
};

export const igualA = (otroCampo, msg) =>
  (v, datos) => (v === datos[otroCampo] ? null : msg);

// Al menos una letra y al menos un número
export const letraYNumero = (msg = 'Incluye al menos una letra y un número.') =>
  (v) => (/[A-Za-z]/.test(v) && /\d/.test(v) ? null : msg);

// Un checkbox marcado llega en FormData con el valor 'on'
export const debeMarcar = (msg = 'Debes aceptar los términos para continuar.') =>
  (v) => (v === 'on' ? null : msg);

// Teléfono: de 7 a 15 dígitos, con + opcional al inicio
export const formatoTelefono = () =>
  (v) => (/^\+?\d{7,15}$/.test(v)
    ? null
    : 'Escribe de 7 a 15 dígitos; puedes empezar con +.');

// Las 7 reglas del registro en un solo lugar
export const reglas = {
  nombre: [requerido(), longitud(3, 60)],
  email: [requerido(), formatoCorreo()],
  password: [requerido(), longitud(8, 64), letraYNumero()],
  confirmar: [requerido(), igualA('password', 'Las contraseñas no coinciden.')],
  edad: [requerido(), rangoEntero(18, 120)],
  pais: [requerido('Elige un país.')],
  terminos: [debeMarcar()],
};

// Reglas de cada teléfono (campo dinámico, varios con el mismo name)
export const reglasTelefono = [
  requerido('Escribe el teléfono o quita este campo.'),
  formatoTelefono(),
];

// Devuelve el primer error del campo, o null
export function validarCampo(nombre, datos) {
  for (const regla of reglas[nombre] ?? []) {
    const error = regla(datos[nombre] ?? '', datos);
    if (error) return error;
  }
  return null;
}

// Devuelve el primer error de un teléfono, o null
export function validarTelefono(valor) {
  for (const regla of reglasTelefono) {
    const error = regla(valor ?? '', {});
    if (error) return error;
  }
  return null;
}

// Devuelve un objeto { campo: mensaje } solo con los campos con error
export function validarFormulario(datos) {
  const errores = {};
  for (const nombre of Object.keys(reglas)) {
    const error = validarCampo(nombre, datos);
    if (error) errores[nombre] = error;
  }
  return errores;
}
