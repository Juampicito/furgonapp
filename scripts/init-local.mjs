import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const directory = path.join(root, '.tools');
fs.mkdirSync(directory, {recursive:true});
const config = path.join(directory, 'local.properties');
if (!fs.existsSync(config)) {
  const roles = ['admin', 'apoderado', 'furgonista', 'colegio'];
  const accounts = roles.map(role => ({role, password:crypto.randomBytes(18).toString('base64url')}));
  fs.writeFileSync(config, ['app.jwt-secret='+crypto.randomBytes(48).toString('base64url'),'app.bootstrap.enabled=true',...accounts.map(a=>'app.bootstrap.'+a.role+'-password='+a.password),''].join('\n'), {flag:'wx',mode:0o600});
  fs.writeFileSync(path.join(directory,'CUENTAS-INICIALES.md'), '# Cuentas iniciales de FurgonApp\n\nAcceso: http://127.0.0.1:3000\n\n| Rol | Correo | Contraseña |\n|---|---|---|\n'+accounts.map(a=>'| '+a.role+' | '+a.role+'@furgonapp.local | '+a.password+' |').join('\n')+'\n\nSon cuentas persistentes. Furgonista e institución deben completar sus datos reales. Este archivo y los secretos se excluyen de Git.\n', {flag:'wx',mode:0o600});
}
console.log('Configuración local preparada. Cuentas iniciales en .tools/CUENTAS-INICIALES.md (privado, excluido de Git).');
