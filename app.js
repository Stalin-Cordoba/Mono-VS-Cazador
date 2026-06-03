const canvas = document.getElementById('simCanvas');
const canvasContext = canvas.getContext('2d');

// Controles UI
// V0: Velocidad Inicial
// Dist: Distancia
// Alt: Altura del mono
// Theta: Ángulo
const rangoV0 = document.getElementById('rangoV0');
const rangoDist = document.getElementById('rangoDist');
const rangoAlt = document.getElementById('rangoAlt');
        
const valV0 = document.getElementById('valV0');
const valDist = document.getElementById('valDist');
const valAlt = document.getElementById('valAlt');
const valAngulo = document.getElementById('valAngulo');

const btnEmpezar = document.getElementById('btnEmpezar');
const btnPausar = document.getElementById('btnPausar');
const btnReiniciar = document.getElementById('btnReiniciar');

const projX_disp = document.getElementById('projX');
const projY_disp = document.getElementById('projY');
const monoX_disp = document.getElementById('monoX');
const monoY_disp = document.getElementById('monoY');
const distanciaRelativa_disp = document.getElementById('dRelativa');
const alertaColision = document.getElementById('alertaColision');
const alertaNoColision = document.getElementById('alertaNoColision');

const g = 9.81; // Gravedad

// Variables de estado de la simulación
let v0 = parseFloat(rangoV0.value);
let d = parseFloat(rangoDist.value);
let h = parseFloat(rangoAlt.value);
let theta = 0;

let t = 0;
let estaEjecutandose = false;
let idAnimacion = null;
let ocurrioColision = false;

// Factores de escala para ajustar metros al lienzo del Canvas
// El origen (0,0) metros estará abajo a la izquierda (con margen)
const Escala = 5.5; // píxeles por metro
const ajusteX = 50; 
const ajusteY = canvas.height - 50;

function actualizarParametros() {
    v0 = parseFloat(rangoV0.value);
    d = parseFloat(rangoDist.value);
    h = parseFloat(rangoAlt.value);
            
    valV0.textContent = v0 + " m/s";
    valDist.textContent = d + " m";
    valAlt.textContent = h + " m";

    // El cazador apunta DIRECTAMENTE al mono
    theta = Math.atan2(h, d);
    valAngulo.textContent = (theta * 180 / Math.PI).toFixed(2) + "°";

    if (!estaEjecutandose) {
        reiniciarSimulacion();
    }
}

// Conversión de metros a coordenadas de pantalla (Canvas)
function convertirCoordenadas(x_m, y_m) {
    return {
        x: ajusteX + x_m * Escala,
        y: ajusteY - y_m * Escala
    };
}

function dibujarEscenario() {
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);

     // Dibujar Suelo
    canvasContext.beginPath();
    canvasContext.moveTo(0, ajusteY);
    canvasContext.lineTo(canvas.width, ajusteY);
    canvasContext.strokeStyle = '#7f8c8d';
    canvasContext.lineWidth = 3;
    canvasContext.stroke();

    // Dibujar Línea de Apuntado (Visualización Educativa)
    if (!estaEjecutandose && !ocurrioColision) {
        canvasContext.beginPath();
        let startPos = convertirCoordenadas(0, 0);
        let targetPos = convertirCoordenadas(d, h);
        canvasContext.moveTo(startPos.x, startPos.y);
        canvasContext.lineTo(targetPos.x, targetPos.y);
        canvasContext.strokeStyle = 'rgba(52, 152, 219, 0.3)';
        canvasContext.setLineDash([5, 5]);
        canvasContext.lineWidth = 1.5;
        canvasContext.stroke();
        canvasContext.setLineDash([]);
    }

    // Calcular posiciones actuales en metros
    let xp = 0; // Abscisa de la posición del proyectil
    let yp = 0; // Ordenada de la posición del proyectil
    let xm = d; // Abscisa de la posición del mono
    let ym = h; // Ordenada de la posición del proyectil

    if (t > 0) {
        // Ecuaciones de Movimiento Parabólico (Proyectil)
        xp = v0 * Math.cos(theta) * t;
        yp = v0 * Math.sin(theta) * t - 0.5 * g * t * t;

        // Ecuaciones de Caída Libre (Mono)
        xm = d;
        ym = h - 0.5 * g * t * t;
    }

    // Asegurar que no traspasen el suelo en la renderización visual
    if (yp < 0) yp = 0;
    if (ym < 0) ym = 0;

    // Coordenadas de pantalla
    let pCanvas = convertirCoordenadas(xp, yp); // Canvas para el proyectil
    let mCanvas = convertirCoordenadas(xm, ym); // Canvas para el mono

    // Dibujar Cazador / Cañón
    let cBase = convertirCoordenadas(0,0);
    canvasContext.beginPath();
    canvasContext.arc(cBase.x, cBase.y, 12, 0, 2 * Math.PI);
    canvasContext.fillStyle = '#34495e';
    canvasContext.fill();

    // Dibujar Proyectil (Bola Amarilla/Roja como la imagen)
    canvasContext.beginPath();
    canvasContext.arc(pCanvas.x, pCanvas.y, 7, 0, 2 * Math.PI);
    canvasContext.fillStyle = '#f1c40f';
    canvasContext.fill();
    canvasContext.strokeStyle = '#e67e22';
    canvasContext.lineWidth = 2;
    canvasContext.stroke();

    // Dibujar Árbol / Soporte del Mono
    let baseArbol = convertirCoordenadas(d, 0);
    let alturaArbol = convertirCoordenadas(d, h);
    canvasContext.beginPath();
    canvasContext.moveTo(baseArbol.x, baseArbol.y);
    canvasContext.lineTo(alturaArbol.x, alturaArbol.y);
    canvasContext.strokeStyle = '#bdc3c7';
    canvasContext.lineWidth = 2;
    canvasContext.stroke();

    // Dibujar Mono (Círculo Marrón representativo)
    canvasContext.beginPath();
    canvasContext.arc(mCanvas.x, mCanvas.y, 10, 0, 2 * Math.PI);
    canvasContext.fillStyle = '#a0522d';
    canvasContext.fill();
    
    // Cabeza/Detalle del "Mono"
    canvasContext.beginPath();
    canvasContext.arc(mCanvas.x, mCanvas.y - 4, 5, 0, 2 * Math.PI);
    canvasContext.fillStyle = '#cd853f';
    canvasContext.fill();

    // Actualizar Telemetría en pantalla
    let distRelativa = Math.sqrt(Math.pow(xm - xp, 2) + Math.pow(ym - yp, 2));
            
    projX_disp.textContent = xp.toFixed(4);
    projY_disp.textContent = yp.toFixed(4);
    monoX_disp.textContent = xm.toFixed(4);
    monoY_disp.textContent = ym.toFixed(4);
    distanciaRelativa_disp.textContent = distRelativa.toFixed(6);

    return { xp, yp, xm, ym, distRelativa };
}

function loopSimulacion() {
    if (!estaEjecutandose) return;

    // Incremento del tiempo
    t += 0.01; 

    let data = dibujarEscenario();

    // Condición de Choque estricta (< 1 mm = 0.001 metros)
    if (data.distRelativa < 1) {
        estaEjecutandose = false;
        ocurrioColision = true;
        alertaColision.style.display = 'block';
        return;
    }

    // Condición de fin por si fallan o caen al suelo
    if (data.yp <= 0 && data.xp > 0 || data.ym <= 0) {
        // Si la velocidad es muy baja y no se impactaron en el aire
        if(!ocurrioColision && data.distRelativa < 1) {
            // El impacto puede ocurrir en el suelo de igual forma por la naturaleza matemática
            estaEjecutandose = false;
            ocurrioColision = true;
            alertaColision.style.display = 'block';
            return;
        }else{
            estaEjecutandose = false;
            alertaNoColision.style.display = 'block';
        }
        return;
    }

    idAnimacion = requestAnimationFrame(loopSimulacion);
}

function reiniciarSimulacion() {
    estaEjecutandose = false;
    if (idAnimacion) cancelAnimationFrame(idAnimacion);
    t = 0;
    ocurrioColision = false;
    alertaColision.style.display = 'none';
    alertaNoColision.style.display = 'none';
    dibujarEscenario();
}

// Event Listeners
rangoV0.addEventListener('input', actualizarParametros);
rangoDist.addEventListener('input', actualizarParametros);
rangoAlt.addEventListener('input', actualizarParametros);

btnEmpezar.addEventListener('click', () => {
    if (!estaEjecutandose && !ocurrioColision) {
        estaEjecutandose = true;
        loopSimulacion();
    }
});

btnPausar.addEventListener('click', () => {
    estaEjecutandose = false;
    if (idAnimacion) cancelAnimationFrame(idAnimacion);
});

btnReiniciar.addEventListener('click', reiniciarSimulacion);

// Inicialización primaria
actualizarParametros();