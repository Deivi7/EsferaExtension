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
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id, },
      function: setUserNotes,
      args : [ getJsonText() ],
    });
  });
});

function getForcePending() { 
  return  document.getElementById("forcePending").checked; // Obtiene el JSON del textarea
}

function getForceProcess() { 
  return  document.getElementById("forceProcess").checked; // Obtiene el JSON del textarea
}

function getJsonText() { 
  return  document.getElementById("userNotesText").value; // Obtiene el JSON del textarea
 }


function setUserNotes(jsonText) {
  
  let jsonData;
  try {
     jsonData = JSON.parse(jsonText); // Parseamos el JSON
  } catch (error) {
    alert("Error al parsear el JSON. Asegúrate de que esté en el formato correcto.");
  }
 
  //let selects = document.querySelectorAll("select"); /**:not([disabled]) */
  const table = document.querySelector('table[data-st-table="qualificacions"]');
  let data =[];
  let select;
  let event;
  let input

  if (table) {
      // Recorremos todas las filas de la tabla (exceptuando la cabecera si tiene)
      table.querySelectorAll("tr").forEach(tr => {
          const tds = tr.querySelectorAll("td");
        
          // Verificamos si hay al menos dos columnas en la fila
          if (tds.length > 1) {
              tds[0].classList.add("bg-danger", "text-white"); // Fondo rojo, texto blanco
              // alert( tds[0].textContent.trim());
              select = tds[3].querySelector('select');
              input = tds[3].querySelector('input');
              
              // Extraemos código del módulo y código del RA
              let parts = tds[0].textContent.trim().split("_");
              let moduleCode = parts[0];
              let raCode = parts.length > 2 ? parts[2] : "T";
              select.id = moduleCode + "_" + raCode;
              if(input){
                input.id = "i_"+moduleCode + "_T";
              }

              tds[1].classList.add("bg-primary", "text-white"); // Fondo azul, texto blanco
          }
      });

      jsonData.forEach((entry) => {
        const modCode = entry.mod;
        const raCode = entry.ra;
        const nota = entry.nota;

        let value="";
        if (nota === "" && raCode =="T") {
          value = "string:PQ";
        } else if (nota != "" && raCode == "T") {
          value = "";
          console.log("======");
          console.log(value);
        } else if (nota === "") {
          value = "string:PDT";
        } else if (nota === "P") {
          value = "string:EP";
        } else if (nota < 5) {
          value = "string:NA";
        } else {
          value = "string:A"+nota;
        }
       
        select = document.getElementById(modCode + "_" + raCode)

        if (nota != "" && raCode == "T") {
          input = document.getElementById("i_" + modCode + "_" + raCode)
          if(input){
            input.value = nota;
            event = new Event('change');
            input.dispatchEvent(event);
          }
        }else if( raCode == "T" ){
          input = document.getElementById("i_" + modCode + "_" + raCode)
          if(input){
            input.value = "";
            event = new Event('change');
            input.dispatchEvent(event);
          }
        }

        if (select){
          let optionExists = Array.from(select.options).some(option => option.value === value);
          console.log(optionExists);
          if (optionExists /* && !select.value*/) {
            select.value = value;
            event = new Event('change');
            select.dispatchEvent(event);
          }    
        }
      });

    }
        
  };


function modifySelect(state, force) {

  let selects = document.querySelectorAll("select"); /**:not([disabled]) */
  selects.forEach(select => {
      let optionExists = Array.from(select.options).some(option => option.value === state);
      let event;
      if (optionExists  && ( !select.value || force) ) {
          select.value = state;
          event = new Event('change');
          select.dispatchEvent(event);
      }

      optionExists = Array.from(select.options).some(option => option.value === "string:PQ");
      if (optionExists && ( !select.value || force)) {
          select.value = "string:PQ";
          event = new Event('change');
          select.dispatchEvent(event);
      }
  });
        
}

