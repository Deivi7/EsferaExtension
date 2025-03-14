document.getElementById("pendingBtn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: modifySelectPending
    });
  });
});

function getJsonText() { 
  return  document.getElementById("userNotesText").value; // Obtiene el JSON del textarea
 }

document.getElementById("setUserNotes").addEventListener("click", () => {
  
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

  
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id, },
      function: setUserNotes,
      args : [ getJsonText() ],
    });

  });
});


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

  if (table) {
      // Recorremos todas las filas de la tabla (exceptuando la cabecera si tiene)
      table.querySelectorAll("tr").forEach(tr => {
          const tds = tr.querySelectorAll("td");
        
          // Verificamos si hay al menos dos columnas en la fila
          if (tds.length > 1) {
              tds[0].classList.add("bg-danger", "text-white"); // Fondo rojo, texto blanco
              // alert( tds[0].textContent.trim());
              select = tds[3].querySelector('select');
              let value = "string:PDT";

               // Extraemos código del módulo y código del RA
               let parts = tds[0].textContent.trim().split("_");
               let moduleCode = parts[0];
               let raCode = parts.length > 2 ? parts[2] : "T";
               select.id = moduleCode + "_" + raCode;
               
               // Inicializamos el array si no existe
               if (!data[moduleCode]) {
                   data[moduleCode] = [];
               }
               
               if (!data[moduleCode][raCode]) {
                   data[moduleCode][raCode] = [];
               }
               
               // Almacenamos el select en la estructura
               data[moduleCode][raCode].push(select);
              //console.log(select);
    
              // let optionExists = Array.from(select.options).some(option => option.value === value);
              // let event;
              // if (optionExists /* && !select.value*/) {
              //     select.value = value;
              //     event = new Event('change');
              //     select.dispatchEvent(event);
              // }    
          
              //setSelectValue(select, "string:PDT");
              //setSelectValue(select, "string:PQ");
            
              tds[1].classList.add("bg-primary", "text-white"); // Fondo azul, texto blanco
          }
      });


  
      jsonData.forEach((entry) => {
        const modCode = entry.mod;
        const raCode = entry.ra;
        const nota = entry.nota;
         // Accede al select correspondiente

        let value="";
        if (nota === "") {
          value = "string:PDT";
        } else if (nota === "P") {
          value = "string:EP";
        } else if (nota < 5) {
          value = "string:NA";
        } else {
          value = "string:A"+nota;
        }
        console.log("======");
        console.log(value);
        select = document.getElementById(modCode + "_" + raCode)
        
        if (select){
          console.log(select);
          let optionExists = Array.from(select.options).some(option => option.value === value);
          console.log(optionExists);
          if (optionExists /* && !select.value*/) {
            console.log("entra");
            select.value = value;
            event = new Event('change');
            select.dispatchEvent(event);
          }    
        }
        


      });


    }

      console.log(data);

  };


function modifySelectPending() {
  let selects = document.querySelectorAll("select"); /**:not([disabled]) */
  alert('Response from background: ' + selects.length);

  selects.forEach(select => {
      let optionExists = Array.from(select.options).some(option => option.value === "string:PDT");
      let event;
      if (optionExists /* && !select.value*/) {
          select.value = "string:PDT";
          event = new Event('change');
          select.dispatchEvent(event);
      }

      optionExists = Array.from(select.options).some(option => option.value === "string:PQ");
      if (optionExists /*&& !select.value*/) {
          select.value = "string:PQ";
          event = new Event('change');
          select.dispatchEvent(event);
      }
  });
        
}

