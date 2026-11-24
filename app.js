/* global obtenerUbicacionActual, consultarEstadoPermisoGeo */

(function () {
  'use strict';

  var panelIds = ['initial-panel', 'consent-panel', 'loading-panel', 'result-panel', 'manual-panel'];
  var startButton = document.getElementById('start-location');
  var confirmButton = document.getElementById('confirm-location');
  var retryButton = document.getElementById('retry-location');
  var changeButton = document.getElementById('change-location');
  var manualButtons = document.querySelectorAll('.js-manual');
  var manualForm = document.getElementById('manual-panel');
  var zoneSelect = document.getElementById('zone');
  var otherZoneRow = document.getElementById('other-zone-row');
  var otherZoneInput = document.getElementById('other-zone');
  var errorBox = document.getElementById('error-box');

  function mostrarPanel(id) {
    panelIds.forEach(function (panelId) {
      document.getElementById(panelId).hidden = panelId !== id;
    });
    if (id !== 'manual-panel') {
      errorBox.hidden = true;
    }
  }

  function mostrarError(mensaje) {
    document.getElementById('error-message').textContent = mensaje;
    errorBox.hidden = false;
  }

  function habilitarSelectorManual(motivo) {
    mostrarPanel('manual-panel');
    if (motivo) {
      document.getElementById('manual-reason').textContent = motivo + ' Elige una zona para continuar.';
      mostrarError(motivo);
    } else {
      document.getElementById('manual-reason').textContent = 'Puedes completar el reporte sin compartir coordenadas.';
    }
    window.setTimeout(function () {
      zoneSelect.focus();
    }, 0);
  }

  function solicitarUbicacion() {
    // Esta función se invoca directamente desde un click para cumplir con iOS.
    mostrarPanel('loading-panel');

    obtenerUbicacionActual({
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 30000
    })
      .then(function (ubicacion) {
        renderizarUbicacion(ubicacion);
      })
      .catch(function (error) {
        console.warn('[Geo] Plan B activado:', error.message);
        habilitarSelectorManual(error.message);
      });
  }

  function renderizarUbicacion(ubicacion) {
    var precisionAlta = ubicacion.precisionMetros < 30;
    var porcentaje = precisionAlta ? Math.max(55, 100 - ubicacion.precisionMetros) : Math.max(12, 55 - Math.min(43, ubicacion.precisionMetros / 8));
    var badge = document.getElementById('quality-badge');

    mostrarPanel('result-panel');
    document.getElementById('result-title').textContent = 'Coordenadas listas';
    document.getElementById('coordinates-block').hidden = false;
    document.getElementById('accuracy-block').hidden = false;
    document.getElementById('manual-summary').hidden = true;
    document.getElementById('latitude').textContent = ubicacion.latitud.toFixed(6);
    document.getElementById('longitude').textContent = ubicacion.longitud.toFixed(6);
    document.getElementById('accuracy-value').textContent = '± ' + ubicacion.precisionMetros + ' m';
    document.getElementById('accuracy-meter').style.width = porcentaje + '%';

    badge.textContent = precisionAlta ? 'PRECISIÓN GPS ALTA' : 'UBICACIÓN APROXIMADA (WI-FI / IP)';
    badge.classList.toggle('is-approximate', !precisionAlta);
    document.getElementById('accuracy-help').textContent = precisionAlta
      ? 'Señal de alta precisión: el margen de error reportado es menor a 30 metros.'
      : 'El dispositivo reporta un margen amplio. Es normal en interiores y equipos sin GPS.';
  }

  function revisarPermiso() {
    startButton.disabled = true;
    startButton.textContent = 'Revisando permiso…';

    consultarEstadoPermisoGeo()
      .then(function (estado) {
        startButton.disabled = false;
        startButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></svg>Adjuntar mi ubicación';

        if (estado === 'granted') {
          solicitarUbicacion();
          return;
        }
        if (estado === 'denied') {
          habilitarSelectorManual('El permiso está bloqueado. En iPhone puedes reactivarlo en Ajustes → Privacidad y seguridad → Localización; recuerda que Safari y la PWA instalada usan permisos separados.');
          return;
        }
        mostrarPanel('consent-panel');
      })
      .catch(function () {
        startButton.disabled = false;
        mostrarPanel('consent-panel');
      });
  }

  function guardarZonaManual(evento) {
    var zona;
    evento.preventDefault();

    if (!manualForm.reportValidity()) {
      return;
    }

    zona = zoneSelect.value === 'Otra zona' ? otherZoneInput.value.trim() : zoneSelect.value;
    if (!zona) {
      otherZoneInput.setCustomValidity('Escribe el nombre de tu zona.');
      otherZoneInput.reportValidity();
      return;
    }

    otherZoneInput.setCustomValidity('');
    mostrarPanel('result-panel');
    document.getElementById('result-title').textContent = 'Zona seleccionada';
    document.getElementById('coordinates-block').hidden = true;
    document.getElementById('accuracy-block').hidden = true;
    document.getElementById('manual-summary').textContent = zona;
    document.getElementById('manual-summary').hidden = false;
  }

  function actualizarEstadoRed() {
    var status = document.getElementById('network-status');
    var conectado = navigator.onLine;
    status.classList.toggle('is-offline', !conectado);
    document.getElementById('network-label').textContent = conectado ? 'En línea' : 'Sin conexión · app disponible';
  }

  startButton.addEventListener('click', revisarPermiso);
  confirmButton.addEventListener('click', solicitarUbicacion);
  retryButton.addEventListener('click', function () {
    mostrarPanel('consent-panel');
  });
  changeButton.addEventListener('click', function () {
    mostrarPanel('initial-panel');
  });

  manualButtons.forEach(function (boton) {
    boton.addEventListener('click', function () {
      habilitarSelectorManual('');
    });
  });

  zoneSelect.addEventListener('change', function () {
    var esOtra = zoneSelect.value === 'Otra zona';
    otherZoneRow.hidden = !esOtra;
    otherZoneInput.required = esOtra;
    otherZoneInput.setCustomValidity('');
    if (esOtra) {
      otherZoneInput.focus();
    }
  });
  otherZoneInput.addEventListener('input', function () {
    otherZoneInput.setCustomValidity('');
  });
  manualForm.addEventListener('submit', guardarZonaManual);
  window.addEventListener('online', actualizarEstadoRed);
  window.addEventListener('offline', actualizarEstadoRed);
  actualizarEstadoRed();

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./sw.js')
        .then(function (registro) {
          console.info('[PWA] Service Worker registrado:', registro.scope);
        })
        .catch(function (error) {
          console.warn('[PWA] No se pudo registrar el Service Worker:', error);
        });
    });
  }
}());
