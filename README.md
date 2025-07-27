# 🏠 Cuba Casa - Property Map Application

Una aplicación web para explorar y publicar propiedades inmobiliarias en Cuba con mapa interactivo.

## 🚀 Características

- **Mapa Interactivo**: Visualiza propiedades en un mapa de Cuba
- **Gestión de Propiedades**: Agrega, edita y elimina propiedades
- **Autenticación**: Sistema de registro y login seguro
- **Subida de Fotos**: Hasta 7 fotos por propiedad
- **Email Automático**: Notificaciones con SendGrid
- **Responsive**: Optimizado para móvil y escritorio

## 🛠️ Tecnologías

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Express.js + Node.js
- **Base de Datos**: PostgreSQL (Neon Database)
- **Mapas**: Leaflet.js
- **Autenticación**: Passport.js
- **Email**: SendGrid
- **Deploy**: Render.com

## 🌐 Deploy en Render.com

### Variables de Entorno Requeridas:
```
DATABASE_URL=postgresql://usuario:password@host/database
SENDGRID_API_KEY=SG.xxxxx
SESSION_SECRET=tu-secreto-super-seguro
NODE_ENV=production
```

### Configuración de Build:
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Node Version**: 18

## 🏃‍♂️ Desarrollo Local

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar en modo desarrollo
npm run dev
```

## 📱 Funcionalidades

### Para Visitantes:
- Ver propiedades en el mapa
- Buscar por zona
- Ver detalles y fotos

### Para Usuarios Registrados:
- Agregar nuevas propiedades
- Editar sus propiedades
- Eliminar sus propiedades
- Recibir emails de confirmación

## 🗺️ Estructura del Proyecto

```
cuba-casa-app/
├── client/          # Frontend React
├── server/          # Backend Express
├── shared/          # Tipos compartidos
├── uploads/         # Archivos subidos
└── dist/           # Build de producción
```

## 📄 Licencia

MIT License - Uso libre para proyectos personales y comerciales.

---

Desarrollado con ❤️ para la comunidad cubana.