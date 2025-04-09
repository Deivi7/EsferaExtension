if (!window.__listenerRegistradoUserQualificacions) {
  window.__listenerRegistradoUserQualificacions = true;
  chrome.runtime.onMessage.addListener(handleMessage);
}

function handleMessage(message, sender, sendResponse) {
  console.log("UserQualificacions:", message);
  const { jsonText, studentCode, force, changeDisabled, av } = message;
  setUserNotes(jsonText, studentCode, force, changeDisabled, av).then(resultado => sendResponse({ resultado }));
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
  aplicarNotesASeleccionats(student.notes, force, changeDisabled);
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

function aplicarNotesASeleccionats(notes, force, changeDisabled) {
  notes.forEach(({ mod, ra, nota }) => {
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
    console.log("Nota1: " + nota + " valor: " + valor+ " editable: " + editable + " force: " + force);

    input.value = nota;
    input.dispatchEvent(new Event("change"));

  }

  if (input && (nota !== "" && (!input.value || force))) {
    console.log("Nota2: " + nota + " valor: " + valor+ " editable: " + editable + " force: " + force);

  }

  if (nota === "" && (editable || force) && (!input.value || force)) {
    select.value = "string:PQ";
    console.log("Nota3: " + nota + " valor: " + valor+ " editable: " + editable + " force: " + force);

    select.dispatchEvent(new Event("change"));
  }
}

function aplicarNotaRA(select, valor, force, editable) {
  const optionExists = Array.from(select.options).some(option => option.value === valor);
  if (optionExists && (editable || force)) {
    select.value = valor;
    select.dispatchEvent(new Event("change"));
  }
}



// async function setUserNotes(jsonText, studentCode, force, changeDisabled) {


//   let jsonData;
//   try {
//      jsonData = JSON.parse(jsonText); // Parseamos el JSON
//   } catch (error) {
//     return "Error en analitzar el JSON. Assegura't que estigui en el format correcte.";
//   }
  
//   const table = document.querySelector('table[data-st-table="qualificacions"]');
//   if (!table) return "Error a llegir la informació de l'Esfer@";

//   const student = jsonData.find(al => al.idalu == studentCode);
//   if (!student) return "Alumne no trobat";

//   //Escriure comentaris
//   let allComments = '';
//   student.notes.forEach((entry) => {
//     const { av:av, mod:moduleCode, ra: raCode, comment: comment } = entry;
//    if (comment && comment.trim() !== '') {
//       allComments += `Mòdul: ${moduleCode} ${raCode}: ${comment}\n`;  // Añadir salto de línea entre comentarios
//     }
//   });
  
//   document.querySelector('a[data-ng-click^="showCommentsModal()"]').click(); //Hacer clic
//   // document.querySelector('a[data-ng-click^="canviAlumne(\'next\')"]').click(); //Hacer clic

//   let textarea_commnet = document.querySelector('textarea[data-ng-model^="comentariGeneral.comentari"]').value = allComments;
//   //textarea_commnet.dispatchEvent(new Event('change'));
//   await new Promise(resolve => setTimeout(resolve, 1000));

//   //El seu treball és satisfactori 
//   document.querySelector('a[data-ng-click^="saveComentariGeneral()"]').click(); //Hacer clic en desar

 


//   table.querySelectorAll("tr").forEach(tr => {
//       let tds = tr.querySelectorAll("td");
//       if(tds.length<5) return;
      
//       let parts = tds[0].textContent.trim().split("_");
//       let moduleCode = parts[0];
//       let raCode = parts.length > 2 ? parts[2] : "T";

//       let select = tds[3].querySelector('select');
//       let input = tds[3].querySelector('input');
      
//       if (select) select.id = moduleCode + "_" + raCode;
//       if(input) input.id = "i_"+moduleCode + "_T";
      
//   });

//   student.notes.forEach((entry) => {
//     const { mod: modCode, ra: raCode, nota } = entry;

//     select = document.getElementById(modCode + "_" + raCode);
//     if( select != null && select.hasAttribute("disabled") && !changeDisabled ) return;
//     if(!select || select==null) return;

//     let value = nota === "" ? (raCode === "T" ? "string:PQ" : "string:PDT") :
//                 raCode === "T" ? "" :
//                 nota === "P" ? "string:EP" :
//                 nota < 5 ? "string:NA" : `string:A${nota}`;
                
    
//     let isEdiableSelect = !select.value || select.value == 'string:EP' || select.value == 'string:PDT';
//     if (nota != "" && raCode == "T") {

//       let optionExists = Array.from(select.options).some(option => option.value === value);
//       if (optionExists && ( isEdiableSelect || force) ) {
//         select.value = value;
//         select.dispatchEvent(new Event('change'));
//       }   

//       input = document.getElementById("i_" + modCode + "_" + raCode)
      
//       if(input && ( !input.value || force)){
//         input.value = nota;
//         input.dispatchEvent(new Event('change'));
//       }
      
//     }else if( raCode == "T" ){

//       if (( isEdiableSelect || force) ) {
//         select.value = "string:PQ";
//         select.dispatchEvent(new Event('change'));
//       }   
   
//       input = document.getElementById("i_" + modCode + "_" + raCode)
//       if(input  &&  force){
//         select.value = value;
//         input.dispatchEvent(new Event('change'));
//       }
//     }else{
//       // console.log(modCode, raCode, nota, value);

//       let optionExists = Array.from(select.options).some(option => option.value === value);
//       if (optionExists && ( isEdiableSelect|| force)) {
//         select.value = value;
//         select.dispatchEvent(new Event('change'));
//       } 
//     }
//   });
  
//   return "Notes de l'alumne "+ student.nomalu +" assignades";
    
// };