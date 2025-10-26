
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  preferences: string[];
  location?: {
    country: string;
    city: string;
    postalCode: string;
  };
}

export interface Item {
  id: string;
  userId: string;
  title: string;
  description: string;
  imageUrls: string[];
  category: string;
  createdAt: string;
  ownerName: string;
}

export enum ExchangeStatus {
  Pending = 'PENDING',
  Accepted = 'ACCEPTED',
  Rejected = 'REJECTED',
  Completed = 'COMPLETED',
}

export interface Exchange {
  id: string;
  offeredItemId: string;
  offeredItem: Item;
  requestedItemId: string;
  requestedItem: Item;
  status: ExchangeStatus;
  requesterId: string;
  requesterName: string;
  ownerId: string;
  ownerName: string;
  createdAt: string;
}