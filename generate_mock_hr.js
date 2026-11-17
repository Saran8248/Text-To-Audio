const fs = require('fs');
const path = require('path');

const firstNames = ['Liam', 'Emma', 'Noah', 'Olivia', 'Conor', 'Saoirse', 'Jack', 'Aoife', 'Sean', 'Ciara', 'Oisin', 'Niamh', 'Patrick', 'Fiona', 'Cillian', 'Roisin', 'Declan', 'Maeve', 'Eoin', 'Siobhan'];
const lastNames = ['Murphy', 'Kelly', 'OSullivan', 'Walsh', 'Smith', 'OBrien', 'Byrne', 'Ryan', 'Connor', 'ONeill', 'Kavanagh', 'Doyle', 'McCarthy', 'Gallagher', 'Lynch', 'Dunne', 'Brennan', 'Daly'];
const companies = ['Stripe', 'Intercom', 'Workday', 'HubSpot', 'Google', 'Meta', 'Amazon', 'Microsoft', 'Salesforce', 'Zendesk', 'Tito', 'Teamwork', 'Ding', 'Qualtrics', 'DocuSign', 'Apple'];

const records = [];
records.push('name,email,company,industry,country');

let count = 1;
while(records.length <= 320) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const company = companies[Math.floor(Math.random() * companies.length)];
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${count}@${company.toLowerCase()}.com`;
    
    records.push(`"${fn} ${ln}",${email},${company},Tech,Ireland`);
    count++;
}

const outPath = 'C:\\Users\\sksar\\Desktop\\Text-to-Audio\\ireland_tech_hr.csv';
fs.writeFileSync(outPath, records.join('\n'));
console.log(`Successfully generated ${records.length - 1} mock records to ${outPath}`);
