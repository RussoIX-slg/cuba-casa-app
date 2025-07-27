const express = require('express');
const session = require('express-session');
const connectPgSimple = require('connect-pg-simple');
const path = require('path');
const { Pool } = require('@neondatabase/serverless');
const multer = require('multer');
const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Configure SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Configure file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Session setup
const pgSession = connectPgSimple(session);
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET || 'cuba-casa-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static('uploads'));
app.use(express.static('dist'));

// Database helper functions
const dbHelpers = {
  async getUserByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  },
  
  async createUser(email, password) {
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [email, password]
    );
    return result.rows[0];
  },
  
  async getAllProperties() {
    const result = await pool.query('SELECT * FROM properties ORDER BY created_at DESC');
    return result.rows;
  },
  
  async createProperty(propertyData) {
    const {
      title, address, description, price, lat, lng, user_id,
      images, bedrooms, bathrooms, area, type, contact
    } = propertyData;
    
    const result = await pool.query(`
      INSERT INTO properties (
        title, address, description, price, lat, lng, user_id,
        images, bedrooms, bathrooms, area, type, contact
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      title, address, description, price, lat, lng, user_id,
      JSON.stringify(images || []), bedrooms, bathrooms, area, type, contact
    ]);
    
    return result.rows[0];
  },
  
  async deleteProperty(id, userId) {
    const result = await pool.query(
      'DELETE FROM properties WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    return result.rows[0];
  }
};

// Email functions
async function sendWelcomeEmail(email) {
  if (!process.env.SENDGRID_API_KEY) return;
  
  const msg = {
    to: email,
    from: 'cubacasa@example.com',
    subject: '¡Bienvenido a Cuba Casa!',
    html: `
      <h1>¡Bienvenido a Cuba Casa!</h1>
      <p>Gracias por registrarte en nuestra plataforma de propiedades en Cuba.</p>
      <p>Ahora puedes:</p>
      <ul>
        <li>Explorar propiedades en el mapa</li>
        <li>Agregar tus propias propiedades</li>
        <li>Contactar vendedores directamente</li>
      </ul>
    `
  };
  
  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// API Routes

// Authentication
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }
    
    const existingUser = await dbHelpers.getUserByEmail(email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }
    
    const user = await dbHelpers.createUser(email.toLowerCase(), password);
    await sendWelcomeEmail(email);
    
    res.json({ id: user.id, email: user.email });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await dbHelpers.getUserByEmail(email.toLowerCase());
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    req.session.userId = user.id;
    res.json({ id: user.id, email: user.email });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Sesión cerrada' });
});

app.get('/api/user', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  res.json({ id: req.session.userId });
});

// Properties
app.get('/api/properties', async (req, res) => {
  try {
    const properties = await dbHelpers.getAllProperties();
    res.json(properties);
  } catch (error) {
    console.error('Error loading properties:', error);
    res.status(500).json({ error: 'Error al cargar propiedades' });
  }
});

app.post('/api/properties', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    const propertyData = {
      ...req.body,
      user_id: req.session.userId.toString()
    };
    
    const property = await dbHelpers.createProperty(propertyData);
    res.json(property);
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ error: 'Error al crear propiedad' });
  }
});

app.delete('/api/properties/:id', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    const deletedProperty = await dbHelpers.deleteProperty(req.params.id, req.session.userId.toString());
    if (!deletedProperty) {
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }
    
    res.json({ message: 'Propiedad eliminada' });
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ error: 'Error al eliminar propiedad' });
  }
});

// File upload
app.post('/api/upload', upload.array('images', 7), (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files)) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const fileUrls = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ urls: fileUrls });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Serve main page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Cuba Casa server running on port ${PORT}`);
});