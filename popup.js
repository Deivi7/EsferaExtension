let studentCode = "";
let studentName = "";

let codeModule = "";
let codeRA = "";

document.addEventListener("DOMContentLoaded", async () => {
  
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.storage.local.get(["notes"], (result) => {
    savedData = result.notes || "";
    document.getElementById("userNotesText").value = savedData;
  });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extractInfoEsfera
  }, (results) => {
   
    if (results && results[0] && results[0].result) {
      const { type} = results[0].result;
      if(type == 'RA'){
        const {moduleCode, raCode} = results[0].result;
        codeModule = moduleCode;
        codeRA = raCode;
        document.getElementById("info").innerHTML = `<strong>Mòdul</strong>: ${codeModule} - ${codeRA}`;
        document.getElementById("viewBtnUserNotes").style.display = "none";
        document.getElementById("viewBtnRANotes").style.display = "flex";
      }else if(type == 'ST'){
        const {idalu,  nom} = results[0].result;
        studentCode = idalu;
        studentName = nom;
        document.getElementById("info").innerHTML = `<strong>Nom:</strong> ${studentName} - <strong>IdAlu:</strong> ${studentCode}`;
        document.getElementById("viewBtnUserNotes").style.display = "flex";
        document.getElementById("viewBtnRANotes").style.display = "none";
      }
    }
  });

});

document.getElementById("clearButton").addEventListener("click", () => {
  document.getElementById("userNotesText").value = "";
  chrome.storage.local.set({ "notes": "" });
});

document.getElementById("userNotesText").addEventListener("input", () => {
  try {
    savedData = document.getElementById("userNotesText").value;
    chrome.storage.local.set({ "notes": savedData });
  } catch (error) {
    alert(error);
    console.error("Error al guardar", error);
  }
});



document.getElementById("pendingBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: modifySelect,
      args : [ "string:PDT", getForcePending() ]
    });
  });
});

document.getElementById("processBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: modifySelect,
      args : [ "string:EP", getForceProcess() ]
    });
  });
});

document.getElementById("setUserNotes").addEventListener("click", () => {

  let forceUserNotes = document.getElementById("forceUserNotes").checked;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id, },
      function: setUserNotes,
      args : [ getJsonText(), studentCode, forceUserNotes ],
    }, (results) => {
     
      if (results && results[0] && results[0].result) {
        document.getElementById("results").textContent = results[0].result;
      }
    }
  );
  });
});

document.getElementById("setRANotes").addEventListener("click", () => {
  let forceRANotes = document.getElementById("forceRANotes").checked;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: setRANotes,
      args : [ getJsonText(), codeModule, codeRA, forceRANotes ]
    });
  });
});

function getForcePending() { 
  return  document.getElementById("forcePending").checked;
}

function getForceProcess() { 
  return  document.getElementById("forceProcess").checked;
}

function getJsonText() { 
  return  document.getElementById("userNotesText").value;
}


function setUserNotes(jsonText, studentCode, force) {

  let changeDisabled = false;

  let jsonData;
  try {
     jsonData = JSON.parse(jsonText); // Parseamos el JSON
  } catch (error) {
    return "Error en analitzar el JSON. Assegura't que estigui en el format correcte.";
  }
  
  const table = document.querySelector('table[data-st-table="qualificacions"]');
  if (!table) return "Error a llegir la informació de l'Esfer@";

  const student = jsonData.find(al => al.idalu == studentCode);
  if (!student) return "Alumne no trobat";

  table.querySelectorAll("tr").forEach(tr => {
      let tds = tr.querySelectorAll("td");
      if(tds.length<5) return;
      
      let parts = tds[0].textContent.trim().split("_");
      let moduleCode = parts[0];
      let raCode = parts.length > 2 ? parts[2] : "T";

      let select = tds[3].querySelector('select');
      let input = tds[3].querySelector('input');
      
      if (select) select.id = moduleCode + "_" + raCode;
      if(input) input.id = "i_"+moduleCode + "_T";
      
  });

  student.notes.forEach((entry) => {
    const { mod: modCode, ra: raCode, nota } = entry;

    select = document.getElementById(modCode + "_" + raCode);
    if( select != null && select.hasAttribute("disabled") && !changeDisabled ) return;
    if(!select || select==null) return;

    let value = nota === "" ? (raCode === "T" ? "string:PQ" : "string:PDT") :
                raCode === "T" ? "" :
                nota === "P" ? "string:EP" :
                nota < 5 ? "string:NA" : `string:A${nota}`;
                
    
    let isEdiableSelect = !select.value || select.value == 'string:EP' || select.value == 'string:PDT';
    if (nota != "" && raCode == "T") {

      let optionExists = Array.from(select.options).some(option => option.value === value);
      if (optionExists && ( isEdiableSelect || force) ) {
        select.value = value;
        select.dispatchEvent(new Event('change'));
      }   

      input = document.getElementById("i_" + modCode + "_" + raCode)
      
      if(input && ( !input.value || force)){
        input.value = nota;
        input.dispatchEvent(new Event('change'));
      }
      
    }else if( raCode == "T" ){

      if (( isEdiableSelect || force) ) {
        select.value = "string:PQ";
        select.dispatchEvent(new Event('change'));
      }   
   
      input = document.getElementById("i_" + modCode + "_" + raCode)
      if(input  &&  force){
        select.value = value;
        input.dispatchEvent(new Event('change'));
      }
    }else{
      // console.log(modCode, raCode, nota, value);

      let optionExists = Array.from(select.options).some(option => option.value === value);
      if (optionExists && ( isEdiableSelect|| force)) {
        select.value = value;
        select.dispatchEvent(new Event('change'));
      } 
    }
  });
  
  return "Notes de l'alumne "+ student.nomalu +" assignades";
    
};


function setRANotes(jsonText, codeModule, raCode, force) {
  //document.querySelector('a[data-ng-click^="canviAlumne(\'next\')"]').click(); //Hacer clic
  
  let changeDisabled = false;

  let jsonData;
  try {
     jsonData = JSON.parse(jsonText); // Parseamos el JSON
  } catch (error) {
    return "Error en analitzar el JSON. Assegura't que estigui en el format correcte.";
  }
  
  const table = document.querySelector('table[data-st-table="dummyStudents"]');
  if (!table) return "Error a llegir la informació de l'Esfer@";

  table.querySelectorAll("tr").forEach(tr => {
    let tds = tr.querySelectorAll("td");
    if(tds.length<7) return;
    
    let idalu = tds[0].textContent.trim();
    let select = tds[5].querySelector('select');
    let input = tds[5].querySelector('input');
    
    if (select) select.id = "s_"+idalu;
    if(input) input.id = "i_"+idalu + "_T";
    
  });

  jsonData.forEach((entry) => {
    const { idalu, nomalu, notes } = entry;


    select = document.getElementById("s_" + idalu);
  
    if( select != null && select.hasAttribute("disabled") && !changeDisabled ) return;
    if(!select || select==null) return;
  
    let nota = notes.find(notaAlu => notaAlu.mod == codeModule && notaAlu.ra == raCode).nota;
    if(!nota) return;
   
    // console.log(idalu);
    console.log(idalu+'-'+nota);

    let value = nota === "" ? (raCode === "T" ? "string:PQ" : "string:PDT") :
                raCode === "T" ? "" :
                nota === "P" ? "string:EP" :
                nota < 5 ? "string:NA" : `string:A${nota}`;
                
    
    let isEdiableSelect = !select.value || select.value == 'string:EP' || select.value == 'string:PDT';
    if (raCode == "T" &&  nota != "" ) {

      let optionExists = Array.from(select.options).some(option => option.value === value);
      if (optionExists && ( isEdiableSelect || force) ) {
        select.value = value;
        select.dispatchEvent(new Event('change'));
      }   

      input = document.getElementById("i_" + idalu)
      
      if(input && ( !input.value || force)){
        input.value = nota;
        input.dispatchEvent(new Event('change'));
      }
      
    }else if( raCode == "T" ){

      if (( isEdiableSelect || force) ) {
        select.value = "string:PQ";
        select.dispatchEvent(new Event('change'));
      }   
   
      input = document.getElementById("i_" + modCode + "_" + raCode)
      if(input  &&  force){
        select.value = value;
        input.dispatchEvent(new Event('change'));
      }

    }else{
      
      let optionExists = Array.from(select.options).some(option => option.value === value);
      if (optionExists && ( isEdiableSelect|| force)) {
        select.value = value;
        select.dispatchEvent(new Event('change'));
      } 
    }
  });
  
};


function modifySelect(state, force) {
  let changeDisabled = false;

  let table = document.querySelector('table[data-st-table="qualificacions"]');
  if (!table) {
    table = document.querySelector('table[data-st-table="dummyStudents"]');
  }

  if (!table) {
    alert("No s'ha trobat la taula de qualificacions");
    return;
  }
 

  let selects = table.querySelectorAll("select"); /**:not([disabled]) */

  selects.forEach(select => {
      if(select!=null && select.hasAttribute("disabled") && !changeDisabled) return;

      let optionExists = Array.from(select.options).some(option => option.value === state);

      if (optionExists  && ( !select.value || force) ) {
          select.value = state;
          select.dispatchEvent(new Event('change'));
      }

      optionExists = Array.from(select.options).some(option => option.value === "string:PQ");
      let input = select.parentElement.querySelector("input");
      let hasQualification = input && input.value && input.value != "";

      //Possara pendent si no te nota, exeptuant si es força
      if (optionExists && ( (!select.value && !hasQualification) || force) ) {
          select.value = "string:PQ";
          select.dispatchEvent(new Event('change'));
      }
  });
        
}

function extractInfoEsfera() {
  
  const breadcrumbItems = document.querySelectorAll('.breadcrumb-wrapper ol.breadcrumb li');
  const lastItem = breadcrumbItems[breadcrumbItems.length - 1];
  if (!lastItem) return "No trobat";

  const lastItemText = lastItem.textContent.trim();
  const parts = lastItemText.split('-');
  const part1 = parts[0].trim();
  const part2 = parts[1].trim();
  let type="";
  
  if (part1.split('_').length == 1){
    type="ST";
    let idalu = part1;
    let nom = part2;
    return { type, idalu, nom };
  }else{
    let moduleRA = part1.split("_");
    let moduleCode = moduleRA[0];
    let raCode = moduleRA.length > 2 ? moduleRA[2] : "T";
    type="RA";
    return {type, moduleCode, raCode };
  }
}

// function extractStudentInfo() {
//   const breadcrumbItems = document.querySelectorAll('.breadcrumb-wrapper ol.breadcrumb li');
//   const lastItem = breadcrumbItems[breadcrumbItems.length - 1];
//   if (!lastItem) return "No trobat";

//   const lastItemText = lastItem.textContent.trim();
//   const [code, name] = lastItemText.split(' - ');
//   return { code, name };
// }

// function extractRAInfo() {
//   const breadcrumbItems = document.querySelectorAll('.breadcrumb-wrapper ol.breadcrumb li');
//   const lastItem = breadcrumbItems[breadcrumbItems.length - 1];
//   if (!lastItem) return "No trobat";

//   const lastItemText = lastItem.textContent.trim();
//   let parts = lastItemText.trim().split("_");
//   let moduleCode = parts[0];
//   let raCode = parts.length > 2 ? parts[2] : "T";

//   return { moduleCode, raCode };
// }