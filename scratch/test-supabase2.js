const url = 'https://hbnfvlcizfjqetodaxer.supabase.co/rest/v1/users?select=*';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhibmZ2bGNpemZqcWV0b2RheGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MzMxNDEsImV4cCI6MjEwNzEwOTE0MX0._8SfoyWbgrXOYTl2D_HrQ61wCtXx3czNLa32B8QC73c';

fetch(url, {
  headers: {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`
  }
}).then(res => res.json()).then(data => console.log(data)).catch(err => console.error(err));
