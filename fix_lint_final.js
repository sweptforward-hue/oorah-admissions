const fs = require('fs')

const clientPath = 'src/components/campers/camper-detail-client.tsx'
let content = fs.readFileSync(clientPath, 'utf8')

content = content.replace(/catch\(err:any\)/g, 'catch(err:unknown)')

fs.writeFileSync(clientPath, content)
