export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'transaction' | 'security' | 'promo';
  date: string;
  read: boolean;
}

export const mockNotifications: NotificationItem[] = [
  { id: 'n1', title: 'Wallet Funded Successfully', body: 'Your transfer of ₦50,000.00 from Mastercard has been settled.', type: 'transaction', date: '2026-05-19T09:00:00Z', read: false },
  { id: 'n2', title: 'New Device Signed In', body: 'A sign-in was detected on a Chrome browser from IP 192.168.1.45.', type: 'security', date: '2026-05-18T14:30:00Z', read: false },
  { id: 'n3', title: 'Zero convenience fees this month!', body: 'Pay all your electricity, TV, and broadband bills without any processing fee.', type: 'promo', date: '2026-05-17T08:00:00Z', read: true },
  { id: 'n4', title: 'KYC Level Update Needed', body: 'Upgrade your KYC status to Tier 1 to bypass the daily ₦20,000 transaction cap.', type: 'security', date: '2026-05-16T12:00:00Z', read: true },
  { id: 'n5', title: 'Transfer Sent to Chinedu Okafor', body: 'You sent ₦15,000.00 to Chinedu Okafor. Reference: TXN10001.', type: 'transaction', date: '2026-05-15T10:14:00Z', read: true },
];
