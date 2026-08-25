const fs = require('fs');
let code = fs.readFileSync('Backend/app.js', 'utf8');
code = code.replace(/const \{ Pool \} = require\('pg'\);\\r?\\n/g, '').replace(/const \{ Pool \} = require\(\
pg\\);\\r?\\n/g, '');
code = code.replace(/const \{ MongoClient \} = require\('mongodb'\);\\r?\\n/g, '').replace(/const \{ MongoClient \} = require\(\mongodb\\);\\r?\\n/g, '');
code = code.replace(/let pgPool = null;\\r?\\n/g, '');
code = code.replace(/let lastPgError = null;\\r?\\n/g, '');
code = code.replace(/function formatPgError[\\s\\S]*?\\}\\r?\\n\\r?\\n/g, '');
code = code.replace(/\\/\\/ --- QUEUE SYSTEM ---[\\s\\S]*?\\/\\/ --- END QUEUE SYSTEM ---\\r?\\n\\r?\\n/g, '');
code = code.replace(/let db = null;\\r?\\nconst MONGODB_URI = process\\.env\\.MONGODB_URI;\\r?\\nconst DATABASE_URL = process\\.env\\.DATABASE_URL \\|\\| process\\.env\\.POSTGRES_URL;[\\s\\S]*?ensureDefaultAdminUser\\(\\);\\r?\\n\\}\\r?\\n\\r?\\nconst PORT/g, 'ensureDefaultAdminUser();\\n\\nconst PORT');
fs.writeFileSync('Backend/app.js', code);
