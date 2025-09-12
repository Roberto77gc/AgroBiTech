# 🗄️ Configuración de MongoDB Atlas para AgroDigital

## 1. Crear Cluster en MongoDB Atlas

1. Ve a [MongoDB Atlas](https://cloud.mongodb.com)
2. Crea una cuenta gratuita
3. Crea un nuevo cluster (M0 Sandbox - Gratuito)
4. Elige la región más cercana a España (Frankfurt o Ireland)

## 2. Configurar Acceso a la Base de Datos

### 2.1 Crear Usuario de Base de Datos
1. Ve a "Database Access" en el menú lateral
2. Click en "Add New Database User"
3. Username: `agrodigital_user`
4. Password: Genera una contraseña segura
5. Database User Privileges: "Read and write to any database"
6. Click "Add User"

### 2.2 Configurar IP Whitelist
1. Ve a "Network Access" en el menú lateral
2. Click en "Add IP Address"
3. Para desarrollo: "Add Current IP Address"
4. Para producción: "Allow Access from Anywhere" (0.0.0.0/0)
5. Click "Confirm"

## 3. Obtener String de Conexión

1. Ve a "Clusters" en el menú lateral
2. Click en "Connect" en tu cluster
3. Selecciona "Connect your application"
4. Driver: "Node.js"
5. Version: "4.1 or later"
6. Copia el string de conexión

### String de conexión ejemplo:
```
mongodb+srv://agrodigital_user:<password>@cluster0.xxxxx.mongodb.net/agrodigital_prod?retryWrites=true&w=majority
```

## 4. Configurar Variables de Entorno

### En Railway (Backend):
```bash
MONGODB_URI=mongodb+srv://agrodigital_user:TU_PASSWORD@cluster0.xxxxx.mongodb.net/agrodigital_prod?retryWrites=true&w=majority
```

### En Vercel (Frontend):
```bash
VITE_API_BASE_URL=https://tu-backend.railway.app/api
```

## 5. Verificar Conexión

1. Despliega tu backend
2. Ve a la URL de health check: `https://tu-backend.railway.app/api/health`
3. Deberías ver: `{"status":"healthy","timestamp":"...","uptime":...}`

## 6. Configuración de Seguridad

### 6.1 Configurar CORS
En Railway, configura:
```bash
CORS_ORIGINS=https://tu-frontend.vercel.app,https://www.tu-frontend.vercel.app
```

### 6.2 Configurar JWT Secret
```bash
JWT_SECRET=tu_secreto_super_seguro_minimo_32_caracteres
```

## 7. Monitoreo y Mantenimiento

1. **MongoDB Atlas Dashboard**: Monitorea el uso de la base de datos
2. **Logs**: Revisa los logs en Railway para errores
3. **Backups**: MongoDB Atlas hace backups automáticos
4. **Escalabilidad**: Puedes escalar el cluster cuando sea necesario

## 8. Troubleshooting

### Error de conexión:
- Verifica que la IP esté en la whitelist
- Verifica que el usuario tenga permisos correctos
- Verifica que el string de conexión sea correcto

### Error de CORS:
- Verifica que CORS_ORIGINS esté configurado correctamente
- Verifica que la URL del frontend sea exacta

### Error de autenticación:
- Verifica que JWT_SECRET esté configurado
- Verifica que el token se esté enviando correctamente
