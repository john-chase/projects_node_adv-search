import { qryStr, HOST } from './constants.js';

let debug = true;

//build the stats content
function appendStat(data, name, stat) {
    if(debug){console.log(data, name, stat)}
    let obj;
    obj=eval('data.response[0].'+stat);
    if(debug){console.log(obj)}
    let elemInner = obj;
    document.getElementById(name+"-stat").append(elemInner);
    if(name==="total-expedition") { document.getElementById("filtered-expedition-stat").innerHTML=elemInner; }
}

//fetch count content from DB
function getTotal(table, num=0) {
    let attr = '';
    let url = '';
    if(num===0){
        url = 'http://'+HOST+'/api/expeditions/count'+table+'s';
        attr = 'total-'+table.toLowerCase()
    } else {
        url = 'http://'+HOST+'/api/expeditions/count'+table+'s/'+num;
        attr = table.toLowerCase()+'-'+num
    }
    return fetch(url)
    .then((response) => response.json())
    .then (data => appendStat(data, attr, 'total'))
    .catch(err => {
        document.getElementById("err").innerHTML=errMsg;
        console.log('error: ' + err);
    })
};

//call total function
function getStats() {
    /*!!!make calls dynamic*/
    return Promise.all([
        getTotal('Expedition', 0),
        getTotal('Year', 2026),
        getTotal('Year', 2025),
        getTotal('Year', 2024),
        getTotal('Year', 2023),
        getTotal('Year', 2022),
        getTotal('Year', 2021),
        getTotal('Year', 2020),
        getTotal('Year', 2019),
        getTotal('Year', 2018),
        getTotal('Year', 2017),
        getTotal('Year', 2016),
        getTotal('Year', 2015),
        getTotal('Year', 2014),
        getTotal('Year', 2013),
        getTotal('Year', 2012),
        getTotal('Year', 2011),
        getTotal('Year', 2010),
        getTotal('Type', 1),
        getTotal('Type', 2),
        getTotal('Type', 3),
        getTotal('Type', 4),
        getTotal('Location', 1),
        getTotal('Location', 2),
        getTotal('Location', 3),
        getTotal('Location', 4),
        getTotal('Location', 5),
        getTotal('Location', 6),
        getTotal('Location', 7),
        getTotal('Topic', 1),
        getTotal('Topic', 2),
        getTotal('Topic', 3),
        getTotal('Topic', 4),
        getTotal('Topic', 5),
        getTotal('Topic', 6),
        getTotal('Topic', 7),
        getTotal('Explorer', 0),
    ])
}

//populate the stats after DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    if(!qryStr) {
        getStats()
        .then(() => {
            console.log('Stats loaded successfully')
        })
        .catch(err => console.log('ERROR loading stats!'))
    }
});