require('isomorphic-fetch');

require('dotenv').config();
const redis = require('redis');
const cheerio = require('cheerio');
const util = require('util');

const cacheTtl = 1000;

const id = 1;

const redisOptions = {
  url: 'redis://127.0.0.1:6379/0'
};

const client = redis.createClient(redisOptions);

const asyncSet = util.promisify(client.set).bind(client);
const asyncGet = util.promisify(client.get).bind(client);
const asyncDel = util.promisify(client.del).bind(client);

/* todo require og stilla dót */


const departments = [
  {
    name: 'Félagsvísindasvið',
    slug: 'felagsvisindasvid',
  },
  {
    name: 'Heilbrigðisvísindasvið',
    slug: 'heilbrigdisvisindasvid',
  },
  {
    name: 'Hugvísindasvið',
    slug: 'hugvisindasvid',
  },
  {
    name: 'Menntavísindasvið',
    slug: 'menntavisindasvid',
  },
  {
    name: 'Verkfræði- og náttúruvísindasvið',
    slug: 'verkfraedi-og-natturuvisindasvid',
  },
];


async function get(url, cacheKey) {
  const cached = await asyncGet(cacheKey);

  if(cached) {
    return cached;
  }

  const response = await fetch(url);
  const text = await response.text();

  await asyncSet(cacheKey, text, 'EX', cacheTtl);

  return text;
}


async function getTests() {
  const responce = await fetch('https://ugla.hi.is/Proftafla/View/ajax.php?sid=2027&a=getProfSvids&proftaflaID=37&svidID=' + id + '&notaVinnuToflu=0', 'ugla:proftafla');
  const text = await responce.text();
  const $ = cheerio.load(JSON.parse(text).html);
  const table = $('tbody');
  // console.log(table.length);
  const tableArray = [];

  table.each((i, el) => {
    const prof = $('tr').children('td').eq(1).text();
  })

  console.log(tableArray);
  // table.each((i, el) => {
  //   const tableRow = $(el).find('tr');
  //   // tableRow.each((i, el) => {
  //   //   const 
  //   // });
  //   console.log(tableRow);
  //   tableArray.push(tableRow);
  // });

  // console.log(table);
  // console.log(tableArray);

  client.quit();
}

getTests().catch(err => console.error(err));


async function clearCache() {
  /* todo */
}


async function getStats() {
  //todo
}

module.exports = {
  departments,
  getTests,
  clearCache,
  getStats,
};
