const fs = require('fs');
const path = require('path');

const envFiles = [
  { example: 'apps/api/.env.example', target: 'apps/api/.env' },
];

for (const { example, target } of envFiles) {
  const targetPath = path.resolve(__dirname, '..', target);
  const examplePath = path.resolve(__dirname, '..', example);

  if (fs.existsSync(targetPath)) {
    console.log(`${target} already exists, skipping`);
  } else {
    fs.copyFileSync(examplePath, targetPath);
    console.log(`Created ${target} from ${example}`);
  }
}
