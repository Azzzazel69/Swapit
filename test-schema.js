fetch('https://api.dicebear.com/7.x/avataaars/schema.json').then(r=>r.json()).then(j=>{
  console.log(Object.keys(j.properties));
})
