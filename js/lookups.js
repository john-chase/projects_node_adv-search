import { qryStr, HOST } from './constants.js';

let debug = false;

//build the lookup content
function appendLookup(data, lookup, name, id, fa) { console.log(data, lookup, name, id, fa)
    let theID;
    let obj;
    let form = document.createElement("form");
    let formInner = '';
    if (lookup === 'explorer') {
        formInner += '<fieldset><legend><label for="'+lookup+'s"><i class="fa fa-'+fa+'" aria-hidden="true"></i> Select Explorer:</label></legend>';
    } else {
        formInner += '<fieldset><legend><i class="fa fa-'+fa+'" aria-hidden="true"></i> Select '+lookup+'(s):</legend>';
    }
    //ANY
    if(lookup === 'type') {
        formInner += '<input id="type-0" type="radio" name="'+lookup+'s" value="0" checked> ';
        formInner += '<label for="type-0">ANY</label><br>';
    } else if (lookup !== 'explorer') {
        formInner += '<input id="'+lookup+'-0" type="checkbox" name="'+lookup+'s" value="0" checked> ';
        formInner += '<label for="'+lookup+'-0">ANY</label><br>';
    }
    //Choices
    if (lookup === 'explorer') {
        formInner += '<select name="'+lookup+'s" id="'+lookup+'s">';
        formInner += '<option value="0">Any</option>';
        for (let i = 0; i < data.response.length; i++) {
            theID=eval('data.response[i].'+id);
            obj=eval('data.response[i].'+name);
            formInner += '<option value="'+theID+'">'+obj+'</option>';
        }
        formInner += '</select>&nbsp;<span id="total-'+lookup+'-stat" class="oval"></span>';
    } else {
        for (let i = 0; i < data.response.length; i++) {
            theID=eval('data.response[i].'+id);
            obj=eval('data.response[i].'+name).replace(/_/g, " ").replace(/\|/g, ", ").toUpperCase();
            if(lookup === 'type') {
                formInner += '<input id="'+lookup+'-'+theID+'" type="radio" name="'+lookup+'s" value="'+theID+'"> ';
                formInner += '<label for="'+lookup+'-'+theID+'">'+obj+'</label>&nbsp;<span id="'+lookup+'-'+theID+'-stat" class="oval"></span><br>';
            } else {
                formInner += '<input id="'+lookup+'-'+theID+'" type="checkbox" name="'+lookup+'s" value="'+theID+'"> ';
                formInner += '<label for="'+lookup+'-'+theID+'">'+obj+'</label>&nbsp;<span id="'+lookup+'-'+theID+'-stat" class="oval"></span><br>';
            }
        }
    }
    formInner += '</fieldset>';
    form.innerHTML = formInner;
    document.getElementById(name+"-sel").appendChild(form);
}

//fetch lookup content from DB
function get(table, sort, fa) {
    let lookup=table.slice(0, -1).toLowerCase();
    let name=lookup;
    let id = 'id';
    if(table==='Years') {id=lookup}
    if(table==='Locations') {name='loc';}
    return fetch('http://'+HOST+'/api/expeditions/lookup'+table+'/0/'+sort)
    .then((response) => response.json())
    .then (data => appendLookup(data, lookup, name, id, fa))
    .catch(err => {document.getElementById("err").innerHTML=errMsg;
        console.log('error: ' + err);
    })
};

//call get lookup function
function getLookups() {
    return Promise.all([get('Years', 'desc', 'calendar'), get('Locations', 'asc', 'globe'), get('Topics', 'asc', 'th'), get('Types', 'asc', 'anchor'), get('Explorers', 'asc', 'user')])
}

//populate the lookups after DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    if(!qryStr) {
        const totalDiv=document.getElementById("total");
        const advSearchBtn=document.getElementById("adv-search");
        const resetBtn=document.getElementById("reset");
        getLookups()
        .then(() => {
            console.log('Lookups loaded successfully')
            totalDiv.innerHTML=`
                <fieldset>
                    <legend><i class="fas fa-balance-scale"></i> Filtered expeditions:</legend>
                    <span id="total-expedition-stat" class="oval" title="Total Expeditions"></span><!-- for stat --></span>&nbsp;
                    <span id="filtered-expedition-stat" class="oval nonzero" title="Filtered expeditions"></span><!-- for stat --></span>
                </fieldset>
                `
                advSearchBtn.classList.remove("hidden")
                advSearchBtn.classList.add("visible")
                reset.classList.remove("hidden")
                reset.classList.add("visible")
        })
        .catch(err => {
            console.log('ERROR loading lookups!')
            totalDiv.innerHTML=`                
            <fieldset>
                <legend><i class="fas fa-hourglass-end"></i> Server Asleep 💤 </legend>
                <p class="red">Please check back later. We make our best effort to keep this app running but it isn't a 24-7 affair.</p>
            </fieldset>`
        })        
    }
});