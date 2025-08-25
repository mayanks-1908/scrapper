// ESM main runner example
import { apiRequest, printPreview } from './utils/apiHandler.js';
import { extractUberEatsStore } from './utils/ubereats-extractor.js';;
import * as utils from "node:util"

const saravan = "https://www.ubereats.com/gb/store/saravanaa-bhavan-southall/gd5ZDoH-S7O9M7YvWyX_yQ"
const url_shahi = "https://www.ubereats.com/gb/store/rockys-southall/_iwInzM_T7OGBYt70CA8zg";
const mc_doland = "https://www.ubereats.com/gb/store/mcdonalds-southall-the-broadway/i3rIdIj2TVeyHgtW-Fxy9A"
const iceland = "https://www.ubereats.com/gb/store/iceland-southall/Bdh2zWWRVDSUfUzyWcVKcw"
const agrawal = "https://www.ubereats.com/gb/store/agrawala/tvRJdOS-VB6KwYGjWc9Ihg"
const html = await apiRequest(agrawal, { format: 'text' }); 


const store = extractUberEatsStore(html);
// console.log(store)
// console.log(JSON.stringify(store, null, 1));
// console.log(utils.inspect(store, { depth: null, colors: true }));
