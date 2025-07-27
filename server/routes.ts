import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { upload } from "./upload";
import path from "path";
import express from "express";
import { sendWelcomeEmail, sendPasswordResetEmail } from "./email";
import crypto from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Upload endpoint
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

  // Authentication routes
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }
      
      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Store user ID in session and save it
      (req as any).session.userId = user.id;
      console.log("LOGIN - Setting userId in session:", user.id);
      console.log("LOGIN - Session after setting userId:", req.session);
      
      // Force session save
      (req as any).session.save();
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      
      // Check if user already exists (normalize email to lowercase)
      const existingUser = await storage.getUserByEmail(email.toLowerCase());
      if (existingUser) {
        return res.status(409).json({ error: "User already exists" });
      }
      
      // Create new user (store email in lowercase)
      const newUser = await storage.createUser({ email: email.toLowerCase(), password });
      
      // Send welcome email
      try {
        const emailSent = await sendWelcomeEmail(email.toLowerCase());
        if (emailSent) {
          console.log(`Welcome email sent successfully to ${email}`);
        } else {
          console.error(`Failed to send welcome email to ${email}`);
        }
      } catch (emailError) {
        console.error("Welcome email error:", emailError);
        // Don't fail registration if email fails
      }
      
      // Store user in session
      (req as any).session.userId = newUser.id;
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/logout", (req, res) => {
    (req as any).session.destroy((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Password reset request
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      
      // Check if user exists (normalize email to lowercase)
      const user = await storage.getUserByEmail(email.toLowerCase());
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ message: "If the email exists, a password reset link has been sent" });
      }
      
      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Expires in 1 hour
      
      // Save reset token (with normalized email)
      await storage.createPasswordReset({
        email: email.toLowerCase(),
        token,
        expires_at: expiresAt
      });
      
      // Send reset email
      try {
        const emailSent = await sendPasswordResetEmail(email.toLowerCase(), token);
        if (emailSent) {
          console.log(`Password reset email sent to ${email}`);
        } else {
          console.error(`Failed to send password reset email to ${email}`);
        }
      } catch (emailError) {
        console.error("Password reset email error:", emailError);
      }
      
      res.json({ message: "If the email exists, a password reset link has been sent" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });

  // Reset password with token
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" });
      }
      
      // Find reset token
      const resetRecord = await storage.getPasswordReset(token);
      if (!resetRecord) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }
      
      // Check if token is expired or already used
      if (resetRecord.used || new Date() > resetRecord.expires_at) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }
      
      // Update password
      await storage.updateUserPassword(resetRecord.email, newPassword);
      
      // Mark token as used
      await storage.markPasswordResetAsUsed(token);
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  app.get("/api/user", async (req, res) => {
    try {
      console.log("GET /api/user - Session data:", req.session);
      const userId = (req as any).session?.userId;
      console.log("GET /api/user - UserId from session:", userId);
      
      if (!userId) {
        console.log("GET /api/user - No userId in session, returning 401");
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        console.log("GET /api/user - User not found for userId:", userId);
        return res.status(404).json({ error: "User not found" });
      }
      
      console.log("GET /api/user - Found user:", user.email);
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // User management API routes
  
  // Get all users (for demonstration)
  app.get("/api/users", async (req, res) => {
    try {
      // This would normally be paginated in a real application
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Create a new user (legacy endpoint - use /api/register instead)
  app.post("/api/users", async (req, res) => {
    try {
      console.log("POST /api/users - Request body:", req.body);
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: "User already exists" });
      }
      
      const newUser = await storage.createUser({ email, password });
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Properties API routes
  app.get("/api/properties", async (req, res) => {
    try {
      const { userId } = req.query;
      const properties = await storage.getAllProperties();
      
      if (userId) {
        // Filter properties by specific user
        const userProperties = properties.filter(prop => 
          prop.user_id === userId || prop.user_id === parseInt(userId as string)
        );
        res.json(userProperties);
      } else {
        // Return all properties (public view)
        res.json(properties);
      }
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ error: "Failed to fetch properties" });
    }
  });

  app.post("/api/properties", async (req, res) => {
    try {
      // Check authentication
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const propertyData = req.body;
      // Assign the authenticated user's ID to the property
      propertyData.user_id = userId.toString();
      
      const newProperty = await storage.createProperty(propertyData);
      res.status(201).json(newProperty);
    } catch (error) {
      console.error("Error creating property:", error);
      res.status(500).json({ error: "Failed to create property" });
    }
  });

  app.put("/api/properties/:id", async (req, res) => {
    try {
      // Check authentication
      const userId = (req as any).session?.userId;
      console.log("PUT - Session:", req.session);
      console.log("PUT - Session userId:", userId);
      console.log("PUT - Session ID:", req.sessionID);
      console.log("PUT - Request headers cookie:", req.headers.cookie);
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid property ID" });
      }
      
      // Get the existing property to check ownership
      const existingProperty = await storage.getPropertyById(id);
      if (!existingProperty) {
        return res.status(404).json({ error: "Property not found" });
      }
      
      // Check if the user owns this property
      if (existingProperty.user_id !== userId.toString() && existingProperty.user_id !== userId) {
        return res.status(403).json({ error: "You can only edit your own properties" });
      }
      
      const propertyData = req.body;
      const updatedProperty = await storage.updateProperty(id, propertyData);
      res.status(200).json(updatedProperty);
    } catch (error) {
      console.error("Error updating property:", error);
      res.status(500).json({ error: "Failed to update property" });
    }
  });

  app.delete("/api/properties/:id", async (req, res) => {
    try {
      // Check authentication
      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid property ID" });
      }
      
      // Get the existing property to check ownership
      const existingProperty = await storage.getPropertyById(id);
      if (!existingProperty) {
        return res.status(404).json({ error: "Property not found" });
      }
      
      // Check if the user owns this property
      if (existingProperty.user_id !== userId.toString() && existingProperty.user_id !== userId) {
        return res.status(403).json({ error: "You can only delete your own properties" });
      }
      
      await storage.deleteProperty(id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting property:", error);
      res.status(500).json({ error: "Failed to delete property" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
