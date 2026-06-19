export interface BillProvider {
  id: string;
  name: string;
  category: string;
  plans?: string[];
}

export const mockBillProviders: BillProvider[] = [
  { id: 'mtn-airtime', name: 'MTN Nigeria', category: 'airtime' },
  { id: 'airtel-airtime', name: 'Airtel Nigeria', category: 'airtime' },
  { id: 'glo-airtime', name: 'Glo Nigeria', category: 'airtime' },
  { id: '9mobile-airtime', name: '9mobile Nigeria', category: 'airtime' },
  { id: 'mtn-data', name: 'MTN Data', category: 'data', plans: ['1.5GB - ₦1,000', '3GB - ₦1,500', '10GB - ₦3,000', '20GB - ₦5,000', '40GB - ₦10,000'] },
  { id: 'airtel-data', name: 'Airtel Data', category: 'data', plans: ['2GB - ₦1,200', '5GB - ₦2,000', '15GB - ₦4,000', '25GB - ₦6,000', '50GB - ₦11,000'] },
  { id: 'glo-data', name: 'Glo Data', category: 'data', plans: ['1.25GB - ₦500', '5.8GB - ₦2,000', '12GB - ₦3,000', '24GB - ₦5,000', '50GB - ₦10,000'] },
  { id: 'ekedc', name: 'Eko Electricity (EKEDC)', category: 'electricity' },
  { id: 'ikedc', name: 'Ikeja Electricity (IKEDC)', category: 'electricity' },
  { id: 'aedc', name: 'Abuja Electricity (AEDC)', category: 'electricity' },
  { id: 'dstv', name: 'DSTV', category: 'tv', plans: ['DSTV Yanga - ₦4,200', 'DSTV Confam - ₦7,400', 'DSTV Compact - ₦12,500', 'DSTV Compact Plus - ₦19,800', 'DSTV Premium - ₦29,500'] },
  { id: 'gotv', name: 'GOTV', category: 'tv', plans: ['GOTV Smallie - ₦1,300', 'GOTV Jinja - ₦2,700', 'GOTV Max - ₦5,700', 'GOTV Supa - ₦7,600', 'GOTV Supa Plus - ₦12,500'] },
  { id: 'startimes', name: 'StarTimes', category: 'tv', plans: ['Nova - ₦1,500', 'Basic - ₦3,300', 'Smart - ₦4,700', 'Super - ₦7,200'] },
  { id: 'smile', name: 'Smile Broadband', category: 'internet', plans: ['Smile 10GB - ₦3,500', 'Smile 20GB - ₦6,000', 'Smile Unlimited Lite - ₦15,000'] },
  { id: 'spectranet', name: 'Spectranet', category: 'internet', plans: ['15GB Freedom - ₦7,000', '30GB MegaValue - ₦11,500', 'Unlimited Gold - ₦20,000'] },
  { id: 'water-lagos', name: 'Lagos Water Corporation', category: 'water' },
  { id: 'water-abuja', name: 'FCT Water Board', category: 'water' },
];
