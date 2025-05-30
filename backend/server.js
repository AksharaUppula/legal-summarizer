const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pipeline } = require('@xenova/transformers');
const os = require('os');

const app = express();

// Configure CORS
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// In-memory storage
const users = new Map(); // Store users
const documents = new Map(); // Store documents

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(express.json());

// Rate limiting middleware
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// User Schema (for validation)
class User {
    constructor(username, email, password) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.documents = [];
        this.id = Date.now().toString();
    }
}

// Authentication Middleware
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            throw new Error('Authentication required');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = users.get(decoded.userId);
        if (!user) {
            throw new Error('User not found');
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Please authenticate' });
    }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

// Initialize summarization model
let summarizer;
const initializeModel = async () => {
    try {
        console.log('Starting BART model initialization...');
        summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-12-6', {
            quantized: true,
            cache_dir: './model_cache',
            progress_callback: (progress) => {
                if (!isNaN(progress)) {
                    console.log(`Model download progress: ${Math.round(progress * 100)}%`);
                }
            },
            max_length: 1024,  // Increased for better context
            min_length: 50,    // Increased for more meaningful summaries
            num_beams: 4,      // Increased for better quality
            temperature: 0.7,  // Slightly increased for more diverse summaries
            top_k: 50,         // Added for better token selection
            top_p: 0.95,       // Added for better token selection
            repetition_penalty: 1.2 // Added to prevent repetition
        });
        console.log('✅ BART model initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Error initializing BART model:', error);
        return false;
    }
};

// Text preprocessing function for legal documents
const preprocessText = (text) => {
    try {
        // Remove extra whitespace
        text = text.replace(/\s+/g, ' ').trim();
        
        // Remove special characters and numbers if they're not part of legal references
        text = text.replace(/[^\w\s.,;:()\[\]{}'"-]/g, ' ');
        
        // Remove multiple consecutive spaces
        text = text.replace(/\s+/g, ' ');
        
        // Split into smaller chunks for faster processing
        const maxChunkSize = 300;
        const sections = text.match(new RegExp(`.{1,${maxChunkSize}}(?=\\s|$)`, 'g')) || [];
        
        // Ensure the text is not empty
        if (!text.trim()) {
            throw new Error('Text is empty after preprocessing');
        }
        
        return sections;
    } catch (error) {
        console.error('Error in text preprocessing:', error);
        throw error;
    }
};

// Input validation middleware
const validateRegistration = (req, res, next) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    next();
};

// Routes
app.post('/api/register', validateRegistration, async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Check if user already exists
        for (const [_, user] of users) {
            if (user.email === email || user.username === username) {
                return res.status(400).json({ error: 'User with this email or username already exists' });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User(username, email, hashedPassword);
        users.set(user.id, user);

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({ 
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        let user = null;
        
        // Find user by email
        for (const [_, u] of users) {
            if (u.email === email) {
                user = u;
                break;
            }
        }
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({ 
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Summarization endpoint
app.post('/api/summarize', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        if (!summarizer) {
            const initialized = await initializeModel();
            if (!initialized) {
                return res.status(500).json({ 
                    error: 'Failed to initialize summarization model. Please try again later.'
                });
            }
        }

        console.log('Processing file:', req.file.path);
        const dataBuffer = await pdfParse(req.file.path);
        let text = dataBuffer.text;

        if (!text || text.trim().length === 0) {
            throw new Error('No text could be extracted from the PDF');
        }

        // Preprocess the text
        const sections = preprocessText(text);
        console.log('Preprocessed text into', sections.length, 'sections');

        if (sections.length === 0) {
            throw new Error('No text could be extracted from the PDF');
        }

        // Check memory usage
        if (!checkMemoryUsage()) {
            throw new Error('Server is currently under high load. Please try again in a few minutes.');
        }

        // Add progress tracking
        let startTime = Date.now();
        const updateProgress = (processed, total) => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = (processed / total) * 100;
            console.log(`Progress: ${Math.round(progress)}% (${processed}/${total} sections) - Time elapsed: ${elapsed.toFixed(1)}s`);
        };

        // Add memory optimization
        const processBatch = async (batch) => {
            const batchPromises = batch.map(async (section) => {
                try {
                    const summary = await summarizer(section, {
                        max_length: 100,
                        min_length: 20,
                        do_sample: false,
                        num_beams: 2,
                        temperature: 0.3,
                        top_k: 20,
                        top_p: 0.8,
                        repetition_penalty: 1.1
                    });
                    return summary && summary[0] ? summary[0].summary_text : '';
                } catch (error) {
                    console.error('Error processing section:', error);
                    return '';
                }
            });
            return Promise.all(batchPromises);
        };

        // Process sections in parallel with optimized batching
        const batchSize = 4; // Increased from 2 for more parallel processing
        const results = [];
        let processedSections = 0;
        
        for (let i = 0; i < sections.length; i += batchSize) {
            if (!checkMemoryUsage()) {
                throw new Error('Server memory limit reached. Please try with a smaller document or try again later.');
            }

            const batch = sections.slice(i, i + batchSize);
            const batchResults = await processBatch(batch);
            results.push(...batchResults);
            processedSections += batch.length;
            updateProgress(processedSections, sections.length);

            // Reduced delay between batches
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        const finalSummary = results.filter(s => s).join('\n\n');
        
        // Clean up the uploaded file
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
        });

        if (!finalSummary.trim()) {
            throw new Error('Failed to generate summary. Please try again with a different document.');
        }

        console.log('Summary generated successfully');
        res.json({
            originalText: text,
            summary: finalSummary
        });
    } catch (error) {
        console.error('Summarization error:', error);
        res.status(500).json({ 
            error: 'Error processing the document. Please try again.',
            details: error.message 
        });
    }
});

// Get user's document history
app.get('/api/documents', auth, async (req, res) => {
    try {
        const userDocuments = req.user.documents.map(id => documents.get(id));
        res.json(userDocuments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a document
app.delete('/api/documents/:documentId', auth, async (req, res) => {
    try {
        const documentId = req.params.documentId;
        const documentIndex = req.user.documents.indexOf(documentId);

        if (documentIndex === -1) {
            return res.status(404).json({ error: 'Document not found' });
        }

        req.user.documents.splice(documentIndex, 1);
        documents.delete(documentId);
        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Review endpoints
app.get('/api/reviews', (req, res) => {
    res.json({ message: 'Thank you for your interest in reviews!' });
});

app.post('/api/reviews', (req, res) => {
    res.json({ message: 'Thank you for your review!' });
});

// Root route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Legal Document Summarizer API is running',
        modelStatus: summarizer ? 'ready' : 'initializing'
    });
});

// Start the server
const PORT = process.env.PORT || 5001;
const startServer = async () => {
    try {
        console.log('Initializing server...');
        console.log('Starting model initialization...');
        const modelInitialized = await initializeModel();
        
        if (!modelInitialized) {
            throw new Error('Failed to initialize the summarization model');
        }

        const tryPort = async (port) => {
            return new Promise((resolve, reject) => {
                const server = app.listen(port, () => {
                    console.log(`✅ Server running successfully on port ${port}`);
                    console.log('Ready to process documents!');
                    resolve(server);
                }).on('error', (err) => {
                    if (err.code === 'EADDRINUSE') {
                        console.log(`Port ${port} is in use, trying next port...`);
                        resolve(null);
                    } else {
                        reject(err);
                    }
                });
            });
        };

        // Try ports in sequence
        const ports = [5001, 5002, 5003, 5004, 5005];
        let server = null;
        
        for (const port of ports) {
            server = await tryPort(port);
            if (server) break;
        }

        if (!server) {
            throw new Error('Failed to start server on any available port');
        }

    } catch (error) {
        console.error('Critical error during server startup:', error);
        process.exit(1);
    }
};

// Initialize uploads directory
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize model cache directory
const modelCacheDir = path.join(__dirname, 'model_cache');
if (!fs.existsSync(modelCacheDir)) {
    fs.mkdirSync(modelCacheDir, { recursive: true });
}

// Add after the imports
const MEMORY_THRESHOLD = 0.8; // 80% memory usage threshold

const checkMemoryUsage = () => {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = usedMemory / totalMemory;
    
    if (memoryUsage > MEMORY_THRESHOLD) {
        console.warn(`High memory usage detected: ${Math.round(memoryUsage * 100)}%`);
        return false;
    }
    return true;
};

startServer(); 