require('isomorphic-fetch');

require('dotenv').config();
const redis = require('redis');
const cheerio = require('cheerio');
const util = require('util');

const cacheTtl = 100000;

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
  const text = await get('https://ugla.hi.is/Proftafla/View/index.php?view=proftaflaYfirlit&sid=2030&proftaflaID=37', 'ugla:proftafla');

  const $ = cheerio.load(text);

  const table = $('.box');

  const tableArray = [];

  table.each((i, el) => {
    const tableRow = $(el).find('table').text();
    console.log(tableRow);
    tableArray.push(tableRow);
  });

  // console.log(table);
  console.log(tableArray);

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
