

if (!window.__listenerRegistradoSetSelects) {
  window.__listenerRegistradoSetSelects = true;
  chrome.runtime.onMessage.addListener(handleMessage);
}

function handleMessage(message, sender, sendResponse) {
  console.log("Mensaje recibido:", message);
  modifySelects(message.state, message.force, message.changeDisabled).then(resultado => sendResponse({ resultado }));
  return true;
}

function modifySelects(state, force, changeDisabled) {
  const table = findTargetTable();
  if (!table) {
    alert("No s'ha trobat la taula de qualificacions");
    return "Taula no trobada";
  }

  const selects = table.querySelectorAll("select");
  selects.forEach(select => {
    if (!shouldProcessSelect(select,force, changeDisabled)) return;

    updateSelectValue(select, state, force);
    applyPendingIfNeeded(select, force);
  });

  return `Modificada la qualificació a ${state}`;
}


function findTargetTable() {
  return (
    document.querySelector('table[data-st-table="qualificacions"]') ||
    document.querySelector('table[data-st-table="dummyStudents"]')
  );
}

/**
changeDisabled === true → permite modificar selects aunque estén deshabilitados.
force === true → permite cambiar valores incluso si el select ya tiene uno.
force === false → solo modifica si el select no tiene valor. 
*/

function shouldProcessSelect(select,force, changeDisabled) {
  if (!select) return false;
  const isDisabled = select.hasAttribute("disabled");
  const hasValue = !!select.value;

  if (isDisabled && !changeDisabled) return false;
  if (force) return true;

  return !hasValue;
}


function updateSelectValue(select, value, force) {
  const hasOption = Array.from(select.options).some(opt => opt.value === value);

  if (hasOption) {
    select.value = value;
    select.dispatchEvent(new Event("change"));
  }
}


function applyPendingIfNeeded(select, force) {
  const pqOptionExists = Array.from(select.options).some(opt => opt.value === "string:PQ");
  const input = select.parentElement.querySelector("input");
  const hasQualification = input && input.value && input.value !== "";

  if (pqOptionExists && ((!select.value && !hasQualification) || force)) {
    select.value = "string:PQ";
    select.dispatchEvent(new Event("change"));
  }
}