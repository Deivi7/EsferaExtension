let studentCode = "";
let studentName = "";

document.addEventListener("DOMContentLoaded", async () => {
  
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.storage.local.get(["notes"], (result) => {
    savedData = result.notes || "";
    document.getElementById("userNotesText").value = savedData;
  });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extractStudentInfo
  }, (results) => {
    if (results && results[0] && results[0].result) {
      const { code, name } = results[0].result;
      studentCode = code;
      studentName = name;
      document.getElementById("idaluesfera").textContent = `IdAlu: ${studentCode}`;
      document.getElementById("nomesfera").textContent = `Nom: ${studentName}`;
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

document.getElementById("setRANotes").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: setRANotes,
      args : [ studentCode ]
    });
  });
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


function setRANotes(studentCode) {
  alert(studentCode);
};


function modifySelect(state, force) {
  let changeDisabled = false;


  const table = document.querySelector('table[data-st-table="qualificacions"]');
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

function extractStudentInfo() {
  const breadcrumbItems = document.querySelectorAll('.breadcrumb-wrapper ol.breadcrumb li');
  const lastItem = breadcrumbItems[breadcrumbItems.length - 1];
  if (!lastItem) return "No encontrado";

  const lastItemText = lastItem.textContent.trim();
  const [code, name] = lastItemText.split(' - ');
  return { code, name };
}