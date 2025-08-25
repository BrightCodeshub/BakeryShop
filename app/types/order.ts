export interface MenuItem {
  name: string;
  image_url: string | null;
}

export interface OrderItem {
  quantity: number;
  price: number;
  menu_items: MenuItem;
}

export interface Order {
  id: string;
  status: string;
  total: number;
  created_at: string;
  order_items: OrderItem[];
}
