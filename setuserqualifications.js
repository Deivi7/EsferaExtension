/*

*/

if (!window.__listenerRegistradoUserQualificacions) {
  window.__listenerRegistradoUserQualificacions = true;
  chrome.runtime.onMessage.addListener(handleMessage);
}

function handleMessage(message, sender, sendResponse) {

  const { jsonText, studentCode, force, changeDisabled, av } = message;
  resultado = setUserNotes(jsonText, studentCode, force, changeDisabled, av);
  sendResponse({ resultado });
  return true; // Necesario para respuestas async
}

async function setUserNotes(jsonText, studentCode, force, changeDisabled, av) {
 
  const jsonData = parseJSON(jsonText);
  if (!jsonData) return "Error en analitzar el JSON. Assegura't que estigui en el format correcte.";

  const table = getQualificacionsTable();
  if (!table) return "Error a llegir la informació de l'Esfer@";

  const student = jsonData.find(al => al.idalu == studentCode);
  if (!student) return "Alumne no trobat";

  actualizarIdsDeSelectsYInputs(table);
  aplicarNotesASeleccionats(student.notes, force, changeDisabled, av);
  await aplicarComentaris(student.notes, av);

  return `Notes de l'alumne ${student.nomalu} assignades`;
}

function parseJSON(jsonText) {
  try {
    return JSON.parse(jsonText);
  } catch (error) {
    return null;
  }
}

function getQualificacionsTable() {
  return document.querySelector('table[data-st-table="qualificacions"]');
}

async function aplicarComentaris(notes, av) {

  const comentarios = notes
    .filter(entry => entry.av == av && entry.comment?.trim())
    .map(
      entry => {
        const raText = entry.ra === 'T' ? '' : ` ${entry.ra}`;
        return `Mòdul ${entry.mod}${raText}: ${entry.comment}`;
      }
    )
    .join("\n");


  document.querySelector('a[data-ng-click^="showCommentsModal()"]').click();
  document.querySelector('textarea[data-ng-model^="comentariGeneral.comentari"]').value = comentarios;
  await delay(300);
  //document.querySelector('a[data-ng-click^="saveComentariGeneral()"]').click();
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function actualizarIdsDeSelectsYInputs(table) {
  table.querySelectorAll("tr").forEach(tr => {
    const tds = tr.querySelectorAll("td");
    if (tds.length < 5) return;

    const parts = tds[0].textContent.trim().split("_");
    const moduleCode = parts[0];
    const raCode = parts.length > 2 ? parts[2] : "T";

    const select = tds[3].querySelector("select");
    const input = tds[3].querySelector("input");

    if (select) select.id = `${moduleCode}_${raCode}`;
    if (input) input.id = `i_${moduleCode}_T`;
  });
}

function aplicarNotesASeleccionats(notes, force, changeDisabled, currentAv) {

  notes.forEach(({ av, mod, ra, nota }) => {
    const select = document.getElementById(`${mod}_${ra}`);
    const input = document.getElementById(`i_${mod}_${ra}`);
    if (!select || (select.hasAttribute("disabled") && !changeDisabled)) return;

    const valorNota = calcularValorNota(nota, ra);
    const isEditable = !select.value || ["string:EP", "string:PDT", "string:PQ"].includes(select.value);

    if (ra === "T") {
      aplicarNotaModul(select, input, nota, valorNota, force, isEditable);
    } else {
      aplicarNotaRA(select, valorNota, force, isEditable);
    }
  });
}

function calcularValorNota(nota, ra) {
  if (nota === "") return ra === "T" ? "string:PQ" : "string:PDT";
  if (ra === "T") return "";
  if (nota === "P") return "string:EP";
  return nota < 5 ? "string:NA" : `string:A${nota}`;
}

function aplicarNotaModul(select, input, nota, valor, force, editable) {

  if (nota !== "" && (editable || force) && (!input.value || force)) {
    select.value = valor;
    select.dispatchEvent(new Event("change"));
    input.value = nota;
    input.dispatchEvent(new Event("change"));
  }


  if (nota === "" && (editable || force) && (!input.value || force)) {
    select.value = "string:PQ";
    select.dispatchEvent(new Event("change"));
  }
}


function aplicarNotaRA(select, valor, force, editable) {
  const optionExists = Array.from(select.options).some(option => option.value === valor);

  if (optionExists && (editable || force)) {

    if(currentAv < av && nota !='P')  {
      valor = "string:PQ"
    }

    select.value = valor;
    select.dispatchEvent(new Event("change"));
  }
}