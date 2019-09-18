import monk from 'monk';
console.log(process.env.DATABASE_URL)
const db = monk(process.env.DATABASE_URL);

module.exports = db;