import { HOST, resetButton } from './constants.js';

let years="";
let types="";
let topics="";
let locs="";
let explorers="";
let selections="";
let debug = false;

//set up event listeners for each criteria group
selectListen('year-sel','years','years');
selectListen('type-sel','types','types');
selectListen('topic-sel','topics','topics');
selectListen('loc-sel','locations','locs');
selectListen('explorer-sel','explorers','explorers');

//setup select listeners
function selectListen(elem, table, field) {
    document.getElementById(elem).addEventListener("change", (e) => {
        // get the item's value
        const item = e.target.value;
        //handle checkbox enable/disabling
        optionSwitch(table, item)
        //aggregate all checks into name/value pairs to build query
        buildEndpoint(field, item)
    });
}

//react to user choices
function optionSwitch(select, item) {
    //get all selects in the dom
    const selectSel = document.getElementsByName(select);
    //if any is checked - uncheck all others
    if(item === '0') {
        for (let i=1; i<selectSel.length; i++) {
            selectSel[i].checked=false;
        }
        selectSel[0].checked=true;
    //if other than any is checked - uncheck any
    } else {
        let none=true;
        for (let i=0; i<selectSel.length; i++) {
            if (selectSel[i].value!=='0') {
                if(selectSel[i].checked===true) {
                    none=false;
                }
            }
        }
        if(none) {
            selectSel[0].checked=true;
        } else {
            selectSel[0].checked=false;
        }
    }
}

//concatenate query string used by load-json.js:filterButton.addEventListener
function buildEndpoint(select, item) {
    if(debug){console.log("BuildEP: ",select, item)}
    //set the selections based on selection group passed in
    switch (select) {
        case "years":
            selections=years;
            break;
        case "types":
            selections=types;
            break;
        case "topics":
            selections=topics;
            break;
        case "locs":
            selections=locs;
            break;
        case "explorers":
            selections=explorers;
            break;
    }
    //any
    if(item==='0') {
        selections="";
    //select
    } else if (select === 'explorers') {
        if(document.getElementById('explorers').value!=='0') { selections=document.getElementById('explorers').value; } else { selections="";}
    //radio
    } else if (select === 'types') {
        selections=item;
    //check
    } else {
        if (!selections.includes(item)) {
            if(selections) selections+=',';
            selections+=item;
        } else {
            const selectionsArr = selections.split(',')
            const index = selectionsArr.indexOf(item);
            if (selectionsArr.indexOf(item) > -1) {
                selectionsArr.splice(index, 1);
                selections=selectionsArr.join(',');
            }
        }
    }
    //reset passed in group with selections
    switch (select) {
        case "years":
            years=selections;
            break;
        case "types":
            types=selections;
            break;
        case "topics":
            topics=selections;
            break;
        case "locs":
            locs=selections;
            break;
        case "explorers":
            explorers=selections;
            break;
    }
    //reset the filtered stat based on new selections
    if(item!=='0') { 
        buildStatQry(select, selections) 
    } else {
        buildStatQry(0,0)
    }
}

/*!!!not RESETing filtered stat after filter button and then reset button clicked*/
//reset all to default state (any)
resetButton.addEventListener('click', () => {
    const filterStat=document.getElementById("filtered-expedition-stat");
    const yearSel=document.getElementsByName("years");
    const locSel=document.getElementsByName("locations");
    const topicSel=document.getElementsByName("topics");
    const typeSel=document.getElementsByName("types");
    const expSel=document.getElementById("explorers");
    const mainContainer = document.getElementById("myData");
    const pagination = document.getElementById("index");
    //empty the div with results
    mainContainer.innerHTML='';
    //empty the pagination div
    pagination.innerHTML='';
    //uncheck all criteria selections - except "any" 
    for (i=1; i<yearSel.length; i++) {
        yearSel[i].checked=false;
    }
    yearSel[0].checked=true;
    for (i=1; i<locSel.length; i++) {
        locSel[i].checked=false;
    }
    locSel[0].checked=true;
    for (i=1; i<topicSel.length; i++) {
        topicSel[i].checked=false;
    }
    topicSel[0].checked=true;
    for (i=1; i<typeSel.length; i++) {
        typeSel[i].checked=false;
    }
    expSel.selectedIndex = "0"
    typeSel[0].checked=true;
    //reset the endpoint used by load-json.js:filterButton.addEventListener
    buildEndpoint('years', '0')
    buildEndpoint('types', '0')
    buildEndpoint('topics', '0')
    buildEndpoint('explorers', '0')
    buildEndpoint('locs', '0')
    //reset filtered stat badge to total exps badgeJOhn
    10
    filterStat.innerHTML=document.getElementById("total-expedition-stat").innerHTML;
    //change color to green
    filterStat.classList.remove("zero");
})

//set the filtered stat badge content - step 4
function appendFilterStat(data) {
    //get filter badge id
    const filterStat=document.getElementById("filtered-expedition-stat");
    //response from getFilterTotal fetch
    let elemInner = data.response[0].total;
    //set the badge with cuurent filter number
    filterStat.innerHTML=elemInner;
    //change the color to red for 0 and green for non zero
    if (elemInner === 0){filterStat.classList.add("zero")} else {filterStat.classList.remove("zero")}
}
//fetch count content from DB - step3
function getFilterTotal(query) {
    if(debug){console.log(query)}
    //build endpoint for fetching from index.js:countAll
    const url = '//'+HOST+'/api/expeditions/countAll/'+query;
    return fetch(url)
    .then((response) => response.json())
    .then (data => appendFilterStat(data,'total'))
    .catch(err => {
        document.getElementById("err").innerHTML=errMsg;
        console.log('error: ' + err);
    })
}

//build query based on table arg - step2
function qryHelper(query, val, col, alias) {
    //query has data, append ADD for next column set
    if(query) { query+=' AND ' }
    //convert comma separated strings to array
    var theArray = val.split(',');
    //for every criteria, add name/value pair
    theArray.forEach((val, index) => {
        if(index===0) { 
            //open the set
            query+="(" 
        } else if(index!== theArray.length) {
            //separate pairs with OR
            query+= ' OR ' 
        }
        query+=alias+'.'+col+'='+val
    });
    //close the set 
    query+=")"
    return query;
}

//build filtered stat badge update query - step1
function buildStatQry(select, selections) { 
    let query='';
    if(debug){console.log(select+" selections: "+selections);}
    //check each column type for data and append query
    if(years) { query=qryHelper(query, years, 'year', 'e') }
    if(locs) { query=qryHelper(query, locs, 'id', 'l') }
    if(topics) { query=qryHelper(query, topics, 'id', 'p') }
    if(types) { query=qryHelper(query, types, 'id', 't') }
    if(explorers) { query=qryHelper(query, explorers, 'id', 'x') }
    //if no data, append 2=2 (since we have AND preceding qry param in index.js:countAll)
    if(select!=='0' && selections!=='0' && !years && !locs && !topics && !types && !explorers){ query="2=2"; }
    if(debug){console.log("The query: "+query)}
    getFilterTotal(query);
}

export { years, types, topics, locs, explorers }