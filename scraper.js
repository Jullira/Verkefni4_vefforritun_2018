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

const departments = [
  {
    name: 'Félagsvísindasvið',
    slug: 'felagsvisindasvid',
    id: 1,
  },
  {
    name: 'Heilbrigðisvísindasvið',
    slug: 'heilbrigdisvisindasvid',
    id: 2,
  },
  {
    name: 'Hugvísindasvið',
    slug: 'hugvisindasvid',
    id: 3,
  },
  {
    name: 'Menntavísindasvið',
    slug: 'menntavisindasvid',
    id: 4,
  },
  {
    name: 'Verkfræði- og náttúruvísindasvið',
    slug: 'verkfraedi-og-natturuvisindasvid',
    id: 5,
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


async function getTests(slug) {
  const department = departments.filter(department => department.slug === slug)[0];

  if(!department) return null;

  const response = await fetch('https://ugla.hi.is/Proftafla/View/ajax.php?sid=2027&a=getProfSvids&proftaflaID=37&svidID=' + department.id + '&notaVinnuToflu=0', 'ugla:' + slug);
  const text = await response.text();
  const $ = cheerio.load(JSON.parse(text).html);

  const containerHeader = $('.box > h3');
  console.log(containerHeader);

  const tests = [];

  containerHeader.each((i, el) => {
    const header = $(el);
    const table = $(header).next();
    const tableBody = $(table).find('tbody');
    const tableData = [];

    tableBody.children().each((j, row) => {
      const tableElement = $(row).children();
      tableData.push({
        course: $(tableElement[0]).text(),
        name: $(tableElement[1]).text(),
        Type: $(tableElement[2]).text(),
        Students: $(tableElement[3]).text(),
        Time: $(tableElement[4]).text(),
      });
    });

    tests.push({
      Header: header.text().trim(),
      Tests: tableData,
    });
  });

  return tests;

  client.quit();
}

getTests().catch(err => console.error(err));


async function clearCache() {
  /* todo */
}


async function getStats() {
  const department = departments.filter(department => department.slug === slug)[0];

  if(!department) return null;

  const response = await fetch('https://ugla.hi.is/Proftafla/View/ajax.php?sid=2027&a=getProfSvids&proftaflaID=37&svidID=' + department.id + '&notaVinnuToflu=0', 'ugla:' + slug);
  const text = await response.text();
  const $ = cheerio.load(JSON.parse(text).html);

  const containerHeader = $('.box > h3');
  console.log(containerHeader);

  const stats = [];
  const students;

  containerHeader.each((i, el) => {
    const header = $(el);
    const table = $(header).next();
    const tableBody = $(table).find('tbody');
    
    tableBody.children().each((j, row) => {
      const tableElement = $(row).children();
      students += parseInt($(tableElement[3].text());
      });

      stats.push({
        course: $(tableElement[0]).text(),
        name: $(tableElement[1]).text(),
        Type: $(tableElement[2]).text(),
        Students: students,
        Time: $(tableElement[4]).text(),
    });
    
    return stats;

    client.quit();
}

module.exports = {
  departments,
  getTests,
  clearCache,
  getStats,
};
