const API_BASE_URL = '/autodiagnostico/api/local';
let currentAssessmentId = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Llenar la fecha actual automáticamente
    const hoy = new Date();
    document.getElementById('fecha').value = hoy.toLocaleDateString('es-CL');

    // Cargar la estructura de los ejes (sin iniciar la evaluación aún)
    await cargarEstructuraCuestionario();

    // Eventos de botones
    document.getElementById('btn-iniciar').addEventListener('click', iniciarEvaluacion);
    document.getElementById('btn-guardar').addEventListener('click', manejarGuardado);
});

// Función para cambiar entre pestañas
function mostrarPestaña(tabId) {
    document.querySelectorAll('.ct-eje-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.ct-tab-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    
    // Activar el botón correspondiente
    const botones = document.querySelectorAll('.ct-tab-btn');
    for(let btn of botones) {
        if(btn.textContent.trim().toUpperCase() === tabId.replace('eje-', 'EJE ').toUpperCase() || 
           (tabId === 'resumen' && btn.id === 'btn-tab-resumen') ||
           (tabId === 'escala' && btn.id === 'btn-tab-escala') ||
           (tabId === 'tablero' && btn.id === 'tab-tablero')) {
            btn.classList.add('active');
        }
    }

    // NUEVO: Mostrar botón de guardar SOLO si estamos en el Eje E y el diagnóstico ya inició
    const btnGuardar = document.getElementById('btn-guardar');
    if (currentAssessmentId && tabId === 'eje-e') {
        btnGuardar.style.display = 'block';
    } else {
        btnGuardar.style.display = 'none';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function cargarEstructuraCuestionario() {
    try {
        const response = await fetch(`${API_BASE_URL}/cuestionario`);
        if (!response.ok) throw new Error('Error al obtener el cuestionario');
        const data = await response.json();
        renderizarPreguntasEnPestañas(data.axes);
    } catch (error) {
        console.error("Error cargando cuestionario:", error);
    }
}

function renderizarPreguntasEnPestañas(axes) {
    const tabsNav = document.getElementById('tabs-navigation');
    const container = document.getElementById('cuestionario-container');
    const tabTableroBtn = document.getElementById('tab-tablero'); // Referencia al botón del tablero

    axes.forEach((eje, index) => {
        const tabId = `eje-${eje.id.toLowerCase()}`;

        // 1. Crear el botón para la pestaña (deshabilitado hasta que inicie)
        const tabBtn = document.createElement('button');
        tabBtn.className = 'ct-tab-btn';
        tabBtn.textContent = `Eje ${eje.id}`;
        tabBtn.style.display = 'none'; // Se ocultan hasta que le de "Iniciar"
        tabBtn.onclick = () => mostrarPestaña(tabId);
        
        // Insertamos el botón ANTES del botón del Tablero, para que el Tablero quede siempre de último
        tabsNav.insertBefore(tabBtn, tabTableroBtn);

        // 2. Crear el contenedor de contenido para este eje
        const ejeDiv = document.createElement('div');
        ejeDiv.id = tabId;
        ejeDiv.className = 'ct-eje-section';
        // ... (El resto de la creación de divs de preguntas se mantiene EXACTAMENTE igual que antes) ...
        // [CÓDIGO DE PREGUNTAS]
        
        const ejeTitle = document.createElement('h2');
        ejeTitle.textContent = `Eje ${eje.id} - ${eje.name}`;
        const ejeDesc = document.createElement('p');
        ejeDesc.textContent = eje.description;
        ejeDiv.appendChild(ejeTitle);
        ejeDiv.appendChild(ejeDesc);

        eje.questions.forEach(pregunta => {
            const qBlock = document.createElement('div');
            qBlock.className = 'ct-question-block';
            qBlock.dataset.questionId = pregunta.id;

            const qText = document.createElement('h4');
            qText.textContent = `${pregunta.id}: ${pregunta.text}`;
            
            const selectsContainer = document.createElement('div');
            selectsContainer.className = 'ct-select-group';

            pregunta.response_fields.forEach(field => {
                const fieldDiv = document.createElement('div');
                const label = document.createElement('label');
                label.textContent = field.label;
                const select = document.createElement('select');
                select.name = field.name; 
                select.className = 'ct-select-input'; 
                const defaultOption = document.createElement('option');
                defaultOption.value = "";
                defaultOption.textContent = "Seleccione una opción...";
                select.appendChild(defaultOption);

                field.options.forEach(opt => {
                    const optionEl = document.createElement('option');
                    optionEl.value = opt.id;
                    optionEl.textContent = opt.text;
                    select.appendChild(optionEl);
                });

                fieldDiv.appendChild(label);
                fieldDiv.appendChild(select);
                selectsContainer.appendChild(fieldDiv);
            });

            qBlock.appendChild(qText);
            qBlock.appendChild(selectsContainer);
            ejeDiv.appendChild(qBlock);
        });
        
        // NUEVO: Agregar botón "Siguiente" si NO es el último eje
        if (index < axes.length - 1) {
            const nextEje = axes[index + 1];
            const nextTabId = `eje-${nextEje.id.toLowerCase()}`;
            
            const btnContainer = document.createElement('div');
            btnContainer.className = 'btn-container';
            btnContainer.style.marginTop = '2rem';
            
            const btnNext = document.createElement('button');
            btnNext.type = 'button';
            btnNext.className = 'ct-btn-primary';
            btnNext.textContent = `Siguiente: Eje ${nextEje.id}`;
            btnNext.onclick = () => mostrarPestaña(nextTabId);
            
            btnContainer.appendChild(btnNext);
            ejeDiv.appendChild(btnContainer);
        }

        container.appendChild(ejeDiv);
    });
}

// NUEVO: Se ejecuta al presionar "Iniciar Diagnóstico"
async function iniciarEvaluacion() {
    const municipio = document.getElementById('municipio').value;
    const responsable = document.getElementById('responsable').value;

    if (!municipio || !responsable) {
        alert("Por favor, ingrese el Municipio y el Responsable antes de iniciar.");
        return;
    }

    const payload = {
        organization_name: municipio 
    };

    try {
        const response = await fetch(`${API_BASE_URL}/evaluaciones`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error('Error al iniciar evaluación en la API');
        
        inicializarProgreso();
        const data = await response.json();
        currentAssessmentId = data.assessment_id || data.id; 
        
        alert("Diagnóstico iniciado con éxito.");

        // Mostrar los botones de los ejes
        document.querySelectorAll('.ct-tab-btn').forEach(btn => {
            // No mostramos el tablero todavía
            if (btn.id !== 'tab-tablero') {
                btn.style.display = 'block';
            }
        });
        //document.getElementById('btn-guardar').style.display = 'block';
        
        document.getElementById('btn-iniciar').style.display = 'none';
        document.getElementById('municipio').disabled = true;
        document.getElementById('responsable').disabled = true;
        document.getElementById('email').disabled = true; // <-- Bloquear email
        document.getElementById('pais').disabled = true; // <-- Bloquear país
        document.getElementById('btn-iniciar').style.display = 'none';

        const introSection = document.querySelector('.intro-circulartec');
        if (introSection) {
            introSection.style.display = 'none';
        }

        // Pasar automáticamente a la Escala de Madurez en vez del Eje A
        mostrarPestaña('escala');

    } catch (error) {
        console.error("Error iniciando evaluación:", error);
    }
}

async function manejarGuardado() {
    if (!currentAssessmentId) return alert("No hay una evaluación activa.");

    const respuestas = recolectarRespuestas();
    console.log("Estructura exacta enviada:", JSON.stringify({ answers: respuestas }, null, 2));

    try {
        const response = await fetch(`${API_BASE_URL}/evaluaciones/${currentAssessmentId}/respuestas`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: respuestas })
        });
        
        // Si falla, leemos qué fue lo que exactamente rechazó la API
        if(!response.ok) {
            const errorData = await response.json();
            console.error("DETALLE DEL ERROR 422 DE LA API:", errorData);
            throw new Error('Error guardando respuestas');
        }
        
        alert("¡Respuestas guardadas exitosamente!");
        document.getElementById('btn-guardar').style.display = 'none';
        await cargarResultados();

    } catch (error) {
        console.error("Error guardando respuestas:", error);
        alert("Hubo un error al guardar. Revisa la consola (F12) para ver el detalle de la API.");
    }
}

// NUEVA FUNCIÓN: Obtiene el resumen final de tu API
async function cargarResultados() {
    try {
        const res = await fetch(`${API_BASE_URL}/evaluaciones/${currentAssessmentId}/resultados`);
        if(!res.ok) throw new Error('Error al traer los resultados');
        
        const data = await res.json();
        
        // Mostrar la pestaña del tablero y activarla
        document.getElementById('tab-tablero').style.display = 'block';
        mostrarPestaña('tablero');

        const container = document.getElementById('tabla-resultados-container');
        
        let tablaHTML = `
            <div style="margin-bottom: 20px; font-size: 0.95rem; color: #475569;">
                <p><b>ID de Evaluación:</b> ${data.assessment_id || currentAssessmentId}</p>
                <p><b>Promedio General de Madurez:</b> <span style="font-size: 1.2rem; color: #0b3c5d; font-weight: bold;">${data.global_average !== undefined ? Number(data.global_average).toFixed(2) : '-'}</span> / 4.0</p>
            </div>
            <table class="ct-table" style="width: 100%; text-align: left; border-collapse: collapse; margin-top: 15px;">
                <tr style="background-color: #0b3c5d; color: white;">
                    <th style="padding: 12px; border: 1px solid #cbd5e1;">Eje</th>
                    <th style="padding: 12px; border: 1px solid #cbd5e1; text-align: center;">Preguntas Respondidas</th>
                    <th style="padding: 12px; border: 1px solid #cbd5e1; text-align: center;">Promedio (0-4)</th>
                    <th style="padding: 12px; border: 1px solid #cbd5e1;">Nivel de Madurez</th>
                </tr>
        `;
        
        // Verificamos si la propiedad 'axes' viene en la respuesta de la API
        if (data.axes && Array.isArray(data.axes)) {
            data.axes.forEach(eje => {
                const promedioRedondeado = eje.average !== undefined ? Number(eje.average).toFixed(2) : '-';
                tablaHTML += `<tr>
                    <td style="padding: 12px; border: 1px solid #cbd5e1;"><b>Eje ${eje.axis_id}:</b> ${eje.axis_name}</td>
                    <td style="padding: 12px; border: 1px solid #cbd5e1; text-align: center;">${eje.answered_count} / ${eje.question_count}</td>
                    <td style="padding: 12px; border: 1px solid #cbd5e1; text-align: center;"><b>${promedioRedondeado}</b></td>
                    <td style="padding: 12px; border: 1px solid #cbd5e1;">${eje.maturity_level || '-'}</td>
                </tr>`;
            });
        } else {
            tablaHTML += `<tr><td colspan="4" style="padding: 12px; text-align: center;">No se encontraron detalles de los ejes.</td></tr>`;
        }

        tablaHTML += `</table>`;
        container.innerHTML = tablaHTML;

    } catch (error) {
        console.error("Error cargando el tablero:", error);
        document.getElementById('tabla-resultados-container').innerHTML = "<p style='color: red;'>No se pudieron cargar los resultados desde el servidor.</p>";
    }
}

function recolectarRespuestas() {
    const blocks = document.querySelectorAll('.ct-question-block[data-question-id]');
    const resultado = [];

    blocks.forEach(block => {
        const questionId = block.dataset.questionId;
        const competenceSelect = block.querySelector('select[name="competence_type"]');
        const optionSelect = block.querySelector('select[name="option_id"]');

        // Solo agregamos la respuesta si el usuario seleccionó ambos campos
        if(competenceSelect && optionSelect && competenceSelect.value !== "" && optionSelect.value !== "") {
            resultado.push({
                question_id: String(questionId), // Aseguramos que sea string
                option_id: parseInt(optionSelect.value), // Aseguramos que sea número entero
                competence_type: String(competenceSelect.value) // Aseguramos que sea string
            });
        }
    });

    return resultado;
}

// Función para inicializar los "listeners" de la barra de progreso
function inicializarProgreso() {
    document.getElementById('progress-wrapper').style.display = 'block';

    // Ahora SOLO escuchamos los cambios en los selects que pertenecen a las preguntas reales
    const selectoresPreguntas = document.querySelectorAll('.ct-question-block[data-question-id] select');
    selectoresPreguntas.forEach(sel => {
        sel.addEventListener('change', actualizarBarraProgreso);
    });
    
    actualizarBarraProgreso(); // Estado inicial al cargar
}

// Función para recalcular la barra cada vez que el usuario responde algo
function actualizarBarraProgreso() {
    // Buscamos solo los contenedores de las 69 preguntas
    const bloquesPreguntas = document.querySelectorAll('.ct-question-block[data-question-id]');
    let totalPreguntas = bloquesPreguntas.length; // Esto dará exactamente 69
    let preguntasCompletadas = 0;

    bloquesPreguntas.forEach(block => {
        const competenceSelect = block.querySelector('select[name="competence_type"]');
        const optionSelect = block.querySelector('select[name="option_id"]');

        // Solo sumamos 1 punto al progreso si AMBOS campos de esa pregunta tienen una respuesta válida
        if (competenceSelect && optionSelect && competenceSelect.value !== "" && optionSelect.value !== "") {
            preguntasCompletadas++;
        }
    });

    // Calcular porcentaje redondeado
    const porcentaje = totalPreguntas > 0 ? Math.round((preguntasCompletadas / totalPreguntas) * 100) : 0;

    // Actualizar elementos visuales en el HTML
    const fillBar = document.getElementById('progress-bar-fill');
    const textBar = document.getElementById('progress-text');

    if (fillBar && textBar) {
        fillBar.style.width = `${porcentaje}%`;
        // Cambiamos la palabra "campos" por "preguntas" para que quede más claro
        textBar.textContent = `${porcentaje}% completado (${preguntasCompletadas}/${totalPreguntas} preguntas)`;
    }
}