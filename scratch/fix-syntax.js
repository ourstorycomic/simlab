const fs = require('fs');

let teacher = fs.readFileSync('src/app/dashboard/teacher/page.tsx', 'utf8');

// Fix empty parens in object properties (like icon: ( \n ))
teacher = teacher.replace(/icon:\s*\([\s\n]*\),/g, '');
// Fix empty ternaries if any
teacher = teacher.replace(/\{\w+\s*\?\s*\([\s\n]*\)\s*:\s*\([\s\n]*\)\}/g, '');

fs.writeFileSync('src/app/dashboard/teacher/page.tsx', teacher);

let student = fs.readFileSync('src/app/dashboard/student/page.tsx', 'utf8');

// Fix empty ternaries
student = student.replace(/\{submission\s*\?\s*\([\s\n]*\)\s*:\s*\([\s\n]*\)\}/g, '');

fs.writeFileSync('src/app/dashboard/student/page.tsx', student);
