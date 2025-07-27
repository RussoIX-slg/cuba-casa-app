import { users, properties, passwordResets, type User, type InsertUser, type Property, type InsertProperty, type PasswordReset, type InsertPasswordReset } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getAllProperties(): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property>;
  deleteProperty(id: number): Promise<void>;
  createPasswordReset(resetData: InsertPasswordReset): Promise<PasswordReset>;
  getPasswordReset(token: string): Promise<PasswordReset | undefined>;
  markPasswordResetAsUsed(token: string): Promise<void>;
  updateUserPassword(email: string, newPassword: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users);
    return allUsers;
  }

  async getAllProperties(): Promise<Property[]> {
    const allProperties = await db.select().from(properties);
    return allProperties;
  }

  async getPropertyById(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property || undefined;
  }

  async createProperty(insertProperty: any): Promise<Property> {
    const [property] = await db
      .insert(properties)
      .values({
        title: insertProperty.title,
        address: insertProperty.address,
        description: insertProperty.description,
        price: insertProperty.price,
        lat: insertProperty.lat?.toString(),
        lng: insertProperty.lng?.toString(),
        user_id: insertProperty.user_id,
        images: insertProperty.images || [],
        bedrooms: insertProperty.bedrooms ? parseInt(insertProperty.bedrooms) : null,
        bathrooms: insertProperty.bathrooms ? parseFloat(insertProperty.bathrooms) : null,
        area: insertProperty.area ? parseInt(insertProperty.area) : null,
        type: insertProperty.type,
        contact: insertProperty.contact
      })
      .returning();
    return property;
  }

  async updateProperty(id: number, updateData: any): Promise<Property> {
    const [property] = await db
      .update(properties)
      .set({
        title: updateData.title,
        address: updateData.address,
        description: updateData.description,
        price: updateData.price,
        images: updateData.images || [],
        bedrooms: updateData.bedrooms ? parseInt(updateData.bedrooms) : null,
        bathrooms: updateData.bathrooms ? parseFloat(updateData.bathrooms) : null,
        area: updateData.area ? parseInt(updateData.area) : null,
        type: updateData.type,
        contact: updateData.contact
      })
      .where(eq(properties.id, id))
      .returning();
    return property;
  }

  async deleteProperty(id: number): Promise<void> {
    await db.delete(properties).where(eq(properties.id, id));
  }

  async createPasswordReset(resetData: InsertPasswordReset): Promise<PasswordReset> {
    const [reset] = await db
      .insert(passwordResets)
      .values(resetData)
      .returning();
    return reset;
  }

  async getPasswordReset(token: string): Promise<PasswordReset | undefined> {
    const [reset] = await db.select().from(passwordResets).where(eq(passwordResets.token, token));
    return reset || undefined;
  }

  async markPasswordResetAsUsed(token: string): Promise<void> {
    await db.update(passwordResets)
      .set({ used: true })
      .where(eq(passwordResets.token, token));
  }

  async updateUserPassword(email: string, newPassword: string): Promise<void> {
    await db.update(users)
      .set({ password: newPassword })
      .where(eq(users.email, email));
  }
}

export const storage = new DatabaseStorage();
