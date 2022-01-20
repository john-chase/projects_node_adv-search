import { qryStr, HOST, domain, noaa, filterButton, searchButton, engQry, mainContainer, pDiv, nDiv, sDiv, mDiv, pagination, errMsg } from './constants.js';
import { years, types, topics, locs, explorers } from './selects.js';

let msg='';
let caller='';
let debug = false;

mainContainer.innerHTML='';

/* Filter by Selection Criteria Button click */
filterButton.addEventListener('click', () => {
    let endpoint = '';
    mainContainer.innerHTML="<br/><p>Please wait...</p>";
    if(years) endpoint+='&years='+years;
    if(locs) endpoint+='&locs='+locs;
    if(topics) endpoint+='&topics='+topics;
    if(types) endpoint+='&types='+types;
    if(explorers) endpoint+='&explorers='+explorers;
    endpoint="//"+HOST+"/api/expeditions/advSearch?1=1"+(endpoint)
    caller="Search Button - clicked";
    if(debug) {console.log("Endpoint (search button): "+(endpoint))}
    fetchRecords(endpoint, mainContainer, caller);
})

/* New Search Button click */
// searchButton.addEventListener('click', () => {
//     let endpoint = '';
//     pDiv.classList.add("hidden");
//     nDiv.classList.remove("hidden");
//     sDiv.classList.remove("hidden");
//     mDiv.classList.add("col-md-9");
//     mainContainer.innerHTML='';
//     pagination.innerHTML='';
//     endpoint="//"+HOST+"/api/expeditions/advSearch?1=1";
//     caller="new_search no parameter";
//     window.history.pushState(null, null, window.location.pathname);
//     getLookups()
//     getStats()
//     fetchRecords(endpoint, mainContainer, caller);
// })

function appendData(data, msg, mainContainer) {
    if (debug) {console.log(data)}
    const p = document.createElement("p");
    if(!data.response.length) {
        p.innerHTML = 'No results. Widen your search criteria.';
        mainContainer.innerHTML="";
        mainContainer.appendChild(p);
        return;
    }
    p.innerHTML = '<h3>'+data.response.length+' '+msg+'</h3>';
    const div = document.createElement("div");
    let divInner = p.innerHTML+'<div class="row"><ul id="list">';
    let expDir;
    for (let i = 0; i < data.response.length; i++) {
        //console.log(data.response[i]);
        const code=data.response[i].code;
        const title=data.response[i].title;
        const url=data.response[i].url;
        const year=data.response[i].year;
        const loc=data.response[i].loc.replace(/_/g, " ").replace(/\|/g, ", ");
        const topic=data.response[i].topic.replace(/_/g, " ").replace(/\|/g, ", ");
        const type=data.response[i].type;
        const explorer=data.response[i].explorer;
        let temp = url.split("/", -1);
        const expDir=temp[temp.length-2];
        let imgPath
        if(location.hostname == "artoftech") {
            imgPath=domain+'/projects/node/advanced-search/images/'+expDir+'/expedition-header.jpg';
        } else {
            imgPath=domain+'/node/advanced-search/images/'+expDir+'/expedition-header.jpg';
        }
        const linkPath=noaa+url;
        console.log(linkPath)
        divInner += ' \
            <li id="col-'+i+'">';
            // '+theH3+' \
            divInner += ' \<div class="callout-column"> \
                    <a class="callout" href="'+linkPath+'" title="'+title+'" target="_blank"> \
                        <img class="callout-img" src="'+imgPath+'" width="100%" height="100%" /> \
                    </a> \
                    <div class="card-content"> \
                        <h3 class="title"><a href="'+linkPath+'" title="'+title+'" target="_blank">'+title+'</a></h3> \
                        <p class="desc"><strong>Year</strong>: <span class="detail">'+year+'</span></p> \
                        <p class="desc"><strong>Type</strong>: <span class="detail">'+type+'</span></p> \
                        <p class="desc"><strong>Location</strong>: <span class="detail">'+data.response[i].loc+'</span></p> \
                        <p class="desc"><strong>Topics</strong>: <span class="detail">'+data.response[i].topic+'</span></p> \
                        <p class="desc"><strong>Explorers</strong>: <span class="detail">'+data.response[i].explorer+'</span></p> \
                        <br /> \
                    </div> \
                </div> \
            </li>';
        mainContainer.appendChild(p);
        mainContainer.innerHTML=divInner;
    }
    const event = new CustomEvent('JSONloaded');
    const elem = document.querySelector('#adv-search');
    // Dispatch the event
    elem.dispatchEvent(event);
}

//Give english interpretation of query results
async function translate2Eng(qryStr) {
    let english='';
    //parse the query string into a JS object: eg: ?years=2020,2019&locs=3,4&types=2&topics=2,4,5&explorers=2
    const s = qryStr.slice(1).split("&");
    const s_length = s.length;
    let bit = {}
    let query = {}
    let first
    let second
    for (let i = 0; i < s_length; i++) {
        bit = s[i].split("=");
        first = decodeURIComponent(bit[0]);
        if(first.length == 0) continue;
        second = decodeURIComponent(bit[1]);
        if(typeof query[first] == "undefined") query[first] = second;
        else if(query[first] instanceof Array) query[first].push(second);
        else query[first] = [query[first], second];
    }
    //iterate the object and spit out message based on key and values based on value queries
    for (let key in query) {
        let value = query[key]//.replace(/,/g,' or ');
        let values;
        console.log(key, value)
        switch (key) {
            case "years":
                if(!english) {english+="Displaying expeditions occuring on "+value.replace(/,/g,', or ')} else {english+=" AND occuring on "+value.replace(/,/g,', or ')}
                break;
            case "types":
                values = await fetchLookupValues('Types', value)
                if(!english) {english+="Displaying expeditions of type "+values} else {english+=" AND of type "+values}
                break;
            case "locs":
                values = await fetchLookupValues('Locations', value)
                if(!english) {english+="Displaying expeditions taking place in the "+values} else {english+=" AND taking place in the "+values}
                break;
            case "topics":
                values = await fetchLookupValues('Topics', value)
                if(!english) {english+="Displaying expeditions with topic(s): "+values} else {english+=" AND with topic(s): "+values}
                break;
            case "explorers":
                values = await fetchLookupValues('Explorers', value)
                if(!english) {english+="Displaying expeditions having explorer "+values+" on board."} else {english+=" AND having explorer "+values+" on board."}
                break;
        }
    }
    if(engQry) engQry.innerHTML = english;
}

//Convert ids to values
async function fetchLookupValues(table, ids) {
    const response = await fetch('//'+HOST+'/api/expeditions/lookup'+table+'/'+ids+'/asc/', {});
    const data = await response.json();
    let values = '';
    switch (table) {
        case "Types": //singular
            return data.response[0].type
            break;
        case "Locations":
            for(let i=0;i<data.response.length;i++) {
                if(i!==data.response.length-1){values+=data.response[i].loc+", or the "} else {values+=data.response[i].loc}
            }
            return data.response[0].loc
            break;
        case "Topics":
            for(let i=0;i<data.response.length;i++) {
                if(i!==data.response.length-1){values+=data.response[i].topic+", or "} else {values+=data.response[i].topic}
            }
            return values;
            break;
        case "Explorers": //singular
            return data.response[0].explorer
            break;
    }

}

// Check for query string - load records immediately
if(qryStr) {
    pDiv.classList.toggle("hidden");
    mDiv.classList.remove("col-md-9");
    const endpoint="//"+HOST+"/api/expeditions/advSearch?1=1"+(qryStr.replace('?', "&"));
    if(debug) {console.log("Endpoint (query string): "+endpoint)}
    caller="query_string parameter";
    fetchRecords(endpoint, mainContainer, caller);
    translate2Eng(qryStr);
} else {
    nDiv.classList.toggle("hidden");
    sDiv.classList.toggle("hidden");
}

function fetchRecords(endpoint, mainContainer, caller) {
    fetch(endpoint)
        .then(response => {
            return response.json();
        })
        .then(data => {
            if(data.response.length < 2) {msg = 'Result'} else {msg = 'Results';}
            appendData(data, msg, mainContainer, caller);
        })
        .catch(err => {
            console.log('error: load-json.js: ' + caller + ' - ' + err);
    });
}