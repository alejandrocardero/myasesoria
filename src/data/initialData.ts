import { Transaction, StockProduct, Campaign, ChatMessage, DigitalFile, ClientConfig } from '../types';

export const initialTransactions: Transaction[] = [
  {
    id: 't1',
    date: '2026-05-27',
    category: 'Consultoría',
    amount: 1200.00,
    type: 'venta',
    description: 'Honorarios Mensuales',
    isBusiness: true
  },
  {
    id: 't2',
    date: '2026-05-26',
    category: 'Suscripción',
    amount: 49.99,
    type: 'gasto',
    description: 'Suscripción SaaS AI',
    isBusiness: true
  },
  {
    id: 't3',
    date: '2026-05-25',
    category: 'Producto',
    amount: 450.00,
    type: 'venta',
    description: 'Venta Producto X',
    isBusiness: true
  }
];

export const initialStock: StockProduct[] = [
  {
    sku: 'EL-001',
    name: 'Smart Hub v2',
    stock: 142,
    cost: 85.00,
    price: 149.99,
    type: 'smartphone',
    status: 'Óptimo'
  },
  {
    sku: 'AU-442',
    name: 'Audio Pro Wireless',
    stock: 8,
    cost: 45.00,
    price: 89.00,
    type: 'headphones',
    status: 'Crítico'
  },
  {
    sku: 'KB-901',
    name: 'Teclado Mecánico RGB',
    stock: 25,
    cost: 110.00,
    price: 159.00,
    type: 'keyboard',
    status: 'Medio'
  }
];

export const initialCampaigns: Campaign[] = [
  {
    id: 'c1',
    name: 'Outlet Septiembre',
    start: '2026-09-01',
    end: '2026-09-15',
    products: 'Mocasín de Cuero',
    status: 'Live',
    activeDays: 'Vence en 2 días • 3 prods'
  },
  {
    id: 'c2',
    name: 'Lanzamiento Primavera',
    start: '2026-09-16',
    end: '2026-09-30',
    products: 'Botas Urbanas',
    status: 'Live',
    activeDays: 'Inicia mañana • 12 prods'
  },
  {
    id: 'c3',
    name: 'Cyber Monday Prep',
    start: '2026-11-20',
    end: '2026-11-27',
    products: 'Sandalia Verano',
    status: 'Draft',
    activeDays: 'Borrador • 0 prods'
  }
];

export const initialChat: ChatMessage[] = [
  {
    id: 'm1',
    role: 'model',
    text: '¡Hola! Soy tu asistente legal especializado en legislación colombiana. ¿En qué puedo ayudarte hoy con tu microempresa, Juan?',
    date: '2026-05-29'
  },
  {
    id: 'm2',
    role: 'user',
    text: 'Necesito saber los plazos de renovación de Cámara de Comercio.',
    date: '2026-05-29'
  },
  {
    id: 'm3',
    role: 'model',
    text: 'De acuerdo con el Código de Comercio de Colombia, debes realizar la renovación de tu matrícula mercantil dentro de los **tres primeros meses de cada año** (antes del 31 de marzo).',
    date: '2026-05-29',
    reference: {
      lawText: 'Decreto 1074 de 2015, Artículo 2.2.2.44.1.3 y Art. 33 del Código de Comercio.',
      link: 'https://www.dian.gov.co'
    }
  }
];

export const initialFiles: DigitalFile[] = [
  {
    id: 'f1',
    name: 'Notificación DIAN',
    date: '12 OCT 2023',
    entity: 'DIAN Colombia',
    priority: 'Urgente'
  },
  {
    id: 'f2',
    name: 'Uso de Suelos PQR',
    date: '05 OCT 2023',
    entity: 'Alcaldía Mayor',
    priority: 'Medio'
  }
];

export const initialConfig: ClientConfig = {
  name: 'Juan',
  location: 'COL',
  email: 'alejandrolazarocard@gmail.com',
  processingState: 75,
  country: 'COL',
  business: 'MyAsesorIA Demo'
};
