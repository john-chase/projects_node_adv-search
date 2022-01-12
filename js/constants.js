const qryStr = window.location.search;
const HOST = 'localhost:3000';
const domain = 'http://artoftech:8888';
const noaa = 'https://oceanexplorer.noaa.gov'
const filterButton=document.getElementById("adv-search");
const searchButton=document.getElementById("new-search");
const engQry=document.getElementById("engQry");
const mainContainer = document.getElementById("myData");
const pDiv=document.getElementById("params");
const nDiv=document.getElementById("noparams");
const sDiv=document.getElementById("search");
const mDiv=document.getElementById("main");
const pagination = document.getElementById("index");
const resetButton=document.getElementById("reset");
const errMsg='<p>There has been a problem retrieving data. Please refresh or <a href="mailto:???">email the help center</a>.</p>';

export { qryStr, HOST, domain, noaa, filterButton, searchButton, engQry, mainContainer, pDiv, nDiv, sDiv, mDiv, pagination, resetButton, errMsg }