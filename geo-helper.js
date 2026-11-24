/*
 * geo-helper.js
 * Adaptador reutilizable de la Geolocation API basado exclusivamente en
 * promesas. No conoce la interfaz y puede consumirse desde cualquier módulo.
 */

function traducirErrorGeolocalizacion(error) {
  switch (error.code) {
    case 1:
      return 'Permiso de ubicación denegado. Puedes ingresar tu zona manualmente.';
    case 2:
      return 'No fue posible determinar tu ubicación (señal GPS o Wi-Fi no disponible).';
    case 3:
      return 'Se agotó el tiempo de espera intentando obtener las coordenadas.';
    default:
      return 'Ocurrió un error inesperado al consultar la ubicación.';
  }
}

function obtenerUbicacionActual(opcionesPersonalizadas) {
  var opciones = Object.assign(
    {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 30000
    },
    opcionesPersonalizadas || {}
  );

  return new Promise(function (resolve, reject) {
    if (!('geolocation' in navigator)) {
      reject(new Error('Este navegador no soporta la API de Geolocalización.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      function (posicion) {
        resolve({
          latitud: posicion.coords.latitude,
          longitud: posicion.coords.longitude,
          precisionMetros: Math.round(posicion.coords.accuracy),
          timestamp: posicion.timestamp
        });
      },
      function (error) {
        reject(new Error(traducirErrorGeolocalizacion(error)));
      },
      opciones
    );
  });
}

function consultarEstadoPermisoGeo() {
  if (!('permissions' in navigator) || typeof navigator.permissions.query !== 'function') {
    return Promise.resolve('prompt');
  }

  return navigator.permissions.query({ name: 'geolocation' })
    .then(function (resultado) {
      return resultado.state;
    })
    .catch(function () {
      // Safari/iOS puede no implementar la consulta aunque sí tenga geolocalización.
      return 'prompt';
    });
}
