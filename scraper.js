require('isomorphic-fetch');

require('dotenv').config();
const redis = require('redis');
const cheerio = require('cheerio');
const util = require('util');

const cacheTtl = 100000;

const redisOptions = {
  url: 'redis://127.0.0.1:6379/0',
};

const client = redis.createClient(redisOptions);

const asyncSet = util.promisify(client.set).bind(client);
const asyncGet = util.promisify(client.get).bind(client);
const asyncFlush = util.promisify(client.flushall).bind(client);

// declare-a departments variable.
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

  if (cached) {
    return cached;
  }

  const response = await fetch(url);
  const text = await response.text();

  await asyncSet(cacheKey, text, 'EX', cacheTtl);

  return text;
}

// Nær í upplýsingar um próf fyrir hvert svið.
async function getTests(slug) {
  // filterar út allt úr departments nema id.
  const department = departments.filter(department => department.slug === slug)[0];
  if (!department) return null;

  // Initialize html fyrir Cheerio
  const text = await get(`https://ugla.hi.is/Proftafla/View/ajax.php?sid=2027&a=getProfSvids&proftaflaID=37&svidID=${department.id}&notaVinnuToflu=0`, slug);
  const $ = cheerio.load(JSON.parse(text).html);

  // Assign variables
  const h3 = $('.box > h3');
  const tests = [];

  // create an array for all tables
  h3.each((i, el) => {
    const table = $(el).next();
    const tableBody = $(table).find('tbody');
    const tableData = [];

    // gets data from table and pushes into tableData
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

    // Push tableData into tests for returning
    tests.push({
      Header: h3.text().trim(),
      Tests: tableData,
    });
  });

  // Return tests array
  return tests;
}

getTests().catch(err => console.error(err));


async function clearCache() {
  asyncFlush();
}

// Nær í gögn út frá URL og reiknar út tölfræði sem þarf til að skila í stats
async function getStats() {
  const text = await get('https://ugla.hi.is/Proftafla/View/ajax.php?sid=2027&a=getProfSvids&proftaflaID=37&svidID=0&notaVinnuToflu=0', 'Allt');
  const $ = cheerio.load(JSON.parse(text).html);

  const h3 = $('.box > h3');

  // Declaring variables.
  const stats = [];
  let students = 0;
  let sumTests = 0;
  let minStudents = Infinity;
  let maxStudents = -Infinity;

  // Finnum header fyrir hverja töflu til að nálgast gögnin
  h3.each((i, el) => {
    const table = $(el).next();
    const tableBody = $(table).find('tbody');

    // Ítra í gegnum tbody element og finna allt data sem við þurfum og reikna það sem þarf
    tableBody.children().each((j, row) => {
      const tableElement = $(row).children();
      sumTests += 1;
      students += parseInt($(tableElement[3]).text());
      const student = parseInt($(tableElement[3]).text());

      if (student < minStudents) {
        minStudents = student;
      }

      if (student > maxStudents) {
        maxStudents = student;
      }
    });
  });

  const avgStudents = parseInt(students / sumTests);

  // Pusha í stats
  stats.push({
    Number_of_tests: sumTests,
    Students: students,
    Average_num_of_students_per_test: avgStudents,
    test_with_most_students: maxStudents,
    test_with_fewest_studets: minStudents,
  });
  // Skila stats
  return stats;
}

getStats().catch(err => console.error(err));

module.exports = {
  departments,
  getTests,
  clearCache,
  getStats,
};
