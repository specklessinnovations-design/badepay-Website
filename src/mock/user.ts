// User interface is now in useAuthStore.ts

export interface Contact {
  id: string;
  name: string;
  phone: string;
  badepayTag: string;
  avatar?: string;
  recent: boolean;
}

export const CONTACTS: Contact[] = [
  { id: 'c1', name: 'Michael Chen', phone: '08123456789', badepayTag: '@mchen', recent: true },
  { id: 'c2', name: 'Sarah Johnson', phone: '07098765432', badepayTag: '@sarahj', recent: true },
  { id: 'c3', name: 'David Okafor', phone: '08055554444', badepayTag: '@davidok', recent: true },
  { id: 'c4', name: 'Aisha Bello', phone: '09011112222', badepayTag: '@aishab', recent: false },
  { id: 'c5', name: 'James Wilson', phone: '08199998888', badepayTag: '@jwilson', recent: false },
];


