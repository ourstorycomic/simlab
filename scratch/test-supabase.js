const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hbnfvlcizfjqetodaxer.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhibmZ2bGNpemZqcWV0b2RheGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1MzMxNDEsImV4cCI6MjEwNzEwOTE0MX0._8SfoyWbgrXOYTl2D_HrQ61wCtXx3czNLa32B8QC73c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Success! Data:", data);
  }
}

test();
