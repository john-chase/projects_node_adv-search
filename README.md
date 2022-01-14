# explorations_advanced-search
API with endpoints for Advanced Expedition Search module 

Requires:
* NODE
* MYSQL

NPM:
* express
* body-parser
* mysql
* chalk
  
Endpoints: 
* /api/expeditions/advSearch/
* /api/expeditions/lookupLocations/:sort
* /api/expeditions/lookupTopics/:sort
* /api/expeditions/lookupTypes/:sort
* /api/expeditions/lookupExplorers/:sort
* /api/expeditions/lookupYears/:sort

Presentation:
* https://drive.google.com/file/d/1atSiKJ5tmMj52NyUayRuvNX_jaI8oxPn/view?ts=5fa02b5f

Connection String
* mysql -u thearto4_eas-api -h chir111.websitehostserver.net -p

Current directory
* SHOW VARIABLES WHERE Variable_Name LIKE "%dir";

Datbase import
* mysql -u thearto4_eas-admin2 -p thearto4_expBuilder -h chir111.websitehostserver.net < ~/public_html/PROJECTS/node/mysql/db.sql

Install node
* curl -sL https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.0/install.sh -o install_nvm.sh
* bash install_nvm.sh
* command -v nvm
* nvm install --lts