// In-memory store for dev mode (no DATABASE_URL)
// Persists for the lifetime of the running process only.
// Used when DATABASE_URL is not configured.

import { randomUUID } from "crypto";

export type Business = {
  id: number;
  userId: number;
  name: string;
  industry?: string | null;
  targetAudience?: string | null;
  toneOfVoice?: string | null;
  websiteUrl?: string | null;
  description?: string | null;
  timezone?: string | null;
  topicClusters?: any;
  postingSchedule?: any;
  contentTypes?: any;
  autoApprove?: boolean;
  videoProvider?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ApiKey = {
  id: number;
  businessId: number;
  provider: string;
  keyName: string;
  keyValue: string;
  createdAt: Date;
};

export type ContentItem = {
  id: number;
  businessId: number;
  platform: string;
  contentType: string;
  title?: string | null;
  content?: string | null;
  status: string;
  scheduledFor: Date;
  publishedAt?: Date | null;
  engagementData?: any;
  createdAt: Date;
  updatedAt: Date;
};

class MemoryStore {
  businesses: Business[] = [];
  apiKeys: ApiKey[] = [];
  contentItems: ContentItem[] = [];
  nextBusinessId = 1;
  nextApiKeyId = 1;
  nextContentId = 1;

  createBusiness(data: Omit<Business, "id" | "createdAt" | "updatedAt">): Business {
    const business: Business = {
      ...data,
      id: this.nextBusinessId++,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.businesses.push(business);
    return business;
  }

  getBusinessByUserId(userId: number): Business | undefined {
    return this.businesses.find(b => b.userId === userId);
  }

  getBusinessById(id: number): Business | undefined {
    return this.businesses.find(b => b.id === id);
  }

  updateBusiness(id: number, data: Partial<Business>): Business | undefined {
    const idx = this.businesses.findIndex(b => b.id === id);
    if (idx === -1) return undefined;
    this.businesses[idx] = {
      ...this.businesses[idx],
      ...data,
      updatedAt: new Date(),
    };
    return this.businesses[idx];
  }

  addApiKey(data: Omit<ApiKey, "id" | "createdAt">): ApiKey {
    const apiKey: ApiKey = {
      ...data,
      id: this.nextApiKeyId++,
      createdAt: new Date(),
    };
    this.apiKeys.push(apiKey);
    return apiKey;
  }

  getApiKeys(businessId: number): ApiKey[] {
    return this.apiKeys.filter(k => k.businessId === businessId);
  }

  deleteApiKey(id: number): void {
    this.apiKeys = this.apiKeys.filter(k => k.id !== id);
  }

  addContentItem(data: Omit<ContentItem, "id" | "createdAt" | "updatedAt">): ContentItem {
    const item: ContentItem = {
      ...data,
      id: this.nextContentId++,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.contentItems.push(item);
    return item;
  }

  getContentItems(businessId: number): ContentItem[] {
    return this.contentItems.filter(c => c.businessId === businessId);
  }
}

// Singleton — persists for process lifetime
export const memoryStore = new MemoryStore();