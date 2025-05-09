import { 
  users, type User, type InsertUser,
  wallets, type Wallet, type InsertWallet,
  transactions, type Transaction, type InsertTransaction,
  webhookConfigs, type WebhookConfig, type InsertWebhookConfig,
  botSettings, type BotSettings, type InsertBotSettings,
  stats, type Stats, type InsertStats
} from "@shared/schema";
import { db } from './db';
import { eq, desc, sql as sqlBuilder } from 'drizzle-orm';

// Extend the storage interface with all required methods
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Wallet methods
  getWallets(): Promise<Wallet[]>;
  getWalletById(id: number): Promise<Wallet | undefined>;
  getWalletByAddress(address: string): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWallet(id: number, wallet: Partial<InsertWallet>): Promise<Wallet | undefined>;
  deleteWallet(id: number): Promise<boolean>;

  // Transaction methods
  getTransactions(limit?: number, offset?: number): Promise<Transaction[]>;
  getTransactionById(id: number): Promise<Transaction | undefined>;
  getTransactionByTransactionId(transactionId: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  countTransactions(): Promise<number>;
  getTransactionsByCurrency(currency: string): Promise<Transaction[]>;

  // Webhook methods
  getWebhookConfig(): Promise<WebhookConfig | undefined>;
  createWebhookConfig(config: InsertWebhookConfig): Promise<WebhookConfig>;
  updateWebhookConfig(id: number, config: Partial<InsertWebhookConfig>): Promise<WebhookConfig | undefined>;

  // Bot settings methods
  getBotSettings(): Promise<BotSettings | undefined>;
  createBotSettings(settings: InsertBotSettings): Promise<BotSettings>;
  updateBotSettings(id: number, settings: Partial<InsertBotSettings>): Promise<BotSettings | undefined>;

  // Stats methods
  getStats(): Promise<Stats | undefined>;
  updateStats(stats: Partial<InsertStats>): Promise<Stats | undefined>;
  incrementWebhookCalls(): Promise<Stats | undefined>;
}

// In-memory implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private wallets: Map<number, Wallet>;
  private transactions: Map<number, Transaction>;
  private webhookConfigs: Map<number, WebhookConfig>;
  private botSettingsMap: Map<number, BotSettings>;
  private statsMap: Map<number, Stats>;
  
  private currentUserId: number;
  private currentWalletId: number;
  private currentTransactionId: number;
  private currentWebhookConfigId: number;
  private currentBotSettingsId: number;
  private currentStatsId: number;

  constructor() {
    this.users = new Map();
    this.wallets = new Map();
    this.transactions = new Map();
    this.webhookConfigs = new Map();
    this.botSettingsMap = new Map();
    this.statsMap = new Map();
    
    this.currentUserId = 1;
    this.currentWalletId = 1;
    this.currentTransactionId = 1;
    this.currentWebhookConfigId = 1;
    this.currentBotSettingsId = 1;
    this.currentStatsId = 1;

    // Initialize with default data
    this.initializeData();
  }

  private initializeData() {
    // Create default stats
    const defaultStats: Stats = {
      id: this.currentStatsId++,
      totalTransactions: 156,
      totalVolume: 5.8,
      activeWallets: 12,
      webhookCalls: 2456,
      transactionsGrowth: "12%",
      volumeGrowth: "8%",
      walletsGrowth: "2",
      webhooksGrowth: "18%",
      updatedAt: new Date(),
    };
    this.statsMap.set(1, defaultStats);

    // Create default wallets
    const defaultWallets: InsertWallet[] = [
      {
        name: "Bitcoin Wallet",
        address: "bc1q9h5ywrfltzwlj7n96xadxtm49nuark4v5xgx0h",
        currency: "BTC",
        network: "BTC",
        discordUserId: "219521086801625344",
        isActive: true
      },
      {
        name: "Ethereum Wallet",
        address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        currency: "ETH",
        network: "ETH",
        discordUserId: "219521086801625344",
        isActive: true
      },
      {
        name: "USDT Wallet (ERC20)",
        address: "0x8f2242bF7C2834Cb730087E59b026Af3e986FD04",
        currency: "USDT",
        network: "ERC20",
        discordUserId: "219521086801625344",
        isActive: true
      },
      {
        name: "USDC Wallet (Solana)",
        address: "5TfvgRXRr5ksXtfo1tFeqUGJX9sUGP1qdP7Yb7TjSQ1V",
        currency: "USDC",
        network: "Solana",
        discordUserId: "219521086801625344",
        isActive: true
      },
      {
        name: "USDT Wallet (TRC20)",
        address: "TUQjA8kHZRGb7BKKe5P6BDFfy1ZQaSQQWG",
        currency: "USDT",
        network: "TRC20",
        discordUserId: "219521086801625344",
        isActive: true
      }
    ];

    defaultWallets.forEach(wallet => this.createWallet(wallet));

    // Create default transactions
    const defaultTransactions: InsertTransaction[] = [
      {
        transactionId: "txn_1KbH7ZmQ8X5p9L",
        amount: 0.0458,
        currency: "BTC",
        network: "BTC",
        confirmations: 6,
        requiredConfirmations: 3,
        status: "completed",
        walletId: 1
      },
      {
        transactionId: "txn_8JhT9PqR3K7L2M",
        amount: 1.25,
        currency: "ETH",
        network: "ETH",
        confirmations: 8,
        requiredConfirmations: 15,
        status: "pending",
        walletId: 2
      },
      {
        transactionId: "txn_5GtY7ZmQ8X5p9L",
        amount: 0.0128,
        currency: "BTC",
        network: "BTC",
        confirmations: 0,
        requiredConfirmations: 3,
        status: "failed",
        walletId: 1
      },
      {
        transactionId: "txn_ERC20_USDT_123",
        amount: 500.00,
        currency: "USDT",
        network: "ERC20",
        confirmations: 15,
        requiredConfirmations: 12,
        status: "completed",
        walletId: 3
      },
      {
        transactionId: "txn_SOL_USDC_456",
        amount: 250.00,
        currency: "USDC",
        network: "Solana",
        confirmations: 25,
        requiredConfirmations: 32,
        status: "pending",
        walletId: 4
      },
      {
        transactionId: "txn_TRC20_USDT_789",
        amount: 1000.00,
        currency: "USDT",
        network: "TRC20",
        confirmations: 19,
        requiredConfirmations: 15,
        status: "completed",
        walletId: 5
      }
    ];

    defaultTransactions.forEach(txn => this.createTransaction(txn));

    // Create default webhook config
    const defaultWebhookConfig: InsertWebhookConfig = {
      url: "https://discord.com/api/webhooks/1234567890/abcdefghijklmnopqrstuvwxyz",
      notifySuccess: true,
      notifyPending: true,
      notifyFailed: true,
      notifyWallet: false
    };
    this.createWebhookConfig(defaultWebhookConfig);

    // Create default bot settings
    const defaultBotSettings: InsertBotSettings = {
      token: "discord_bot_token_placeholder",
      bitcoinConfirmations: 3,
      ethereumConfirmations: 15,
      litecoinConfirmations: 6,
      erc20Confirmations: 12,
      trc20Confirmations: 15,
      bep20Confirmations: 10,
      polygonConfirmations: 15,
      solanaConfirmations: 32,
      discordClientId: "123456789012345678",
      discordClientSecret: "client_secret_placeholder",
      discordRedirectUri: "https://crypto-dashboard.replit.app/auth/discord/callback",
      discordGuildId: "987654321098765432",
      gitbookApiKey: "gitbook_api_key_placeholder",
      gitbookSpaceId: "space_123456"
    };
    this.createBotSettings(defaultBotSettings);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Wallet methods
  async getWallets(): Promise<Wallet[]> {
    return Array.from(this.wallets.values());
  }

  async getWalletById(id: number): Promise<Wallet | undefined> {
    return this.wallets.get(id);
  }

  async getWalletByAddress(address: string): Promise<Wallet | undefined> {
    return Array.from(this.wallets.values()).find(
      (wallet) => wallet.address === address,
    );
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const id = this.currentWalletId++;
    const wallet: Wallet = { 
      ...insertWallet, 
      id, 
      createdAt: new Date() 
    };
    this.wallets.set(id, wallet);
    return wallet;
  }

  async updateWallet(id: number, updates: Partial<InsertWallet>): Promise<Wallet | undefined> {
    const wallet = this.wallets.get(id);
    if (!wallet) return undefined;
    
    const updatedWallet = { ...wallet, ...updates };
    this.wallets.set(id, updatedWallet);
    return updatedWallet;
  }

  async deleteWallet(id: number): Promise<boolean> {
    return this.wallets.delete(id);
  }

  // Transaction methods
  async getTransactions(limit = 50, offset = 0): Promise<Transaction[]> {
    const allTransactions = Array.from(this.transactions.values());
    // Sort by most recent first
    allTransactions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return allTransactions.slice(offset, offset + limit);
  }

  async getTransactionById(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionByTransactionId(transactionId: string): Promise<Transaction | undefined> {
    return Array.from(this.transactions.values()).find(
      (tx) => tx.transactionId === transactionId,
    );
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const now = new Date();
    const transaction: Transaction = { 
      ...insertTransaction, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(id: number, updates: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction: Transaction = { 
      ...transaction, 
      ...updates,
      updatedAt: new Date()
    };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async countTransactions(): Promise<number> {
    return this.transactions.size;
  }

  async getTransactionsByCurrency(currency: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (tx) => tx.currency === currency,
    );
  }

  // Webhook methods
  async getWebhookConfig(): Promise<WebhookConfig | undefined> {
    if (this.webhookConfigs.size > 0) {
      return this.webhookConfigs.get(1);
    }
    return undefined;
  }

  async createWebhookConfig(insertConfig: InsertWebhookConfig): Promise<WebhookConfig> {
    const id = this.currentWebhookConfigId++;
    const now = new Date();
    const config: WebhookConfig = { 
      ...insertConfig, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.webhookConfigs.set(id, config);
    return config;
  }

  async updateWebhookConfig(id: number, updates: Partial<InsertWebhookConfig>): Promise<WebhookConfig | undefined> {
    const config = this.webhookConfigs.get(id);
    if (!config) return undefined;
    
    const updatedConfig: WebhookConfig = { 
      ...config, 
      ...updates,
      updatedAt: new Date()
    };
    this.webhookConfigs.set(id, updatedConfig);
    return updatedConfig;
  }

  // Bot settings methods
  async getBotSettings(): Promise<BotSettings | undefined> {
    if (this.botSettingsMap.size > 0) {
      return this.botSettingsMap.get(1);
    }
    return undefined;
  }

  async createBotSettings(insertSettings: InsertBotSettings): Promise<BotSettings> {
    const id = this.currentBotSettingsId++;
    const now = new Date();
    const settings: BotSettings = { 
      ...insertSettings, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.botSettingsMap.set(id, settings);
    return settings;
  }

  async updateBotSettings(id: number, updates: Partial<InsertBotSettings>): Promise<BotSettings | undefined> {
    const settings = this.botSettingsMap.get(id);
    if (!settings) return undefined;
    
    const updatedSettings: BotSettings = { 
      ...settings, 
      ...updates,
      updatedAt: new Date()
    };
    this.botSettingsMap.set(id, updatedSettings);
    return updatedSettings;
  }

  // Stats methods
  async getStats(): Promise<Stats | undefined> {
    if (this.statsMap.size > 0) {
      return this.statsMap.get(1);
    }
    return undefined;
  }

  async updateStats(updates: Partial<InsertStats>): Promise<Stats | undefined> {
    let stats = await this.getStats();
    if (!stats) return undefined;
    
    const updatedStats: Stats = { 
      ...stats, 
      ...updates,
      updatedAt: new Date()
    };
    this.statsMap.set(stats.id, updatedStats);
    return updatedStats;
  }

  async incrementWebhookCalls(): Promise<Stats | undefined> {
    let stats = await this.getStats();
    if (!stats) return undefined;
    
    stats = { 
      ...stats, 
      webhookCalls: stats.webhookCalls + 1,
      updatedAt: new Date()
    };
    this.statsMap.set(stats.id, stats);
    return stats;
  }
}

// DatabaseStorage implementation using Drizzle ORM
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Wallet methods
  async getWallets(): Promise<Wallet[]> {
    return db.select().from(wallets);
  }

  async getWalletById(id: number): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, id));
    return wallet;
  }

  async getWalletByAddress(address: string): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.address, address));
    return wallet;
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const [wallet] = await db.insert(wallets).values({
      ...insertWallet,
      createdAt: new Date()
    }).returning();
    return wallet;
  }

  async updateWallet(id: number, updates: Partial<InsertWallet>): Promise<Wallet | undefined> {
    const [wallet] = await db
      .update(wallets)
      .set(updates)
      .where(eq(wallets.id, id))
      .returning();
    return wallet;
  }

  async deleteWallet(id: number): Promise<boolean> {
    const result = await db
      .delete(wallets)
      .where(eq(wallets.id, id))
      .returning({ id: wallets.id });
    return result.length > 0;
  }

  // Transaction methods
  async getTransactions(limit = 50, offset = 0): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getTransactionById(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    return transaction;
  }

  async getTransactionByTransactionId(transactionId: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.transactionId, transactionId));
    return transaction;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const now = new Date();
    const [transaction] = await db
      .insert(transactions)
      .values({
        ...insertTransaction,
        status: insertTransaction.status || "pending",
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return transaction;
  }

  async updateTransaction(id: number, updates: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const [transaction] = await db
      .update(transactions)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(transactions.id, id))
      .returning();
    return transaction;
  }

  async countTransactions(): Promise<number> {
    const [result] = await db
      .select({ count: sqlBuilder<number>`count(*)` })
      .from(transactions);
    return result?.count || 0;
  }

  async getTransactionsByCurrency(currency: string): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.currency, currency));
  }

  // Webhook methods
  async getWebhookConfig(): Promise<WebhookConfig | undefined> {
    const [config] = await db
      .select()
      .from(webhookConfigs)
      .limit(1);
    return config;
  }

  async createWebhookConfig(insertConfig: InsertWebhookConfig): Promise<WebhookConfig> {
    const now = new Date();
    const [config] = await db
      .insert(webhookConfigs)
      .values({
        ...insertConfig,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return config;
  }

  async updateWebhookConfig(id: number, updates: Partial<InsertWebhookConfig>): Promise<WebhookConfig | undefined> {
    const [config] = await db
      .update(webhookConfigs)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(webhookConfigs.id, id))
      .returning();
    return config;
  }

  // Bot settings methods
  async getBotSettings(): Promise<BotSettings | undefined> {
    const [settings] = await db
      .select()
      .from(botSettings)
      .limit(1);
    return settings;
  }

  async createBotSettings(insertSettings: InsertBotSettings): Promise<BotSettings> {
    const now = new Date();
    const [settings] = await db
      .insert(botSettings)
      .values({
        ...insertSettings,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return settings;
  }

  async updateBotSettings(id: number, updates: Partial<InsertBotSettings>): Promise<BotSettings | undefined> {
    const [settings] = await db
      .update(botSettings)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(botSettings.id, id))
      .returning();
    return settings;
  }

  // Stats methods
  async getStats(): Promise<Stats | undefined> {
    const [statsData] = await db
      .select()
      .from(stats)
      .limit(1);
    return statsData;
  }

  async updateStats(updates: Partial<InsertStats>): Promise<Stats | undefined> {
    const statsData = await this.getStats();
    if (!statsData) return undefined;

    const [updatedStats] = await db
      .update(stats)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(stats.id, statsData.id))
      .returning();
    return updatedStats;
  }

  async incrementWebhookCalls(): Promise<Stats | undefined> {
    const statsData = await this.getStats();
    if (!statsData) return undefined;

    const [updatedStats] = await db
      .update(stats)
      .set({
        webhookCalls: statsData.webhookCalls + 1,
        updatedAt: new Date()
      })
      .where(eq(stats.id, statsData.id))
      .returning();
    return updatedStats;
  }
}

// Initialize the database with default data
async function initializeDatabase() {
  const storage = new DatabaseStorage();
  
  // Check if we need to seed the database
  const existingSettings = await storage.getBotSettings();
  if (existingSettings) {
    console.log('Database already initialized, skipping seed data');
    return storage;
  }

  console.log('Initializing database with seed data...');
  
  // Create default user
  const defaultUser = {
    username: 'admin',
    password: 'admin', // Should be hashed in production
    email: 'admin@example.com'
  };
  await storage.createUser(defaultUser);

  // Create default stats
  const defaultStats: InsertStats = {
    totalTransactions: 0,
    totalVolume: 0,
    activeWallets: 0,
    webhookCalls: 0,
    transactionsGrowth: "0%",
    volumeGrowth: "0%", 
    walletsGrowth: "0",
    webhooksGrowth: "0%"
  };
  await db.insert(stats).values({
    ...defaultStats,
    updatedAt: new Date()
  });

  // Create default webhook config
  const defaultWebhookConfig: InsertWebhookConfig = {
    url: 'https://discord.com/api/webhooks/example',
    notifySuccess: true,
    notifyPending: true,
    notifyFailed: true,
    notifyWallet: false
  };
  await storage.createWebhookConfig(defaultWebhookConfig);

  // Create default bot settings
  const defaultBotSettings: InsertBotSettings = {
    token: "discord_bot_token_placeholder",
    bitcoinConfirmations: 3,
    ethereumConfirmations: 15,
    litecoinConfirmations: 6,
    erc20Confirmations: 12,
    trc20Confirmations: 15,
    bep20Confirmations: 10,
    polygonConfirmations: 15,
    solanaConfirmations: 32,
    discordClientId: "123456789012345678",
    discordClientSecret: "client_secret_placeholder",
    discordRedirectUri: "https://crypto-dashboard.replit.app/auth/discord/callback",
    discordGuildId: "987654321098765432",
    gitbookApiKey: "gitbook_api_key_placeholder",
    gitbookSpaceId: "space_123456"
  };
  await storage.createBotSettings(defaultBotSettings);

  console.log('Database initialization complete');
  return storage;
}

// Export a function that initializes the database and returns the storage instance
export const getStorage = async (): Promise<IStorage> => {
  try {
    return await initializeDatabase();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    // Fallback to memory storage in case of database error
    console.log('Falling back to memory storage');
    return new MemStorage();
  }
};

// Export the storage instance for backward compatibility
// This needs to be used with await: const storageInstance = await storage;
export const storage = getStorage();